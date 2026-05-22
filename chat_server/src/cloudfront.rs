//! CloudFront signed-URL generation for chat rank-badge images.
//!
//! S3 objects are served privately — the browser can only load them through a
//! CloudFront *signed* URL. `chat_message.rank_image` is stored **unsigned**;
//! this module signs it fresh every time a message goes out to a client
//! (broadcast + history), mirroring `signStoredCloudFrontUrl` in the Next.js
//! app (`src/helpers/server/s3.ts`).
//!
//! Signatures expire, so they must never be persisted. Storing the column
//! unsigned and signing only on serve keeps that invariant.

use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use chrono::Utc;
use dashmap::DashMap;
use rsa::RsaPrivateKey;
use rsa::pkcs1::DecodeRsaPrivateKey;
use rsa::pkcs1v15::SigningKey;
use rsa::pkcs8::DecodePrivateKey;
use rsa::signature::{SignatureEncoding, Signer};
use sha1::Sha1;
use std::env;
use tracing::{error, info};

/// Validity window for a freshly minted signature (24h, matching the Next.js
/// default in `getSignedCloudFrontUrl`).
const SIGNATURE_TTL_SECS: i64 = 24 * 60 * 60;
/// Re-sign a cached URL once it has less than this much life left, so a client
/// never receives a URL that is about to expire mid-session.
const REFRESH_SKEW_SECS: i64 = 6 * 60 * 60;

struct CachedUrl {
    signed: String,
    expires_at: i64,
}

pub struct CloudFrontSigner {
    domain: String,
    key_pair_id: String,
    signing_key: SigningKey<Sha1>,
    /// S3 object key -> cached signed URL. Rank badges are a tiny fixed set, so
    /// this stays warm after the first few signs — RSA work becomes negligible.
    cache: DashMap<String, CachedUrl>,
}

impl CloudFrontSigner {
    /// Builds a signer from `CLOUDFRONT_DOMAIN` / `CLOUDFRONT_KEY_PAIR_ID` /
    /// `CLOUDFRONT_PRIVATE_KEY`. Returns `None` when any are absent (local /
    /// MinIO dev) or the key is unparseable — callers then pass URLs through
    /// unsigned rather than the server failing to boot.
    pub fn from_env() -> Option<Self> {
        let domain = non_empty_env("CLOUDFRONT_DOMAIN")?;
        let key_pair_id = non_empty_env("CLOUDFRONT_KEY_PAIR_ID")?;
        let pem_raw = non_empty_env("CLOUDFRONT_PRIVATE_KEY")?;
        // The env file carries the PEM single-line with literal "\n"; the
        // Next.js app does the same substitution. Real LFs are left untouched.
        let pem = pem_raw.trim().trim_matches('"').replace("\\n", "\n");

        let private_key = RsaPrivateKey::from_pkcs8_pem(&pem)
            .ok()
            .or_else(|| RsaPrivateKey::from_pkcs1_pem(&pem).ok());
        let Some(private_key) = private_key else {
            error!(
                "CLOUDFRONT_PRIVATE_KEY parse failed (tried PKCS#8 and PKCS#1); \
                 rank images will be served unsigned"
            );
            return None;
        };

        info!("cloudfront signer enabled");
        Some(Self {
            domain: strip_scheme(&domain),
            key_pair_id,
            signing_key: SigningKey::<Sha1>::new(private_key),
            cache: DashMap::new(),
        })
    }

    /// Signs an optional stored rank-image URL. `None` and non-CloudFront
    /// values pass through untouched.
    pub fn sign_opt(&self, url: Option<String>) -> Option<String> {
        url.map(|u| self.sign_stored(&u))
    }

    /// Mirrors `signStoredCloudFrontUrl`: signs a stored (unsigned) CloudFront
    /// URL, passing through anything not pointing at our domain.
    fn sign_stored(&self, stored: &str) -> String {
        if !stored.contains(&self.domain) {
            return if stored.starts_with("http") {
                stored.to_string()
            } else {
                format!("https://{stored}")
            };
        }

        let key = object_key(stored, &self.domain);
        let now = Utc::now().timestamp();

        if let Some(hit) = self.cache.get(&key) {
            if hit.expires_at - now > REFRESH_SKEW_SECS {
                return hit.signed.clone();
            }
        }

        let expires = now + SIGNATURE_TTL_SECS;
        let url = format!("https://{}/{}", self.domain, key);
        match self.sign_url(&url, expires) {
            Some(signed) => {
                self.cache.insert(
                    key,
                    CachedUrl {
                        signed: signed.clone(),
                        expires_at: expires,
                    },
                );
                signed
            }
            // Signing failed — an unsigned URL is still better than a dropped
            // badge, and it matches the no-signer fallback behaviour.
            None => url,
        }
    }

    fn sign_url(&self, url: &str, expires: i64) -> Option<String> {
        // CloudFront canned policy — compact JSON, no whitespace. Identical to
        // what `@aws-sdk/cloudfront-signer` produces for a `dateLessThan` sign.
        let policy = format!(
            r#"{{"Statement":[{{"Resource":"{url}","Condition":{{"DateLessThan":{{"AWS:EpochTime":{expires}}}}}}}]}}"#
        );
        let signature = self.signing_key.try_sign(policy.as_bytes()).ok()?;
        let encoded = cf_base64(&signature.to_vec());
        Some(format!(
            "{url}?Expires={expires}&Signature={encoded}&Key-Pair-Id={}",
            self.key_pair_id
        ))
    }
}

fn non_empty_env(key: &str) -> Option<String> {
    env::var(key).ok().filter(|v| !v.is_empty())
}

fn strip_scheme(domain: &str) -> String {
    domain
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_end_matches('/')
        .to_string()
}

/// Extracts the S3 object key from a stored URL: drops scheme + domain and any
/// query string. Mirrors the key extraction in `signStoredCloudFrontUrl`.
fn object_key(stored: &str, domain: &str) -> String {
    let no_scheme = stored
        .trim_start_matches("https://")
        .trim_start_matches("http://");
    let after_domain = match no_scheme.find(domain) {
        Some(idx) => &no_scheme[idx + domain.len()..],
        None => no_scheme,
    };
    let key = after_domain.trim_start_matches('/');
    key.split('?').next().unwrap_or(key).to_string()
}

/// Base64 with CloudFront's URL-safe character substitutions.
fn cf_base64(bytes: &[u8]) -> String {
    BASE64
        .encode(bytes)
        .replace('+', "-")
        .replace('=', "_")
        .replace('/', "~")
}
