"use strict";
const { pool } = require("../database/dbinfo");
const axios = require("axios");

const createShippingOrder = async (req, res) => {
  const user = req.user;
  const { post_id } = req.body;
  const sellerInfoQ = `
     SELECT distinct ON (wm.id)
        wm.id::integer,
        wm.name,
        wm.price,
        wm.is_verified,
        wm.user_id as seller_id,
        rp.first_name as first_name,
         rp.last_name as last_name,
        rp.phone as phone,
        a.street as street,
        rw.district_name as district_name,
        rw.province_name as province_name,
        rw.name as ward_name
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
      WHERE
        wm.id = $1 AND wm.is_active = 1;
    `;

  const rows = await pool.query(sellerInfoQ, [post_id]);
console.log((rows.rows))
  const buyerAddress = await pool.query(
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
        a.user_id = $1 and a.is_active = 1 and a.is_default = 1`,
    [user.id]
  );
  const rawData = {
    payment_type_id: 2,
    required_note: "CHOXEMHANGKHONGTHU",
    return_phone: "0332190158",
    return_address: "39 NTT",
    return_district_id: null,
    return_ward_code: "",
    client_order_code: "",
    from_name: `${rows.rows[0].last_name} ${rows.rows[0].first_name}`,
    from_phone: "0987654321",
    from_address: "72 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Vietnam",
    from_ward_name: rows.rows[0].ward_name,
    from_district_name: rows.rows[0].district_name,
    from_province_name: rows.rows[0].province_name,
    to_name: `${buyerAddress.rows[0].last_name} ${buyerAddress.rows[0].first_name}`,
    to_phone: "0987654321",
    to_address: "72 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Vietnam",
    to_ward_name: buyerAddress.rows[0].ward_name,
    to_district_name: buyerAddress.rows[0].district_name,
    to_province_name: buyerAddress.rows[0].province_name,
    cod_amount: 5000000,
    content: "Theo New York Times",
    weight: 200,
    length: 1,
    width: 19,
    height: 10,
    cod_failed_amount: 2000,
    pick_station_id: 1444,
    deliver_station_id: null,
    insurance_value: 1000,
    service_id: 0,
    service_type_id: 2,
    coupon: null,
    pickup_time: 1692840132,
    pick_shift: [2],
    items: [
      {
        name: "Áo Polo",
        code: "Polo123",
        quantity: 1,
        price: 5000,
        length: 12,
        width: 12,
        weight: 1200,
        height: 12,
        category: {
          level1: "Áo",
        },
      },
    ],
  };

  try {
    // const response = await axios.post(
    //   "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create",
    //   rawData,
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "ShopId": process.env.GHN_shop,
    //       "token": process.env.GHN_token,
    //     },
    //   }
    // );
    console.log(rawData);
    res.json("ok");
    // res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating shipping order");
  }
};

const receiveCallback = async (req, res) => {
  console.log(req.body);
  const body = req.body;
  pool.query("INSERT INTO shipping_order (body) VALUES ($1)", [body]);
  res.send("OK");
};

module.exports = {
  createShippingOrder,
  receiveCallback,
};
