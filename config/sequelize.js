exports.default = {
  sequelize: (api) => {
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

// For sequelize-cli
// Add to the exports below, if you have setup additional environment-specific settings

exports.development = exports.default.sequelize()
// exports.test = merge(exports.test);
// exports.production = merge(exports.production);

// Uncomment merge function when adding exports

// const merge = (overlayFn) => {
//   let mergeObj = {}
//   for (let attrname in exports.default.sequelize()) {
//     mergeObj[attrname] = exports.default.sequelize()[attrname]
//   }
//   if (typeof (overlayFn) !== 'undefined') {
//     for (var attrname in overlayFn.sequelize()) {
//       mergeObj[attrname] = overlayFn.sequelize()[attrname]
//     }
//   }

//   mergeObj.sequelize = overlayFn.sequelize
//   return mergeObj
// }

// Example test configuration

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
      'password': ''
    }
  }
}

// You can define even more elaborate configurations (including replication).
// See http://sequelize.readthedocs.org/en/latest/api/sequelize/index.html for more information
// For example:

// exports.production = {
//   sequelize: function(api){
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
