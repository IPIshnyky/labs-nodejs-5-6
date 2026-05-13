#!/usr/bin/env node
import fs from "fs";
import path from "path";
import sequelize from "../src/db/index.js";
import { handleFatalError } from "./helpers.js";

const seedSqlPath = path.resolve("scripts", "seed.sql");

(async () => {
  console.log("Running seed...");
  if (fs.existsSync(seedSqlPath)) {
    const sql = fs.readFileSync(seedSqlPath, "utf-8");
    try {
      await sequelize.query(sql);
      console.log("Seed executed successfully.");
    } catch (err) {
      handleFatalError("Error executing seed:")(err);
    } finally {
      await sequelize
        .close()
        .catch(
          handleFatalError("Fatal error closing the database connection:"),
        );
    }
  } else {
    console.log(`No seed SQL found at ${seedSqlPath}`);
    process.exit(1);
  }
})();
