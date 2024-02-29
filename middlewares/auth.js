const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const auth = async (req, res, next) => {
  try {
    const idToken = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(idToken, process.env.SECRET_KEY);
    req.id = decoded.id;
    const user = await User.findOne({ _id: decoded.id });
    console.log(decoded );
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Token is outdated" });
    }
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
