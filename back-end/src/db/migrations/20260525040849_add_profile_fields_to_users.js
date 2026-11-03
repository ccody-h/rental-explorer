exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    // Optional user profile fields
    table.string("first_name").nullable();
    table.string("last_name").nullable();
    table.date("dob").nullable();
    table.string("address").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("first_name");
    table.dropColumn("last_name");
    table.dropColumn("dob");
    table.dropColumn("address");
  });
};