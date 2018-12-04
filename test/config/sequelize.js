exports.test = {
  sequelize: (api) => {
    return {
      'autoMigrate': true,
      'loadFixtures': false,
      'database': 'TEST_DB',
      'dialect': 'mysql',
      'port': 3306,
      'host': '127.0.0.1',
      'username': 'root',
      'password': '',
      'modelsDir': ['models', 'plugins/test-plugin/models'],
      'migrationsDir': ['migrations', 'plugins/test-plugin/migrations']
    }
  }
}
