const { DataSource } = require("typeorm");
const env = require("../config/env");

const AppDataSource = new DataSource({
  type: "postgres",

  host: env.dbHost,
  port: Number(env.dbPort),
  username: env.dbUsername,
  password: env.dbPassword,
  database: env.dbName,

  synchronize: false,
  logging: false,

  entities: ["src/entities/*.js"],
  migrations: ["src/migrations/*.js"],
});

module.exports = AppDataSource;