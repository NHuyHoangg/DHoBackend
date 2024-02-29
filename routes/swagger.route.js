const express = require("express");
const router = express.Router();
const {
  swaggerUi,
  swaggerAutogen,
  doc,
  outputFile,
  endpointsFiles,
} = require("../middlewares/swagger");

const swaggerDocument = require("../swagger-output.json");

router.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customSiteTitle: "Backend Generator",
    customfavIcon: "https://avatars.githubusercontent.com/u/6936373?s=200&v=4",
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js",
    ],
    customCssUrl: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css",
    ],
  })
);

router.get(
  "/api-update",
  // #swagger.tags = ['test']
  (req, res) => {
    swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
      require("../index.js");
    });
    res.send("complete");
  }
);

module.exports = router;
