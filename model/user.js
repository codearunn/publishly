const {createHmac, randomBytes} = require("crypto");
const mongoose= require("mongoose");
const { createTokenForUser } = require("../utils/authUtil");

const UserSchema= new mongoose.Schema({
  fullName:{
    type:String,
    required:true,
  },
  email:{
    type:String,
    required:true,
    unique:true,
  },
  salt:{
    type:String,
  },
  password:{
    type:String,
    required:true,
  },
  profileImg:{
    type:String,
    default: "../public/LuffyPFP.jpeg",
  },
  role:{
    type:String,
    enum: ["USER", "ADMIN"],
    default: "USER",
  }
}, {timestamps: true});

//Hashing password
UserSchema.pre("save", async function() {
  const user= this;

  if(!user.isModified("password")) return;

  const salt = randomBytes(16).toString();
  const hashedPassword= createHmac("sha256", salt)
                        .update(user.password)
                        .digest("hex");

  this.salt=salt;
  this.password= hashedPassword;
});
//Verifying user By matching passowrds
UserSchema.static("matchPasswordAndGenerateToken", async function (email, password) {
  const user= await this.findOne({email});
  if(!user){
    throw new Error("User not Found!");
  }

  const salt = user.salt;
  const hashedPassword= user.password;

  const userProvidedPassword= createHmac("sha256", salt)
                        .update(password)
                        .digest("hex");


  if (userProvidedPassword !== hashedPassword) {
    throw new Error("Invalid password");
  }

  const token = createTokenForUser(user);
  return token;
})


const User= mongoose.model("user", UserSchema);

module.exports= User;