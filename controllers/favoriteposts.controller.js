"use strict";
const { pool } = require("../database/dbinfo");
const getUpdatedRows = require("../utils/update");

const addFavorite = async (req, res) => {
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

const deleteFavorite = async (req, res) => {
  const favorite_id = req.params.id;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      "DELETE FROM post_favorites WHERE post_id = $1 AND user_id = $2",
      [favorite_id, user_id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Favorite not found." });
    } else {
      res.status(200).json({ message: "Favorite deleted successfully." });
    }
  } catch (err) {
    console.error("Error deleting favorite:", err.message);
    res.status(500).json({ error: "Error deleting favorite." });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user_id = req.user.id;
    const favoriteResult = await pool.query(
      "SELECT id,post_id FROM post_favorites WHERE user_id = $1 order by id desc",
      [user_id]
    );

    const post_ids = favoriteResult.rows.map((row) => row.post_id);

    if (post_ids.length === 0) {
      console.log("User has no favorite posts.");
      res.status(200).json([]);
      return;
    }

    const postResult = await pool.query(
      `
      WITH filtered_posts AS (
        SELECT DISTINCT ON (p.ID)
          p.ID AS post_id,
          p.name,
          p.price,
          p.case_size,
          p.status,
          p.create_date AS date,
          rpr.name AS province,
          pm.content AS media_content
        FROM
          post p
        LEFT JOIN
          post_media pm ON p.id =  CAST(pm.post_id AS INTEGER) AND pm.post_index = 1
        LEFT JOIN
          users rp ON p.user_id = rp.id
        LEFT JOIN
          address a ON rp.id = a.user_id AND a.is_default = 1
        LEFT JOIN
          res_province rpr ON cast(a.province_id as integer)  = rpr.id 
        WHERE p.ID = ANY($1::int[]) and p.is_active = 1 AND p.is_sold = 0
      ),
      total_count AS (
        SELECT COUNT(*) FROM filtered_posts
      )
      SELECT * FROM filtered_posts, total_count
      ORDER BY post_id DESC
    `,
      [post_ids]
    );
    

     const updatedRows = getUpdatedRows(postResult.rows);
    console.log("Favorite posts found.");
    res.status(200).json(updatedRows);
  } catch (err) {
    console.error("Error getting favorite posts:", err.message);
    res.status(500).json({ error: "Error getting favorite posts." });
  }
};


module.exports = {
  addFavorite,
  deleteFavorite,
  getFavorites,

};
