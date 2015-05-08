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

      migrate: function(opts, next){
        if(typeof opts === "function"){
          next = opts;
          opts = null;
        }
        opts = opts === null ? { method: 'up' } : opts;

          umzug.execute(opts).then(next());
      },

      migrateUndo: function(next) {
          umzug.down().then(next());
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
            migrateSequelizeMeta(api, umzug)
                .then(function() {
                    return umzug.up().then(function() {
                        return;
                    });
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

function migrateSequelizeMeta(api, umzug) {

    var migration = api.sequelize.sequelize.getQueryInterface();

    // Check if we need to upgrade from the old sequlize migration format
    return api.sequelize.sequelize.query('SELECT * FROM "SequelizeMeta";', {
        raw: true

    }).then(function(raw) {

        var rows = raw[0];
        if (rows.length && rows[0].hasOwnProperty('id')) {

            var migrationFiles = fs.readdirSync(umzug.options.migrations.path),
                data = rows.map(function(row) {
                    return migrationFiles.filter(function(f) {
                        return f.substring(0, row.to.length) === row.to;

                    })[0];
                });

            // Drop the existing migration data
            return api.sequelize.sequelize.query('DELETE FROM "SequelizeMeta";', null, {
                raw: true

                // Update the table format
            }).then(function() {
                return [
                    migration.renameColumn('SequelizeMeta', 'to', 'name'),
                    migration.removeColumn('SequelizeMeta', 'from'),
                    migration.removeColumn('SequelizeMeta', 'id')
                ];
                // Insert data in the new migration format
            }).then(function() {
                var MetaModel = umzug.storage.options.storageOptions.model;

                return data.map(function(migrationName) {
                    return MetaModel.create({
                        name: migrationName
                    });
                });
            }).all();
        } else {
            // TODO check the table layout in case it's empty
            return false;
        }
    }).then(function(migrated) {
        if (migrated) {
            var completeMsg = 'SequelizeMeta migration complete!';
            api.log(completeMsg);
            console.log(completeMsg);
        }
    }).catch(Sequelize.DatabaseError, function (err) {
        var noTableMsg = 'No SequelizeMeta table found - skipping meta migration';
        api.log(noTableMsg);
        console.log(noTableMsg);
    });
}
