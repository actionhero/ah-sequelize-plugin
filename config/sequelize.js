exports.default = {
  sequelize: () => {
    return {
      'autoMigrate': true,
      'loadFixtures': false,
      'database': 'DEVELOPMENT_DB',
      'dialect': 'mysql',
      'port': 3306,
      'host': '127.0.0.1',
      'username': 'root',
      'password': ''
    }
  }
}

exports.test = {
  sequelize: () => {
    return {
      'database': 'TEST_DB'
    }
  }
}

// For sequelize-cli
// Add to the exports below, if you have setup additional environment-specific settings
exports.development = { ...exports.default.sequelize() }
exports.test = { ...exports.default.sequelize(), ...exports.test.sequelize() }

// You can define even more elaborate configurations (including replication).
// See http://sequelize.readthedocs.org/en/latest/api/sequelize/index.html for more information
// For example:

// exports.production = {
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
