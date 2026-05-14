#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { Sequelize } from "sequelize";
import sequelize from "../src/db/index.js";
import { handleFatalError } from "./helpers.js";

const cmd = process.argv[2] || "up";
const seedersDir = path.resolve("seeders");
const require = createRequire(import.meta.url);
const queryInterface = sequelize.getQueryInterface();
const metaTable = "SequelizeData";

function getSeeders() {
  if (!fs.existsSync(seedersDir)) return [];
  return fs
    .readdirSync(seedersDir)
    .filter((file) => file.endsWith(".cjs"))
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

async function getAppliedSeeders() {
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

function loadSeeder(file) {
  return require(path.join(seedersDir, file));
}

async function runSeeder(file, direction, { updateMeta = true } = {}) {
  const seeder = loadSeeder(file);
  const transaction = await sequelize.transaction();

  try {
    await seeder[direction](queryInterface, Sequelize, transaction);

    if (direction === "up" && updateMeta) {
      await markApplied(file, transaction);
    } else if (direction === "down" && updateMeta) {
      await unmarkApplied(file, transaction);
    }

    await transaction.commit();
    console.log(`${direction === "up" ? "Seeded" : "Unseeded"}: ${file}`);
  } catch (err) {
    await transaction.rollback();
    console.error(`Error running ${direction} for ${file}:`, err);
    throw err;
  }
}

(async () => {
  try {
    const seeders = getSeeders();
    const applied = await getAppliedSeeders();

    if (cmd === "up") {
      console.log("SEED UP");
      for (const file of seeders) {
        await runSeeder(file, "up", { updateMeta: !applied.has(file) });
      }
    } else if (cmd === "down") {
      console.log("SEED DOWN");
      for (const file of seeders.slice().reverse()) {
        if (applied.has(file)) {
          await runSeeder(file, "down");
        }
      }
    } else if (cmd === "refresh") {
      console.log("SEED REFRESH");
      for (const file of seeders.slice().reverse()) {
        if (applied.has(file)) {
          await runSeeder(file, "down");
        }
      }

      for (const file of seeders) {
        await runSeeder(file, "up");
      }
    } else {
      console.error("Unknown command", cmd);
      process.exit(2);
    }
  } catch (err) {
    handleFatalError("Seeding failed:")(err);
  } finally {
    await sequelize
      .close()
      .catch(handleFatalError("Fatal error closing the database connection:"));
  }
})();
