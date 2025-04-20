use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Song::Table)
                    .add_column(
                        ColumnDef::new(Song::Content)
                        .string()
                    )
                    
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
                    .drop_table(Table::drop().table(Song::Table).to_owned())
                    .await
    }
}

#[derive(DeriveIden)]
enum Song {
    Table,
    Id,
    Title,
    CategoryId,
    AuthorId,
    Reference,
    Content
}