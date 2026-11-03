exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    // Primary key for each user
    table.increments("id").primary();

    // User email must be unique so duplicate accounts cannot be created
    table.string("email").notNullable().unique();

    // Stores the hashed password
    table.string("password_hash").notNullable();

    // records when the account was created
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("users");
};