var express = require("express");
var router = express.Router();
var db = require("../../db");

// Middleware: ตรวจสอบสิทธิ์ว่าเป็น Admin (studio_keeper) หรือไม่
router.use(function(req, res, next) {
  if (req.session.user && req.session.user.role === 'studio_keeper') {
    next();
  } else {
    // ถ้าไม่ใช่ Admin ให้เด้งกลับหน้า Dashboard ปกติ
    req.flash("errorMessages", "คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ");
    res.redirect("/dashboard");
  }
});

// GET: หน้า Dashboard ของ Admin
router.get("/", function(req, res, next) {
  // 1. ดึงสถิติการใช้งานย้อนหลัง 30 วัน (แยกตามโซน)
  const sqlStats = `
    SELECT z.zone_name, COUNT(r.reservation_id) AS total_usage
    FROM zone z
    LEFT JOIN reservation r ON z.zone_id = r.zone_id 
    AND r.datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY z.zone_id, z.zone_name
    ORDER BY total_usage DESC
  `;

  db.query(sqlStats, function(err, statsResults) {
    if (err) return next(err);

    // 2. ดึงรายการจองของ "วันนี้"
    const sqlToday = `
      SELECT r.*, u.user_name, z.zone_name
      FROM reservation r
      JOIN user u ON r.user_id = u.user_id
      JOIN zone z ON r.zone_id = z.zone_id
      WHERE DATE(r.datetime) = CURDATE()
      ORDER BY r.datetime ASC
    `;

    db.query(sqlToday, function(err, todayResults) {
      if (err) return next(err);

      // 3. ดึงข้อมูลโซนทั้งหมด (สำหรับให้ Admin แก้ไข)
      db.query("SELECT * FROM zone ORDER BY zone_id ASC", function(err, zones) {
        if (err) return next(err);

        res.render("keeper-dashboard", {
          title: "Admin Dashboard",
          user: req.session.user,
          stats: statsResults,
          bookings: todayResults,
          zones: zones
        });
      });
    });
  });
});

// POST: เพิ่มโซนใหม่
router.post("/add-zone", function(req, res, next) {
  const { zone_name, zone_details, is_open } = req.body;
  const openStatus = is_open ? 1 : 0;

  db.execute(
    "INSERT INTO zone (zone_name, zone_details, is_open) VALUES (?, ?, ?)",
    [zone_name, zone_details, openStatus],
    function(err) {
      if (err) return next(err);
      res.redirect("/dashboard/keeper");
    }
  );
});

// POST: แก้ไขข้อมูลโซน (ปิด/เปิด/แก้ไขรายละเอียด)
router.post("/edit-zone", function(req, res, next) {
  const { zone_id, zone_name, zone_details, is_open } = req.body;
  const openStatus = is_open ? 1 : 0;

  db.execute(
    "UPDATE zone SET zone_name = ?, zone_details = ?, is_open = ? WHERE zone_id = ?",
    [zone_name, zone_details, openStatus, zone_id],
    function(err) {
      if (err) return next(err);
      res.redirect("/dashboard/keeper");
    }
  );
});

module.exports = router;