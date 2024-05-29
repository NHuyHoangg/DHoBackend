const express = require("express");
const router = express.Router();
const shippingCtrl = require("../controllers/shipping.controller");
const auth = require("../middlewares/auth");

router.post(
  "/order-review",
  // #swagger.tags = ['Shipping']
  auth,
  shippingCtrl.createShippingOrder
);

router.post(
  "/shipping_ipn",
  /*
      #swagger.tags = ['Shipping']
*/
  shippingCtrl.receiveCallback
);

module.exports = router;
