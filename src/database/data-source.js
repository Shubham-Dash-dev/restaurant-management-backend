const { DataSource } = require("typeorm");
const env = require("../config/env");
const User = require("../modules/users/user.entity");
const Category = require('../modules/categories/category.entity');
const MenuItem = require('../modules/menu/menu.entity')
const Cart = require('../modules/cart/cart.entity');
const CartItem = require('../modules/cart/cartItem.entity');
const Order = require('../modules/orders/order.entity');
const OrderItem = require('../modules/orders/orderItem.entity');
const Notification = require('../modules/notifications/notification.entity');

const AppDataSource = new DataSource({
  type: "postgres",
  host: env.dbHost,
  port: Number(env.dbPort),
  username: env.dbUsername,
  password: env.dbPassword,
  database: env.dbName,
  synchronize: false,
  logging: false,
  entities: [
    User, 
    Category, 
    MenuItem,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Notification],
  migrations: ["src/migrations/*.js"],
});

module.exports = AppDataSource;


//npm run migration:generate -- src/migrations/CreateCartAndCartItemsTable
// npm run migration:run
