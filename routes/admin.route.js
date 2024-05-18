const express = require("express");
const router = express.Router();
const adminCtr = require("../controllers/admin.controller");
const auth = require("../middlewares/auth");
const authCtrl = require("../controllers/auth.controller");
const admin = require("../middlewares/admin");

router.get(
  "/users",
  // #swagger.tags = ['ADMIN']
  // #swagger.description = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDQiLCJpYXQiOjE3MTYwMzI3NDd9.fSAuo5-4_OUpn1roA_qEWe3NzJivmZR8IPiBi91D2Kc'
  auth,
  admin,
  adminCtr.getUser
);

router.post(
  "/users-edit",
  // #swagger.tags = ['ADMIN']
  // #swagger.description = 'chỉnh sửa user, is_admin = 1 || 0'
  auth,
  admin,
  adminCtr.updateUser
);


router.post(
  "/users-create",
  // #swagger.tags = ['ADMIN']
  // #swagger.description = 'tạo user'
  auth,
  admin,
  adminCtr.createUser
);

router.post(
  "/users-block",
  // #swagger.tags = ['ADMIN']
  // #swagger.description = 'block user'
  auth,
  admin,
  adminCtr.blockUser
);


module.exports = router;
