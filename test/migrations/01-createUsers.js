module.exports = {
  up: async function (migration, DataTypes) {
    await migration.createTable('Users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE
    })

    await migration.addIndex('Users', ['email'], {
      fields: 'email',
      unique: true
    })
  },

  down: async function (migration, DataTypes) {
    await migration.dropTable('Users')
  }
}
