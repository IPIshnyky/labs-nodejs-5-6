#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { Sequelize } from "sequelize";
import sequelize from "../src/db/index.js";

const cmd = process.argv[2] || "up";
const migrationsDir = path.resolve("migrations");
const require = createRequire(import.meta.url);
const queryInterface = sequelize.getQueryInterface();
const metaTable = "SequelizeMeta";

function getMigrations() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".cjs"))
    .sort();
}

async function ensureMetaTable() {
  const tables = await queryInterface.showAllTables();
  const tableExists = tables.some((table) => {
    const tableName = typeof table === "object" ? table.tableName : table;
    return tableName === metaTable;
  });

  if (!tableExists) {
    await queryInterface.createTable(metaTable, {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
    });
  }
}

async function getAppliedMigrations() {
  await ensureMetaTable();
  const [rows] = await sequelize.query(`SELECT name FROM "${metaTable}"`);
  return new Set(rows.map((row) => row.name));
}

async function markApplied(name, transaction) {
  await queryInterface.bulkInsert(metaTable, [{ name }], { transaction });
}

async function unmarkApplied(name, transaction) {
  await queryInterface.bulkDelete(metaTable, { name }, { transaction });
}

function loadMigration(file) {
  return require(path.join(migrationsDir, file));
}

async function runMigration(file, direction) {
  const migration = loadMigration(file);
  const transaction = await sequelize.transaction();

  try {
    await migration[direction](queryInterface, Sequelize);

    if (direction === "up") {
      await markApplied(file, transaction);
    } else {
      await unmarkApplied(file, transaction);
    }

    await transaction.commit();
    console.log(`${direction === "up" ? "Applied" : "Reverted"}: ${file}`);
  } catch (err) {
    await transaction.rollback();
    console.error(`Error running ${direction} for ${file}:`, err);
    throw err;
  }
}

(async () => {
  try {
    const migrations = getMigrations();
    const applied = await getAppliedMigrations();

    if (cmd === "up") {
      console.log("MIGRATE UP");
      for (const file of migrations) {
        if (!applied.has(file)) {
          await runMigration(file, "up");
        }
      }
    } else if (cmd === "down") {
      console.log("MIGRATE DOWN");
      for (const file of migrations.slice().reverse()) {
        if (applied.has(file)) {
          await runMigration(file, "down");
        }
      }
    } else if (cmd === "refresh") {
      console.log("MIGRATE REFRESH");
      for (const file of migrations.slice().reverse()) {
        if (applied.has(file)) {
          await runMigration(file, "down");
        }
      }

      for (const file of migrations) {
        await runMigration(file, "up");
      }
    } else {
      console.error("Unknown command", cmd);
      process.exit(2);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
