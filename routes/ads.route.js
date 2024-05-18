const express = require("express");
const router = express.Router();
const ads = require("../controllers/ads.controller");
const auth = require("../middlewares/auth");

router.post(
  "/ads",
  // #swagger.tags = ['Ads post']

  auth,
  ads.addAds
);


router.get(
  "/ads",
  // #swagger.tags = ['Ads post']
  // #swagger.description = 'lấy các gói'

  ads.getAds
);
// router.post(
//   "/favorite_post",
//   // #swagger.tags = ['Favorite post']
//   auth,
//   addFavorite
// );
// router.delete(
//   "/favorite_post/:id",
//   // #swagger.tags = ['Favorite post']

//   auth,
//   deleteFavorite
// );

module.exports = router;
