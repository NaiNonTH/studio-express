var express = require("express");
var router = express.Router();

var bcrypt = require("bcrypt");

var db = require("../db");
const { checkAuthToSkipLogin } = require("../middlewares/auth");

router.get("/", function (req, res) {
  res.redirect("/login");
});

router.get("/login", checkAuthToSkipLogin, function(req, res) {
  let context = {
    title: "Sign In"
  };
  
  let errorMessage;
  if (errorMessage = req.flash("errorMessage")[0]) {
    context.errorMessage = errorMessage;
  }

  return res.render("login", context);
});

router.post("/login", checkAuthToSkipLogin, function (req, res, next) {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM user WHERE email = ?",
    [email, password],
    (err, results) => {
      if (err) return next(err);

      const user = results[0];

      if (!user)
        req.flash("errorMessage", "ไม่พบผู้ใช้ที่มีอีเมลดังกล่าว");
      else if (bcrypt.compareSync(password, user.password)) // สำเร็จ
        req.session.user = {
          name: user.user_name,
          email: user.email,
          role: user.role,
        };
      else
        req.flash("errorMessage", "รหัสผ่านไม่ถูกต้อง");
      
      return res.redirect("/login");
    },
  );
});

router.get("/register", function (req, res) {
  const context = {
    title: "Register",
    registered: (req.flash("registered")[0] === "1"),
    user_name: req.flash("user_name")[0] || "",
    email: req.flash("email")[0] || "",
    errorMessages: req.flash("errorMessages")
  };

  return res.render("register", context);
});

router.post("/register", function (req, res, next) {
  const { user_name, email, password, confirm_password } = req.body;

  let errorFlag = false;

  if (!user_name || !email || !password) {
    errorFlag = true;
    req.flash("errorMessages", "ข้อมูลกรอกไม่ครบถ้วน");
  }

  if (password.length < 8) {
    errorFlag = true;
    req.flash("errorMessages", "รหัสผ่านน้อยกว่า 8 ตัวอักษร");
    req.flash("user_name", user_name);
    req.flash("email", email);
  }

  if (password !== confirm_password) {
    errorFlag = true;
    req.flash("errorMessages", "รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    req.flash("user_name", user_name);
    req.flash("email", email);
  }

  if (errorFlag)
    return res.redirect("/register");

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.execute(
    "INSERT INTO user (user_name, email, password) VALUES (?, ?, ?)",
    [user_name, email, hashedPassword],
    (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          errorFlag = true;
          req.flash("errorMessages", "มีผู้ใช้อีเมลนี้แล้ว");
          req.flash("user_name", user_name);
        }
        else
          return next(err);
      }

      if (!errorFlag)
        req.flash("registered", "1");

      return res.redirect("/register");
    },
  );
});

router.get("/logout", function(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed");

    return res.redirect("/login");
  });
});

module.exports = router;
