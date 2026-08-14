const { DataSource } = require("typeorm");
const env = require("../config/env");
const User = require("../modules/users/user.entity");
const Category = require('../modules/categories/category.entity');
const MenuItem = require('../modules/menu/menu.entity')

const AppDataSource = new DataSource({
  type: "postgres",
  host: env.dbHost,
  port: Number(env.dbPort),
  username: env.dbUsername,
  password: env.dbPassword,
  database: env.dbName,
  synchronize: false,
  logging: false,
  entities: [User, Category, MenuItem],
  migrations: ["src/migrations/*.js"],
});

module.exports = AppDataSource;
