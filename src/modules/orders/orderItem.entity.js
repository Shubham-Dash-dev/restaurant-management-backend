const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");

const orderItemEntity = new EntitySchema({
  name: "OrderItem",
  tableName: "order_items",

  columns: {
    ...BaseEntity,

    orderId: {
      name: "order_id",
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
      nullable: false,
    },

    priceAtPurchase: {
      name: "price_at_purchase",
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
  },

  uniques: [
    {
      name: "UQ_order_item_unique",
      columns: ["orderId", "menuItemId"],
    },
  ],

  relations: {
    order: {
      type: "many-to-one",
      target: "Order",
      joinColumn: { name: "order_id" },
      onDelete: "CASCADE",
    },

    menuItem: {
      type: "many-to-one",
      target: "MenuItem",
      joinColumn: { name: "menu_item_id" },
      onDelete: "RESTRICT", // if an admin tries to delete a dish from the menu, then
      //  it will throw an error : "Error: You cannot delete this dish because it is part of historical order receipts in order_items."
    },
  },
});


module.exports = orderItemEntity;
