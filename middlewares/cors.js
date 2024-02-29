const cors = require("cors");

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173", 
    "https://sandbox.vnpayment.vn", 
    "https://bkhostel.netlify.app",
    "https://hostel.hcmut.tech",
    "http://bkhostel-fe.s3-website-ap-southeast-2.amazonaws.com"
  ],
  credentials: true,
  method: ["GET", "PUT", "POST", "PATCH", "DELETE"],
  allowedHeaders: [
    "Origin",
    "X-CSRF-Token",
    "X-Requested-With",
    "Accept",
    "Accept-Version",
    "Content-Length",
    "Content-MD5",
    "Content-Type",
    "Date",
    "X-Api-Version",
    "Authorization",
  ],
  optionSuccessStatus: 200,
  preflightContinue: false,
};

module.exports = { corsOptions, corsMiddleware: cors(corsOptions) };
