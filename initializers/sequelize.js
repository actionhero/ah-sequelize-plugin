const { Initializer, api } = require('actionhero')
const SequelizePlugin = require('../classes/sequelize.js')

module.exports =
  class SequelizeInitializer extends Initializer {
    constructor () {
      super()
      this.name = 'sequelize'
      this.loadPriority = 101
      this.startPriority = 101
      this.stopPriority = 300
    }

    async initialize () {
      api.models = {}
      api.sequelize = new SequelizePlugin()
    }

    async start () {
      await api.sequelize.connect()
      await api.sequelize.autoMigrate()
      await api.sequelize.loadFixtures()
    }
  }
