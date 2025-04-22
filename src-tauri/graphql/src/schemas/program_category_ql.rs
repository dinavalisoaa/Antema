use serde::{Deserialize, Serialize};
use async_graphql::{Context, Object, Result, SimpleObject};
use repository::DbConnection;
use entity::program_category::{Entity as ProgramCategory, Column, Model as ProgramCategoryModel};
use anyhow::Error;
use sea_orm::{EntityTrait, QueryOrder, ActiveModelTrait, ActiveValue::Set, QuerySelect};
use entity::program_category;
use sea_orm::entity::prelude::*;
/// DTO pour la catégorie de programme
#[derive(Debug, Serialize, Deserialize, SimpleObject)]
pub struct ProgramCategoryDTO {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub programs: Option<Vec<ProgramDTO>>,
}

/// DTO pour le détail d'un programme
#[derive(Debug, Serialize, Deserialize, SimpleObject)]
pub struct ProgramDetailDTO {
    pub id: i32,
    pub name: String,
    pub title: String,
    pub order: i32,
    pub reference: String,
    pub song_id: i32,
    pub song_reference: String,
    pub image: String,
    pub category_id: i32,
    pub program_id: i32,
    pub category: Option<ProgramCategoryDTO>,
    pub program: Option<ProgramDTO>,
}

/// DTO principal pour un programme
#[derive(Debug, Serialize, Deserialize, SimpleObject)]
pub struct ProgramDTO {
    pub id: i32,
    pub name: String,
    pub reference: String,
    pub template_id: i32,
    pub date: DateTimeUtc,
    pub created_at:DateTimeUtc,
    pub category_id: i32,
    pub category: Option<ProgramCategoryDTO>,
    pub details: Vec<ProgramDetailDTO>,
}

#[derive(Default)]
pub struct ProgramCategoryQuery;

#[Object]
impl ProgramCategoryQuery {
    async fn find_category_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
    ) -> Result<Option<ProgramCategoryDTO>, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        if let Some(cat) = ProgramCategory::find_by_id(id).one(&db.connection).await? {
            Ok(Some(ProgramCategoryDTO {
                id: cat.id,
                name: cat.name,
                description: cat.description,
                programs: None,
            }))
        } else {
            Ok(None)
        }
    }

    async fn all_categories(
        &self,
        ctx: &Context<'_>,
        offset: Option<i32>,
        limit: Option<i32>,
    ) -> Result<Vec<ProgramCategoryDTO>, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let mut query = ProgramCategory::find().order_by_asc(Column::Name);
        if let Some(off) = offset {
            query = query.offset(off as u64);
        }
        if let Some(lim) = limit {
            query = query.limit(lim as u64);
        }
        let cats = query.all(&db.connection).await?;
        Ok(cats.into_iter().map(|cat| ProgramCategoryDTO {
            id: cat.id,
            name: cat.name,
            description: cat.description,
            programs: None,
        }).collect())
    }
}

#[derive(Default)]
pub struct ProgramCategoryMutation;

#[Object]
impl ProgramCategoryMutation {
    async fn create_category(
        &self,
        ctx: &Context<'_>,
        name: String,
        description: Option<String>,
    ) -> Result<ProgramCategoryDTO, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let new_cat = program_category::ActiveModel {
            id: Set(Default::default()),
            name: Set(name.clone()),
            description: Set(description.clone()),
        };
        let inserted = new_cat.insert(&db.connection).await?;
        Ok(ProgramCategoryDTO { id: inserted.id, name: inserted.name, description: inserted.description, programs: None })
    }

    async fn update_category_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
        name: String,
        description: Option<String>,
    ) -> Result<ProgramCategoryDTO, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let cat: program_category::ActiveModel = ProgramCategory::find_by_id(id)
            .one(&db.connection)
            .await?
            .ok_or(Error::msg("Category not found"))?
            .into();
        let mut am = cat;
        am.name = Set(name.clone());
        am.description = Set(description.clone());
        let updated = am.update(&db.connection).await?;
        Ok(ProgramCategoryDTO { id: updated.id, name: updated.name, description: updated.description, programs: None })
    }
}
