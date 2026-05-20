mod admin;
mod auth;
mod cache;
mod db;
mod filters;
mod helpers;
mod pipeline;
mod protocol;
mod registry;
mod spam;
mod state;
mod ws;

use crate::auth::JwtVerifier;
use crate::cache::ConfigCache;
use crate::registry::Registry;
use crate::spam::SpamTracker;
use crate::state::AppState;

use axum::{Router, routing::{get, post}};
use dotenv::dotenv;
use sea_orm::{Database, DatabaseConnection};
use std::env;
use std::net::SocketAddr;
use tokio::signal;
use tower_http::trace::TraceLayer;
use tracing::{error, info};
use tracing_subscriber::{EnvFilter, fmt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    init_tracing();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL is required");
    let jwt_secret = env::var("CHAT_JWT_SECRET").expect("CHAT_JWT_SECRET is required");
    let bind_addr: SocketAddr = env::var("CHAT_BIND_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:8088".to_string())
        .parse()
        .expect("CHAT_BIND_ADDR must be host:port");

    let db = connect_db(&database_url).await?;

    let cache = ConfigCache::new();
    cache.refresh(&db).await; // initial warm-up
    tokio::spawn(cache::run_refresher(db.clone(), cache.clone()));

    let state = AppState {
        db,
        jwt: JwtVerifier::new(&jwt_secret),
        registry: Registry::new(),
        spam: SpamTracker::new(),
        cache,
    };

    let app = Router::new()
        .route("/ws", get(ws::ws_handler))
        .route("/internal/event", post(admin::admin_handler))
        .route("/healthz", get(|| async { "ok" }))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(bind_addr).await.map_err(|e| {
        error!(%bind_addr, error = %e, "failed to bind listener");
        e
    })?;
    info!(%bind_addr, "chat_server listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn connect_db(url: &str) -> Result<DatabaseConnection, Box<dyn std::error::Error>> {
    let mut attempt = 0;
    loop {
        match Database::connect(url).await {
            Ok(db) => return Ok(db),
            Err(e) if attempt < 3 => {
                error!(error = ?e, attempt, "db connect failed; retrying");
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                attempt += 1;
            }
            Err(e) => return Err(Box::new(e)),
        }
    }
}

async fn shutdown_signal() {
    #[cfg(unix)]
    {
        let mut term = signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("install SIGTERM handler");
        tokio::select! {
            _ = signal::ctrl_c() => info!("ctrl-c"),
            _ = term.recv() => info!("sigterm"),
        }
    }
    #[cfg(windows)]
    {
        let mut ctrl_c = signal::windows::ctrl_c().expect("install ctrl-c handler");
        let mut ctrl_close = signal::windows::ctrl_close().expect("install ctrl-close handler");
        tokio::select! {
            _ = ctrl_c.recv() => info!("ctrl-c"),
            _ = ctrl_close.recv() => info!("ctrl-close"),
        }
    }
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("chat_server=info,tower_http=info"));
    fmt().with_env_filter(filter).init();
}
