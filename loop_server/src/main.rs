use dotenv::dotenv;
use google_sheets4::hyper_util::client::legacy::connect::HttpConnector;
use google_sheets4::{hyper_util, Sheets};
use helpers::tables::{common, prelude::Common};
use hyper_rustls::HttpsConnector;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, Database, DatabaseConnection, EntityTrait,
    QueryFilter,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use tokio::signal;
use tokio::sync::Mutex;
use tokio::time::interval;
use yup_oauth2::ServiceAccountKey;
mod helpers;

// 테더/원화 시세 구조체
#[derive(Debug, Serialize, Deserialize)]
struct TetherKrwRate {
    prev_closing_price: String, // 전일 종가
    trade_price: String,        // 현재가
}

pub fn db_connection() -> &'static Arc<Mutex<DatabaseConnection>> {
    static BUILDER: OnceLock<Arc<Mutex<DatabaseConnection>>> = OnceLock::new();
    BUILDER.get_or_init(|| Arc::new(Mutex::new(DatabaseConnection::default())))
}

pub async fn get_db_connection(
) -> Result<DatabaseConnection, Box<dyn std::error::Error + Send + Sync>> {
    let mut count = 0;
    let mut connection = Option::<DatabaseConnection>::None;
    while count < 3 {
        match Database::connect(env::var("DATABASE_URL")?).await {
            Ok(db) => {
                connection = Some(db);
                break;
            }
            Err(_) => {
                tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
                count += 1;
            }
        }
    }
    Ok(connection.unwrap())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    let get_db_connection = get_db_connection()
        .await
        .expect("Can't connect to database");
    *db_connection().lock().await = get_db_connection;

    // 시그널 처리 태스크
    let signal_task = tokio::spawn(async {
        #[cfg(unix)]
        {
            // Unix 시스템에서 SIGTERM 처리
            let mut term_signal =
                tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                    .expect("Failed to install SIGTERM handler");

            tokio::select! {
                _ = signal::ctrl_c() => {
                    println!("Received CTRL+C (SIGINT), shutting down gracefully...");
                }
                _ = term_signal.recv() => {
                    println!("Received SIGTERM, shutting down gracefully...");
                }
            }
        }

        #[cfg(windows)]
        {
            // Windows 시스템에서 여러 컨트롤 이벤트 처리
            let mut ctrl_c = signal::windows::ctrl_c().expect("Failed to install CTRL+C handler");
            let mut ctrl_close =
                signal::windows::ctrl_close().expect("Failed to install CTRL+CLOSE handler");
            let mut ctrl_shutdown =
                signal::windows::ctrl_shutdown().expect("Failed to install CTRL+SHUTDOWN handler");

            tokio::select! {
                _ = ctrl_c.recv() => {
                    println!("Received CTRL+C event, shutting down gracefully...");
                }
                _ = ctrl_close.recv() => {
                    println!("Received CTRL+CLOSE event, shutting down gracefully...");
                }
                _ = ctrl_shutdown.recv() => {
                    println!("Received CTRL+SHUTDOWN event, shutting down gracefully...");
                }
            }
        }
    });

    tokio::spawn(loop_get_tether());

    // 애플리케이션이 종료되거나 시그널을 받을 때까지 대기
    tokio::select! {
        _ = signal_task => {
            // 시그널이 발생하면 여기로 옴
            println!("Shutdown signal received");
        }
    }

    Ok(())
}

async fn loop_get_tether() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // 1. 서비스 계정 키 파일 읽기
    let key_contents =
        env::var("SERVICE_ACCOUNT_KEY").expect("SERVICE_ACCOUNT_KEY 환경변수를 설정해주세요");

    let service_account: ServiceAccountKey = serde_json::from_str(&key_contents)?;
    let _ = rustls::crypto::ring::default_provider().install_default();

    // 2. Google Sheets API 클라이언트 설정
    let auth = yup_oauth2::ServiceAccountAuthenticator::builder(service_account)
        .build()
        .await?;

    let client = hyper_util::client::legacy::Client::builder(hyper_util::rt::TokioExecutor::new())
        .build(
            hyper_rustls::HttpsConnectorBuilder::new()
                .with_native_roots()
                .unwrap()
                .https_or_http()
                .enable_http1()
                .build(),
        );

    let hub = Sheets::new(client, auth);

    // 3. 스프레드시트 ID와 범위 설정
    let spreadsheet_ids =
        env::var("SPREADSHEET_ID").expect("SPREADSHEET_ID 환경변수를 설정해주세요");
    let spreadsheet_ids = spreadsheet_ids.split(",").collect::<Vec<&str>>();
    let range = "Sheet1!B2:B3"; // GOOGLEFINANCE 함수가 있는 범위

    // 4. 주기적으로 데이터 가져오기
    let mut interval = interval(Duration::from_secs(45)); // 2분마다 업데이트

    let mut index = 0;
    let mut previeous = String::new();
    let url = format!(
        "{}/api/admin_di2u3k2j/refresh_192873832736/read",
        env::var("API_URL").expect("API_URL 환경변수를 설정해주세요")
    );
    loop {
        interval.tick().await;

        println!("index: {}", index);
        match get_tether_krw_rate(&hub, spreadsheet_ids[index], range).await {
            Ok(rate) => {
                println!("테더/원화 시세: {:?}", rate);
                let tether = Common::find()
                    .filter(common::Column::Key.eq("Tether"))
                    .one(&*db_connection().lock().await)
                    .await
                    .unwrap();

                let current = serde_json::to_string(&rate).unwrap();

                if previeous == current {
                    continue;
                }
                previeous = current.clone();

                let params = HashMap::from([("method", "tether")]);
                let client = reqwest::Client::builder()
                    .danger_accept_invalid_certs(true)
                    .build()
                    .unwrap();
                let _ = client.get(&url).query(&params).send().await;

                let data = common::ActiveModel {
                    key: ActiveValue::Set("Tether".into()),
                    value: ActiveValue::Set(current.clone()),
                };
                match tether {
                    Some(_) => {
                        data.update(&*db_connection().lock().await).await.unwrap();
                    }
                    None => {
                        data.insert(&*db_connection().lock().await).await.unwrap();
                    }
                }
            }
            Err(e) => {
                eprintln!("시세 가져오기 실패: {:?}", e);
            }
        }
        index = (index + 1) % spreadsheet_ids.len();
    }
}

async fn get_tether_krw_rate(
    hub: &Sheets<HttpsConnector<HttpConnector>>,
    spreadsheet_id: &str,
    range: &str,
) -> Result<TetherKrwRate, Box<dyn std::error::Error + Send + Sync>> {
    // 1. Google Sheets API를 사용하여 데이터 가져오기
    let result = hub
        .spreadsheets()
        .values_get(spreadsheet_id, range)
        .doit()
        .await?;

    let values = result.1.values.ok_or("데이터가 없습니다")?;

    // 2. 응답 데이터 파싱
    if values.is_empty() {
        return Err("데이터가 없습니다".into());
    }

    // 셀 값 가져오기
    let trade_price = if !values[0].is_empty() {
        values[0][0].as_str().unwrap().replace(",", "")
    } else {
        return Err("현재가 데이터가 없습니다".into());
    };

    let prev_closing_price = if values.len() > 1 && !values[1].is_empty() {
        values[1][0].as_str().unwrap().replace(",", "")
    } else {
        return Err("전일 종가 데이터가 없습니다".into());
    };

    // 4. 결과 구조체 반환
    Ok(TetherKrwRate {
        prev_closing_price,
        trade_price,
    })
}
