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
      this.importMigrationsFromDirectory(config.sequelize.migrations);
      for (const umzug of this.umzug) {
        await umzug.up();
      }
    } else {
      log("skipping sequelize migrations", "debug");
    }
  }

  importMigrationsFromDirectory(dir: string) {
    (Array.isArray(dir) ? dir : [dir]).forEach((dir) => {
      const umzug = new Umzug({
        storage: new SequelizeStorage({ sequelize: api.sequelize }),
        migrations: {
          // params: [
          //   api.sequelize.getQueryInterface(),
          //   api.sequelize.constructor,
          // ],
          context: api.sequelize.getQueryInterface(),
          // path: dir,
          // pattern: /(\.js|\w{3,}\.ts)$/,
          glob: `${dir}/*.js`,
          // nameFormatter: (filename: string) => {
          //   // we want to use only the base-name of the file, so the migrations are named the same in JS and TS
          //   return path.parse(filename).name;
          // },

          //@ts-ignore
          resolve: ({ path: filename }) => {
            const { up, down } = require(filename);
            return {
              name: path.parse(filename).name,
              up: ({ context }) => up(context),
              down: ({ context }) => down(context),
            };
          },
        },
        logging: function () {
          if (arguments[0].match(/\.d\.ts does not match pattern/)) {
            return;
          }

          log.apply(null, arguments);
        },
      });

      function logUmzugEvent(eventName) {
        return function (name, migration) {
          log(`${name} ${eventName}`);
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
}
