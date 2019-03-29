
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('users', table => {
      table.increments('id').primary();
      table.string('githubId').unique();
    })
    .createTable('posts', table => {
      table.increments('id').primary();
      table.string('content').notNull();
      table
        .integer('writerId')
        .unsigned()
        .references('id')
        .inTable('users');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .table('posts', table => {
      table.dropForeign('writerId');
      table.dropColumn('writerId');
    })
    .dropTableIfExists('posts')
    .dropTableIfExists('users');
};
