const express = require("express");
const router = express.Router();
const postCtrl = require("../controllers/post.controller");
const auth = require("../middlewares/auth");

router.get("/search", postCtrl.searchPosts);
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
  /*
  #swagger.parameters['Authorization'] = {
    in: 'header',
    description: 'Authorization:\"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJpYXQiOjE3MTE4NDcyNTJ9.eGEirES2G_n0EgGDLT_7qoFrKITlfyTsiDavS5P48CY"' ,
  }
*/ (req, res, next) => {
    let params = Object.keys(req.query);
    if (!params.includes("page") && params.length != 0) {
      postCtrl.filterPosts(req, res, next);
    } else {
      postCtrl.getPosts(req, res, next);
    }
  }
);

router.post("/posts", postCtrl.postDetail);
// router.post("/posts/toggle", auth, togglePostSoldStatus);
// router.post("/posts/edit", auth, editPost);
// router.delete("/posts/:id", auth, deletePost);
// router.post(
//   "/posts/upload",
//   auth,
//   uploadPost
//   /*
//   #swagger.parameters['obj'] = {
//     in: 'body',
//     description: 'If the image is not in base64, BE will handle it and add the tag\n Allowed params:\n' +
//       'name,\n' +
//       'description,\n' +
//       'price,\n' +
//       'status,\n' +
//       'brand,\n' +
//       'origin,\n' +
//       'case_size,\n' +
//       'color,\n' +
//       'strap_color,\n' +
//       'strap_material,\n' +
//       'battery_life,\n' +
//       'waterproof,\n' +
//       'power,\n' +
//       'engine,\n' +
//       'images,\n' +
//       'gender\n ' ,
//     required: true
//   }
// */
// );


module.exports = router;