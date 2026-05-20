//! Banned-word masking. Built from the periodically refreshed `chat_banned_word`
//! cache. Matches are case-insensitive; matched substrings are replaced with
//! asterisks (length-preserving).

use aho_corasick::{AhoCorasick, AhoCorasickBuilder, MatchKind};

#[derive(Default)]
pub struct BannedWords {
    matcher: Option<AhoCorasick>,
}

impl BannedWords {
    pub fn empty() -> Self {
        Self { matcher: None }
    }

    pub fn build(words: &[String]) -> Self {
        let cleaned: Vec<&str> = words
            .iter()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .collect();
        if cleaned.is_empty() {
            return Self::empty();
        }
        let matcher = AhoCorasickBuilder::new()
            .ascii_case_insensitive(true)
            .match_kind(MatchKind::LeftmostLongest)
            .build(&cleaned)
            .ok();
        Self { matcher }
    }

    /// Returns `(masked_text, was_modified)`. If no banned words are matched,
    /// the input is returned unchanged.
    pub fn mask(&self, text: &str) -> (String, bool) {
        let Some(matcher) = self.matcher.as_ref() else {
            return (text.to_string(), false);
        };

        let mut out = String::with_capacity(text.len());
        let mut cursor = 0usize;
        let mut modified = false;

        for m in matcher.find_iter(text) {
            if m.start() > cursor {
                out.push_str(&text[cursor..m.start()]);
            }
            // Use char count, not byte count, so multi-byte characters mask sensibly.
            let masked_chars = text[m.start()..m.end()].chars().count();
            for _ in 0..masked_chars {
                out.push('*');
            }
            cursor = m.end();
            modified = true;
        }
        if cursor < text.len() {
            out.push_str(&text[cursor..]);
        }
        (out, modified)
    }
}
