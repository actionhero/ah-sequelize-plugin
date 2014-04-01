ah-sequelize-plugin

This pluggin will use the sequelize orm to create `api.models` which contain your sequelize models

## Setup

- be sure to enable the pluggin within actionhero (`config/api.js`)
- you will need to add the sequelize package (`npm install sequelize --save`) to your package.json
- you will need to add the sequelize-fixtures package (`npm install sequelize-fixtures --save`) to your package.json
- you will need to add the mysql (or other supported database) package (`npm install mysql --save`) to your package.json

A `./config/sequelize.json` file will be created which will store your database configuration

## [Models](http://sequelizejs.com/docs/latest/models)

Use the exports form of sequelize models in `./models` with the file name matching that of the model, IE:

```javascript
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Project", {
    name: DataTypes.STRING,
    description: DataTypes.TEXT
  })
}
```

## [Migrations](http://sequelizejs.com/docs/latest/migrations)

This pluggin does not condone the use of `Sequelize.sync()` in favor of migrations.  Keep you migrations in `./migrationss` and run `api.sequelize.migrate()`.

You can add a migration grunt helper to your actionhero project by adding the below to your `gruntfile.js`:

```javascript
grunt.registerTask('migrate','run any pending database migrations',function(file){
  var done = this.async();
  init(function(api){
    api.sequelize.migrate(function(){
      done();
    })
  })
})
```

## [Associations](http://sequelizejs.com/docs/latest/associations)

If you want to declare associations, best practice has you create an `associations` initializer within your project which might look like this:

```javascript
exports.associations = function(api, next){

  api.models.user.hasMany(api.models.posts);
  api.models.posts.hasMany(api.models.comments);

  api.models.comments.belongsTo(api.models.posts);
  api.models.posts.belongsTo(api.models.user);

  next();
}
```

## [Fixtures](https://github.com/domasx2/sequelize-fixtures)

We use the `sequelize-fixtures` package to load in JSON-defined fixtures in the test NODE_ENV.  Store your fixtures in `./test/fixtures/*.json` or `./test/fixtures/*.yml`