exports.up = function (knex) {
  return knex.schema.alterTable("ratings", (table) => {
    // Optional comment submitted with a rating
    table.string("comment", 200).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("ratings", (table) => {
    table.dropColumn("comment");
  });
};