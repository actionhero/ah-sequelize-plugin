import { Umzug, SequelizeStorage, MigrationParams } from "umzug";
import { Sequelize } from "sequelize-typescript";
import * as path from "path";

export namespace Migrations {
  export type SequelizeConfig = { [key: string]: any };
  export type MigrationLogger = (
    message: string,
    severity: string,
    data?: any
  ) => void;

  export async function migrate(
    sequelizeConfig: SequelizeConfig,
    sequelizeInstance: Sequelize,
    logger: MigrationLogger,
    logLevel: string
  ) {
    logger("running sequelize migrations", "debug");
    const umzugs = importMigrationsFromDirectory(
      sequelizeConfig,
      sequelizeInstance,
      logger,
      logLevel
    );
    await upAll(umzugs);
  }

  export async function upAll(umzugs: Umzug[]) {
    for (const umzug of umzugs) await umzug.up();
  }

  export async function downAll(umzugs: Umzug[]) {
    //@ts-ignore
    for (const umzug of umzugs) await umzug.down({ to: 0 });
  }

  export async function upOne(umzugs: Umzug[]) {
    for (const umzug of umzugs) {
      const pendingMigrations = await umzug.pending();
      if (pendingMigrations.length === 0) continue;
      await umzug.up({ step: 1 });
      break;
    }
  }

  export async function downOne(umzugs: Umzug[], migrationName: string) {
    let found = false;
    for (const umzug of umzugs) {
      try {
        await umzug.down({ migrations: [migrationName] });
        found = true;
        break;
      } catch (error) {
        if (error.message.match(/Unable to find migration/)) {
          // it's OK
        } else throw error;
      }
    }

    if (!found) {
      throw new Error(
        `could not find migration \`${migrationName}\` in the migration directories`
      );
    }
  }

  export function importMigrationsFromDirectory(
    sequelizeConfig: SequelizeConfig,
    sequelizeInstance: Sequelize,
    logger: MigrationLogger,
    logLevel: string
  ) {
    const umzugs: Umzug[] = [];
    (Array.isArray(sequelizeConfig.migrations)
      ? sequelizeConfig.migrations
      : [sequelizeConfig.migrations]
    ).forEach((dir) => {
      const umzug = new Umzug({
        storage: new SequelizeStorage({ sequelize: sequelizeInstance }),
        context: sequelizeInstance.getQueryInterface(),
        migrations: {
          glob: `${dir}/*.{js,ts}`,
          resolve: ({ path: filePath, context }) => {
            const migration = require(filePath).default
              ? require(filePath).default
              : require(filePath);
            return {
              name: path.parse(filePath).name,
              up: async () => migration.up(context, Sequelize),
              down: async () => migration.down(context, Sequelize),
            };
          },
        },
        logger: null,
      });

      function logUmzugEvent(name: string, eventName: string) {
        logger(`[migration] ${name} ${eventName}`, logLevel);
      }

      umzug.on("migrating", (ev) => logUmzugEvent(ev.name, "migrating"));
      umzug.on("migrated", (ev) => logUmzugEvent(ev.name, "migrated"));
      umzug.on("reverting", (ev) => logUmzugEvent(ev.name, "reverting"));
      umzug.on("reverted", (ev) => logUmzugEvent(ev.name, "reverted"));

      umzugs.push(umzug);
    });

    return umzugs;
  }

  export function getInjectedQueryInterface(
    sequelizeConfig: SequelizeConfig,
    sequelizeInstance: Sequelize
  ) {
    const queryInterface = sequelizeInstance.getQueryInterface();
    if (
      sequelizeConfig.schema &&
      sequelizeConfig.schema !== "public" &&
      sequelizeConfig.dialect &&
      sequelizeConfig.dialect === "postgres"
    ) {
      queryInterface.addColumn = injectSchema(
        queryInterface.addColumn,
        sequelizeConfig.schema
      );
      queryInterface.removeColumn = injectSchema(
        queryInterface.removeColumn,
        sequelizeConfig.schema
      );
      queryInterface.renameColumn = injectSchema(
        queryInterface.renameColumn,
        sequelizeConfig.schema
      );
    }
    return queryInterface;
  }

  export function injectSchema(original: Function, schema: string) {
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
