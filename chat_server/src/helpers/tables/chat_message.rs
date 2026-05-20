use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Default, Debug, DeriveEntity)]
pub struct Entity;

impl EntityName for Entity {
    fn schema_name(&self) -> Option<&str> {
        Some("Platypus")
    }
    fn table_name(&self) -> &str {
        "chat_message"
    }
}

#[derive(Clone, Debug, PartialEq, DeriveModel, DeriveActiveModel, Eq, Serialize, Deserialize)]
pub struct Model {
    pub id: String,
    pub topic_id: i32,
    pub uid: String,
    pub displayname: String,
    pub rank_level: i32,
    pub rank_image: Option<String>,
    pub content: String,
    pub is_hidden: bool,
    pub hidden_by_id: Option<String>,
    pub hidden_at: Option<ChronoDateTime>,
    pub created_at: ChronoDateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveColumn)]
pub enum Column {
    Id,
    TopicId,
    Uid,
    Displayname,
    RankLevel,
    RankImage,
    Content,
    IsHidden,
    HiddenById,
    HiddenAt,
    CreatedAt,
}

#[derive(Copy, Clone, Debug, EnumIter, DerivePrimaryKey)]
pub enum PrimaryKey {
    Id,
}

impl PrimaryKeyTrait for PrimaryKey {
    type ValueType = String;
    fn auto_increment() -> bool {
        false
    }
}

#[derive(Copy, Clone, Debug, EnumIter)]
pub enum Relation {}

impl ColumnTrait for Column {
    type EntityName = Entity;
    fn def(&self) -> ColumnDef {
        match self {
            Self::Id => ColumnType::Text.def(),
            Self::TopicId => ColumnType::Integer.def(),
            Self::Uid => ColumnType::Text.def(),
            Self::Displayname => ColumnType::String(StringLen::N(50)).def(),
            Self::RankLevel => ColumnType::Integer.def(),
            Self::RankImage => ColumnType::Text.def().null(),
            Self::Content => ColumnType::String(StringLen::N(500)).def(),
            Self::IsHidden => ColumnType::Boolean.def(),
            Self::HiddenById => ColumnType::Text.def().null(),
            Self::HiddenAt => ColumnType::DateTime.def().null(),
            Self::CreatedAt => ColumnType::DateTime.def(),
        }
    }
}

impl RelationTrait for Relation {
    fn def(&self) -> RelationDef {
        panic!("No RelationDef")
    }
}

impl ActiveModelBehavior for ActiveModel {}

type ChronoDateTime = chrono::NaiveDateTime;
