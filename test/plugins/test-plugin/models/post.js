module.exports = function (sequelize, DataTypes, api) {
  const model = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: true
    },
    title: {
      type: DataTypes.STRING
    }
  })

  return model
}
