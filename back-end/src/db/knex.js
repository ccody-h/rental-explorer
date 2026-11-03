const path = require("path");

// Loads the Knex configuration from the server root folder
const knexConfig = require(path.join(__dirname, "../../knexfile"));

const environment = process.env.NODE_ENV || "development";

// Creates a reusable Knex database connection
const knex = require("knex")(knexConfig[environment]);

module.exports = knex;