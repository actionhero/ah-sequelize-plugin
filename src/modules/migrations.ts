import { Umzug, SequelizeStorage } from "umzug";
import { Sequelize, Op } from "sequelize";
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
    const umzugs = await importMigrationsFromDirectory(
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

  export async function importMigrationsFromDirectory(
    sequelizeConfig: SequelizeConfig,
    sequelizeInstance: Sequelize,
    logger: MigrationLogger,
    logLevel: string
  ) {
    const dirs: string[] = Array.isArray(sequelizeConfig.migrations)
      ? sequelizeConfig.migrations
      : [sequelizeConfig.migrations];
    const umzugs: Umzug[] = [];
    for (const dir of dirs) {
      const context = sequelizeInstance.getQueryInterface();

      const umzug = new Umzug({
        storage: new SequelizeStorage({ sequelize: sequelizeInstance }),
        context,
        migrations: {
          glob: ["*.{js,ts}", { cwd: dir, ignore: "**/*.d.ts" }],
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

      // Older versions of Umzug would have allowed .ts and .js names in the migration
      //   and silently matched them. Now, we need to remove the filename prefixes in the
      //   database to match the migration names.
      // We are doing the name update in JS rather than SQL to avoid dialect-specific commands.
      const model = context.sequelize.models.SequelizeMeta;
      const rows = await model.findAll({
        where: {
          name: { [Op.or]: [{ [Op.like]: "%.js" }, { [Op.like]: "%.ts" }] },
        },
      });

      for (const row of rows) {
        // @ts-ignore
        const oldName: string = row.name;
        const newName = oldName.replace(/\.ts$/, "").replace(/\.js$/, "");
        await model.update({ name: newName }, { where: { name: oldName } });
        logger(
          `[migration] renamed migration '${oldName}' to '${newName}'`,
          logLevel
        );
      }

      umzugs.push(umzug);
    }

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
