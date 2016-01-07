var path              = require('path');
var fs                = require('fs');
var Sequelize         = require('sequelize');
var Umzug             = require('umzug');

module.exports = {
  initialize: function(api, next){
    api.models = {};

    var sequelizeInstance = new Sequelize(
      api.config.sequelize.database,
      api.config.sequelize.username,
      api.config.sequelize.password,
      api.config.sequelize
    );

    var umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelizeInstance
      },
      migrations: {
        params: [sequelizeInstance.getQueryInterface(), sequelizeInstance.constructor, function() {
          throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.');
        }],
        path: api.projectRoot + '/migrations'
      }
    });

    api.sequelize = {

      sequelize: sequelizeInstance,

      umzug: umzug,

      migrate: function(opts, next){
        if(typeof opts === "function"){
          next = opts;
          opts = null;
        }
        opts = opts === null ? { method: 'up' } : opts;

        checkMetaOldSchema(api, umzug).then(function () {
          return umzug.execute(opts);
        }).then(function() {
          next();
        });
      },

      migrateUndo: function(next) {
        checkMetaOldSchema(api, umzug).then(function() {
          return umzug.down();
        }).then(function() {
          next();
        });
      },

      connect: function(next){
        var dir = path.normalize(api.projectRoot + '/models');
        fs.readdirSync(dir).forEach(function(file){
          var nameParts = file.split("/");
          var name = nameParts[(nameParts.length - 1)].split(".")[0];
          api.models[name] = api.sequelize.sequelize.import(dir + '/' + file);
        });

        api.sequelize.test(next);
      },

      loadFixtures: function(next) {
        if(api.config.sequelize.loadFixtures) {
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
          checkMetaOldSchema(api, umzug).then(function() {
            return umzug.up();
          }).then(function () {
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
        var query = "SELECT NOW()";
        if(api.config.sequelize.dialect == 'sqlite') query = "SELECT strftime('%s', 'now');";
        api.sequelize.sequelize.query(query).then(function(){
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

  startPriority: 101, // aligned with actionhero's redis initializer
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

function checkMetaOldSchema(api, umzug) {
  // Check if we need to upgrade from the old sequelize migration format
  return api.sequelize.sequelize.query('SELECT * FROM "SequelizeMeta"', {raw: true}).then(function(raw) {
    var rows = raw[0];
    if (rows.length && rows[0].hasOwnProperty('id')) {
      throw new Error('Old-style meta-migration table detected - please use `sequelize-cli`\'s `db:migrate:old_schema` to migrate.');
    }
  }).catch(Sequelize.DatabaseError, function (err) {
    var noTableMsg = 'No SequelizeMeta table found - creating new table';
    api.log(noTableMsg);
    console.log(noTableMsg);
  });
}
