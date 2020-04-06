import { Sequelize } from "sequelize-typescript";
import * as Umzug from "umzug";
import { api, log, config, Initializer } from "actionhero";

export class SequelizeInitializer extends Initializer {
  umzug: Array<any>;

  constructor() {
    super();
    this.name = "sequelize";
    this.loadPriority = 101;
    this.startPriority = 101;
    this.stopPriority = 300;
    this.umzug = [];
  }

  async start() {
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
        storage: "sequelize",
        storageOptions: {
          sequelize: api.sequelize,
        },
        migrations: {
          params: [
            api.sequelize.getQueryInterface(),
            api.sequelize.constructor,
            () => {
              throw new Error(
                'Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.'
              );
            },
          ],
          path: dir,
          pattern: /(\.js|\w{3,}\.ts)$/,
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
    if (config.dialect === "mssql") query = "SELECT GETDATE();";
    if (config.dialect === "sqlite") query = "SELECT strftime('%s', 'now');";

    await api.sequelize.query(query);
  }
}
