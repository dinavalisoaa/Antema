use serde::{Deserialize, Serialize};
use async_graphql::{Context, Object, Result, SimpleObject};
use repository::DbConnection;
use entity::program_category::*;
use entity::program::*;
use anyhow::Error;
use sea_orm::{EntityTrait, QueryOrder, ActiveModelTrait, ActiveValue::Set, QuerySelect};
use sea_orm::entity::prelude::*;
use crate::schemas::program_category_ql::{ProgramDTO, ProgramDetailDTO};
use entity::{program, program::Entity as Program};
/// DTO pour la catégorie de programme

#[derive(Default)]
pub struct ProgramCategoryQuery;

#[derive(Default)]
pub struct ProgramQuery;

#[Object]
impl ProgramQuery {
    async fn find_program_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
    ) -> Result<Option<ProgramDTO>, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        if let Some(prog) = Program::find_by_id(id).one(&db.connection).await? {
            Ok(Some(ProgramDTO {
                id: prog.id,
                name: prog.name,
                reference: prog.reference,
                template_id: prog.template_id,
                date: prog.date,
                created_at: prog.created_at,
                category_id: prog.category_id,
                category: None,
                details: vec![],
            }))
        } else {
            Ok(None)
        }
    }

    async fn all_programs(
        &self,
        ctx: &Context<'_>,
        offset: Option<i32>,
        limit: Option<i32>,
    ) -> Result<Vec<ProgramDTO>, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let mut query = Program::find().order_by_asc(Column::Name);
        if let Some(off) = offset {
            query = query.offset(off as u64);
        }
        if let Some(lim) = limit {
            query = query.limit(lim as u64);
        }
        let progs = query.all(&db.connection).await?;
        Ok(progs.into_iter().map(|p| ProgramDTO {
            id: p.id,
            name: p.name,
            reference: p.reference,
            template_id: p.template_id,
            date: p.date,
            created_at: p.created_at,
            category_id: p.category_id,
            category: None,
            details: vec![],
        }).collect())
    }

    async fn find_program_with_details_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
    ) -> Result<Option<ProgramDTO>, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        if let Some(prog) = Program::find_by_id(id).one(&db.connection).await? {
            let details = prog.find_related(entity::program_detail::Entity)
                .all(&db.connection).await?;
            Ok(Some(ProgramDTO {
                id: prog.id,
                name: prog.name,
                reference: prog.reference,
                template_id: prog.template_id,
                date: prog.date,
                created_at: prog.created_at,
                category_id: prog.category_id,
                category: None,
                details: details.into_iter().map(|d| ProgramDetailDTO {
                    id: d.id,
                    name: d.name,
                    title: d.title,
                    order: d.order,
                    reference: d.reference,
                    song_id: d.song_id,
                    song_reference: d.song_reference,
                    image: d.image,
                    category_id: d.category_id,
                    program_id: d.program_id,
                    category: None,
                    program: None,
                }).collect(),
            }))
        } else {
            Ok(None)
        }
    }
}

#[derive(Default)]
pub struct ProgramMutation;

#[Object]
impl ProgramMutation {
    async fn create_program(
        &self,
        ctx: &Context<'_>,
        name: String,
        reference: String,
        template_id: i32,
        date: chrono::DateTime<chrono::Utc>,
        category_id: i32,
    ) -> Result<ProgramDTO, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let new_prog = program::ActiveModel {
            id: Set(Default::default()),
            name: Set(name.clone()),
            reference: Set(reference.clone()),
            template_id: Set(template_id),
            date: Set(date),
            created_at: Set(chrono::Utc::now()),
            category_id: Set(category_id),
        };
        let inserted = new_prog.insert(&db.connection).await?;
        Ok(ProgramDTO {
            id: inserted.id,
            name: inserted.name,
            reference: inserted.reference,
            template_id: inserted.template_id,
            date: inserted.date,
            created_at: inserted.created_at,
            category_id: inserted.category_id,
            category: None,
            details: vec![],
        })
    }

    async fn update_program_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
        name: String,
        reference: String,
        template_id: i32,
        date: chrono::DateTime<chrono::Utc>,
        category_id: i32,
    ) -> Result<ProgramDTO, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let prog: program::ActiveModel = Program::find_by_id(id)
            .one(&db.connection)
            .await?
            .ok_or(Error::msg("Program not found"))?
            .into();
        let mut am = prog;
        am.name = Set(name.clone());
        am.reference = Set(reference.clone());
        am.template_id = Set(template_id);
        am.date = Set(date);
        am.category_id = Set(category_id);
        let updated = am.update(&db.connection).await?;
        Ok(ProgramDTO {
            id: updated.id,
            name: updated.name,
            reference: updated.reference,
            template_id: updated.template_id,
            date: updated.date,
            created_at: updated.created_at,
            category_id: updated.category_id,
            category: None,
            details: vec![],
        })
    }
}
