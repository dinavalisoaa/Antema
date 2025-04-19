use async_graphql::{Context, Object, Result, SimpleObject};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, ModelTrait, QueryOrder, Set, DbErr};
use repository::DbConnection;
use entity::{verses, verses::Entity as Verses, song, song::Entity as Song};
use serde::{Deserialize, Serialize};
use anyhow::Error;
use sea_orm::QuerySelect;
use crate::schemas::song_ql::SongDTO;
// DTO pour Song (simplifié pour les versets)


// DTO pour Verse (avec relation vers Song)
#[derive(Debug, Serialize, Deserialize, SimpleObject)]
pub struct VerseDTO {
    pub id: i32,
    pub lyrics: String,
    pub reference: String,
    pub song: Option<SongDTO>,
}

// Structure pour les requêtes GraphQL
#[derive(Default)]
pub struct VerseQuery;

#[Object]
impl VerseQuery {
    // Récupérer un verset par ID avec sa relation
    async fn find_verse_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
    ) -> Result<Option<VerseDTO>, Error> {
        let db = ctx.data::<DbConnection>().unwrap();

        if let Some(verse) = Verses::find_by_id(id).one(&db.connection).await? {
            let related_song = verse.find_related(Song).one(&db.connection).await?;

            let verse_dto = VerseDTO {
                id: verse.id,
                lyrics: verse.lyrics,
                reference: verse.reference,
                song: related_song.map(|s| SongDTO {
                    id: s.id,
                    title: s.title,
                    reference: s.reference,
                    category: None,
                    author: None,
                    verses: vec![],
                }),
            };

            Ok(Some(verse_dto))
        } else {
            Ok(None)
        }
    }

    // Récupérer tous les versets avec leurs relations
    async fn all_verses(
        &self,
        ctx: &Context<'_>,
        offset: Option<i32>,
        limit: Option<i32>,
    ) -> Result<Vec<VerseDTO>, DbErr> {
        let db = ctx.data::<DbConnection>().unwrap();

        let mut query = Verses::find()
            .order_by_asc(verses::Column::Id); // Tri par ID, ajustez selon vos besoins

        if let Some(offset_val) = offset {
            query = query.offset(offset_val as u64);
        }
        if let Some(limit_val) = limit {
            query = query.limit(limit_val as u64);
        }

        let verses = query.all(&db.connection).await?;

        let mut verse_dtos = Vec::new();
        for verse in verses {
            let related_song = verse.find_related(Song).one(&db.connection).await?;

            let verse_dto = VerseDTO {
                id: verse.id,
                lyrics: verse.lyrics,
                reference: verse.reference,
                song: related_song.map(|s| SongDTO {
                    id: s.id,
                    title: s.title,
                    reference: s.reference,
                    category: None,
                    author: None,
                    verses: vec![],
                }),
            };
            verse_dtos.push(verse_dto);
        }

        Ok(verse_dtos)
    }
}

// Structure pour les mutations GraphQL
#[derive(Default)]
pub struct VerseMutation;

#[Object]
impl VerseMutation {
    // Créer un nouveau verset
    async fn create_verse(
        &self,
        ctx: &Context<'_>,
        lyrics: String,
        reference: String,
        song_reference: String
    ) -> Result<VerseDTO, Error> {
        let db = ctx.data::<DbConnection>().unwrap();

        if lyrics.trim().is_empty() {
            return Err(Error::msg("Les paroles du verset ne peuvent pas être vides."));
        }

        let new_verse = verses::ActiveModel {
            id: ActiveValue::NotSet,
            lyrics: ActiveValue::Set(lyrics.clone()),
            reference: ActiveValue::Set(reference),
            song_reference: ActiveValue::Set(song_reference),
        };

        let inserted_verse = new_verse.insert(&db.connection).await?;
        let related_song = inserted_verse.find_related(Song).one(&db.connection).await?;

        Ok(VerseDTO {
            id: inserted_verse.id,
            lyrics: inserted_verse.lyrics,
            reference: inserted_verse.reference,
            song: related_song.map(|s| SongDTO {
                id: s.id,
                title: s.title,
                reference: s.reference,
                category: None,
                author: None,
                verses: vec![],
            }),
        })
    }

    // Mettre à jour un verset par ID
    async fn update_verse_by_id(
        &self,
        ctx: &Context<'_>,
        id: i32,
        lyrics: String,
        reference: String,
        song_reference: String,
    ) -> Result<VerseDTO, Error> {
        let db = ctx.data::<DbConnection>().unwrap();

        if lyrics.trim().is_empty() {
            return Err(Error::msg("Les paroles du verset ne peuvent pas être vides."));
        }

        // Récupérer le verset existant
        let verse: verses::ActiveModel = Verses::find_by_id(id)
            .one(&db.connection)
            .await?
            .ok_or(DbErr::Custom("Verset non trouvé".to_owned()))
            .map(Into::into)?;

        // Mettre à jour les champs
        let mut updated_verse: verses::ActiveModel = verse;
        updated_verse.lyrics = Set(lyrics.clone());
        updated_verse.reference = Set(reference);
        updated_verse.song_reference = Set(song_reference);

        let updated_verse = updated_verse.update(&db.connection).await?;
        let related_song = updated_verse.find_related(Song).one(&db.connection).await?;

        Ok(VerseDTO {
            id: updated_verse.id,
            lyrics: updated_verse.lyrics,
            reference: updated_verse.reference,
            song: related_song.map(|s| SongDTO {
                id: s.id,
                title: s.title,
                reference: s.reference,
                category: None,
                author: None,
                verses: vec![],
            }),
        })
    }
}