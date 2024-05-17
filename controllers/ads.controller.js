const { formattedPrice, formatDateAgo } = require("../utils/format");
const cloudinary = require("cloudinary").v2;
const { validationResult } = require("express-validator");
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
const { pool } = require("../database/dbinfo");
const getUpdatedRows = require("../utils/update");


const addAds = async (req, res) => {
  const post_id = req.body.post_id;
  const user_id = req.user.id;

  try {
    const selectQuery =
      "SELECT * FROM post_favorites WHERE user_id = $1 AND post_id = $2";
    const rows = await pool.query(selectQuery, [user_id, post_id]);

    if (rows.rows.length > 0) {
      console.log("User has already favorited this post.");
      res.status(400).json({ error: "User has already favorited this post." });
      return;
    }

    const insertQuery =
      "INSERT INTO post_favorites (user_id, post_id) VALUES ($1, $2)";
    await pool.query(insertQuery, [user_id, post_id]);

    res.status(201).json({ message: "Favorite inserted successfully." });
  } catch (err) {
    console.error("Error inserting favorite:", err.message);
    res.status(500).json({ error: "Error inserting favorite." });
  }
};


module.exports = {

};
