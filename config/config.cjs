require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const config = {
  url: databaseUrl,
  dialect: "postgres",
  logging: false,
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
