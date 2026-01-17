require("dotenv").config();
const path = require("path");
const express = require("express");
const app= express();
const PORT= process.env.PORT || 8001;

//DB connection
const {connectToMongoDB}= require("./connect.js");
const mongoURI= process.env.MONGO_URI;
connectToMongoDB(mongoURI)
          .then(() => console.log("DB connected"))
          .catch((e) => console.log(e));

//EJS
app.set("view engine", "ejs");
app.set("views",path.resolve("./views"))

const cookieParser= require("cookie-parser");
const {checkAuthByCookie}= require("./middleware/auth");

// Body parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(checkAuthByCookie("token"));
app.use(express.static(path.resolve("./public")));

//ROUTES
const staticRoute = require("./routes/staticRoutes");
const userRoute= require("./routes/user");
const blogRoute= require("./routes/blog");



app.use("/", staticRoute);
app.use("/user", userRoute);
app.use("/blog", blogRoute);




app.listen(PORT, () => console.log(`Server Started at PORT: ${PORT}`));