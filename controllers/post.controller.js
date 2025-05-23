"use strict";

const { formattedPrice, formatDateAgo } = require("../utils/format");
const cloudinary = require("cloudinary").v2;
const { validationResult } = require("express-validator");
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
const { pool } = require("../database/dbinfo");
const getUpdatedRows = require("../utils/update");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const districts = require("../models/district");
const wards = require("../models/ward");
const moment = require("moment-timezone");

// const getActivePosts = async (req, res) => {
//   try {
//     // Query to fetch the posts with media content (index 1) and specific details
//     const user_id = req.id;
//     const { status } = req.body;
//     const sqlQuery = `
//       SELECT
//         p.ID AS post_id,
//         p.name,
//         p.price,
//         p.watch_id,
//         p.case_size,
//         p.status,
//         p.create_date AS date,
//         rpr.name AS province,
//         pm.content AS media_content
//       FROM
//         post p
//       LEFT JOIN
//         post_media pm ON p.ID = pm.post_id AND pm.post_index = 1
//       LEFT JOIN
//         res_partner rp ON p.user_id = rp.id
//       LEFT JOIN
//         res_province rpr ON rp.province_id = rpr.id where p.is_active = 1 AND p.is_sold = ? and user_id = ? order by post_id desc;
//     `;

//     const connection = await poolPromise.getConnection();
//     const [rows] = await connection.query(sqlQuery, [status, user_id]);

