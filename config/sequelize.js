exports.default = { 
  sequelize: function(api){
    return {
      "database"    : "DEVELOPMENT_DB",
      "dialect"     : "mysql",
      "port"        : 3306,
      "host"        : "127.0.0.1", 
      "username"    : "root", 
      "password"    : "",
    };
  }
};

// You can define even more elaborate configurations (including replication).
// See http://sequelize.readthedocs.org/en/latest/api/sequelize/index.html for more information
// For example: 

// exports.production = { 
//   sequelize: function(api){
//     return {
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
