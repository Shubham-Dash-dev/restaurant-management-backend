const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");
const { ORDER_STATUS } = require("../../constants/orderStatus");

const orderEntity = new EntitySchema({
  name: "Order",
  tableName: "orders",

  columns: {
    ...BaseEntity,

    userId: {
      name: "user_id",
      type: "uuid",
      nullable: false,
    },

    orderStatus: {
      name: "order_status",
      type: "varchar",
      length: 50,
      default: ORDER_STATUS.PENDING,
      nullable: false,
    },

    totalAmount: {
      name: "total_amount",
      type: "decimal",
      precision: 10,
      scale: 2,
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

    items: {
      type: "one-to-many",
      target: "OrderItem",
      inverseSide: "order",
      cascade: true,
    },
  },
});

module.exports = orderEntity;
