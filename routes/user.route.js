const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const userCtrl = require("../controllers/user.controller");
const auth = require("../middlewares/auth");
router.get(
  "",
  //   #swagger.tags = ['User']
  // #swagger.description = 'dùng lấy profile của user'

  auth,
  userCtrl.getUserProfile
);
router.post(
  "",
  auth,

  //   #swagger.tags = ['User']
  // #swagger.description = 'dùng sửa profile của user'
  /*
  #swagger.parameters['obj'] = {
    in: 'body',
    description: ' avatar must be in base64, \n Allowed params:\n' +
      'last_name,\n' +
      'first_name,\n' +
      'phone,\n' +
      'email,\n' +
      'avatar,\n',
    required: true
  }
*/
  [
    check("last_name")
      .optional({ nullable: true, checkFalsy: true })
      .isAlpha("vi-VN", { ignore: " " })
      .withMessage("Last name must be alpha"),
    check("first_name")
      .optional({ nullable: true, checkFalsy: true })
      .isAlpha("vi-VN", { ignore: " " })
      .withMessage("First name must be alpha"),
    check("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid phone number"),
    check("email")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Invalid email"),
    check("avatar")
      .optional({ nullable: true, checkFalsy: true })
      .custom((value) => {
        const base64Regex = /^data:image\/[a-zA-Z+]*;base64,/;
        if (!base64Regex.test(value)) {
          throw new Error("Avatar must be a base64 string");
        }
        return true;
      }),
  ],
  userCtrl.editUser
);
router.get(
  "/status",
  // #swagger.description = 'dùng lấy status seller của user'
  //   #swagger.tags = ['User']
  auth,
  userCtrl.sellerState
);
router.post(
  "/change-password",
  // #swagger.description = 'dùng lấy đổi password'
  //   #swagger.tags = ['User']
  userCtrl.changePassword
);
module.exports = router;
