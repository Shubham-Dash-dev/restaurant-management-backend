const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");

const categoryEntity = new EntitySchema({
  name: "Category",
  tableName: "categories",

  columns: {
    ...BaseEntity,

    name: {
      type: "varchar",
      length: 100,
      unique: true,
      nullable: false,
    },

    description: {
      type: "text",
      nullable: true,
    },

    isActive: {
      name: "is_active",
      type: "boolean",
      default: true,
      nullable: false,
    },

    deletedAt: {
      name: "deleted_at",
      type: "timestamp",
      deleteDate: true,
      nullable: true,
    },
  },
});

module.exports = categoryEntity;
