function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).send("Please sign in first");
  }
  return next();
}

module.exports = {
  requireAuth,
};