//     connection.release();
//     const updatedRows = getUpdatedRows(rows);
//     return res.json(updatedRows);
//   } catch (err) {
//     console.error("Error fetching data:", err);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const getPosts = async (req, res) => {
  try {
    // Query to fetch the posts with media content (index 1) and specific details
    let sqlQuery = `
      WITH filtered_posts AS (
        SELECT
          p.ID AS post_id,
          p.name,
          p.price,
          p.case_size,
          p.status,
          p.is_verified,
          p.create_date AS date,
          rpr.name AS province,
          pm.content AS media_content,
          date_diff_in_days(pa.time_left)::int as is_ads
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
        LEFT JOIN
          post_ads pa ON p.id = pa.post_id and pa.is_active = 1
        WHERE p.is_active = 1 AND p.is_sold = 0
      ),
      total_count AS (
        SELECT COUNT(*) FROM filtered_posts
      ),
      post as (SELECT DISTINCT ON (post_id)
        post_id,
        name,
        price,
        case_size,
        status,
        date,
        province,
        media_content,
        is_verified,
        is_ads
      FROM filtered_posts
      )
      SELECT * FROM post, total_count  ORDER BY is_ads DESC, post_id DESC
    `;
    //paging
    let page = req.query.page || 1;
    if (page) {
      const numberPattern = /^-?\d+(\.\d+)?$/;
      const isNumber = numberPattern.test(page);
      if (!isNumber) {
        const error = new Error("Tham số không hợp lệ");
        error.statusCode = 402;
        throw error;
      }
      page = parseInt(page);
      sqlQuery += "LIMIT 10 OFFSET " + (page - 1) * 10 + ";";
    }

    const client = await pool.connect();
    // Execute count query

    const ressql = await client.query(sqlQuery);
    const rows = ressql.rows;
    const updatedRows = getUpdatedRows(rows);
    const totalPosts = rows[0] ? rows[0].count : 0;
    const totalPages = Math.ceil(totalPosts / 10);
    if (page > totalPages) {
      console.log(page);
      return res.status(400).json({ error: "Page is out of range" });
    }
    let authHeader = "";
    authHeader += req.header("Authorization");
    if (authHeader.length > 0) {
      try {
        const idToken = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(idToken, process.env.SECRET_KEY);
        req.id = decoded.id;
        const row1 = await client.query(
          "SELECT post_id FROM post_favorites WHERE user_id = $1",
          [req.id]
        );
        const postFavorites = row1.rows.map((row) => row.post_id);
        updatedRows.forEach((row) => {
          if (postFavorites.includes(row.post_id)) {
            row.is_favorite = true;
          } else row.is_favorite = false;
        });
      } catch (err) {
        return res.json({
          totalEntries: totalPosts,
          totalPages: totalPages,
          currentPage: page,
          entries: updatedRows,
        });
      }
    }
    client.release();

    return res.json({
      totalEntries: totalPosts,
      totalPages: totalPages,
      currentPage: page,
      entries: updatedRows,
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const searchPosts = async (req, res) => {
  try {
    const postsPerPage = 10;
    let page = req.query.page || 1;

    const { q } = req.query;

    const sqlQuery = `
      WITH filtered_posts AS (
        SELECT  DISTINCT ON (p.ID)
          p.ID AS post_id,
          p.name,
          p.case_size,
          p.status,
          p.price,
          p.is_verified,
          p.create_date AS date,
          rpr.name AS province,
          pm.content AS media_content,
          date_diff_in_days(pa.time_left) as is_ads
        FROM
          post p
        LEFT JOIN
          post_media pm ON p.ID = pm.post_id::integer AND pm.post_index = 1
        LEFT JOIN
          users rp ON p.user_id = rp.id
        LEFT JOIN
          address a ON rp.id = a.user_id AND a.is_default = 1
        LEFT JOIN
          res_province rpr ON cast(a.province_id as integer)  = rpr.id
        LEFT JOIN
           post_ads pa ON p.id = pa.post_id and pa.is_active = 1
        WHERE
        (p.price LIKE $1 OR
        p.name LIKE $1 OR
        p.case_size LIKE $1 OR
        p.description LIKE $1 OR
        p.brand LIKE $1 OR
        p.color LIKE $1 OR
        p.strap_color LIKE $1 OR
        p.strap_material LIKE $1 OR
        p.engine LIKE $1) AND
        p.is_active = 1 AND p.is_sold = 0
      ),
      total_count AS (
        SELECT COUNT(*) FROM filtered_posts
      )
    SELECT fp.*, tc.count
    FROM filtered_posts fp
    LEFT JOIN total_count tc ON TRUE
    ORDER BY is_ads desc, fp.post_id DESC
    LIMIT $2 OFFSET $3;
    `;

    // Validate page number
    const numberPattern = /^-?\d+(\.\d+)?$/;
    const isNumber = numberPattern.test(page);
    if (!isNumber) {
      const error = new Error("Invalid parameter");
      error.statusCode = 402;
      throw error;
    }
    page = parseInt(page);

    const client = await pool.connect();
    const ressql = await client.query(sqlQuery, [
      `%${q}%`,
      postsPerPage,
      (page - 1) * postsPerPage,
    ]);
    const rows = ressql.rows;
    client.release();
    const updatedRows = getUpdatedRows(rows);

    const totalPosts = rows[0] ? rows[0].count : 0;
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    if (page > totalPages) {
      console.log(page);
      return res.status(400).json({ error: "Page is out of range" });
    }
    return res.json({
      totalEntries: totalPosts,
      totalPages: totalPages,
      currentPage: page,
      entries: updatedRows,
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const filterPosts = async (req, res) => {
  try {
    const {
      sortBy,
      condition,
      brand,
      engine,
      size,
      priceRange,
      page = 1,
    } = req.query;
    const entriesPerPage = 10;
    let sqlQuery = `
      SELECT 
        p.ID AS post_id,
        p.name,
        CAST(p.price as integer) as price,
        p.case_size,
        p.status,
        p.is_verified,
        p.create_date AS date,
        rpr.name AS province,
        pm.content AS media_content,
        date_diff_in_days(pa.time_left) as is_ads
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
      LEFT JOIN
         post_ads pa ON p.id = pa.post_id and pa.is_active = 1
      WHERE
        p.is_active = 1 AND p.is_sold = 0
       `;

    if (condition) {
      sqlQuery += ` AND p.status = '${condition}'`;
    }

    if (!Array.isArray(brand) && brand) {
      sqlQuery += ` AND p.brand like'${brand}'`;
    }
    let brandParams = {};
    let brandString = "";
    if (Array.isArray(brand) && brand.length > 0) {
      brandParams = Object.fromEntries(
        brand.map((b, i) => [`brand${i}`, `%${b}%`])
      );
      brandString = Object.values(brandParams)
        .map((value) => `p.brand LIKE '${value}'`)
        .join(" OR ");
      sqlQuery += ` AND (${brandString})`;
    }

    if (engine) {
      sqlQuery += ` AND p.engine = '${engine}'`;
    }

    if (size) {
      const [minSize, maxSize] = size.split("-");

      const minSizeValue = parseInt(minSize);
      const maxSizeValue = parseInt(maxSize);

      if (!isNaN(minSizeValue) && !isNaN(maxSizeValue)) {
 sqlQuery += ` AND CAST(REPLACE(p.case_size, 'mm', '') AS DOUBLE PRECISION) >= ${minSizeValue} AND CAST(REPLACE(p.case_size, 'mm', '') AS DOUBLE PRECISION) <= ${maxSizeValue}`;
      }
    }

    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split("-");
      sqlQuery += ` AND price >= ${minPrice} AND price <= ${maxPrice}`;
    }
    if (sortBy) {
      switch (sortBy) {
        case "newest":
          sqlQuery += " ORDER BY p.create_date DESC";
          break;
        case "oldest":
          sqlQuery += " ORDER BY p.create_date ASC";
          break;
        case "price_asc":
          sqlQuery += " ORDER BY price ASC";
          break;
        case "price_desc":
          sqlQuery += " ORDER BY price DESC";
          break;
        default:
          break;
      }
    }
    else sqlQuery += " ORDER BY is_ads DESC, date DESC, p.ID";
    // sqlQuery += ` LIMIT ${entriesPerPage} OFFSET ${
    //   (page - 1) * entriesPerPage
    // }`;

    const client = await pool.connect();
    const ressql = await client.query(sqlQuery);

    const rows = ressql.rows;
    // const totalEntries = rows.length;
    // const totalPages = Math.ceil(totalEntries / entriesPerPage);
    // if (page > totalPages) {
    //   console.log(page);
    //   return res.status(400).json({ error: "Page is out of range" });
    // }
    const updatedRows = getUpdatedRows(rows);
    const authHeader = req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const idToken = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(idToken, process.env.SECRET_KEY);
        req.id = decoded?.id;
        const [results] = await connection.query(
          "SELECT post_id FROM post_favorites WHERE user_id = ?",
          [req.id]
        );
        const postFavorites = results.map((row) => row.post_id);
        updatedRows.forEach((row) => {
          if (postFavorites.includes(row.post_id)) {
            row.is_favorite = true;
          } else row.is_favorite = false;
        });
      } catch (err) {
        return res
          .status(500)
          .json({ error: "Invalid token", result: updatedRows });
      }
    }
    client.release();
    let uniqueUpdatedRows = updatedRows.filter(
      (value, index, self) =>
        index === self.map((item) => item.post_id).indexOf(value.post_id)
    );
    return res.json({
      currentPage: page,
      // totalEntries,
      // totalPages,
      posts: uniqueUpdatedRows,
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const postDetail = async (req, res) => {
  try {
    const { post_id } = req.body;
    const client = await pool.connect();
    const sqlQuery = `
     SELECT
        wm.id::integer,
        wm.name,
        wm.description,
        wm.price,
        wm.status,
         wm.origin,
         wm.waterproof,
        wm.create_date AS date,
        wm.brand,
        wm.view,
        wm.case_size,
        wm.color,
        wm.strap_color,
        wm.strap_material,
        wm.battery_life,
        wm.gender,
        wm.is_verified,
        COALESCE(date_diff_in_days(pa.time_left), 0)::int as is_ads,
        pm.content AS media_content,
        pm.post_index AS media_index,
        wm.user_id as seller_id,
        a.first_name as first_name,
         a.last_name as last_name,
        a.phone_number as phone,
        a.street as street,
        rw.district_name as district,
        rw.province_name as province,
        rw.name as ward
      FROM
        post wm
      LEFT JOIN
        post_media pm ON cast(wm.id as integer) = cast(pm.post_id as integer)
      LEFT JOIN
        users rp ON cast(wm.user_id as integer) =cast(rp.id as integer)
      LEFT JOIN
          address a ON rp.id = a.user_id AND a.is_default = 1
      LEFT JOIN
        res_ward rw ON cast(a.ward_id as integer)= cast(rw.id as integer)
        LEFT JOIN
          post_ads pa ON wm.id = pa.post_id and pa.is_active = 1
      WHERE
        wm.id = $1 AND wm.is_active = 1;
    `;

    const rows = await client.query(sqlQuery, [post_id]);
    const results = rows.rows;
    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const {
      id,
      name,
      description,
      price,
      date,
      view,
      origin,
      brand,
      case_size,
      color,
      strap_color,
      strap_material,
      battery_life,
      gender,
      is_ads,
      is_verified,
      first_name,
      last_name,
      province,
      seller_id,
      phone,
      street,
      status,
      waterproof,
      district,
      ward,
  } = results[0];

    if (case_size) {
      var case_size_num = parseInt(case_size.match(/\d+/)[0]);
    }
    const productInfo = {
      id,
      name,
      description,
      price,
      formatted_price: formattedPrice(price),
      date_ago: formatDateAgo(date),
      date,
      view,
      status,
      brand,
      origin,
      case_size,
      case_size_num,
      color,
      strap_color,
      strap_material,
      battery_life,
      waterproof,
      waterproof_num: waterproof === "Chống nước" ? true : false,
      gender,
      is_ads,
      is_verified,
      seller_id,
      user_name: `${last_name} ${first_name}`,
      phone,
      province,
      district,
      ward,
      street,
    };

    const mediaArray = results.map(({ media_content, media_index }) => ({
      content: media_content,
      product_index: media_index,
    }));

    client.query(
      "UPDATE post SET view = view + 1 WHERE id = $1",
      [post_id],
      (error, results) => {
        if (error) {
          console.error(error);
          // res.status(500).send("Internal server error");
        }
      }
    );
    const responseJSON = {
      product_info: productInfo,
      media: mediaArray,
    };
    let authHeader = "";
    authHeader += req.header("Authorization");
    if (authHeader.length > 0) {
      try {
        const idToken = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(idToken, process.env.SECRET_KEY);
        req.id = decoded.id;
        const row1 = await client.query(
          "SELECT post_id FROM post_favorites WHERE post_id = $1 and user_id = $2",
          [post_id, req.id]
        );
        if (row1.rows.length === 0) {
          responseJSON.product_info.isFavorite = false;
        } else responseJSON.product_info.isFavorite = true;
      } catch (err) {
        return res.json(responseJSON);
      }
    }
    return res.json(responseJSON);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const uploadPost = async (req, res) => {
  const allowedParams = [
    "name",
    "description",
    "images",
    "price",
    "status",
    "brand",
    "origin",
    "case_size",
    "color",
    "strap_color",
    "strap_material",
    "battery_life",
    "waterproof",
    "gender",
    "engine",
    "is_verified"
  ];

  const requestBodyKeys = Object.keys(req.body);

  const invalidParams = requestBodyKeys.filter((key) => {
    const isAllowed = allowedParams.includes(key);
    const isNotImage = key !== "images";
    const isNotString = Array.isArray(req.body[key]);
    return isAllowed && isNotImage && isNotString;
  });

  if (invalidParams.length > 0) {
    return res.status(400).json({
      error: `Invalid parameter(s): ${invalidParams.join(
        ", "
      )}. Only 'images' parameter can be an array.`,
    });
  }

  const validationRules = [
    body("name").notEmpty().withMessage("Name is required"),
    body("price").notEmpty().withMessage("Price is required"),
    body("case_size").notEmpty().withMessage("Case size is required"),
    body("images")
      .isArray({ min: 1 })
      .withMessage("At least one image is required"),
  ];

  for (const param of allowedParams) {
    if (req.body[param]) {
      validationRules.push(body(param).trim());
    }
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userID = req.user.id;

  const rows = await pool.query(
    "SELECT * FROM address WHERE user_id = $1 and is_default = 1 and is_active = 1",
    [userID]
  );

  if (rows.length === 0) {
    return res
      .status(403)
      .json({ error: "User does not have permission to upload a post." });
  }

  const { name, price, images, case_size,...rest } = req.body;
  if (!name || !price || !images || !case_size || images.length === 0) {
    return res.status(400).json({ error: "Invalid request body." });
  }
  let modifiedCaseSize = case_size;
  if (
    rest.hasOwnProperty("is_verified") &&
    rest.is_verified !== null &&
    rest.is_verified !== "undefined"
  ) {
    rest.is_verified = 1;
  }
  if (modifiedCaseSize) {
    modifiedCaseSize += " mm";
  }
  try {
    const values_ = [
      userID,
      name,
      price,
      modifiedCaseSize,
      ...Object.values(rest),
    ];
    const params = values_.map((_, index) => `$${index + 1}`).join(", ");

    const sql = `
      INSERT INTO post (user_id, name, price, case_size, ${Object.keys(
        rest
      ).join(", ")})
      VALUES (${params}) returning *
    `
    const result = await pool.query(sql, values_);
    const post_id = result.rows[0].id;
    const date = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD_HH:mm:ss");
    const uploadPromises = images.map(async (fileStr, i) => {
      try {
        if (!/^data:image\/\w+;base64,/.test(fileStr)) {
          // If not, add the base64 tag to the beginning of the string
          fileStr = `data:image/png;base64,${fileStr}`;
        }
        const imageName = `${post_id}_${date}_${i + 1}`;
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
          public_id: `${imageName}`,
          folder: "DHo",
        });

        return uploadResponse.url;
      } catch (error) {
        console.error("Error uploading image:", error.message);
        throw error;
      }
    });

    const uploadedImageUrls = await Promise.all(uploadPromises);

    const values = uploadedImageUrls
      .map((url, i) => `('${url}', '${post_id}', ${i + 1})`)
      .join(","); // Construct the values string for bulk insert

    await pool.query(
      `INSERT INTO post_media (content, post_id, post_index) VALUES ${values}`
    );
    
    const responseJSON = {
      post_id: post_id,
      info: { name, price, ...rest },
      content: uploadedImageUrls,
      message: "New row inserted successfully.",
    };

    res.status(201).json(responseJSON);
  } catch (error) {
    console.error("Error inserting row:", error.message);
    res.status(500).json(error);
  }
};

// const editPost = async (req, res) => {
//   const allowedParams = [
//     "post_id",
//     "name",
//     "description",
//     "watch_id",
//     "images",
//     "price",
//     "status",
//     "brand",
//     "case_size",
//     "color",
//     "strap_color",
//     "strap_material",
//     "battery_life",
//     "waterproof",
//     "gender",
//   ];
//   const userID = req.id;

//   const { post_id, images, ...rest } = req.body;
//   const filteredRest = Object.entries(rest)
//     .filter(([key, value]) => value !== "")
//     .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
//   const requestBodyKeys = Object.keys(filteredRest);
//   const invalidParams = requestBodyKeys.filter((key) => {
//     const isAllowed = allowedParams.includes(key);
//     const isNotImage = key !== "images";
//     const isNotString = Array.isArray(req.body[key]);
//     return isAllowed && isNotImage && isNotString;
//   });

//   if (invalidParams.length > 0) {
//     return res.status(400).json({
//       error: `Invalid parameter(s): ${invalidParams.join(
//         ", "
//       )}. Only 'images' parameter can be an array.`,
//     });
//   }

//   const validationRules = [
//     body("images")
//       .isArray({ min: 1 })
//       .withMessage("At least one image is required"),
//   ];

//   for (const param of allowedParams) {
//     if (req.body[param]) {
//       validationRules.push(body(param).trim());
//     }
//   }

//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const connection = await poolPromise.getConnection();
//     const [user] = await connection.query(
//       "SELECT ID FROM post WHERE ID = ? AND user_id = ? LIMIT 1;",
//       [post_id, userID]
//     );
//     let isEmptyObj = !Object.keys(user).length;
//     if (isEmptyObj) {
//       return res.status(401).json({ message: "The post is not exist" });
//     }
//     const updateQuery = `
//       UPDATE post
//       SET ${Object.keys(filteredRest)
//         .map((key) => `${key} = ?`)
//         .join(", ")}
//       WHERE id = ? AND user_id = ?
//     `;

//     const values_query = [...Object.values(filteredRest), post_id, userID];

//     // const [result] =
//     await connection.query(updateQuery, values_query);

//     const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

//     const uploadPromises = images.map(async (fileStr, i) => {
//       try {
//         if (/^data:image\/\w+;base64,/.test(fileStr)) {
//           const imageName = `${post_id}_${date}_${i + 1}`;
//           const uploadResponse = await cloudinary.uploader.upload(fileStr, {
//             public_id: `${imageName}`,
//             folder: "ctime",
//           });
//           return uploadResponse.url;
//         }
//         return fileStr;
//       } catch (error) {
//         console.error("Error uploading image:", error.message);
//         throw error;
//       }
//     });

//     const uploadedImageUrls = await Promise.all(uploadPromises);

//     const values = uploadedImageUrls
//       .map((url, i) => `('${url}', '${post_id}', ${i + 1})`)
//       .join(","); // Construct the values string for bulk insert
//     await poolPromise.query(
//       `DELETE from post_media where post_id = ${post_id}`
//     );
//     await poolPromise.query(
//       `INSERT INTO post_media (content, post_id, post_index) VALUES ${values}`
//     );

//     connection.release();

//     const responseJSON = {
//       post_id: post_id,
//       info: { ...filteredRest },
//       content: uploadedImageUrls,
//       message: "Edit row successfully.",
//     };

//     res.status(201).json(responseJSON);
//   } catch (error) {
//     console.error("Error inserting row:", error.message);
//     res.status(500).json(error);
//   }
// };

const deletePost = async (req, res) => {
  const user_id = req.user.id;
  const post_id = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE post SET is_active = 0 WHERE id = $1 AND user_id = $2 returning *",
      [post_id, user_id]
    );
    console.log(result.rows);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Post not found or does not belong to user." });
    }

    return res.status(200).json({ message: "Post deleted successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error deleting post." });
  }
};
// const togglePostSoldStatus = async (req, res) => {
//   const { postId } = req.body;
//   const userID = req.id;
//   console.log(postId);
//   console.log(userID);
//   const connection = await poolPromise.getConnection();
//   try {
//     await connection.beginTransaction();

//     const selectQuery = "SELECT is_sold FROM post WHERE id = ? and user_id = ?";
//     const [rows] = await connection.query(selectQuery, [postId, userID]);

//     if (rows.length === 0) {
//       throw new Error("Post not found.");
//     }

//     const isSold = rows[0].is_sold;
//     const updateQuery = "UPDATE post SET is_sold = ? WHERE id = ?";
//     const values_query = [isSold ? 0 : 1, postId];
//     await connection.query(updateQuery, values_query);

//     await connection.commit();
//     console.log("Post updated successfully.");
//     const newStatus = isSold ? "Đang bán" : "Đã bán";
//     res.status(200).send(`Post updated successfully. New status: ${newStatus}`);
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error updating post:", err.message);
//     res.status(500).send("Error updating post.");
//   } finally {
//     connection.release();
//   }
// };
// const getPage = async (req, res) => {
//   try {
//     let { limit, offset } = req.query;
//     const numberPattern = /^-?\d+(\.\d+)?$/;
//     const testStrings = [limit, offset];
//     for (const str of testStrings) {
//       const isNumber = numberPattern.test(str);
//       if (!isNumber) {
//         const error = new Error("Tham số không hợp lệ");
//         error.statusCode = 402;
//         throw error;
//       }
//     }
//     limit = parseInt(limit);
//     offset = parseInt(offset);

//     const sqlQuery = `
//       SELECT
//         p.ID AS post_id,
//         p.name,
//         p.price,
//         p.case_size,
//         p.status,
//         p.create_date AS date,
//         rpr.name AS province,
//         pm.content AS media_content
//       FROM
//         post p
//       LEFT JOIN
//         post_media pm ON p.ID = pm.post_id AND pm.post_index = 1
//       LEFT JOIN
//         res_partner rp ON p.user_id = rp.id
//       LEFT JOIN
//         res_province rpr ON rp.province_id = rpr.id where p.is_active = 1 AND p.is_sold = 0
//         ORDER BY
//       p.ID DESC LIMIT ? OFFSET ?;`;

//     const [postPageContent] = await poolPromise.query(sqlQuery, [
//       limit,
//       offset,
//     ]);
//     const updatedRows = getUpdatedRows(postPageContent);
//     const authHeader = req.header("Authorization");
//     if (authHeader?.startsWith("Bearer ")) {
//       try {
//         const idToken = req.header("Authorization").replace("Bearer ", "");
//         const decoded = jwt.verify(idToken, process.env.SECRET_KEY);
//         req.id = decoded?.id;
//         const [results] = await connection.query(
//           "SELECT post_id FROM post_favorites WHERE user_id = ?",
//           [req.id]
//         );
//         const postFavorites = results.map((row) => row.post_id);
//         updatedRows.forEach((row) => {
//           if (postFavorites.includes(row.post_id)) {
//             row.is_favorite = true;
//           } else row.is_favorite = false;
//         });
//       } catch (err) {
//         return res.json(updatedRows);
//       }
//     }
//     return res.json(updatedRows);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const message = error.message || "Lỗi máy chủ";
//     res.status(statusCode).json({ message: message });
//   }
// };

module.exports = {
  deletePost,
  postDetail,
  getPosts,
  searchPosts,
  filterPosts,
  uploadPost,
  // getActivePosts,
  //   editPost,
  //   togglePostSoldStatus,
};
