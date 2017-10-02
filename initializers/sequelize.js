const ActionHero = require('actionhero')
const SequelizePlugin = require('../sequelize.js')

module.exports =
  class SequelizeInitializer extends ActionHero.Initializer {
    constructor () {
      super()
      this.name = 'sequelize'
      this.loadPriority = 101
      this.startPriority = 101
      this.stopPriority = 300
    }

    async initialize () {
      ActionHero.api.models = {}
      ActionHero.api.sequelize = new SequelizePlugin()
    }

    async start () {
      await ActionHero.api.sequelize.connect()
      await ActionHero.api.sequelize.autoMigrate()
      await ActionHero.api.sequelize.loadFixtures()
    }
  }
