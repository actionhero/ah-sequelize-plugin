var path              = require('path');
var fs                = require('fs');
var Sequelize         = require('sequelize');

module.exports = {
  initialize: function(api, next){
    api.models = {};

    api.sequelize = {

      migrate: function(opts, next){
        if(typeof opts === "function"){
          next = opts;
          opts = null;
        }
        opts = opts === null ? { method: 'up' } : opts;

        var migrator = api.sequelize.sequelize.getMigrator({
          path: api.projectRoot + '/migrations'
        });

        migrator.migrate(opts).then(function() {
          next();
        });
      },

      migrateUndo: function(next) {
        this.migrate({ method: 'down' }, next);
      },

      connect: function(next){
        api.sequelize.sequelize = new Sequelize(
          api.config.sequelize.database,
          api.config.sequelize.username,
          api.config.sequelize.password,
          api.config.sequelize
        );

        var dir = path.normalize(api.projectRoot + '/models');
        fs.readdirSync(dir).forEach(function(file){
          var nameParts = file.split("/");
          var name = nameParts[(nameParts.length - 1)].split(".")[0];
          api.models[name] = api.sequelize.sequelize.import(dir + '/' + file);
        });

        api.sequelize.test(next);
      },

      loadFixtures: function(next) {
          if(api.config.sequelize.loadFixtures == null || api.config.sequelize.loadFixtures) {
            var SequelizeFixtures = require('sequelize-fixtures');
            SequelizeFixtures.loadFile(api.projectRoot + '/test/fixtures/*.{json,yml,js}', api.models, function () {
              next();
            });
          } else {
            next();
          }
      },

      autoMigrate: function(next) {
        if(api.config.sequelize.autoMigrate == null || api.config.sequelize.autoMigrate) {
            api.sequelize.migrate({method: 'up'}, function () {
              next();
            });
        } else {
            next();
        }
      },

      // api.sequelize.test([exitOnError=true], next);
      // Checks to see if mysql can be reached by selecting the current time
      // Arguments:
      //  - next (callback function(err)): Will be called after the test is complete
      //      If the test fails, the `err` argument will contain the error
      test: function(next){
        api.sequelize.sequelize.query("SELECT NOW()").then(function(){
          next();
        }).catch(function(err){
          api.log(err, 'warning');
          console.log(err);
          next(err);
        });
      }
    };

    next();
  },

  startPriority: 1001, // the lowest post-core middleware priority
  start: function(api, next){
    api.sequelize.connect(function(err){
      if(err) {
        return next(err);
      }

      api.sequelize.autoMigrate(function() {
          api.sequelize.loadFixtures(next);
      });
    });
  }
};
