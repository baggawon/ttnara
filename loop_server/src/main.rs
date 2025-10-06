use atomic_http::SendableError;
use dotenv::dotenv;
// use google_sheets4::hyper_util::client::legacy::connect::HttpConnector;
// use google_sheets4::{hyper_util, Sheets};
use helpers::tables::{common, prelude::Common};
use reqwest::header::{HeaderMap, HeaderValue};
// use hyper_rustls::HttpsConnector;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, Database, DatabaseConnection, EntityTrait,
    QueryFilter,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::env;
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use tokio::signal;
use tokio::sync::Mutex;
use tokio::time::interval;
// use yup_oauth2::ServiceAccountKey;
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
    // 주기적으로 데이터 가져오기
    let mut interval = interval(Duration::from_secs(45)); // 2분마다 업데이트

    let mut previeous = String::new();
    let url = format!(
        "{}/api/admin_di2u3k2j/refresh_192873832736/read",
        env::var("API_URL").expect("API_URL 환경변수를 설정해주세요")
    );
    loop {
        interval.tick().await;

        match get_tether_krw_rate().await {
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
                let _ = send_message(&format!("{:?}", e)).await;
            }
        }
    }
}

async fn get_tether_krw_rate() -> Result<TetherKrwRate, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();

    // API 키 설정
    headers.insert("downlink", HeaderValue::from_static("10"));
    headers.insert(
        "referer",
        HeaderValue::from_static("https://www.google.com/"),
    );
    headers.insert("rtt", HeaderValue::from_static("50"));
    headers.insert(
        "sec-ch-prefers-color-scheme",
        HeaderValue::from_static("dark"),
    );
    headers.insert(
        "sec-ch-ua",
        HeaderValue::from_static(
            "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
        ),
    );
    headers.insert("sec-ch-ua-arch", HeaderValue::from_static("\"x86\""));
    headers.insert("sec-ch-ua-bitness", HeaderValue::from_static("\"64\""));
    headers.insert(
        "sec-ch-ua-form-factors",
        HeaderValue::from_static("\"Desktop\""),
    );
    headers.insert(
        "sec-ch-ua-full-version",
        HeaderValue::from_static("\"140.0.7339.208\""),
    );
    headers.insert("sec-ch-ua-full-version-list",HeaderValue::from_static("\"Chromium\";v=\"140.0.7339.208\", \"Not=A?Brand\";v=\"24.0.0.0\", \"Google Chrome\";v=\"140.0.7339.208\""));
    headers.insert("sec-ch-ua-mobile", HeaderValue::from_static("?0"));
    headers.insert("sec-ch-ua-model", HeaderValue::from_static("\"\""));
    headers.insert(
        "sec-ch-ua-platform",
        HeaderValue::from_static("\"Windows\""),
    );
    headers.insert(
        "sec-ch-ua-platform-version",
        HeaderValue::from_static("\"15.0.0\""),
    );
    headers.insert("sec-ch-ua-wow64", HeaderValue::from_static("?0"));
    headers.insert("upgrade-insecure-requests", HeaderValue::from_static("1"));
    headers.insert("user-agent",HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"));

    // API 요청 보내기
    let response = client
        .get("https://www.google.com/finance/quote/USD-KRW?hl=ko")
        .headers(headers)
        .send()
        .await?
        .text()
        .await?;

    let mut trade_price = String::new();
    let mut prev_closing_price = String::new();

    for (index, script) in response.split("data:[[[").enumerate() {
        if index == 0 {
            continue;
        }
        if script.contains("USD / KRW") && trade_price.is_empty() && script.contains("]]],") {
            let data = script.split("]]],").next();
            if let Some(data) = data {
                let data: Value = serde_json::from_str(data)?;
                println!("script {}: {}", index, data);
                if !data.is_array() {
                    continue;
                }
                for item in data.as_array().unwrap() {
                    if item.is_array() && trade_price.is_empty() {
                        let currencies = item.as_array().unwrap();
                        for (index, currency) in currencies.iter().enumerate() {
                            if index == 0 && currency.is_number() {
                                let currency = {
                                    let currency = currency.as_number().unwrap();
                                    if currency.is_f64() {
                                        currency.as_f64().unwrap().to_string()
                                    } else if currency.is_i64() {
                                        currency.as_i64().unwrap().to_string()
                                    } else {
                                        currency.as_u64().unwrap().to_string()
                                    }
                                };
                                trade_price = currency;
                                println!("{}", trade_price);
                            } else if index == 1 && currency.is_number() {
                                let currency = {
                                    let currency = currency.as_number().unwrap();
                                    if currency.is_f64() {
                                        currency.as_f64().unwrap().to_string()
                                    } else if currency.is_i64() {
                                        currency.as_i64().unwrap().to_string()
                                    } else {
                                        currency.as_u64().unwrap().to_string()
                                    }
                                };
                                prev_closing_price = (trade_price.parse::<f64>()?
                                    - currency.parse::<f64>()?)
                                .to_string()
                            }
                        }
                    }
                }
            }
        }
    }

    if prev_closing_price.is_empty() {
        prev_closing_price = trade_price.clone();
    }

    // 4. 결과 구조체 반환
    Ok(TetherKrwRate {
        prev_closing_price,
        trade_price,
    })
}

async fn send_message(message: &str) -> Result<(), SendableError> {
    use teloxide_core::{prelude::*, types::ParseMode};

    let chat_id = ChatId(
        std::env::var("CHAT_ID")
            .expect("Expected CHAT_ID env var")
            .parse::<i64>()?,
    );

    let bot = Bot::from_env().parse_mode(ParseMode::MarkdownV2);

    bot.send_message(chat_id, message).await?;

    Ok(())
}

#[tokio::test]
async fn test_get_tether_krw_rate() {
    match get_tether_krw_rate().await {
        Ok(rate) => {
            println!("테더/원화 시세: {:?}", rate);
        }
        Err(e) => {
            eprintln!("시세 가져오기 실패: {:?}", e);
        }
    }
}
