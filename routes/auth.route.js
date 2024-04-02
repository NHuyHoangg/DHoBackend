const express = require("express");
const { check, validationResult } = require("express-validator");
const authCtrl = require("../controllers/auth.controller");
const auth = require("../middlewares/auth");

const router = express.Router();
router.post(
  "/sign-in",
  /*
      #swagger.tags = ['Auth']
    #swagger.parameters['obj'] = {
                in: 'body',
                description: 'data input to login',
                required: true,
                schema: {
                    phone: "0123456789",
                    password: "123456"
                }
            }
*/
  [check("phone").isMobilePhone(), check("password").isLength({ min: 3 })],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => {
        return `${error.path}: ${error.msg}`;
      });
      return res.status(422).json({ message: errorMessages.join(", ") });
    }
    authCtrl.signIn(req, res);
  }
);

// router.post(
//   "/sign-in-mail",
//   /*
//       #swagger.tags = ['Auth']
//     #swagger.parameters['obj'] = {
//                 in: 'body',
//                 description: 'data input to login',
//                 required: true,
//                 schema: {
//                     email: "test@gmail.com",
//                     password: "1235"
//                 }
//             }
// */
//   [check("phone").isEmail(), check("password").isLength({ min: 3 })],
//   (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       const errorMessages = errors.array().map((error) => {
//         return `${error.path}: ${error.msg}`;
//       });
//       return res.status(422).json({ message: errorMessages.join(", ") });
//     }
//     authCtrl.authCtrl.signInEmail(req, res);
//   }
// );

router.post(
  "/sign-up",
  // #swagger.tags = ['Auth']
  [
    check("phone").isMobilePhone(),
    check("email").isEmail(),
    check("password_confirm").isLength({ min: 6 }),
    check("password").isLength({ min: 6 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => {
        return `${error.path}: ${error.msg}`;
      });
      return res.status(422).json({ message: errorMessages.join(", ") });
    }
    authCtrl.signUp(req, res);
  }
);
router.get(
  "/test-auth",
  // #swagger.tags = ['Auth']
  auth,
  (req, res) => {
    res.json({ message: "You are authenticated" });
  }
);

router.post(
  "/forgot-password",
  //  #swagger.tags = ['Auth']
  authCtrl.forgotPassword
);


module.exports = router;
