const swaggerUi = require("swagger-ui-express");
const swaggerAutogen = require("swagger-autogen")();
const doc = {
  info: {
    title: "BKHostel's API",
    description: "API for an ecommerce app",
  },
  host: "",
  schemes: [],
  //   schemes: ["https"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./index.js"];



module.exports = {
  swaggerUi,
  swaggerAutogen,
  doc,
  outputFile,
  endpointsFiles,
};
