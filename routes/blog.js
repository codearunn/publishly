const express = require("express");
const router = express.Router();
const { Blog } = require("../model/blog");
const path = require("path");
const { requireAuth } = require("../middleware/requireAuth");
const Comment = require("../model/comment");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("./public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// GET route to display all blogs
router.get("/", async (req, res) => {
  const blogs = await Blog.find({}).populate("createdBy", "fullName");
  return res.render("card", { blogs, user: req.user });
});

router.post(
  "/",
  requireAuth,
  upload.single("coverImgURL"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("Cover image is required");
    }

    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).send("Title and body are required");
    }

    await Blog.create({
      title,
      body,
      coverImgURL: `${req.file.filename}`,
      createdBy: req.user._id,
    });

    // Redirect to GET route instead of rendering directly
    // This prevents duplicate blog creation on refresh
    return res.redirect("/blog");
  }
);

router.post("/comment/:blogId", requireAuth, async (req, res) => {
  const content = (req.body.comment || "").trim();
  if (!content) return res.redirect(`/blog/${req.params.blogId}`);

  await Comment.create({
    content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  res.redirect(`/blog/${req.params.blogId}`);
});

module.exports = router;
