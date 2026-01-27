var express = require("express");
var bcrypt = require("bcrypt");

var router = express.Router();

var db = require("../../db");

router.post("/edit", function(req, res, next) {
  const { user_name, email } = req.body;

  let errorFlag = false;
  req.flash("target", "edit-user");

  if (!user_name || !email) {
    errorFlag = true;
    req.flash("errorMessages", "ข้อมูลกรอกไม่ครบถ้วน");
  }
  
  if (user_name === req.session.user.user_name && email === req.session.user.email) {
    errorFlag = true;
    req.flash("errorMessages", "ข้อมูลซ้ำกับที่มีอยู่");
  }

  if (errorFlag)
    return res.redirect("/dashboard");

  db.execute(
    'UPDATE user SET user_name = ?, email = ? WHERE user_id = ?',
    [user_name, email, req.session.user.id],
    function(err, results) {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          errorFlag = true;
          req.flash("errorMessages", "มีผู้ใช้อีเมลนี้แล้ว");
        }
        else
          return next(err);
      }

      if (!errorFlag) {
        req.session.user.name = user_name;
        req.session.user.email = email;
        req.flash("updated", "1");
      }

      return res.redirect("/dashboard");
    }
  );
});

router.post("/edit-password", function(req, res, next) {
  const { current_password, new_password, confirm_password } = req.body;

  let errorFlag = false;
  req.flash("target", "edit-password");

  if (!current_password || !new_password) {
    errorFlag = true;
    req.flash("errorMessages", "ข้อมูลกรอกไม่ครบถ้วน");
  }

  if (new_password.length < 8) {
    errorFlag = true;
    req.flash("errorMessages", "รหัสผ่านใหม่น้อยกว่า 8 ตัวอักษร");
  }

  if (new_password !== confirm_password) {
    errorFlag = true;
    req.flash("errorMessages", "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
  }

  db.query("SELECT password FROM user WHERE user_id = ?", [req.session.user.id], (err, results) => {
    if (err) return next(err);

    if (!bcrypt.compareSync(current_password, results[0].password)) {
      errorFlag = true;
      req.flash("errorMessages", "รหัสผ่านปัจจุบันไม่ถูกต้อง");
    }

    if (errorFlag)
      return res.redirect("/dashboard");
  
    const hashedPassword = bcrypt.hashSync(new_password, 10);
  
    db.execute(
      'UPDATE user SET password = ? WHERE user_id = ?',
      [hashedPassword, req.session.user.id],
      function(err, results) {
        if (err) return next(err);
      
        if (!errorFlag)
          req.flash("updated", "1");
      
        return res.redirect("/dashboard");
      }
    );
  });
});

router.post("/delete", function(req, res, next) {
  const { user_name, password } = req.body;

  let errorFlag = false;
  req.flash("target", "delete");

  if (!user_name || !password) {
    errorFlag = true;
    req.flash("errorMessages", "ข้อมูลกรอกไม่ครบถ้วน");
  }

  if (user_name !== req.session.user.name) {
    errorFlag = true;
    req.flash("errorMessages", "ชื่อ-สกุลไม่ถูกต้อง");
  }
  
  db.query("SELECT password FROM user WHERE user_id = ?", [req.session.user.id], (err, results) => {
    if (err) return next(err);

    if (!bcrypt.compareSync(password, results[0].password)) {
      errorFlag = true;
      req.flash("errorMessages", "รหัสผ่านปัจจุบันไม่ถูกต้อง");
    }

    db.query(
      "SELECT COUNT(*) AS reservation_count FROM reservation WHERE user_id = ? AND datetime >= ?",
      [req.session.user.id, Date.now()],
      (err, r) => {
        if (err) return next(err);

        if (r[0].reservation_count > 0) {
          errorFlag = true;
          req.flash("errorMessages", "กรุณายกเลิกการจองก่อนปิดบัญชี");
        }

        if (errorFlag)
          return res.redirect("/dashboard");
      
        db.execute("DELETE FROM user WHERE user_id = ?", [req.session.user.id], (err) => {
          if (err) return next(err);
        
          return res.redirect("/logout");
        });
      }
    );
  });
});

module.exports = router;