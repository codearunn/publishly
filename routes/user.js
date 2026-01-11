const express = require("express");
const router = express.Router();
const User= require("../model/user");

router.post("/signup", async(req, res) =>{
  const {fullName, email, password} = req.body;
  try {
    await User.create({
      fullName,
      email,
      password,
    });
  } catch (error) {
    return res.render("signup",{
      error:"All fields are Required!",
    })
  }
  return res.redirect("/");
});

router.post("/signin", async(req, res) =>{
  const {email, password} = req.body;
  try{
    const token= await User.matchPasswordAndGenerateToken(email, password);
    return res.cookie("token", token).redirect("/");
  }catch(err){
    return res.render("signin",{
      error:"Invalid password or email",
    })
  }

});


module.exports= router;