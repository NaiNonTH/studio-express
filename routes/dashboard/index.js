var express = require("express");
var router = express.Router();

const { checkAuth } = require("../../middlewares/auth");

const dashboardUser = require("./user");
const dashboardKeeper = require("./keeper");
const dashboardReservation = require("./reservation");

router.use(checkAuth);

router.get("/", function (req, res) {
  return res.render("dashboard", {
    title: "Dashboard",
    user: req.session.user,
    target: req.flash("target")[0] || "",
    errorMessages: req.flash("errorMessages"),
    updated: req.flash("updated")[0]
  });
});

router.get("/empty", function(req, res) {
  return res.end("firetruck");
});

router.use("/user", dashboardUser);
router.use("/keeper", dashboardKeeper);
router.use("/reservation", dashboardReservation);

module.exports = router;
