const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const User = require("../model/user");
const { requireAuth } = require("../middleware/requireAuth");
const { createTokenForUser } = require("../utils/authUtil");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("./public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    await User.create({
      fullName,
      email,
      password,
    });
  } catch (error) {
    return res.render("signup", {
      error: "All fields are Required!",
    });
  }
  return res.redirect("/");
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    return res.cookie("token", token).redirect("/");
  } catch (err) {
    return res.render("signin", {
      error: "Invalid password or email",
    });
  }
});

router.get("/profile", requireAuth, (req, res) => {
  return res.render("profile", { user: req.user });
});

router.post(
  "/profile",
  requireAuth,
  upload.single("profileImg"),
  async (req, res) => {
    if (!req.file) {
      return res.render("profile", { user: req.user, error: "Please upload an image." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImg: `/uploads/${req.file.filename}` },
      { new: true }
    );

    const newToken = createTokenForUser(updatedUser);
    res.cookie("token", newToken);

    return res.redirect("/");
  }
);

module.exports = router;
