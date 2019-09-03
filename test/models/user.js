const Op = require('sequelize').Op

module.exports = function (sequelize, DataTypes, api) {
  const model = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    name: {
      type: DataTypes.TEXT,
      unique: false
    }
  }, {
    paranoid: true
  })

  // Attach Class methods
  model.countEvans = function () {
    return model.count({
      where: {
        name: { [Op.like]: '%evan%' }
      }
    })
  }

  // Attach Instance methods
  model.prototype.apiData = function () {
    return {
      id: this.id,
      name: this.name
    }
  }

  return model
}
