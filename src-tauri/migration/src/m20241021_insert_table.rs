use sea_orm_migration::prelude::*;
use std::env;
use std::fs;
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {

let init = fs::read_to_string("database/INIT.sql")
.map_err(|e| DbErr::Migration(format!("Failed to read SQL file: {}", e)))?;
let ff = fs::read_to_string("database/FF.sql")
.map_err(|e| DbErr::Migration(format!("1 to read SQL file: {}", e)))?;
let ffpm = fs::read_to_string("database/FFPM.sql")
.map_err(|e| DbErr::Migration(format!("Failed to read SQL file: {}", e)))?;
let antema = fs::read_to_string("database/ANTEMA.sql")
.map_err(|e| DbErr::Migration(format!("Failed to read SQL file: {}", e)))?;
let salamo = fs::read_to_string("database/SALAMO.sql")
.map_err(|e| DbErr::Migration(format!("Failed to read SQL file: {}", e)))?;
println!("With text:\n{init}");
            manager
            .get_connection()
            .execute_unprepared(&init
            )
            .await?;
            manager
            .get_connection()
            .execute_unprepared(&ff
            )
            .await?;

            manager
            .get_connection()
            .execute_unprepared(&antema
            )
            .await?;

            manager
            .get_connection()
            .execute_unprepared(&ffpm
            )
            .await?;
manager
            .get_connection()
            .execute_unprepared(&salamo
            )
            .await?;
Ok(())
}

async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
manager
.get_connection()
.execute_unprepared(
"DELETE FROM types WHERE id = 54353;"
)
.await?;

Ok(())
}
}
