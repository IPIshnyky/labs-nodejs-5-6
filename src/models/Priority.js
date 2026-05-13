import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Priority",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      label: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      weight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "priorities",
      timestamps: false,
    },
  );
};
