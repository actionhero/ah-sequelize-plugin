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
      config.operatorsAliases = config.operatorsAliases === true

      this.sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        config
      )

      this.umzug = new Umzug({
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
          path: path.join(api.projectRoot, 'migrations'),
          pattern: /\.js$/
        }
      })
    }

    async connect () {
      const importModelsFromDirectory = (dir) => {
        fs.readdirSync(dir).forEach((file) => {
          const filename = path.join(dir, file)
          if (fs.statSync(filename).isDirectory()) {
            return importModelsFromDirectory(filename)
          }
          if (path.extname(file) !== '.js') return
          var nameParts = file.split('/')
          var name = nameParts[(nameParts.length - 1)].split('.')[0]
          var modelFunc = currySchemaFunc(require(filename))
          this.sequelize.import(name, modelFunc)
          api.watchFileAndAct(filename, async () => {
            api.log(`*** Rebooting due to model change (${filename}) ***`, 'info')
            delete require.cache[require.resolve(filename)]
            delete this.sequelize.importCache[filename]
            await api.commands.restart()
          })
        })
      }

      let dir = path.normalize(path.join(api.projectRoot, 'models'))
      importModelsFromDirectory(dir)
      api.models = this.sequelize.models
      await this.test()
    }

    async loadFixtures () {
      if (config.loadFixtures) {
        const SequelizeFixtures = require('sequelize-fixtures')
        let options = { log: (api.config.logging) ? console.log : function () { } }
        await SequelizeFixtures.loadFile(api.projectRoot + '/test/fixtures/*.{json,yml,js}', api.models, options)
      }
    }

    async migrate (options) {
      options = options === null
        ? { method: 'up' }
        : options

      await checkMetaOldSchema()
      await this.umzug.execute(options)
    }

    async autoMigrate () {
      if (config.autoMigrate === null || config.autoMigrate === undefined || config.autoMigrate) {
        await checkMetaOldSchema()
        await this.umzug.up()
      }
    }

    async migrateUndo () {
      await checkMetaOldSchema()
      await this.umzug.down()
    }

    async test () {
      let query = 'SELECT NOW()'
      if (config.dialect === 'mssql') query = 'SELECT GETDATE();'
      if (config.dialect === 'sqlite') query = "SELECT strftime('%s', 'now');"

      try {
        await this.sequelize.query(query)
      } catch (error) {
        api.log(error, 'warning')
        throw error
      }
    }
  }

async function checkMetaOldSchema () {
  // Check if we need to upgrade from the old sequelize migration format
  try {
    let raw = await api.sequelize.sequelize.query('SELECT * FROM SequelizeMeta', { raw: true })
    let rows = raw[0]
    if (rows.length && rows[0].hasOwnProperty('id')) {
      throw new Error('Old-style meta-migration table detected - please use `sequelize-cli`\'s `db:migrate:old_schema` to migrate.')
    }
  } catch (error) {
    if (error instanceof Sequelize.DatabaseError) {
      if (api.env !== 'test') {
        api.log('No SequelizeMeta table found - creating new table. (Make sure you have \'migrations\' folder in your projectRoot!)')
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
