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
      "SELECT id,first_name,last_name,email,phone,is_active,is_admin  from users";
    const rows = await pool.query(selectQuery);

    const result = rows.rows.map(
      ({ id, first_name, last_name, email, phone, is_active, is_admin }) => ({
        id,
        name: `${last_name} ${first_name}`,
        first_name,
        last_name,
        email,
        phone,
        is_active,
        is_admin
      })
    );
    res.json(result);
  } catch (err) {
    console.error("Error getting adds:", err.message);
    res.status(500).json({ error: "Error getting adds." });
  }
};

const updateUser = async (req, res) => {
  const { id, first_name, last_name, email, phone, is_active, is_admin } =
    req.body;
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
      is_admin,
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
    await pool.query(insertQuery, [
      first_name,
      last_name,
      email,
      phone,
      password,
      is_admin
    ]);

    res.json({ message: "User created successfully." });
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: "Error creating user." });
  }
};

const toggleBlockUser = async (req, res) => {
  const { id } = req.body;
  try {
    const userQuery = `SELECT is_active FROM users WHERE id = $1`;
    const result = await pool.query(userQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }

    const is_active = result.rows[0].is_active;
    const updateQuery = `
      UPDATE users
      SET
        is_active = ${is_active === 0 ? 1 : 0}
      WHERE id = $1
    `;
    await pool.query(updateQuery, [id]);

    res.json({
      message: `User ${
        is_active === 0 ? "unblocked" : "blocked"
      } successfully.`,
    });
  } catch (err) {
    console.error("Error updating user block status:", err.message);
    res.status(500).json({ error: "Error updating user block status." });
  }
};

const createService = async (req, res) => {
  const { name, price, description, expiration_day } = req.body;
  try {
    const insertQuery = `
      INSERT INTO services (name, price, description, expiration_day)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(insertQuery, [name, price, description, expiration_day]);

    res.json({ message: "Service created successfully." });
  } catch (err) {
    console.error("Error creating service:", err.message);
    res.status(500).json({ error: "Error creating service." });
  }
};

const editService = async (req, res) => {
  const { id, name, price, description, expiration_day } = req.body;
  try {
    const updateQuery = `
      UPDATE services
      SET
        name = COALESCE($1, name),
        price = COALESCE($2, price),
        description = COALESCE($3, description),
        expiration_day = COALESCE($4, expiration_day)
      WHERE id = $5
    `;
    await pool.query(updateQuery, [
      name,
      price,
      description,
      expiration_day,
      id,
    ]);

    res.json({ message: "Service updated successfully." });
  } catch (err) {
    console.error("Error updating service:", err.message);
    res.status(500).json({ error: "Error updating service." });
  }
};

const toggleService = async (req, res) => {
  const { id } = req.body;
  try {
    const serviceQuery = `SELECT is_active FROM services WHERE id = $1`;
    const result = await pool.query(serviceQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Service not found." });
    }

    const is_active = result.rows[0].is_active;
    const updateQuery = `
      UPDATE services
      SET
        is_active = ${is_active === 0 ? 1 : 0}
      WHERE id = $1
    `;
    await pool.query(updateQuery, [id]);

    res.json({
      message: `Service ${
        is_active === 0 ? "enabled" : "disabled"
      } successfully.`,
    });
  } catch (err) {
    console.error("Error updating service status:", err.message);
    res.status(500).json({ error: "Error updating service status." });
  }
};

module.exports = {
  getUser,
  updateUser,
  createUser,
  toggleBlockUser,
  toggleService,
  createService,
  editService,
};
