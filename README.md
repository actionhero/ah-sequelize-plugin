![plugin](https://i.imgur.com/nd1btLt.png)
# ah-sequelize-plugin

[![CircleCI](https://circleci.com/gh/actionhero/ah-sequelize-plugin.svg?style=svg)](https://circleci.com/gh/actionhero/ah-sequelize-plugin)

This plugin will use the sequelize orm to create `api.models` which contain your sequelize models.

## Notes
Versions `1.0.0+` are only compatible with ActionHero versions `18.0.0+`.

For versions compatible with ActionHero versions prior to `18.0.0`, use version [`0.9.0`](https://github.com/actionhero/ah-sequelize-plugin/releases/tag/v0.9.0).

## Setup

- Install this plugin: `npm install ah-sequelize-plugin --save`
- Add sequelize package: `npm install sequelize --save`
- Add plugin to your project's `./config/plugins.js`:

```javascript
exports['default'] = {
  plugins: (api) => {
    return {
      'ah-sequelize-plugin': { path: __dirname + '/../node_modules/ah-sequelize-plugin' }
    }
  }
}
```

### Add supported database packages
- MySQL: `npm install mysql2 --save`
- SQLite: `npm install sqlite3 --save`
- Postgress: `npm install --save pg pg-hstore`
- MSSQL: `npm install --save tedious`

For additional information on supported databases visit the [Sequelize Docs](http://docs.sequelizejs.com/manual/installation/getting-started).

### Add optional dependencies
- For automatic fixures: `npm install sequelize-fixtures --save`
- For Sequelize CLI: `npm install --save-dev sequelize-cli`

### Configuration

A `./config/sequelize.js` file will be created which will store your database configuration.  Read commented sections of configuration file for examples of multi-environment configurations.

To override the default location for models and/or migrations, use the `modelsDir` and `migrationsDir` configuration parameter with an array of paths relative to the project root.

```javascript
exports.default = {
  sequelize: () => {
    return {
      'autoMigrate': true,
      'loadFixtures': false,
      'database': 'DEVELOPMENT_DB',
      'dialect': 'mysql',
      'port': 3306,
      'host': '127.0.0.1',
      'username': 'root',
      'password': '',
      'modelsDir': ['models', 'plugins/acl-plugin/models'], // Default: ['models']
      'migrationsDir': ['migrations', 'plugins/acl-plugin/migrations'] // Default: ['migrations']
    }
  }
}

```

#### Logging

The `logging` configuration parameter accepts either a `false` value, or a function which accepts a log value of type `string` and a event level value of type `string` (ex: `console.log`, `api.log`).  If you are passing in a function for the logging parameter, you must also set the `_toExpand` config parameter to `false` in order for the logging function to not be called during ActionHero startup.

```javascript
exports.test = {
  ...exports.default.sequelize(),
  sequelize: () => {
    return {
      '_toExpand': false,
      'database': 'TEST_DB',
      'logging': console.log
    }
  }
}

```

## [Models](http://docs.sequelizejs.com/en/latest/api/models)

Use the exports form of sequelize models in `./models` with the file name matching that of the model, IE:

```javascript
// from ./models/user.js

module.exports = function (sequelize, DataTypes, api) {

  // Define model structure and options
  const model = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    }
  }, {
    paranoid: true
  })

  // Attach Class methods
  model.rehydrate = function (user) {
    return this.build(user)
  }

  // Attach Instance methods
  model.prototype.apiData = function () {
    return {
      id: this.id
    }
  }

  return model
}
```

Models are loaded into `api.models`, so the example above would be `api.models.user`. These module.exports allow for a third optional parameter "api" which is the ActionHero API object. This can be used to access configs and initializer functions, among other things.

## [Migrations](http://docs.sequelizejs.com/en/latest/api/migrations)

This plugin does not condone the use of `Sequelize.sync()` in favor of migrations.  Keep you migrations in `./migrations` and use the [sequelize-cli](https://github.com/sequelize/cli) to execute them.

An example migration to create a `users` table would look like:
```javascript
// from ./migrations/20140101000001-create-users.js

module.exports = {
  up: async function (migration, DataTypes) {
    await migration.createTable('users', {
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

    await migration.addIndex('users', ['email'], {
      indexName: 'email_index',
      indicesType: 'UNIQUE'
    })

    await migration.addIndex('users', ['name'], {
      indexName: 'name_index',
      indicesType: 'UNIQUE'
    })

    await migration.addIndex('users', ['phone'], {
      indexName: 'phone_index',
      indicesType: 'UNIQUE'
    })
  },

  down: async function (migration, DataTypes) {
    await migration.dropTable('users')
  }
}
```

You can use the [sequelize-cli](http://docs.sequelizejs.com/en/latest/docs/migrations/) to create and execute migrations.

`api.sequelize.migrate` and `api.sequelize.migrateUndo` are now based on [Umzug](https://github.com/sequelize/umzug), and are maintained for legacy purposes.
An Umzug instance is available at `api.sequelize.umzug`, and should be used to perform (and undo) migrations programatically using the [official API](https://github.com/sequelize/umzug#api).

If you want to sync, you can `api.sequelize.sequelize.sync()` or `api.models.yourModel.sync()`;

By default, `ah-sequelize-plugin` will automatically execute any pending migrations when Actionhero starts up. You can disable this behaviour by adding `autoMigrate: false` to your sequelize config.

## [Associations](http://docs.sequelizejs.com/en/latest/api/associations)

If you want to declare associations, best practice has you define an `.associate()` class method in your model such as:

```javascript
module.exports = function (sequelize, DataTypes, api) {
  const model = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    }
  })

  model.associate = function (models) {
    this.hasMany(models.email)
  }

  return model
}
```

Then you create an `associations.js` initializer within your project which might look like this:

```javascript
const { Initializer, api } = require('actionhero')

module.exports = class AssociationsInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'AssociationsInitializer'
  }

  start () {
    Object.entries(api.models).filter(([k, m]) => typeof m.associate === 'function')
      .forEach(([k, m]) => m.associate(api.models))
  }
}
```

## [Fixtures](https://github.com/domasx2/sequelize-fixtures)

We use the `sequelize-fixtures` package to load in JSON-defined fixtures in the test NODE\_ENV.  Store your fixtures in `./test/fixtures/*.json` or `./test/fixtures/*.yml`.

By default, `ah-sequelize-plugin` will **not** automatically load your fixtures when Actionhero starts up. You can enable this behavior by adding `loadFixtures: true` to your sequelize config.
