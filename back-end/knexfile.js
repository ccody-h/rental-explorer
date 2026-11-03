require("dotenv").config();

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || REDACTED,
      database: process.env.DB_NAME || "rental_api",
    },
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },
};