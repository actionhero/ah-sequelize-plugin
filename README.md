# ah-sequelize-plugin

This pluggin will use the sequelize orm to create `api.models` which contain your sequelize models

## Setup

- install this plugin: `npm install ah-sequelize-plugin --save`
- be sure to enable the pluggin within actionhero (`config/plugins.js`)
- you will need to add the sequelize package (`npm install sequelize --save`) to your package.json
- you will need to add the sequelize-fixtures package (`npm install sequelize-fixtures --save`) to your package.json
- you will need to add the mysql (or other supported database) package (`npm install mysql --save`) to your package.json
  - there are many options you can pass to sequelize.  You can learn more here: http://sequelize.readthedocs.org/en/latest/api/sequelize/index.html

A `./config/sequelize.json` file will be created which will store your database configuration

## [Models](http://docs.sequelizejs.com/en/latest/api/models)

Use the exports form of sequelize models in `./models` with the file name matching that of the model, IE:

```javascript
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Project", {
    name: DataTypes.STRING,
    description: DataTypes.TEXT
  })
}
```

Models are loaded into `api.models`, so the example above would be `api.models.Project`.

## [Migrations](http://docs.sequelizejs.com/en/latest/api/migrations)

This pluggin does not condone the use of `Sequelize.sync()` in favor of migrations.  Keep you migrations in `./migrationss` and run `api.sequelize.migrate()`.

An example migration to create a `users` table would look like:
```javascript 
// from ./migrations/20140101000001-create-users.js

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      passwordHash: DataTypes.TEXT,
      passwordSalt: DataTypes.TEXT,
      createdAt: DataTypes.DATE
      updatedAt: DataTypes.DATE
    }).complete(function(){

    migration.addIndex('users', ['email'], {
      indexName: 'email_index',
      indicesType: 'UNIQUE'
    }).complete(function(){

    migration.addIndex('users', ['name'], {
      indexName: 'name_index',
      indicesType: 'UNIQUE'
    }).complete(function(){

    migration.addIndex('users', ['phone'], {
      indexName: 'phone_index',
      indicesType: 'UNIQUE'
    }).complete(function(){

      done();

    });
    });
    });
    });
  },
 
  down: function(migration, DataTypes, done) {
    migration.dropTable('users').complete(done);
  }
}
```

You can use the [sequelize-cli](http://docs.sequelizejs.com/en/latest/api/migrations#cli) for more utilities or
you can add a migration grunt helper(s) to your actionhero project by adding the below to your `gruntfile.js`:

```javascript
grunt.registerTask('migrate','run any pending database migrations',function(file){
  var done = this.async();
  init(function(api){
    api.sequelize.migrate(function(){
      done();
    })
  })
})
```

To migrate down also add the following:

```javascript
grunt.registerTask('migrate:undo','revert and run the “down” action on the last run migration',function(file){
  var done = this.async();
  init(function(api){
    api.sequelize.migrateUndo(function(){
      done();
    })
  })
})
```

If you want to sync, you can `api.sequelize.sync()` or `api.models.yourModel.sync()`;

## [Associations](http://docs.sequelizejs.com/en/latest/api/associations)

If you want to declare associations, best practice has you create an `associations` initializer within your project which might look like this:

```javascript
exports.associations = function(api, next){

  api.associations = {};

  api.associations._start = function(api, next){
    api.models.user.hasMany(api.models.posts);
    api.models.posts.hasMany(api.models.comments);

    api.models.comments.belongsTo(api.models.posts);
    api.models.posts.belongsTo(api.models.user);

    next();
  };

  next();
}
```

## [Fixtures](https://github.com/domasx2/sequelize-fixtures)

We use the `sequelize-fixtures` package to load in JSON-defined fixtures in the test NODE_ENV.  Store your fixtures in `./test/fixtures/*.json` or `./test/fixtures/*.yml`
