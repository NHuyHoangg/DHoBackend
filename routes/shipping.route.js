const express = require("express");
const router = express.Router();
const shippingCtrl = require("../controllers/shipping.controller");
const auth = require("../middlewares/auth");

router.get(
  "/create-order",
  // #swagger.tags = ['Shipping']
  // #swagger.description = 'chỉnh sửa service, is_admin = 1 || 0'
  shippingCtrl.createShippingOrder
);

router.post(
  "/shipping_ipn",
  /*
      #swagger.tags = ['Shipping']
    #swagger.parameters['obj'] = {
                in: 'body',
                description: 'data input to login',
                required: true,
                schema: {
                    
                }
            }
*/
  shippingCtrl.receiveCallback
);


module.exports = router;
