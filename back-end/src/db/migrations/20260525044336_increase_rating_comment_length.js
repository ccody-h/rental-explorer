exports.up = function (knex) {
  return knex.schema.alterTable("ratings", (table) => {
    table.string("comment", 2000).nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("ratings", (table) => {
    table.string("comment", 200).nullable().alter();
  });
};