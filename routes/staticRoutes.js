const express = require("express");
const router = express.Router();
const {Blog} = require("../model/blog");
const Comment = require("../model/comment");

router.get("/", async (req, res) =>{
  const blogs = await Blog.find({}).populate("createdBy", "fullName").sort({ createdAt: -1 }).limit(6);
  res.render("home", {
    user: req.user,
    blogs: blogs,
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
});

router.get("/blog/createBlog",async (req, res) =>{
  const allBlogs= await Blog.find({});
  return res.render("blog",{
    user:req.user,
    blogs:allBlogs,
  });
});

router.get("/blog/:id",async (req, res) =>{
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments= await Comment.find({blogId:req.params.id})
    .populate("createdBy", "fullName profileImg");
  // Estimate reading time based on word count (~200 words/minute)
  let readTimeMinutes = 1;
  if (blog && blog.body) {
    const words = blog.body.split(/\s+/).filter(Boolean).length;
    readTimeMinutes = Math.max(1, Math.ceil(words / 200));
  }

  return res.render("viewBlog",{
    user: req.user,
    blog,
    readTimeMinutes,
    comments,
  } );
})


module.exports= router;