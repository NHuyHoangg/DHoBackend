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
const User = require("../models/user.model");
const moment = require("moment-timezone");
// const moment = require("moment-timezone");

const getUserInfo = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username }).select(
      "full_name email username phone zalo facebook avatar -_id"
    );

    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    const result = user.toObject();
    res.json(result);
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const result = req.user;
    result.avatar = result.avatar
      ? result.avatar
      : "https://res.cloudinary.com/dgdjzaq35/image/upload/v1691662078/user-circle-v2_foaygy.png";
    delete result.password;
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
    await User.findOneAndUpdate(
      { _id: user.id },
      { $inc: { tokenVersion: 1 } }
    );
    user.password = newPassword;
    await user.save();
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
      "username",
      "full_name",
      "phone",
      "email",
      "zalo",
      "facebook",
      "avatar",
    ];
    const user = req.user;
    const oldUser = JSON.parse(JSON.stringify(user));
    const { avatar, ...rest } = req.body;

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
      if (avatar) {
        const dateTime = moment()
          .tz("Asia/Ho_Chi_Minh")
          .format("YYYY-MM-DD HH:mm:ss");

        const imageName = `${user.id}_${dateTime}`;
        try {
          const uploadResponse = await cloudinary.uploader.upload(avatar, {
            public_id: `${imageName}`,
            folder: "BKHostelID",
          });
          user.avatar = uploadResponse.url;
        } catch (error) {
          console.error("Error uploading image:", error.message);
        }
      }
      const changes = {};
      Object.keys(rest).forEach((key) => {
        if (rest[key] !== null) {
          user[key] = rest[key];
        }
        if (oldUser[key] !== null && user[key] !== oldUser[key]) {
          changes[key] = {
            old: oldUser[key],
            new: rest[key],
          };
        }
      });

      if (oldAvatar !== user.avatar) {
        changes.avatar = {
          old: oldAvatar,
          new: user.avatar,
        };
      }
      await user.save();
      const responseJSON = {
        user: user,
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

module.exports = {
  getUserInfo,
  getUserProfile,
  changePassword,
  editUser,
};
