use crate::auth::JwtVerifier;
use crate::cache::ConfigCache;
use crate::cloudfront::CloudFrontSigner;
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
    /// CloudFront signer for rank-badge images. `None` in local/MinIO dev or
    /// when the CloudFront env vars are absent — URLs then pass through.
    pub signer: Option<Arc<CloudFrontSigner>>,
}
