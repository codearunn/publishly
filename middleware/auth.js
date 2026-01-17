const { validateToken } = require("../utils/authUtil");

function checkAuthByCookie(cookieName){
  return (req, res, next) => {
    const tokenValue = req.cookies[cookieName];
    if (!tokenValue) {
      res.locals.user = null;
      return next();
    }
    try {
      const payload = validateToken(tokenValue);
      req.user = payload;
      res.locals.user = payload;
    } catch (error) {
      res.locals.user = null;
    }

    return next();
  }
}

module.exports={
  checkAuthByCookie,
}