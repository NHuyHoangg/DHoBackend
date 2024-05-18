const { formattedPrice, formatDateAgo } = require("../utils/format");

const { validationResult } = require("express-validator");
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
const { pool } = require("../database/dbinfo");
const getUpdatedRows = require("../utils/update");
const moment = require("moment");


const addAds = async (req, res) => {
  const post_id = req.body.post_id;
  const days = req.body.days;
  try {
    const selectQuery =
      "SELECT 1 FROM post_ads WHERE post_id = $1 and is_active = 1";
      const rows = await pool.query(selectQuery, [post_id]);
      
    if (rows.rows.length > 0) {
      res.status(400).json({ error: "Post này đang được đẩy tin." });
      return;
    }

    process.env.TZ = "Asia/Ho_Chi_Minh";
    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    //get Merchant sever addess
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    //Merchant code
    // let tmnCode = config.get('vnp_TmnCode');
    let tmnCode = process.env.vnp_TmnCode;
    //Merchant secret key
    let secretKey = process.env.vnp_HashSecret;
    //Vnpay gateway
    let vnpUrl = process.env.vnp_Url;
    //Result url
    let returnUrl = process.env.vnp_ReturnUrl;

    let orderId = moment(date).format("DDHHmmss");
    let amount;
    switch (days) {
      case '7':
        amount = '50000';
        break;
      case '3':
        amount = '25000';
        break;
      case '1':
        amount = '10000';
        break;
      default:
        amount = 0;
    }
      let bankCode = "";

    let locale = "";
    if (locale === null || locale === "" || locale === undefined) {
      locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params = {};
    let userID = req.user.id;

    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho KH:" + userID;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    const insertQuery =
      "INSERT INTO post_ads (post_id, order_id,days) VALUES ($1, $2,$3)";
    await pool.query(insertQuery, [post_id, orderId, days]);

    res.status(201).json({
      message: "Đã yêu cầu đẩy tin. Vui lòng thanh toán",
      paymentURL: vnpUrl,
    });
  } catch (err) {
    console.error("Error inserting favorite:", err.message);
    res.status(500).json({ error: "Error inserting." });
  }
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
module.exports = { addAds };
