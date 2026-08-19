const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");
const { PAYMENT_STATUS, PAYMENT_METHODS } = require("../../constants/paymentStatus");

const paymentEntity = new EntitySchema({
  name: "Payment",
  tableName: "payments",

  columns: {
    ...BaseEntity,

    orderId: {
      name: "order_id",
      type: "uuid",
      nullable: false,
    },

    userId: {
      name: "user_id",
      type: "uuid",
      nullable: false,
    },

    amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },

    paymentMethod: {
      name: "payment_method",
      type: "varchar",
      length: 20,
      default: PAYMENT_METHODS.UPI,
      nullable: false,
    },

    paymentStatus: {
      name: "payment_status",
      type: "varchar",
      length: 20,
      default: PAYMENT_STATUS.COMPLETED,
      nullable: false,
    },

    transactionId: {
      name: "transaction_id",
      type: "varchar",
      length: 60,
      unique: true,
      nullable: false,
    },

    paidAt: {
      name: "paid_at",
      type: "timestamp",
      nullable: true,
    },
  },

  relations: {
    order: {
      type: "many-to-one",
      target: "Order",
      joinColumn: { name: "order_id" },
      onDelete: "CASCADE",
    },

    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
      onDelete: "CASCADE",
    },
  },
});

module.exports = paymentEntity;
