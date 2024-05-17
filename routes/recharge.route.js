const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { check, validationResult } = require("express-validator");
const rechargeCtrl = require("../controllers/recharge.controller");

router.post(
  "/create_payment_url",
  /*  

        #swagger.tags = ['Recharge']
        #swagger.parameters['Authorization'] = {
            in: 'header',
            description: 'Token for authentication',
            required: true,
            type: 'string',
        
        }
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Payment amount and language mode when transaction is created',
            required: true,
            schema: {
                amount: 20000,
                language: "vn"
            }
        }
    */

  [
    check("amount")
      .isFloat({ min: 1000 })
      .withMessage("Amount must be greater than 1000"),
  ],
  auth,
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => {
        return `${error.path}: ${error.msg}`;
      });
      return res.status(422).json({ message: errorMessages.join(", ") });
    }

    rechargeCtrl.createPaymentUrl(req, res);
  }
);

router.get("/vnpay_return", (req, res) => {
  rechargeCtrl.vnpayReturn(req, res);
});

router.get("/vnp_ipn", (req, res) => {
  rechargeCtrl.vnpayIPN(req, res);
});

// router.get(
//   "/:userID",
//   auth,
//   /* 
//         #swagger.tags = ['Recharge']
//     */

//   (req, res) => {
//     rechargeCtrl.getAllRecharges(req, res);
//   }
// );

module.exports = router;
