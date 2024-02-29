"use strict";
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const nodemailer = require("nodemailer");

const signIn = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password }).select("id");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Thông tin đăng nhập không chính xác" });
    }

    await User.updateOne({ _id: user.id }, { last_active: new Date() });

    const userInfo = await User.findById(user.id).select(
      "_id role full_name tokenVersion"
    );
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
  const { username, phone, email, password, password_confirm } = req.body;

  if (password !== password_confirm) {
    return res.status(422).json({ error: "Mật khẩu không trùng khớp" });
  }

  try {
    const existingUsername = await User.findOne({ username: username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }

    const existingPhone = await User.findOne({ phone: phone });
    if (existingPhone) {
      return res.status(409).json({ message: "Phone đã tồn tại" });
    }

    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }
    const newUser = new User({
      username,
      phone,
      email,
      password,
    });

    const savedUser = await newUser.save();
    const newUserId = savedUser._id.toString();
    const token = jwt.sign(
      { id: newUserId, tokenVersion: newUser.tokenVersion },
      process.env.SECRET_KEY
    );

    res.json({
      message: "Signup successful",
      id: newUserId.toString(),
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
