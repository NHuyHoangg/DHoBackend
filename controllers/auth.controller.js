"use strict";
const jwt = require("jsonwebtoken");
// const User = require("../models/user.model");
const nodemailer = require("nodemailer");
const { pool } = require("../database/dbinfo");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const signIn = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const userQuery =
      "SELECT id FROM users WHERE phone = $1 AND password = $2";
    const userRes = await pool.query(userQuery, [phone, password]);
    const user = userRes.rows[0];

    if (!user) {
      return res
        .status(401)
        .json({ message: "Thông tin đăng nhập không chính xác" });
    }


    const userInfoQuery =
      "SELECT id, role, full_name, tokenversion FROM users WHERE id = $1";
    const userInfoRes = await pool.query(userInfoQuery, [user.id]);
    const userInfo = userInfoRes.rows[0];

    const token = jwt.sign(
      { id: userInfo.id.toString(), tokenVersion: userInfo.tokenVersion },
      process.env.SECRET_KEY
    );

    res.json({
      message: "Logged in successfully",
      result: {
        "user-info": {
          id: userInfo.id,
          full_name: userInfo.full_name,
          role: userInfo.role,
        },
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
const signUp = async (req, res) => {
  const { phone, email, password, password_confirm } = req.body;

  if (password !== password_confirm) {
    return res.status(422).json({ error: "Mật khẩu không trùng khớp" });
  }

  try {

    const existingPhoneQuery = "SELECT * FROM users WHERE phone = $1";
    const existingPhoneRes = await pool.query(existingPhoneQuery, [phone]);
    if (existingPhoneRes.rows.length > 0) {
      return res.status(409).json({ message: "Phone đã tồn tại" });
    }

    const existingEmailQuery = "SELECT * FROM users WHERE email = $1";
    const existingEmailRes = await pool.query(existingEmailQuery, [email]);
    if (existingEmailRes.rows.length > 0) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    const insertUserQuery =
      "INSERT INTO users(phone, email, password) VALUES($1, $2, $3) RETURNING *";
    const newUserRes = await pool.query(insertUserQuery, [
      phone,
      email,
      password,
    ]);
    const newUser = newUserRes.rows[0];

    const token = jwt.sign(
      { id: newUser.id, tokenVersion: newUser.tokenVersion },
      process.env.SECRET_KEY
    );

    res.json({
      message: "Signup successful",
      id: newUser.id,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("Không tìm thấy tài khoản trong hệ thống");
      error.statusCode = 401;
      throw error;
    }

    const newPassword = Math.random().toString(36).slice(2, 8);
    user.password = newPassword;
    user.tokenVersion++;

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "bkhostelhelper@gmail.com",
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    await transporter.verify();
    const content = `
  <div style="padding: 10px; background-color: #003375">
    <div style="padding: 10px; background-color: white; border-radius: 5px;">
      <h2 style="color: #0085ff; text-align: center; margin-bottom: 20px;">Trung tâm hỗ trợ BKHostel</h2>
      <p style="color: black; font-size: 16px; line-height: 1.5;">
        Chúng tôi đã hỗ trợ bạn lấy lại mật khẩu. Dưới đây là mật khẩu mới của bạn:
      </p>
      <h3 style="color: #0085ff; font-size: 24px; text-align: center; margin-top: 20px;">${newPassword}</h3>
      <p style="color: black; font-size: 16px; line-height: 1.5;">
        Xin cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Nếu bạn có bất kỳ câu hỏi hoặc cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi.
      </p>
      <p style="color: black; font-size: 16px; line-height: 1.5; text-align: center;">
        Trân trọng,<br>
        Đội ngũ BKHostel
      </p>
    </div>
  </div>
`;
    const mailOptions = {
      from: "bkhostelhelper@gmail.com",
      to: email,
      subject: "Thay đổi mật khẩu",
      html: content,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: "Đặt lại mật khẩu thành công", address: email });
  } catch (error) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Lỗi máy chủ";
    res.status(statusCode).json({ message: message });
  }
};

module.exports = {
  signIn,
  signUp,
  forgotPassword,
};
