const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");

const menuItemEntity = new EntitySchema({
  name: "MenuItem",
  tableName: "menu_items",

  columns: {
    ...BaseEntity,

    name: {
      type: "varchar",
      length: 150,
      nullable: false,
    },

    description: {
      type: "text",
      nullable: true,
    },

    price: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },

    imageUrl: {
      name: "image_url",
      type: "varchar",
      length: 255,
      nullable: true,
    },

    isVeg: {
      name: "is_veg",
      type: "boolean",
      default: true,
      nullable: false,
    },

    isAvailable: {
      name: "is_available",
      type: "boolean",
      default: true,
      nullable: false,
    },

    categoryId: {
      name: "category_id",
      type: "uuid",
      nullable: false,
    },

    deletedAt: {
      name: "deleted_at",
      type: "timestamp",
      deleteDate: true,
      nullable: true,
    },
  },

  relations: {
    category: { // this will work similar like populate in mongoose // give details of category table in menuitems table 
      type: "many-to-one",
      target: "Category",
      joinColumn: { name: "category_id" },
      onDelete: "RESTRICT",
    },
  },
});

module.exports = menuItemEntity;


// line no 65 category is not an database column name it is just an javascript relationship property . the actual DB column is category_id
// this category is just an property in relations object which have the category table information so that we can easily access this category information on menuitems query 
// with the help of relations : ["category"] we can fetch category table details in menuitems 
// 1. type: "many-to-one" -> this tell that this table can have multiple relations with this table 
// 2. target: "Category" -> this tell that this table is related to which table 
// 3. joinColumn: { name: "category_id" } -> this tell that this table is related to which column in this table 
// 4. onDelete: "CASCADE" -> this tell that if this table is deleted then this table is also deleted 
