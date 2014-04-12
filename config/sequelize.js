exports.default = { 
  sequelize: function(api){
    return {
      "database"    : "DEVELOPMNET_DB",
      "dialect"     : "mysql",
      "port"        : 3306,
      "host"        : "127.0.0.1", 
      "username"    : "root", 
      "password"    : "",
    }
  }
}


exports.test = { 
  sequelize: function(api){
    return {
      "logging"     : false,
      "database"    : "TEST_DB",
      "dialect"     : "mysql",
      "port"        : 3306,
      "host"        : "127.0.0.1", 
      "username"    : "root", 
      "password"    : "",
    }
  }
}

exports.production = { 
  sequelize: function(api){
    return {
      "logging"     : false,
      "database"    : "PRODUCTION_DB",
      "dialect"     : "mysql",
      "port"        : 3306,
      "replication" : {
        "write": {
          "host"     : "127.0.0.1", 
          "username" : "root", 
          "password" : "",
          "pool"     : {}
        },
        "read": [
          {
            "host"     : "127.0.0.1", 
            "username" : "root", 
            "password" : "",
            "pool"     : {}
          }
        ]
      }
    }
  }
}
