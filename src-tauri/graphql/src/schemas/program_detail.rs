use async_graphql::{Context, Object, Result, SimpleObject};
use repository::DbConnection;
use entity::program_detail::{Entity as ProgramDetail, Column, Model as ProgramDetailModel};
use anyhow::Error;
use sea_orm::{EntityTrait, QueryOrder, ActiveModelTrait, ActiveValue::Set, QuerySelect};
use entity::program_detail;
use crate::schemas::program_category_ql::ProgramDetailDTO;

#[derive(Default)]
pub struct ProgramDetailQuery;

#[Object]
impl ProgramDetailQuery {
    async fn find_detail_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
    ) -> Result<Option<ProgramDetailDTO>, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        if let Some(detail) = ProgramDetail::find_by_id(id).one(&db.connection).await? {
            Ok(Some(ProgramDetailDTO {
                id: detail.id,
                name: detail.name,
                title: detail.title,
                order: detail.order,
                reference: detail.reference,
                song_id: detail.song_id,
                song_reference: detail.song_reference,
                image: detail.image,
                category_id: detail.category_id,
                program_id: detail.program_id,
                category: None,
                program: None,
            }))
        } else {
            Ok(None)
        }
    }

    async fn all_details(
        &self,
        ctx: &Context<'_>,
        offset: Option<i32>,
        limit: Option<i32>,
    ) -> Result<Vec<ProgramDetailDTO>, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let mut query = ProgramDetail::find().order_by_asc(Column::Id);
        if let Some(off) = offset {
            query = query.offset(off as u64);
        }
        if let Some(lim) = limit {
            query = query.limit(lim as u64);
        }
        let details = query.all(&db.connection).await?;
        Ok(details.into_iter().map(|d| ProgramDetailDTO {
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
        }).collect())
    }
}

#[derive(Default)]
pub struct ProgramDetailMutation;

#[Object]
impl ProgramDetailMutation {
    async fn create_detail(
        &self,
        ctx: &Context<'_>,
        name: String,
        title: String,
        order: i32,
        reference: String,
        song_id: i32,
        song_reference: String,
        image: String,
        category_id: i32,
        program_id: i32,
    ) -> Result<ProgramDetailDTO, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let new_detail = program_detail::ActiveModel {
            id: Set(Default::default()),
            name: Set(name.clone()),
            title: Set(title.clone()),
            order: Set(order),
            reference: Set(reference.clone()),
            song_id: Set(song_id),
            song_reference: Set(song_reference.clone()),
            image: Set(image.clone()),
            category_id: Set(category_id),
            program_id: Set(program_id),
        };
        let inserted = new_detail.insert(&db.connection).await?;
        Ok(ProgramDetailDTO {
            id: inserted.id,
            name: inserted.name,
            title: inserted.title,
            order: inserted.order,
            reference: inserted.reference,
            song_id: inserted.song_id,
            song_reference: inserted.song_reference,
            image: inserted.image,
            category_id: inserted.category_id,
            program_id: inserted.program_id,
            category: None,
            program: None,
        })
    }

    async fn update_detail_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
        name: String,
        title: String,
        order: i32,
        reference: String,
        song_id: i32,
        song_reference: String,
        image: String,
        category_id: i32,
        program_id: i32,
    ) -> Result<ProgramDetailDTO, Error> {
        let db = ctx.data::<DbConnection>().unwrap();
        let detail: program_detail::ActiveModel = ProgramDetail::find_by_id(id)
            .one(&db.connection)
            .await?
            .ok_or(Error::msg("Detail not found"))?
            .into();
        let mut am = detail;
        am.name = Set(name.clone());
        am.title = Set(title.clone());
        am.order = Set(order);
        am.reference = Set(reference.clone());
        am.song_id = Set(song_id);
        am.song_reference = Set(song_reference.clone());
        am.image = Set(image.clone());
        am.category_id = Set(category_id);
        am.program_id = Set(program_id);
        let updated = am.update(&db.connection).await?;
        Ok(ProgramDetailDTO {
            id: updated.id,
            name: updated.name,
            title: updated.title,
            order: updated.order,
            reference: updated.reference,
            song_id: updated.song_id,
            song_reference: updated.song_reference,
            image: updated.image,
            category_id: updated.category_id,
            program_id: updated.program_id,
            category: None,
            program: None,
        })
    }
}
