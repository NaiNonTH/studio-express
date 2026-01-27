var express = require("express");
var router = express.Router();

const { checkAuth } = require("../../middlewares/auth");

var db = require("../../db");

const dashboardUser = require("./user");
const dashboardKeeper = require("./keeper");
const dashboardReservation = require("./reservation");

// Middleware: บังคับ Login ก่อนเข้า Dashboard
router.use(checkAuth);

router.get("/", function (req, res, next) { // <--- 1. อย่าลืมเติม next ตรงนี้
  db.execute(
    'SELECT r.reservation_id, r.zone_id, z.zone_name, z.zone_details, r.datetime FROM reservation r JOIN zone z ON z.zone_id = r.zone_id WHERE user_id = ?;',
    [req.session.user.id],
    function (err, reservations) {
      if (err) return next(err);
      
      // console.log(reservations);

      // --- 2. ส่วนตรวจสอบสิทธิ์ Admin (ย้ายมาไว้ตรงนี้ ก่อนจะ Render) ---
      if (req.session.user.role === 'studio_keeper') {
        return res.redirect("/dashboard/keeper");
      }
      // -----------------------------------------------------------

      // 3. ถ้าเป็น User ทั่วไป ให้แสดงหน้า Dashboard ปกติ
      return res.render("dashboard", {
        title: "Dashboard",
        user: req.session.user,
        target: req.flash("target")[0] || "",
        errorMessages: req.flash("errorMessages"),
        updated: req.flash("updated")[0],
        reservations: reservations
      });
    }
  );
});

router.get("/empty", function (req, res) {
  return res.end("firetruck");
});

// เชื่อม Route ย่อยต่าง ๆ
router.use("/user", dashboardUser);
router.use("/keeper", dashboardKeeper);
router.use("/reservation", dashboardReservation);

module.exports = router;