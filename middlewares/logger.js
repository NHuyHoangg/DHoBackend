const moment = require("moment-timezone");
const { pool } = require("../database/dbinfo");

async function logMiddleware(req, res, next) {
  const ip = req.headers["x-real-ip"];
  const vietnamTime = moment()
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DD_HH:mm:ss");
  const api_route = req.originalUrl;
  const server_domain = req.hostname;
  const startTime = new Date();
  let user_id;
  // console.log(res)
  res.on("finish", async () => {
    if (req.user === undefined) {
      user_id = "unknown";
    } else user_id = req.user.id;

    const body = JSON.stringify(req.body);
    const endTime = new Date();
    const responseTime = endTime - startTime;
    pool.query(
      "INSERT INTO logs (level, message, user_id, api_route, server_domain,ip,time_now,msg) VALUES ($1, $2, $3, $4,$5 ,$6,$7,$8)",
      [
        body,
        responseTime,
        user_id,
        api_route,
        server_domain,
        ip,
        vietnamTime,
        res.error,
      ],
      (err, result) => {
        if (err) {
          console.error("Error inserting log:", err.message);
        }
      }
    );
  });
  next();
}

module.exports = { logMiddleware };
