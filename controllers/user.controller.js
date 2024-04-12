"use strict";

const { formattedPrice, formatDateAgo } = require("../utils/format");
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
// const User = require("../models/user.model");
const moment = require("moment-timezone");
// const moment = require("moment-timezone");

const getUserInfo = async (req, res) => {
  try {
    const { username } = req.params;

    const { rows } = await pool.query(
      "SELECT first name, last name, email,  phone, avatar FROM users WHERE username = $1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    const user = rows[0];
    res.json(user);
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const getUserAddress = async (req, res) => {
  try {
    const user = req.user;
    const address = await pool.query(
      `SELECT
        a.id,
        a.user_id,
        a.is_default,
        a.first_name,
        a.last_name,
        a.phone_number,
        a.street,
        a.province_id,
        a.district_id,
        a.ward_id,
        w.province_name,
        w.district_name,
        w.name as ward_name
      FROM
        address a
        LEFT JOIN res_ward w ON a.province_id = w.province_id
        AND a.district_id = w.district_id
        AND a.ward_id = w.id
      WHERE
        a.user_id = $1 order by id`,
      [user.id]
    );
    const result = address.rows.map(
      ({
        id,
        user_id,
        first_name,
        last_name,
        is_default,
        ward_name,
        phone_number,
        street,
        province_name,
        district_name,
      }) => ({
        id,
        user_id,
        name: `${last_name} ${first_name}`,
        first_name,
        last_name,
        is_default,
        ward_name,
        phone_number,
        street,
        province_name,
        district_name,
      })
    );
    res.json(result);
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const editUserAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const user_id = user.id;
    const {
      is_default,
      first_name,
      last_name,
      phone_number,
      street,
      province_id,
      district_id,
      ward_id,
    } = req.body;

    if (is_default) {
      const idExists = await pool.query(`SELECT 1 FROM address WHERE id = $1`, [
        id,
      ]);

      if (idExists.rows.length === 0) {
        return res.status(404).json({ error: "ID not found" });
      }

      await pool.query(
        `UPDATE address SET is_default = 0 WHERE user_id = $1 AND id != $2`,
        [user_id, id]
      );
    }

    const result = await pool.query(
      `UPDATE address SET user_id = $1, is_default = $2, phone_number = $4, street = $5, province_id = $6, district_id = $7, ward_id = $8, first_name = $3, last_name = $10 WHERE id = $9 RETURNING *`,
      [
        user_id,
        is_default,
        first_name,
        phone_number,
        street,
        province_id,
        district_id,
        ward_id,
        id,
        last_name,
      ]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error updating address:", err);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const uploadAddress = async (req, res) => {
  try {
    const user = req.user;
    const user_id = user.id;
    const {
      is_default,
      first_name,
      last_name,
      phone_number,
      street,
      province_id,
      district_id,
      ward_id,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO address (user_id, is_default, first_name, last_name, phone_number, street, province_id, district_id, ward_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        user_id,
        is_default,
        first_name,
        last_name,
        phone_number,
        street,
        province_id,
        district_id,
        ward_id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding address:", err);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    user.avatar = user.avatar
      ? user.avatar
      : "https://res.cloudinary.com/dgdjzaq35/image/upload/v1691662078/user-circle-v2_foaygy.png";

    const result = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    };

    res.json(result);
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = req.user;

    const { rows } = await pool.query(
      "SELECT password FROM public.users WHERE id = $1",
      [user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    if (oldPassword !== user.password) {
      const error = new Error("Mật khẩu cũ không đúng");
      error.statusCode = 403;
      throw error;
    }
    if (newPassword.length < 6) {
      const error = new Error("Mật khẩu phải chứa ít nhất 6 ký tự");
      error.statusCode = 400;
      throw error;
    }
    if (newPassword != confirmPassword) {
      const error = new Error("Mật khẩu xác nhận không trùng khớp");
      error.statusCode = 400;
      throw error;
    }
    await pool.query(
      "UPDATE public.users SET password = $1, tokenversion = tokenversion + 1 WHERE id = $2",
      [newPassword, user.id]
    );

    res.json({ message: "Thay đổi mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Lỗi máy chủ";
    res.status(statusCode).json({ message: message });
  }
};

const editUser = async (req, res) => {
  try {
    const allowedParams = [
      "phone",
      "email",
      "first_name",
      "last_name",
      "avatar",
    ];
    const user = req.user;
    const { avatar: avatarFromBody, ...rest } = req.body;

    const requestBodyKeys = Object.keys(req.body);

    const invalidParams = requestBodyKeys.filter((key) => {
      const isAllowed = allowedParams.includes(key);
      return !isAllowed;
    });
    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: `Invalid parameter(s): ${invalidParams.join(", ")}.`,
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let oldAvatar = user.avatar;
    try {
      if (avatarFromBody) {
        const dateTime = moment()
          .tz("Asia/Ho_Chi_Minh")
          .format("YYYY-MM-DD HH:mm:ss");
        const imageName = `${user.id}_${dateTime}`;
        try {
          const uploadResponse = await cloudinary.uploader.upload(
            avatarFromBody,
            {
              public_id: `${imageName}`,
              folder: "DHo",
            }
          );

          user.avatar = uploadResponse.url;
        } catch (error) {
          console.log(error);
          console.error("Error uploading image:", error.message);
        }
      }
      let changes = {};
      Object.keys(rest).forEach((key) => {
        if (rest[key] !== null && rest[key] !== "" && user[key] !== rest[key]) {
          (changes[key] = rest[key]), (user[key] = rest[key]);
        }
      });
      if (oldAvatar !== user.avatar) {
        changes["avatar"] = user.avatar;
      }

      if (Object.keys(changes).length > 0) {
        const updateQuery = `UPDATE public.users SET ${Object.keys(changes)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(", ")} WHERE id = ${user.id}`;
        await pool.query(updateQuery, Object.values(changes));
      }
      const { phone, email, first_name, last_name, avatar } = user;

      const responseJSON = {
        user: { phone, email, first_name, last_name, avatar },
        changes: changes,
        message: "Cập nhật thành công.",
      };
      res.json(responseJSON);
    } catch (error) {
      console.error("Error updating user:", error.message);
      throw error;
    }
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sellerState = async (req, res) => {
  const userID = req.id;
  try {
    const rows = await pool.query("SELECT is_seller FROM users WHERE id = $1", [
      userID,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    const isSeller = rows.rows.is_seller;
    // if (!isSeller) {
    //   return res
    //     .status(403)
    //     .json({ error: "User does not have permission to upload a post." });
    // }
    const responseJSON = {
      userID: userID,
      isSeller: isSeller ? true : false,
      message: "Query successfully.",
    };
    res.status(200).json(responseJSON);
  } catch (error) {
    console.error("Error getting user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUserInfo,
  getUserProfile,
  changePassword,
  editUser,
  sellerState,
  getUserAddress,
  editUserAddress,
  uploadAddress,
};
