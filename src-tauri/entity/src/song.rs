use std::fmt;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::category;
use crate::author;
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "song")]
pub struct Model {
    #[sea_orm(primary_key)]
    #[serde(skip_deserializing)]
    pub id: i32,
    pub title: String,
    pub category_id: i32,  // Foreign key to the Post model
    pub author_id: i32,
    pub reference: String,
    pub content: Option<String>,
  #[sea_orm(ignore)]
    pub category: Option<category::Model>,
  #[sea_orm(ignore)]
    pub author: Option<author::Model>
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(belongs_to = "super::category::Entity", from = "Column::CategoryId", to = "super::category::Column::Id")]
    Category, 
    #[sea_orm(belongs_to = "super::author::Entity", from = "Column::AuthorId", to = "super::author::Column::Id")]
    Author,
}


impl Related<super::category::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Category.def()
    }
}
impl fmt::Display for Model {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // Customize so only `x` and `y` are denoted.
        write!(f, "x: {}",self.category.clone().unwrap().name)
    }
}
impl Related<super::author::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Author.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
