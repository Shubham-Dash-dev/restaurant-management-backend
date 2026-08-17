const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");

const cartItemEntity = new EntitySchema({
  name: "CartItem",
  tableName: "cart_items",

  columns: {
    ...BaseEntity,

    cartId: {
      name: "cart_id",
      type: "uuid",
      nullable: false,
    },

    menuItemId: {
      name: "menu_item_id",
      type: "uuid",
      nullable: false,
    },

    quantity: {
      type: "int",
      default: 1,
      nullable: false,
    },
  },

  uniques: [
    { // one dish can only appear ONCE in a single cart.
      name: "UQ_cart_item_unique",
      columns: ["cartId", "menuItemId"],
    },
  ],

  relations: {
    cart: {
      type: "many-to-one",
      target: "Cart",
      joinColumn: { name: "cart_id" },
      onDelete: "CASCADE",
    },

    menuItem: {
      type: "many-to-one",
      target: "MenuItem",
      joinColumn: { name: "menu_item_id" },
      onDelete: "CASCADE",
    },
  },
});

module.exports = cartItemEntity;
