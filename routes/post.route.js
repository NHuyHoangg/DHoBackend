const express = require("express");
const router = express.Router();
const postCtrl = require("../controllers/post.controller");
const auth = require("../middlewares/auth");

router.get(
  "/search",
//  #swagger.tags = ['Posts']
  (req, res, next) => {
  const { q } = req.query;

if (q) {
  // Handle the case when q is null or an empty string
  postCtrl.searchPosts(req, res, next);
} else {
  postCtrl.getPosts(req, res, next);
}
 }
 
);
// router.post(
//   "/posts/history",
//   /*
//   #swagger.parameters['obj'] = {
//     in: 'body',
//     description: 'status = 0 -> đang bán\n status = 1 -> đã bán',
//     required: true,
//     schema: {
//         status:"0"
//     }
//   }
// */ auth,
//   getActivePosts
// );
router.get(
  "/posts",
  //  #swagger.tags = ['Posts']
  (req, res, next) => {
    let params = Object.keys(req.query);
    let filterParams = [
      "sortBy",
      "condition",
      "brand",
      "engine",
      "size",
      "priceRange",
    ];

    if (params.some((param) => filterParams.includes(param))) {
      postCtrl.filterPosts(req, res, next);
    } else {
      postCtrl.getPosts(req, res, next);
    }
  }
);

router.post(
  "/posts",
  //  #swagger.tags = ['Posts']
  postCtrl.postDetail
);
// router.post("/posts/toggle", auth, togglePostSoldStatus);
// router.post("/posts/edit", auth, editPost);
// router.delete("/posts/:id", auth, deletePost);
router.post(
  "/posts/upload",
  auth,
  postCtrl.uploadPost
  //  #swagger.tags = ['Posts']
  /*
  #swagger.parameters['obj'] = {
    in: 'body',
    description: 'If the image is not in base64, BE will handle it and add the tag\n Allowed params:\n' +
      'name,\n' +
      'description,\n' +
      'price,\n' +
      'status,\n' +
      'brand,\n' +
      'origin,\n' +
      'case_size,\n' +
      'color,\n' +
      'strap_color,\n' +
      'strap_material,\n' +
      'battery_life,\n' +
      'waterproof,\n' +
      'power,\n' +
      'engine,\n' +
      'images,\n' +
      'gender\n ' +
      'is_verified',
    required: true
  }
*/
);

module.exports = router;
