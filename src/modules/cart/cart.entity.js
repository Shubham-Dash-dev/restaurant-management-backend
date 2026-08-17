const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");

const cartEntity = new EntitySchema({
  name: "Cart",
  tableName: "carts",

  columns: {
    ...BaseEntity,

    userId: {
      name: "user_id",
      type: "uuid",
      unique: true,
      nullable: false,
    },
  },

  relations: {
    user: {
      type: "one-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
      onDelete: "CASCADE",
    },

    items: {
      type: "one-to-many",
      target: "CartItem",
      inverseSide: "cart",
      cascade: true,
    },
  },
});

module.exports = cartEntity;
