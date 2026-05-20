//! HS256 JWT verification for chat session tokens. The Next.js app issues
//! these (planned `/api/chat/token` route) signed with `CHAT_JWT_SECRET`.
//!
//! Claims carry the user identity *and* a denormalized profile snapshot
//! (displayname, rank) so the chat server doesn't need to hit the user/profile
//! tables on every connect or message.

use jsonwebtoken::{DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use std::fmt;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatClaims {
    /// User id (cuid).
    pub sub: String,
    /// Unix expiry timestamp.
    pub exp: usize,
    pub displayname: String,
    pub rank_level: i32,
    #[serde(default)]
    pub rank_image: Option<String>,
    pub auth_level: i32,
}

#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    Invalid(jsonwebtoken::errors::Error),
}

impl fmt::Display for AuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AuthError::MissingToken => write!(f, "missing token"),
            AuthError::Invalid(e) => write!(f, "invalid token: {}", e),
        }
    }
}

impl std::error::Error for AuthError {}

impl From<jsonwebtoken::errors::Error> for AuthError {
    fn from(e: jsonwebtoken::errors::Error) -> Self {
        AuthError::Invalid(e)
    }
}

#[derive(Clone)]
pub struct JwtVerifier {
    key: Arc<DecodingKey>,
    validation: Validation,
}

impl JwtVerifier {
    pub fn new(secret: &str) -> Self {
        Self {
            key: Arc::new(DecodingKey::from_secret(secret.as_bytes())),
            validation: Validation::new(jsonwebtoken::Algorithm::HS256),
        }
    }

    pub fn verify(&self, token: &str) -> Result<ChatClaims, AuthError> {
        if token.is_empty() {
            return Err(AuthError::MissingToken);
        }
        let data = decode::<ChatClaims>(token, &self.key, &self.validation)?;
        Ok(data.claims)
    }
}
