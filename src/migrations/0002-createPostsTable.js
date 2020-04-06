module.exports = {
  up: async function (migration, DataTypes) {
    await migration.createTable(
      "posts",
      {
        guid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },

        authorGuid: {
          type: DataTypes.UUID,
          allowNull: false,
        },

        title: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },

        body: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: DataTypes.DATE,
      },
      {
        charset: "utf8mb4",
      }
    );

    await migration.addIndex("posts", ["authorGuid", "title"], {
      unique: true,
      fields: ["authorGuid", "title"],
    });
  },

  down: async function (migration) {
    await migration.dropTable("posts");
  },
};
