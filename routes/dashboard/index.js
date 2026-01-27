var express = require("express");
var router = express.Router();

const { checkAuth } = require("../../middlewares/auth");

const dashboardUser = require("./user");
const dashboardKeeper = require("./keeper");
const dashboardReservation = require("./reservation");

// Middleware: บังคับ Login ก่อนเข้า Dashboard
router.use(checkAuth);

router.get("/", function (req, res) {
  // --- ส่วนที่ต้องเพิ่ม: ตรวจสอบสิทธิ์ Admin ---
  // ถ้า Role เป็น 'studio_keeper' ให้ Redirect ไปหน้า /dashboard/keeper ทันที
  if (req.session.user.role === 'studio_keeper') {
    return res.redirect("/dashboard/keeper");
  }
  // ----------------------------------------

  // ถ้าเป็น User ทั่วไป (customer) ให้แสดงหน้า Dashboard ปกติ
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

// เชื่อม Route ย่อยต่าง ๆ
router.use("/user", dashboardUser);
router.use("/keeper", dashboardKeeper);
router.use("/reservation", dashboardReservation);

module.exports = router;