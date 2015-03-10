# ah-sequelize-plugin

This plugin will use the sequelize orm to create `api.models` which contain your sequelize models

## Setup

- install this plugin: `npm install ah-sequelize-plugin --save`
- be sure to enable the plugin within actionhero (`config/plugins.js`)
- you will need to add the sequelize package (`npm install sequelize --save`) to your package.json
- you will need to add the sequelize-fixtures package (`npm install sequelize-fixtures --save`) to your package.json
- you will need to add the mysql (or other supported database) package (`npm install mysql --save`) to your package.json
  - there are many options you can pass to sequelize.  You can learn more here: http://sequelize.readthedocs.org/en/latest/api/sequelize/index.html
- you will need to add the sequelize-cli package (`npm install sequelize-cli --save-dev`) to the `"devDependencies"` of your package.json
  - you could install it globally instead (`npm install -g sequelize-cli`)

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

This plugin does not condone the use of `Sequelize.sync()` in favor of migrations.  Keep you migrations in `./migrations` and use the [sequelize-cli](https://github.com/sequelize/cli) to execute them.

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

You can use the [sequelize-cli](http://docs.sequelizejs.com/en/latest/docs/migrations/) to create and execute migrations. 
Using the `migrator` class on `api.sequelize` is [deprecated](https://github.com/sequelize/sequelize/issues/3301#issuecomment-77935976), as Sequelize 
now recommends using [Umzug](https://github.com/sequelize/umzug) to manage database schemas.

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

We use the `sequelize-fixtures` package to load in JSON-defined fixtures in the test NODE\_ENV.  Store your fixtures in `./test/fixtures/*.json` or `./test/fixtures/*.yml`
