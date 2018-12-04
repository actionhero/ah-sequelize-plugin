module.exports = {
  up: async function (migration, DataTypes) {
    await migration.createTable('Posts', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    })
  },

  down: async function (migration, DataTypes) {
    await migration.dropTable('Posts')
  }
}
