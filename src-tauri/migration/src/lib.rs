pub use sea_orm_migration::prelude::*;

mod m20241021_080046_create_table_migration;
mod m20241021_insert_table;
mod alter_table_migration;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            // Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20241021_080046_create_table_migration::Migration),
            Box::new(m20241021_insert_table::Migration),
            Box::new(alter_table_migration::Migration)
        ]
    }
}
