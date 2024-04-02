const jwt = require("jsonwebtoken");
// const User = require("../models/user.model");
const { pool } = require("../database/dbinfo");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const auth = async (req, res, next) => {
  try {
    const idToken = req.header("Authorization").replace("Bearer ", "");
      const decoded = jwt.verify(idToken, process.env.SECRET_KEY);


    const userQuery = "SELECT * FROM users WHERE id = $1";
    const userRes = await pool.query(userQuery, [decoded.id]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Token is outdated" });
    }
    delete user.password;
    req.user = user;
    next();
  } catch (e) {
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
