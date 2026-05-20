use crate::auth::JwtVerifier;
use crate::cache::ConfigCache;
use crate::registry::Registry;
use crate::spam::SpamTracker;
use sea_orm::DatabaseConnection;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub jwt: JwtVerifier,
    pub registry: Arc<Registry>,
    pub spam: Arc<SpamTracker>,
    pub cache: Arc<ConfigCache>,
}
