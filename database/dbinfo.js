const mysql = require("mysql2/promise");
const mysql1 = require("mysql2");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const pool = new mysql1.createPool(process.env.DATABASE_URL);
const poolPromise = new mysql.createPool(process.env.DATABASE_URL);
module.exports = {
  pool,
  poolPromise,
};

