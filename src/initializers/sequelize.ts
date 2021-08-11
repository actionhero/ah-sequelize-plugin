import { Sequelize } from "sequelize-typescript";
import { Umzug, SequelizeStorage } from "umzug";
import { api, log, config, Initializer } from "actionhero";
import * as path from "path";

declare module "actionhero" {
  export interface Api {
    sequelize: Sequelize;
  }
}

export class SequelizeInitializer extends Initializer {
  umzug: Array<any>;

  constructor() {
    super();
    this.name = "sequelize";
    this.loadPriority = 201;
    this.stopPriority = 9000;
    this.umzug = [];
  }

  async initialize() {
    api.sequelize = new Sequelize(config.sequelize);
    await this.test();
    await this.migrate(config.sequelize.autoMigrate);
  }

  async stop() {
    await api.sequelize.close();
  }

  async migrate(toMigrate: boolean) {
    if (toMigrate) {
      log("running sequelize migrations", "debug");
      this.importMigrationsFromDirectory(config.sequelize);
      for (const umzug of this.umzug) {
        await umzug.up();
      }
    } else {
      log("skipping sequelize migrations", "debug");
    }
  }

  importMigrationsFromDirectory(sequelizeConfig: any) {
    const queryInterface = this.getInjectedQueryInterface(sequelizeConfig);
    (Array.isArray(sequelizeConfig.migrations)
      ? sequelizeConfig.migrations
      : [sequelizeConfig.migrations]
    ).forEach((dir) => {
      const umzug = new Umzug({
        storage: new SequelizeStorage({ sequelize: api.sequelize }),
        migrations: {
          params: [queryInterface, api.sequelize.constructor],
          path: dir,
          pattern: /(\.js|\w{3,}\.ts)$/,
          nameFormatter: (filename: string) => {
            // we want to use only the base-name of the file, so the migrations are named the same in JS and TS
            return path.parse(filename).name;
          },
        },
        // logging: function () {
        //   if (arguments[0].match(/\.d\.ts does not match pattern/)) return;
        //   log.apply(
        //     null,
        //     [].concat(
        //       arguments[0],
        //       config.sequelize.migrationLogLevel || "info"
        //     )
        //   );
        // },
      });

      function logUmzugEvent(eventName) {
        return function (name, migration) {
          log(
            `[migration] ${name} ${eventName}`,
            config.sequelize.migrationLogLevel || "info"
          );
        };
      }

      umzug.on("migrating", logUmzugEvent("migrating"));
      umzug.on("migrated", logUmzugEvent("migrated"));
      umzug.on("reverting", logUmzugEvent("reverting"));
      umzug.on("reverted", logUmzugEvent("reverted"));

      this.umzug.push(umzug);
    });
  }

  async test() {
    let query = "SELECT NOW()";
    if (config.sequelize.dialect === "mssql") query = "SELECT GETDATE();";
    if (config.sequelize.dialect === "sqlite")
      query = "SELECT strftime('%s', 'now');";

    await api.sequelize.query(query);
  }

  getInjectedQueryInterface(sequelizeConfig: any) {
    const queryInterface = api.sequelize.getQueryInterface();
    if (
      sequelizeConfig.schema &&
      sequelizeConfig.schema !== "public" &&
      sequelizeConfig.dialect &&
      sequelizeConfig.dialect === "postgres"
    ) {
      queryInterface.addColumn = this.injectSchema(
        queryInterface.addColumn,
        sequelizeConfig.schema
      );
      queryInterface.removeColumn = this.injectSchema(
        queryInterface.removeColumn,
        sequelizeConfig.schema
      );
      queryInterface.renameColumn = this.injectSchema(
        queryInterface.renameColumn,
        sequelizeConfig.schema
      );
    }
    return queryInterface;
  }

  injectSchema(original, schema) {
    return function () {
      if (typeof arguments[0] === "string") {
        arguments[0] = { tableName: arguments[0], schema };
      } else if (!arguments[0].schema) {
        arguments[0].schema = schema;
      }
      return original.apply(this, arguments);
    };
  }
}
