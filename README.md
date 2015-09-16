# ah-sequelize-plugin

This plugin will use the sequelize orm to create `api.models` which contain your sequelize models

## Setup

- install this plugin: `npm install ah-sequelize-plugin --save`
- be sure to enable the plugin within actionhero (`config/plugins.js`)
- you will need to add the sequelize package (`npm install sequelize --save`) to your package.json
- you will need to add the sequelize-fixtures package (`npm install sequelize-fixtures --save`) to your package.json
- you will need to add the mysql (or other supported database) package (`npm install mysql --save`) to your package.json
  - there are many options you can pass to sequelize.  You can learn more here: http://sequelize.readthedocs.org/en/latest/api/sequelize/index.html
- you will need to add the sequelize-cli package (`npm install sequelize-cli`) to your package.json
  - you could install it globally instead (`npm install -g sequelize-cli`)

A `./config/sequelize.js` file will be created which will store your database configuration

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

var Promise = require('bluebird');

module.exports = {
  up: function(migration, DataTypes) {
    return Promise.all([
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
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE
      })
    ]).then(function(){
      return Promise.all([
        migration.addIndex('users', ['email'], {
          indexName: 'email_index',
          indicesType: 'UNIQUE'
        }),
        migration.addIndex('users', ['name'], {
          indexName: 'name_index',
          indicesType: 'UNIQUE'
        }),
        migration.addIndex('users', ['phone'], {
          indexName: 'phone_index',
          indicesType: 'UNIQUE'
        })
      ]);
    });
  },
 
  down: function(migration, DataTypes) {
    return Promise.all([
      migration.dropTable('users')
    ]);
  }
}
```

You can use the [sequelize-cli](http://docs.sequelizejs.com/en/latest/docs/migrations/) to create and execute migrations. 

`api.sequelize.migrate` and `api.sequelize.migrateUndo` are now based on [Umzug](https://github.com/sequelize/umzug), and are maintained for legacy purposes.
An Umzug instance is available at `api.sequelize.umzug`, and should be used to perform (and undo) migrations programatically using the [official API](https://github.com/sequelize/umzug#api).

If you want to sync, you can `api.sequelize.sequelize.sync()` or `api.models.yourModel.sync()`;

By default, `ah-sequelize-plugin` will automatically execute any pending migrations when Actionhero starts up. You can disable this behaviour by adding `autoMigrate: false` to your sequelize config.

## [Associations](http://docs.sequelizejs.com/en/latest/api/associations)

If you want to declare associations, best practice has you create an `associations.js` initializer within your project which might look like this:

```javascript
module.exports = {
    loadPriority: 1000,
    startPriority: 1002, // priority has to be after models have been loaded
    stopPriority: 1000,

    associations: {},

    initialize: function (api, next) {
        next();
    },
    start: function (api, next) {
        api.models.user.hasMany(api.models.posts);
        api.models.posts.hasMany(api.models.comments);

        api.models.comments.belongsTo(api.models.posts);
        api.models.posts.belongsTo(api.models.user);

        next();
    },
    stop: function (api, next) {
        next();
    }
};
```

## [Fixtures](https://github.com/domasx2/sequelize-fixtures)

We use the `sequelize-fixtures` package to load in JSON-defined fixtures in the test NODE\_ENV.  Store your fixtures in `./test/fixtures/*.json` or `./test/fixtures/*.yml`.

By default, `ah-sequelize-plugin` will **not** automatically load your fixtures when Actionhero starts up. You can enable this behaviour by adding `loadFixtures: true` to your sequelize config.
