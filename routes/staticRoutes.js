const express = require("express");
const router = express.Router();

router.get("/", (req, res) =>{
  res.render("home", {
    user: req.user,
  });
});

router.get("/signin", (req, res) =>{
  return res.render("signin");
});

router.get("/signUp", (req, res) =>{
  return res.render("signUp");
});


router.get("/logout", (req, res) =>{
  res.clearCookie("token").redirect("/");
})


module.exports= router;