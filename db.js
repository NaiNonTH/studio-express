const mysql2 = require("mysql2");

const db = mysql2.createConnection({
  host: process.env.DATABASE_HOST || "localhost",
  port: process.env.DATABASE_PORT || 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_SCHEMA,
  dateStrings: true
});

db.connect((err) => {
  if (err) {
    console.error("❌ Failed connecting to database: " + err);
    process.exit(1);
  }
  else
    console.log("✅ Sucessfully connected to database as ID: " + db.threadId);
});

process.addListener("SIGINT", terminate);
process.addListener("SIGKILL", terminate);

function terminate() {
  db.end((err) => {
    if (err) console.error("❌ Failed closing database connection: " + err);
    else console.log("✅ Sucessfully closed database connection.");
  });

  process.exit(0);
}

module.exports = db;