const path = require("path");
const express = require("express");
const app= express();
const PORT= 3000;

//DB connection
const {connectToMongoDB}= require("./connect.js");
connectToMongoDB("mongodb://localhost:27017/Publishly")
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
//ROUTES
const staticRoute = require("./routes/staticRoutes");
const userRoute= require("./routes/user");

app.use("/", staticRoute);
app.use("/user", userRoute);





app.listen(PORT, () => console.log(`Server Started at PORT: ${PORT}`));