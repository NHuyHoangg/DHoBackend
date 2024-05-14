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
router.get(
  "/address",
  //   #swagger.tags = ['User']
  // #swagger.description = 'dùng lấy address của user'
  auth,
  userCtrl.getUserAddress
);

router.put(
  "/address/:id",
  //   #swagger.tags = ['User']
  // #swagger.description = 'dùng chỉnh address của user, is default gồm 0 và 1'
  auth,
  userCtrl.editUserAddress
);

router.delete(
  "/address/:id",
  //   #swagger.tags = ['User']
  // #swagger.description = ''
  auth,
  userCtrl.deactivateUserAddress
);


router.post(
  "/address/",
  //   #swagger.tags = ['User']
  // #swagger.description = 'dùng thêm address cho user, is default gồm 0 và 1'
  auth,
  [
    check('is_default').not().isEmpty().withMessage('is_default is required'),
    check('first_name').not().isEmpty().withMessage('first_name is required'),
    check('last_name').not().isEmpty().withMessage('last_name is required'),
    check('phone_number').not().isEmpty().withMessage('phone_number is required'),
    check('street').not().isEmpty().withMessage('street is required'),
    check('province_id').not().isEmpty().withMessage('province_id is required').isNumeric().withMessage('province_id must be a number'),
    check('district_id').not().isEmpty().withMessage('district_id is required').isNumeric().withMessage('district_id must be a number'),
    check('ward_id').not().isEmpty().withMessage('ward_id is required').isNumeric().withMessage('ward_id must be a number'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  userCtrl.uploadAddress
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
  auth,
  userCtrl.changePassword
);
module.exports = router;
