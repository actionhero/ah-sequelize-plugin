exports.default = {
  sequelize: () => {
    return {
      autoMigrate: true,
      loadFixtures: false,
      database: 'DEVELOPMENT_DB',
      dialect: 'mysql',
      port: 3306,
      host: '127.0.0.1',
      username: 'root',
      password: ''
    }
  }
}

exports.test = {
  ...exports.default.sequelize(),
  sequelize: () => {
    return {
      dialect: 'sqlite',
      storage: ':memory:',
      host: 'localhost'
    }
  }
}

exports.development = { ...exports.default.sequelize() }

// You can define even more elaborate configurations (including replication).
// See http://sequelize.readthedocs.org/en/latest/api/sequelize/index.html for more information
// For example:

// exports.production = {
//   ...exports.default.sequelize(),
//   sequelize: function(){
//     return {
//       "autoMigrate" : false,
//       "loadFixtures": false,
//       "logging"     : false,
//       "database"    : "PRODUCTION_DB",
//       "dialect"     : "mysql",
//       "port"        : 3306,
//       "replication" : {
//         "write": {
//           "host"     : "127.0.0.1",
//           "username" : "root",
//           "password" : "",
//           "pool"     : {}
//         },
//         "read": [
//           {
//             "host"     : "127.0.0.1",
//             "username" : "root",
//             "password" : "",
//             "pool"     : {}
//           }
//         ]
//       }
//     }
//   }
// }
