const express = require("express");
const router = express.Router();
const ads = require("../controllers/ads.controller");
const auth = require("../middlewares/auth");

router.post(
  "/ads",
  // #swagger.tags = ['Ads post']
  /*
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'days = 1 || 3 ||  7',
    required: true
  }
*/
  auth,
  ads.addAds
);


router.get(
  "/ads",
  // #swagger.tags = ['Ads post']
  /*
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'lấy các gói',
    required: true
  }
*/
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
