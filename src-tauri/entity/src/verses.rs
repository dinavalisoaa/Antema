    use sea_orm::entity::prelude::*;
    use serde::{Deserialize, Serialize};


    #[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
    #[sea_orm(table_name = "verses")]
    pub struct Model {
        #[sea_orm(primary_key)]
        #[serde(skip_deserializing)]
        pub id: i32,
        pub lyrics: String,
        pub reference: String,
        pub song_reference  : String
       }


       #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
       pub enum Relation {
           #[sea_orm(belongs_to = "super::song::Entity", from = "Column::SongReference", to = "super::song::Column::Reference")]
           Song
       }

       impl Related<super::song::Entity> for Entity {
           fn to() -> RelationDef {
               Relation::Song.def()
           }
       }


       impl ActiveModelBehavior for ActiveModel {}
