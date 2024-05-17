const jwt = require("jsonwebtoken");
const moment = require("moment");

const { successFilePath, failureFilePath } = require("../resources/export");






const createPaymentUrl = async (req, res) => {
  try {
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
    let amount = req.body.amount;
    let bankCode = "";

    let locale = req.body.language;
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
    res.status(200).json({ paymentURL: vnpUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err });
  }
};

const vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;

    let secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    let tmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;
    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      res.sendFile(successFilePath);
    } else {
      res.sendFile(failureFilePath);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

const vnpayIPN = async (req, res) => {
  var vnp_Params = req.query;
  var secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  var secretKey = process.env.vnp_HashSecret;
  var querystring = require("qs");
  var signData = querystring.stringify(vnp_Params, { encode: false });
  var crypto = require("crypto");
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  try {
    let orderInfo = vnp_Params["vnp_OrderInfo"];
    let result = orderInfo.split("%3A");
    let userID = result[1];
    let amount = vnp_Params["vnp_Amount"] / 100;
    let orderID = vnp_Params["vnp_TxnRef"];
    let status = vnp_Params["vnp_TransactionStatus"];
    if (status == "00") {
      status = "SUCCESS";
    } else status = "FAILED";

    console.log(vnp_Params);
  } catch (e) {
    console.log("Error when updating payment");
  }

  if (secureHash === signed) {
    var orderId = vnp_Params["vnp_TxnRef"];
    var rspCode = vnp_Params["vnp_ResponseCode"];
    //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY
    res.status(200).json({ RspCode: "00", Message: "success" });
  } else {
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
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

module.exports = {
  createPaymentUrl,
  vnpayReturn,
  vnpayIPN,
//   getAllRecharges,
};
