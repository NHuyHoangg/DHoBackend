"use strict";

const cloudinary = require("cloudinary").v2;
const { validationResult } = require("express-validator");
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const { pool } = require("../database/dbinfo");

const moment = require("moment-timezone");

const getUser = async (req, res) => {
  try {
    const selectQuery =
      "SELECT id,first_name,last_name,email,phone,is_active  from users";
    const rows = await pool.query(selectQuery);

    const result = rows.rows.map(
      ({ id, first_name, last_name, email, phone, is_active }) => ({
        id,
        name: `${last_name} ${first_name}`,
        email,
        phone,
        is_active,
      })
    );
    res.json(result);
  } catch (err) {
    console.error("Error getting adds:", err.message);
    res.status(500).json({ error: "Error getting adds." });
  }
};

const updateUser = async (req, res) => {
  const { id, first_name, last_name, email, phone, is_active, is_admin } = req.body;
  // how to handle if 1 var is null?
  try {
    const updateQuery = `
      UPDATE users
      SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        is_active = COALESCE($5, is_active),
          is_admin = COALESCE($7, is_admin)
      WHERE id = $6
    `;
    await pool.query(updateQuery, [
      first_name,
      last_name,
      email,
      phone,
      is_active,
      id,
      is_admin
    ]);

    res.json({ message: "User updated successfully." });
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(500).json({ error: "Error updating user." });
  }
};

const createUser = async (req, res) => {
  const { first_name, last_name, email, phone, password, is_admin } = req.body;
  try {
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, phone, password,is_admin)
      VALUES ($1, $2, $3, $4, $5,$6)
    `;
    await pool.query(insertQuery, [first_name, last_name, email, phone, password]);

    res.json({ message: "User created successfully." });
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: "Error creating user." });
  }
};

const blockUser = async (req, res) => {
  const { id } = req.body;
  try {
    const userQuery = `SELECT is_active FROM users WHERE id = $1`;
    const result = await pool.query(userQuery, [id]);

    if (result.rows.length > 0 && result.rows[0].is_active === 0) {
      return res.status(400).json({ message: "User is already blocked." });
    }

    const updateQuery = `
      UPDATE users
      SET
        is_active = 0
      WHERE id = $1
    `;
    await pool.query(updateQuery, [id]);

    res.json({ message: "User blocked successfully." });
  } catch (err) {
    console.error("Error blocking user:", err.message);
    res.status(500).json({ error: "Error blocking user." });
  }
};

module.exports = {
  getUser,
  updateUser,
  createUser,
  blockUser,
};
