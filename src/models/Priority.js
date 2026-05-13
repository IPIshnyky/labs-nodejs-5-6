import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Priority = sequelize.define(
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

  Priority.associate = (models) => {
    Priority.hasMany(models.Task, { foreignKey: "priority", as: "tasks" });
  };

  return Priority;
};
