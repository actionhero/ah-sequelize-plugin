const path = require('path')

exports.test = {
  sequelize: () => {
    return {
      autoMigrate: true,
      loadFixtures: false,
      dialect: 'sqlite',
      storage: ':memory:',
      host: 'localhost',
      modelsDir: [path.join(__dirname, '..', 'models'), path.join(__dirname, '..', 'plugins/test-plugin/models')],
      migrationsDir: [path.join(__dirname, '..', 'migrations'), path.join(__dirname, '..', 'plugins/test-plugin/migrations')]
    }
  }
}
