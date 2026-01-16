function checkAuth(req, res, next) {
  if (!req.session.user) {
	  req.flash("destAfterAuth", req.originalUrl);
	  return res.redirect("/login");
  }
  
  next();
}

function checkAuthToSkipLogin(req, res, next) {
  if (req.session.user) {
    const destAfterAuth = req.flash("destAfterAuth")[0];

    const destination =
      (!destAfterAuth || destAfterAuth === "/login")
        ? "/dashboard"
        : destAfterAuth;

    return res.redirect(destination);
  }

  next();
}

module.exports = { checkAuth, checkAuthToSkipLogin };