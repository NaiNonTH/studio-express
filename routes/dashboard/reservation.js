var express = require("express");

var router = express.Router();

var db = require("../../db");

router.get("/", function (req, res, next) {
    // 1. ดึงข้อมูล Zone ก่อน
    db.execute(
        'SELECT zone_id, zone_name FROM zone WHERE is_open = 1',
        function (err, zones) {
            if (err) return next(err);

            // 2. ดึงข้อมูล Reservation ทั้งหมดที่มี (เอาแค่ zone_id กับ datetime พอ)
            db.execute(
                'SELECT zone_id, datetime FROM reservation',
                function (err, reservations) {
                    if (err) return next(err);

                    // 3. ส่งข้อมูลทั้งคู่ไปที่หน้า EJS
                    return res.render("reservation_form", {
                        title: "New Reservation",
                        user: req.session.user,
                        target: req.flash("target")[0] || "",
                        errorMessages: req.flash("errorMessages"),
                        updated: req.flash("updated")[0],
                        zones: zones,           // ข้อมูลห้อง
                        reservations: reservations // <--- ข้อมูลการจองที่เพิ่มเข้ามา
                    });
                }
            );
        }
    );
});

router.post("/reservation-process", function (req, res, next) {
    // ใน Route ที่รับค่า POST (reservation-process)
    const date = req.body.reservation_date; // ได้มาเป็น "2026-01-27"
    const time = req.body.reservation_time; // ได้มาเป็น "11:00"

    const zone = parseInt(req.body.reservation_zone);

    // รวมร่างกันดื้อๆ เลย (เติม :00 คือวินาที ต่อท้ายให้ครบ format)
    const timestampForDB = `${date} ${time}:00`;
    // console.log(req.body);
    db.execute(
        'INSERT INTO reservation VALUES (NULL, ?, ?, ?)',
        [req.session.user.id, zone, timestampForDB],
        function (err, results) {
            if (err) return next(err);
            return res.redirect("/dashboard");
        }
    )
});

module.exports = router;