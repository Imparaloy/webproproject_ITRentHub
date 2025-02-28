const express = require("express");
const path = require("path");
const port = 3000;
const bcrypt = require("bcryptjs"); // ใช้ hash รหัส
const bodyParser = require("body-parser"); // ใช้สำหรับส่งข้อมูลไป post
const sqlite3 = require('sqlite3').verbose();

// Creating the Express server
const app = express();

// Connect to SQLite database
let db = new sqlite3.Database('itrentalhub.db', (err) => {    
  if (err) {
      return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

app.use(express.static('public'));
app.set('view engine', 'ejs');

// Middleware ใช้สำหรับส่งข้อมูลไป post
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//---------------โซนส่งไปหน้าต่างๆ------------------------
// เริ่ม จะส่งไป login
app.get("/", (req, res) => {
  res.send("Hello! REST API N");
});

app.get('/register', function (req, res) {
    res.render("register", { message: null, formdata: null });
});

app.get('/register_owner', function (req, res) {
  res.render("register_owner", { message: null, formdata: null });
});

app.get('/login', function (req, res) {
  res.render("login", { message: null, formdata: null });
});

app.get('/login_owner', function (req, res) {
res.render("login_owner", { message: null, formdata: null });
});

// ตัว show แค่เช็คว่ามีค่ามาแล้วจริง
app.get('/show', function (req, res) {
  const query = 'SELECT * FROM account';
  // all มีผลกลับมา run ไม่มีผลกลับมา
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
  //   console.log(rows);
    res.render('show', { data : rows });
  });
});

//-------------โซนทำงาน Backend------------------------
//Insert Normal User to DB
app.post('/register', function (req, res) {
    let formdata = {
        username: req.body.username,
        password: req.body.password,
        cpassword: req.body.cpassword,
        email: req.body.email,
        phone: req.body.phone,
        roles: req.body.roles
    };
    console.log(formdata);

    if (formdata.password !== formdata.cpassword) {
      // ถ้ารหัส กับ ตัวเช็คไม่ตรงกันให้ส่งไปพิมพ์ใหม่
      return res.render("register", { message: "Passwords do not match!", formdata });
    }

    let checkSql = `SELECT * FROM account WHERE User_Name = ? OR Email = ?`;

    db.get(checkSql, [formdata.username, formdata.email], (err, row) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Internal Server Error"); // Return server error
        }

        if (row) {
            // If a user with the same username or email is found go back to register
            return res.render("register", { message: "Username or Email already exists!", formdata });

        }

        bcrypt.hash(formdata.password, 10, (err, hashedPassword) => { // hash password
            if (err) throw err;
            
            let sql = `INSERT INTO account (User_Name, Email, Password, Phone_Number, Roles)
            VALUES (?, ?, ?, ?, ?)`;
        
            db.run(sql, [formdata.username, formdata.email, hashedPassword, formdata.phone, formdata.roles], function (err, result) {
                if (err) throw err;
                console.log("a record inserted");
                res.redirect('show');
            });
        });
    });
});

// Insert Owner data to DB
app.post('/register_owner', function (req, res) {
  let formdata = {
      username: req.body.username,
      password: req.body.password,
      cpassword: req.body.cpassword,
      email: req.body.email,
      phone: req.body.phone,
      roles: req.body.roles
  };
  console.log(formdata);

  if (formdata.password !== formdata.cpassword) {
    // ถ้ารหัส กับ ตัวเช็คไม่ตรงกันให้ส่งไปพิมพ์ใหม่
    return res.render("register_owner", { message: "Passwords do not match!", formdata });
  }

  let checkSql = `SELECT * FROM account WHERE User_Name = ? OR Email = ?`;

  db.get(checkSql, [formdata.username, formdata.email], (err, row) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Internal Server Error"); // Return server error
      }

      if (row) {
          // If a user with the same username or email is found go back to register_owner
          return res.render("register_owner", { message: "Username or Email already exists!", formdata });

      }

      bcrypt.hash(formdata.password, 10, (err, hashedPassword) => { // hash password
          if (err) throw err;
          
          let sql = `INSERT INTO account (User_Name, Email, Password, Phone_Number, Roles)
          VALUES (?, ?, ?, ?, ?)`;
      
          db.run(sql, [formdata.username, formdata.email, hashedPassword, formdata.phone, formdata.roles], function (err, result) {
              if (err) throw err;
              console.log("a record inserted");
              res.redirect('show');
          });
      });
  });
});


//Login Normal User
app.post("/signin", (req, res) => {
    const { login, password } = req.body;

    // Query user by username OR email
    const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
    conn.query(sql, [login, login], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.render("signin", { message: "ไม่พบบัญชีผู้ใช้" });
        }

        // Check password
        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;

            if (!isMatch) {
                return res.render("signin", { message: "รหัสผ่านไม่ถูกต้อง" });
            }

            console.log("Login successful!");
            res.redirect('/show');
        });
    });
});


app.listen(port, () => {
  console.log(`Starting node.js at port ${port}`);
});