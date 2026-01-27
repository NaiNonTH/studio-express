var express = require("express");
var router = express.Router();
var db = require("../../db");

// 1. หน้าฟอร์มจองปกติ (Create)
router.get("/", function (req, res, next) {
    // 1. ดึงข้อมูล Zone
    db.execute(
        'SELECT zone_id, zone_name, zone_details FROM zone WHERE is_open = 1',
        function (err, zones) {
            if (err) return next(err);

            // 2. ดึงข้อมูล Reservation ทั้งหมดที่มี (เอาไว้เช็คเวลาชน)
            db.execute(
                'SELECT zone_id, datetime, reservation_id FROM reservation',
                function (err, reservations) {
                    if (err) return next(err);

                    // 3. ส่งข้อมูลไปที่หน้า EJS
                    return res.render("reservation_form", {
                        title: "New Reservation",
                        user: req.session.user,
                        target: req.flash("target")[0] || "",
                        errorMessages: req.flash("errorMessages"),
                        updated: req.flash("updated")[0],
                        zones: zones,           // ข้อมูลห้อง
                        reservations: reservations // ข้อมูลการจองทั้งหมด
                    });
                }
            );
        }
    );
});

// 2. ฟังก์ชันยกเลิกการจอง (เปลี่ยนเป็น POST และรับ ID)
router.get("/cancel-reservation/:id", function (req, res, next) {
    db.execute(
        'DELETE FROM reservation WHERE reservation_id = ?;',
        [req.params.id],
        function (err, result) {
            if (err) return next(err);
            return res.redirect("/dashboard");
        }
    )
})

// 3. ฟังก์ชันบันทึกการจองใหม่
router.post("/reservation-process", function (req, res, next) {
    const date = req.body.reservation_date;
    const time = req.body.reservation_time;
    const zone = parseInt(req.body.reservation_zone);

    // รวมร่าง Timestamp
    const timestampForDB = `${date} ${time}:00`;

    db.execute(
        'INSERT INTO reservation VALUES (NULL, ?, ?, ?)',
        [req.session.user.id, zone, timestampForDB],
        function (err, results) {
            if (err) return next(err);
            return res.redirect("/dashboard");
        }
    )
});

// 4. หน้าฟอร์มแก้ไข (Edit Mode)
router.get("/edit/:id", function (req, res, next) {
    // 1. ดึงข้อมูล Zone
    db.execute('SELECT zone_id, zone_name FROM zone WHERE is_open = 1', function (err, zones) {
        if (err) return next(err);

        // 2. ดึงข้อมูลการจอง "ใบเดิม" ที่จะแก้ไข
        db.execute('SELECT * FROM reservation WHERE reservation_id = ?', [req.params.id], function (err, currentBooking) {
            if (err) return next(err);
            if (currentBooking.length === 0) return res.redirect("/dashboard"); // ถ้าหาไม่เจอ ดีดกลับ

            // 3. (สำคัญ) ดึงข้อมูลการจอง "ทั้งหมด" เพื่อเอาไปเช็คเวลาชนในหน้า Edit
            db.execute('SELECT reservation_id, zone_id, datetime FROM reservation', function (err, allReservations) {
                if (err) return next(err);

                // ส่งข้อมูลไปที่ไฟล์ reservation_form เดิม
                return res.render("reservation_form", {
                    title: "Edit Reservation",
                    user: req.session.user,
                    zones: zones,
                    
                    booking: currentBooking[0],    // <--- ข้อมูลของใบที่จะแก้ (เอาไป Pre-fill)
                    reservations: allReservations, // <--- ข้อมูลทั้งหมด (เอาไปเช็คชน)
                    
                    target: req.flash("target")[0] || "",
                    errorMessages: req.flash("errorMessages"),
                    updated: req.flash("updated")[0]
                });
            });
        });
    });
});

// 5. ฟังก์ชันบันทึกการแก้ไข (Update)
router.post("/update/:id", function (req, res, next) {
    const date = req.body.reservation_date;
    const time = req.body.reservation_time;
    const zone = parseInt(req.body.reservation_zone);
    const timestampForDB = `${date} ${time}:00`;

    // ใช้คำสั่ง UPDATE แทน INSERT
    db.execute(
        'UPDATE reservation SET zone_id = ?, datetime = ? WHERE reservation_id = ?',
        [zone, timestampForDB, req.params.id],
        function (err, results) {
            if (err) return next(err);
            return res.redirect("/dashboard");
        }
    );
});

module.exports = router;