const express = require("express");
const app = express();
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { corsMiddleware } = require("./middlewares/cors");

require("./database/dbinfo").connect(); //Connect to database (MongoDB)

app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(corsMiddleware);

// const setCacheControl = (req, res, next) => {
//   const authToken = req.headers.authorization;

//   if (authToken) {
//     // Reset cache if there is a token in the auth header
//     res.setHeader("Vercel-CDN-Cache-Control", "no-cache");
//     res.setHeader("Cache-Control", "no-cache");
//     res.setHeader("Cache-Control", "no-store");
//   } else {
//     // Set cache control headers with a max-age of 60 seconds
//     res.setHeader("Vercel-CDN-Cache-Control", "max-age=60");
//     res.setHeader("Cache-Control", "max-age=60");
//   }
//   next();
// };

// Use the middleware function for all routes
// app.use(setCacheControl);
app.get("/", (req, res) => {
  res.send(
    `<html> 
      <a href="/api-docs">
        <img src='https://ik.imagekit.io/ar5q0hrss/default-image.jpg?updatedAt=1680091498536' style='object-fit: contain; display: block; margin-left: auto; margin-right: auto; width: 50%;height: 80%' >
      </a>
    </html>`
  );
});

// // API ROUTE ///////////////////////////////////////////////////
// // ---------------------------- SWAGGER DOCS  ---------------------------------- //
const swaggerRoute = require("./routes/swagger.route");
app.use(swaggerRoute);

// // ---------------------------- AUTH  ---------------------------------- //
const authRoutes = require("./routes/auth.route");
app.use("/auth", authRoutes);

// // ---------------------------- SERVICES  ---------------------------------- //
const serviceRoutes = require("./routes/service.route");
app.use("/services", serviceRoutes);

// // ---------------------------- FAKE DATA  ---------------------------------- //
const fakerRoutes = require("./routes/faker.route");
app.use("/faker", fakerRoutes);

// // ---------------------------- LOCATION  ---------------------------------- //
const locationRoutes = require("./routes/location.route");
app.use("/location", locationRoutes);

// // ---------------------------- RECHARGES  ---------------------------------- //
const rechargeRoute = require("./routes/recharge.route")
app.use("/recharge",rechargeRoute)

// // ---------------------------- PAYMENTS  ---------------------------------- //
const paymentRoute = require("./routes/payment.route")
app.use("/payments",paymentRoute)

// // ---------------------------- POSTS  ---------------------------------- //
const postsRoute = require("./routes/post.route");
app.use(postsRoute);

// // ---------------------------- USERS  ---------------------------------- //
const usersRoute = require("./routes/user.route");
app.use("/users", usersRoute);


// // ---------------------------- USERS  ---------------------------------- //
const adminRoute = require("./routes/admin.route");
app.use("/admin", adminRoute);


const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Server started running on " + port);
});
