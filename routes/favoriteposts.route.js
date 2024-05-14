const express = require("express");
const router = express.Router();
const {
  addFavorite,
  deleteFavorite,
  getFavorites,
} = require("../controllers/favoriteposts.controller");
const auth = require("../middlewares/auth");

router.get(
  "/favorite_post",
  // #swagger.tags = ['Favorite post']
  auth,
  getFavorites
);
router.post(
  "/favorite_post",
  // #swagger.tags = ['Favorite post']
  auth,
  addFavorite
);
router.delete(
  "/favorite_post/:id",
  // #swagger.tags = ['Favorite post']

  auth,
  deleteFavorite
);



module.exports = router;
