const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");

const favoriteEntity = new EntitySchema({
  name: "Favorite",
  tableName: "favorites",

  columns: {
    ...BaseEntity,

    userId: {
      name: "user_id",
      type: "uuid",
      nullable: false,
    },

    menuItemId: {
      name: "menu_item_id",
      type: "uuid",
      nullable: false,
    },
  },

  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
      onDelete: "CASCADE",
    },

    menuItem: {
      type: "many-to-one",
      target: "MenuItem",
      joinColumn: { name: "menu_item_id" },
      onDelete: "CASCADE",
    },
  },

  uniques: [
    {
      name: "UQ_user_favorite_unique",
      columns: ["userId", "menuItemId"],
    },
  ],
});

module.exports = favoriteEntity;
