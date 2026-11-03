exports.up = function (knex) {
  return knex.schema.createTable("ratings", (table) => {
    // Primary key for each rating row
    table.increments("id").primary();

    // The user who made the rating
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    // The property being rated.
    table
      .integer("rental_id")
      .notNullable()
      .references("id")
      .inTable("data")
      .onDelete("CASCADE");

    // Rating value
    table.integer("rating").notNullable();

    // Date/time the rating was created or updated
    table.timestamp("date_time").defaultTo(knex.fn.now());

    // One rating per user per property
    table.unique(["user_id", "rental_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("ratings");
};