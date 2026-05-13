module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("priorities", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      label: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      weight: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
    });

    await queryInterface.sequelize.query(`
      INSERT INTO priorities (id, code, label, weight) VALUES
        (1, 'low', 'Low', 1),
        (2, 'medium', 'Medium', 2),
        (3, 'high', 'High', 3)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        label = EXCLUDED.label,
        weight = EXCLUDED.weight;
    `);

    await queryInterface.sequelize.query(`
      UPDATE tasks
      SET priority = 1
      WHERE priority IS NULL
         OR priority NOT IN (SELECT id FROM priorities);
    `);

    await queryInterface.changeColumn("tasks", "priority", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'tasks_priority_fkey'
            AND conrelid = 'tasks'::regclass
        ) THEN
          ALTER TABLE tasks
            ADD CONSTRAINT tasks_priority_fkey
            FOREIGN KEY (priority)
            REFERENCES priorities(id);
        END IF;
      END $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("tasks", "tasks_priority_fkey");

    await queryInterface.changeColumn("tasks", "priority", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });

    await queryInterface.dropTable("priorities");
  },
};
