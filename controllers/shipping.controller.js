"use strict";
const { pool } = require("../database/dbinfo");
const axios = require("axios");

const createShippingOrder = async (req, res) => {
  const rawData = {
    payment_type_id: 2,
    required_note: "CHOXEMHANGKHONGTHU",
    return_phone: "0332190158",
    return_address: "39 NTT",
    return_district_id: null,
    return_ward_code: "",
    client_order_code: "",
    from_name: "TinTest124",
    from_phone: "0987654321",
    from_address: "72 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Vietnam",
    from_ward_name: "Phường 14",
    from_district_name: "Quận 10",
    from_province_name: "HCM",
    to_name: "TinTest124",
    to_phone: "0987654321",
    to_address: "72 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Vietnam",
    to_ward_name: "Phường 14",
    to_district_name: "Quận 10",
    to_province_name: "HCM",
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
    const response = await axios.post(
      "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create",
      rawData,
      {
        headers: {
          "Content-Type": "application/json",
          "ShopId": process.env.GHN_shop,
          "token": process.env.GHN_token,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating shipping order");
  }
};


const receiveCallback = async (req, res) => {
    console.log(req.body);
    const body = req.body;
   pool.query(
     "INSERT INTO shipping_order (body) VALUES ($1)",
     [
       body
     ]
   );
  res.send("OK");
}

module.exports = {
  createShippingOrder,
  receiveCallback,
};
