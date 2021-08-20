import * as Sequelzie from "sequelize";

export default {
  up: async function (
    queryInterface: Sequelzie.QueryInterface,
    DataTypes: typeof Sequelzie
  ) {
    await queryInterface.createTable(
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

    await queryInterface.addIndex("posts", ["authorGuid", "title"], {
      unique: true,
      fields: ["authorGuid", "title"],
    });
  },

  down: async function (queryInterface: Sequelzie.QueryInterface) {
    await queryInterface.dropTable("posts");
  },
};
