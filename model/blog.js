const mongoose= require("mongoose");

const blogSchema= new mongoose.Schema({
  title:{
    type:String,
    required:true,
  },
  body:{
    type:String,
    required:true,
  },
  coverImgURL:{
    type:String,
    default:"../public/images/default_blog_img.png",
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
    required: true,
  },
},{timestamps:true});

const Blog = mongoose.model("blog", blogSchema);

module.exports= {
  Blog,
}