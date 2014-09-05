var path              = require('path');
var fs                = require('fs');
var Sequelize         = require('sequelize');

exports.sequelize = function(api, next){
  
  api.models = {};

  api.sequelize = {
    _start: function(api, next){
      next();
    },

    _teardown: function(api, next){
      next();
    },

    migrate: function(opts, next){
      if(typeof opts === "function"){
        next = opts;
        opts = null;
      }
      opts = opts === null ? { method: 'up' } : opts;

      var migrator = api.sequelize.sequelize.getMigrator({
        path: api.project_root + '/migrations'
      });

      migrator.migrate(opts).success(function() {
        next();
      });
    },

    migrateUndo: function(next) {
      this.migrate({ method: 'down' }, next);
    },

    connect: function(next){
      var self = this;

      api.sequelize.sequelize = new Sequelize(
        api.config.sequelize.database, 
        api.config.sequelize.username, 
        api.config.sequelize.password, 
        api.config.sequelize
      );

      var dir = path.normalize(api.project_root + '/models');
      fs.readdirSync(dir).forEach(function(file){
        var nameParts = file.split("/");
        var name = nameParts[(nameParts.length - 1)].split(".")[0];
        api.models[name] = api.sequelize.sequelize.import(dir + '/' + file);
      })
      
      if(api.env === "test"){  
        var SequelizeFixtures = require('sequelize-fixtures');
        SequelizeFixtures.loadFile(api.project_root + '/test/fixtures/*.json', api.models, function(){
          SequelizeFixtures.loadFile(api.project_root + '/test/fixtures/*.yml', api.models, function(){
            self.test(next);
          });
        });
      }else{
        self.test(next);
      }
    },

    test: function(next){
      // ensure the connection with a test
      api.sequelize.sequelize.query("SELECT NOW()").success(function(){
        next()
      }).failure(function(err){
        api.log(err, 'warning');
        console.log(err);
        process.exit();
      });
    },

  }

  api.sequelize.connect(function(){
    // api.sequelize.migrate(function(){
      next();
    // });
  });
  
}