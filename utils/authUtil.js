const jwt= require("jsonwebtoken");
const secret= "www.AakhyyaPaglu.com";

function createTokenForUser(user){
  const payLoad= {
    _id:user._id,
    name:user.fullName,
    profileImgURL:user.profileImg,
    role:user.role,
  }
  const token= jwt.sign(payLoad, secret);
  return token;
}
function validateToken(token) {
  if(!token) return null;
  const payLoad= jwt.verify(token, secret);
  return payLoad;
}


module.exports={
  createTokenForUser,
  validateToken
}