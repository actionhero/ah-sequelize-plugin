const path = require('path')
const fs = require('fs')
const Umzug = require('umzug')
const { api } = require('actionhero')
const Sequelize = require('sequelize')
const config = api.config.sequelize

module.exports =
  class SequelizePlugin {
    constructor () {
      config.logging = config.logging !== false ? config.logging || api.log : () => { }

      this.sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        config
      )

      this.umzug = []
      this.importMigrationsFromDirectory(config.migrationsDir || ['migrations'])
    }

    importMigrationsFromDirectory (dir) {
      (Array.isArray(dir) ? dir : [dir])
        .map(dir => path.normalize(path.join(api.projectRoot, dir)))
        .forEach(dir => {
          this.umzug.push(new Umzug({
            storage: 'sequelize',
            storageOptions: {
              sequelize: this.sequelize
            },
            migrations: {
              params: [
                this.sequelize.getQueryInterface(),
                this.sequelize.constructor,
                () => {
                  throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.')
                }],
              path: dir,
              pattern: /\.js$/
            }
          }))
        })
    }

    importModelsFromDirectory (dir) {
      (Array.isArray(dir) ? dir : [dir])
        .map(dir => path.normalize(path.join(api.projectRoot, dir)))
        .forEach(dir => {
          fs.readdirSync(dir).forEach(file => {
            const filename = path.join(dir, file)
            if (fs.statSync(filename).isDirectory()) {
              return this.importModelsFromDirectory(filename)
            }
            if (path.extname(file) !== '.js') return
            const nameParts = file.split('/')
            const name = nameParts[(nameParts.length - 1)].split('.')[0]
            const modelFunc = currySchemaFunc(require(filename))
            this.sequelize.import(name, modelFunc)

            // watch model files for changes
            api.watchFileAndAct(filename, async () => {
              config.logging(`*** Rebooting due to model change (${filename}) ***`, 'info')
              delete require.cache[require.resolve(filename)]
              delete this.sequelize.importCache[filename]
              await api.commands.restart()
            })
          })
        })
    }

    async connect () {
      this.importModelsFromDirectory(config.modelsDir || 'models')
      api.models = this.sequelize.models
      await this.test()
    }

    async loadFixtures () {
      if (config.loadFixtures) {
        const SequelizeFixtures = require('sequelize-fixtures')
        const options = { log: config.logging }
        await SequelizeFixtures.loadFile(api.projectRoot + '/test/fixtures/*.{json,yml,js}', api.models, options)
      }
    }

    async migrate (options) {
      options = options === null
        ? { method: 'up' }
        : options

      await checkMetaOldSchema()
      for (const umzug of this.umzug) {
        await umzug.execute(options)
      }
    }

    async autoMigrate () {
      if (config.autoMigrate === null || config.autoMigrate === undefined || config.autoMigrate) {
        await checkMetaOldSchema()
        for (const umzug of this.umzug) {
          await umzug.up()
        }
      }
    }

    async migrateUndo () {
      await checkMetaOldSchema()
      for (const umzug of this.umzug) {
        await umzug.down()
      }
    }

    async test () {
      let query = 'SELECT NOW()'
      if (config.dialect === 'mssql') query = 'SELECT GETDATE();'
      if (config.dialect === 'sqlite') query = "SELECT strftime('%s', 'now');"

      try {
        await this.sequelize.query(query)
      } catch (error) {
        config.logging(error, 'warning')
        throw error
      }
    }

    async close () {
      return this.sequelize.close()
    }
  }

async function checkMetaOldSchema () {
  // Check if we need to upgrade from the old sequelize migration format
  try {
    const raw = await api.sequelize.sequelize.query('SELECT * FROM SequelizeMeta', { raw: true })
    const rows = raw[0]
    if (rows.length && Object.prototype.hasOwnProperty.call(rows[0], 'id')) {
      throw new Error('Old-style meta-migration table detected - please use `sequelize-cli`\'s `db:migrate:old_schema` to migrate.')
    }
  } catch (error) {
    if (error instanceof Sequelize.DatabaseError) {
      if (api.env !== 'test') {
        config.logging('No SequelizeMeta table found - creating new table. (Make sure you have \'migrations\' folder in your projectRoot!)')
      }
    } else {
      throw error
    }
  }
}

const currySchemaFunc = function (SchemaExportFunc) {
  return function (a, b) {
    return SchemaExportFunc(a, b, api)
  }
}
