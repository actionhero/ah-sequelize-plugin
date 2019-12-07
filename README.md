![plugin](https://i.imgur.com/nd1btLt.png)

# ah-sequelize-plugin

[![CircleCI](https://circleci.com/gh/actionhero/ah-sequelize-plugin.svg?style=svg)](https://circleci.com/gh/actionhero/ah-sequelize-plugin)

This plugin connects [Sequelize](https://sequelize.org/) and [Actionhero](https://www.actionherojs.com). It handles running migrations and connecting your models. Under the hood, we use [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) and [Uzmug](https://github.com/sequelize/umzug)

## Notes

- Versions `2.0.0+` of this package are only compatible with Actionhero versions `21.0.0+`.
- Versions `1.0.0+` of this package are only compatible with Actionhero versions `18.0.0+`.

For versions compatible with ActionHero versions prior to `21.0.0`, use version [`1.x.x`](https://github.com/actionhero/ah-sequelize-plugin/releases/tag/v1.3.2).
For versions compatible with ActionHero versions prior to `18.0.0`, use version [`0.9.x`](https://github.com/actionhero/ah-sequelize-plugin/releases/tag/v0.9.0).

## Setup

1. Install this plugin: `npm install ah-sequelize-plugin --save`
2. Add sequelize packages: `npm install sequelize sequelize-typescript --save`
3. Add types and reflexive addons: `npm install @types/bluebird @types/validator reflect-metadata --save`
4. Add plugin to your project's `./config/plugins.js`:

```ts
export const DEFAULT = {
  plugins: () => {
    return {
      "ah-sequelize-plugin": {
        path: __dirname + "/../node_modules/ah-sequelize-plugin"
      }
    };
  }
};
```

5. Add `experimentalDecorators` and `emitDecoratorMetadata` to your Typescript `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "allowJs": true,
    "module": "commonjs",
    "target": "es2018",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["./src/**/*"]
}
```

### Add supported database packages

- MySQL: `npm install mysql2 --save`
- SQLite: `npm install sqlite3 --save`
- Postgres: `npm install --save pg pg-hstore`
- MSSql: `npm install --save tedious`

For additional information on supported databases visit the [Sequelize Docs](http://docs.sequelizejs.com/manual/installation/getting-started).

### Install optional dependencies

- For Sequelize CLI: `npm install --save-dev sequelize-cli`

### Configuration

A `./src/config/sequelize.ts` will need to be created for your project. The example below will parse the Environment variable `DATABASE_URL` for a `postgres` database, however you can configure your connection in many ways. You can connect to DB pools, configure read/write splitting and more with Sequelize options.

```ts
import { URL } from "url";
import * as path from "path";

export const DEFAULT = {
  sequelize: config => {
    let dialect = "postgres";
    let host = "127.0.0.1";
    let port = "5432";
    let database = "actionhero";
    let username = undefined;
    let password = undefined;

    // if your environment provides database information via a single JDBC-style URL like mysql://username:password@hostname:port/default_schema
    if (process.env.DATABASE_URL) {
      const parsed = new URL(process.env.DATABASE_URL);
      if (parsed.username) {
        username = parsed.username;
      }
      if (parsed.password) {
        password = parsed.password;
      }
      if (parsed.hostname) {
        host = parsed.hostname;
      }
      if (parsed.port) {
        port = parsed.port;
      }
      if (parsed.pathname) {
        database = parsed.pathname.substring(1);
      }
    }

    return {
      autoMigrate: true,
      logging: false,
      dialect: dialect,
      port: parseInt(port),
      database: database,
      host: host,
      username: username,
      password: password,
      models: [path.join(__dirname, "..", "models")],
      migrations: [path.join(__dirname, "..", "migrations")]
    };
  }
};

// for the sequelize CLI tool
module.exports.development = DEFAULT.sequelize({
  env: "development",
  process: { env: "development" }
});

module.exports.staging = DEFAULT.sequelize({
  env: "staging",
  process: { env: "staging" }
});

module.exports.production = DEFAULT.sequelize({
  env: "production",
  process: { env: "production" }
});
```

#### Logging

The `logging` configuration parameter accepts either a `false` value, or a function which accepts a log value of type `string` and a event level value of type `string` (ex: `console.log`, `log` from Actionhero). If you are passing in a function for the logging parameter.

## Models

Thanks to `sequelize-typescript`, we can have models with tagged parameters. The example below shows of how to use hooks, associations, and more. Further information can be found at https://github.com/RobinBuschmann/sequelize-typescript.

```ts
// from `src/models/Users.ts`
import * as bcrypt from "bcrypt";
import {
  Model,
  Table,
  Column,
  AllowNull,
  IsEmail,
  BeforeCreate,
  HasMany
} from "sequelize-typescript";
import * as uuid from "uuid/v4";
import { Post } from "./Post";

@Table({ tableName: "users", paranoid: true })
export class User extends Model<User> {
  saltRounds = 10;

  @Column({ primaryKey: true })
  guid: string;

  @AllowNull(false)
  @Column
  firstName: string;

  @AllowNull(false)
  @Column
  lastName: string;

  @AllowNull(false)
  @IsEmail
  @Column
  email: string;

  @Column
  passwordHash: string;

  @HasMany(() => Post)
  posts: Post[];

  @BeforeCreate
  static generateGuid(instance) {
    if (!instance.guid) {
      instance.guid = uuid();
    }
  }

  async updatePassword(password: string) {
    this.passwordHash = await bcrypt.hash(password, this.saltRounds);
    await this.save();
  }

  async checkPassword(password: string) {
    if (!this.passwordHash) {
      throw new Error("password not set for this team member");
    }

    const match = await bcrypt.compare(password, this.passwordHash);
    return match;
  }
}
```

You can then use these models in your Actions, Tasks, etc, by simply requiring them.

```ts
// from actions/user.ts

import { Action } from "actionhero";
import { User } from "./../models/User";

export class UserCreate extends Action {
  constructor() {
    super();
    this.name = "user:create";
    this.description = "create a new user";
    this.outputExample = {};
    this.inputs = {
      firstName: { required: true },
      lastName: { required: true },
      password: { required: true },
      email: { required: true }
    };
  }

  async run({ params, response }) {
    const user = new User({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email
    });
    await user.save();
    await user.updatePassword(params.password);
    response.userGuid = user.guid;
  }
}
```

## [Migrations](http://docs.sequelizejs.com/en/latest/api/migrations)

This plugin does not condone the use of `Sequelize.sync()` in favor of migrations. Keep you migrations in `./migrations` and use the [sequelize-cli](https://github.com/sequelize/cli) to execute them.

**Note**: Migrations should remain as _.js files rather than _.ts files. Typescript files will run just fine, but the default Uzmug storage engine places file names into the database table. This means if you try to run your project in both TS and JS "modes", you will get conflicting migrations.

An example migration to create a `users` table would look like:

```js
// from ./migrations/0000001-createUsersTable.js

module.exports = {
  up: async function(migration, DataTypes) {
    await migration.createTable(
      "users",
      {
        guid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },

        firstName: {
          type: DataTypes.STRING(191),
          allowNull: false
        },

        lastName: {
          type: DataTypes.STRING(191),
          allowNull: false
        },

        email: {
          type: DataTypes.STRING(191),
          allowNull: false
        },

        passwordHash: {
          type: DataTypes.TEXT,
          allowNull: true
        },

        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true
        },

        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: DataTypes.DATE
      },
      {
        charset: "utf8mb4"
      }
    );

    await migration.addIndex("users", ["email"], {
      unique: true,
      fields: "email"
    });
  },

  down: async function(migration) {
    await migration.dropTable("users");
  }
};
```

You can use the [sequelize-cli](http://docs.sequelizejs.com/en/latest/docs/migrations/) to create and execute migrations.

By default, `ah-sequelize-plugin` will automatically execute any pending migrations when Actionhero starts up. You can disable this behavior by adding `autoMigrate: false` to your sequelize config.

## Fixtures (removed)

As of version `2.0.0`, we have removed support for fixtures from this plugin. If you need to load data into your application consider an Initializer in your project.
