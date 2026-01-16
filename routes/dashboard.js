var express = require("express");
var router = express.Router();

const { checkAuth } = require("../middlewares/auth");

router.use(checkAuth);

router.get("/", function (req, res) {
  return res.render("dashboard", {
    title: "Dashboard",
    user: req.session.user,
  });
});

router.get("/empty", function(req, res) {
  return res.end("firetruck");
});

module.exports = router;
