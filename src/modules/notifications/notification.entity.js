const { EntitySchema } = require("typeorm");
const BaseEntity = require("../../common/database/baseEntity");

const notificationEntity = new EntitySchema({
  name: "Notification",
  tableName: "notifications",

  columns: {
    ...BaseEntity,

    userId: {
      name: "user_id",
      type: "uuid",
      nullable: false,
    },

    orderId: {
      name: "order_id",
      type: "uuid",
      nullable: true,
    },

    title: {
      type: "varchar",
      length: 100,
      nullable: false,
    },

    message: {
      type: "text",
      nullable: false,
    },

    isRead: {
      name: "is_read",
      type: "boolean",
      default: false,
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

    order: {
      type: "many-to-one",
      target: "Order",
      joinColumn: { name: "order_id" },
      onDelete: "CASCADE",
    },
  },
});

module.exports = notificationEntity;
