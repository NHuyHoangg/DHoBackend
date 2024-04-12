const express = require("express");
// const { check, validationResult } = require("express-validator");
const locationCtrl = require("../controllers/address.controller");
// const auth = require("../middlewares/auth");

const router = express.Router();
router.get(
  "/province",
  // #swagger.tags = ['location']
  locationCtrl.getProvinces
);
router.get("/province/:id",
    // #swagger.tags = ['location']
    locationCtrl.getDistricts);
router.post("/districts"
    // #swagger.tags = ['location']
    , locationCtrl.getWards);


module.exports = router;