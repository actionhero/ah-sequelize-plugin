exports.test = {
  sequelize: () => {
    return {
      autoMigrate: true,
      loadFixtures: false,
      dialect: 'sqlite',
      storage: ':memory:',
      host: 'localhost',
      modelsDir: ['models', 'plugins/test-plugin/models'],
      migrationsDir: ['migrations', 'plugins/test-plugin/migrations']
    }
  }
}
