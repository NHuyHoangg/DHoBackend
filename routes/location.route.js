const express = require("express");
// const { check, validationResult } = require("express-validator");
const locationCtrl = require("../controllers/location.controller");
// const auth = require("../middlewares/auth");

const router = express.Router();
router.get("/districts",
    // #swagger.tags = ['location']
    locationCtrl.getDistricts);
router.get("/districts/:id/wards"
    // #swagger.tags = ['location']
    , locationCtrl.getWards);

module.exports = router;