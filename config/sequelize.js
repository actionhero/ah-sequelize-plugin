var sequelizeConfig = require('./sequelize.json');

exports.default = {
  sequelize: function(api){
      return sequelizeConfig.development;
  }
};

exports.test = {
    sequelize: function(api){
        return sequelizeConfig.test;
    }
};

exports.production = {
    sequelize: function(api){
        return sequelizeConfig.production;
    }
};

// You can define even more elaborate configurations (including replication) in `sequelize.json`.
// See http://sequelize.readthedocs.org/en/latest/api/sequelize/index.html for more information
// For example: 
//
//{
//  "production": {
//      "logging"     : false,
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
//}
