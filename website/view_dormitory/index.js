const express = require("express");
const path = require("path");
const port = 3000;
const bcrypt = require("bcryptjs"); // ใช้ hash รหัส
const bodyParser = require("body-parser"); // ใช้สำหรับส่งข้อมูลไป post
const session = require('express-session'); //ใช้ session เก็บข้อมูล cookie
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


app.use(session({
  secret: 'h0pETh!slS$tOngE#ough', // Change this to a strong, random key
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1 * 60 * 60 * 1000 // 1 Hour
  },
}));

//---------------โซนส่งไปหน้าต่างๆ-ใช้โค้ดจาก regis_login ส่วนที่เพิ่มจะมีบอกเป็นพิเศษ-----------------------
// <<<<<<<<<<<<<<<< อันเก่า <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
app.get("/", (req, res) => {
  res.send("Hello! REST API N");
});

app.get('/register_owner', function (req, res) {
  res.render("register_owner", { message: null, formdata: null });
});

app.get('/login_owner', function (req, res) {
res.render("login_owner", { message: null, formdata: null });
});

app.get('/reset_password', function (req, res) {
  let loginValue = req.query.login || '';
  let rolesValue = req.query.roles;
  if (loginValue == '') {
    if (rolesValue == "owner") {
      return res.render("login_owner", { message: "Enter your Username or Email", formdata: null });
    } else {
      return res.render("login", { message: "Enter your Username or Email", formdata: null });
    }
  }
  res.render("forgetpw", { message: null, formdata: { login: loginValue, roles: rolesValue } });
});

// {==== JUST FOR TEST DELETE WHEN GO TO REAL USE ==========================================
// เช็คว่า Login สำเร็จไหม
app.get('/protected_owner', (req, res) => {
  if (req.session.user && req.session.roles == "owner") {
    res.send(`Welcome OWNER prepare to get your RENT, ${req.session.user.User_Name}! This is a protected route.`);
  } else {
    res.send('Please log in AS OWNER.');
  }
});
// ====== END OF WHAT YOU SHOULD DELETE ================}
// >>>>>>>>>>>>>>>>>> จบโค้ดเก่า >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



// ตัว show ว่า owner มีที่เช่าอะไรบ้าง ***ผมใช้แทน select_dormitory ไปก่อน***
app.get('/show_own_rental', function (req, res) {
  let owner = req.session.user //ต้องมี session (ต้อง login owner ก่อน)
  if (!owner) {
    res.send('Please log in AS OWNER.');
  } else {
    const query = 'SELECT * FROM rental_data WHERE Owner_ID = ?';
    // all มีผลกลับมา run ไม่มีผลกลับมา
    db.all(query, owner.User_ID, (err, rows) => {
      if (err) {
        console.log(err.message);
      }
    //   console.log(rows);
      res.render('show_own_rental', { data : rows, owner : owner });
    });
  }
});

//เปิดหน้า view_dormitory ถ้า login เป็น owner
app.get('/view_dormitory', (req, res) => {
  if (req.session.user && req.session.roles == "owner") {
    const rental_id = req.query.rental_id; //รับ "/view_dormitory?rental_id=<%= item.Rental_ID %>" จาก show_own_rental
    if (!rental_id) { //ถ้าไม่มี rental_id ให้ส่งกลับไปหน้าเลือกดูหอพัก
      res.redirect('show_own_rental')
    }
    db.all('SELECT * FROM review JOIN account USING (User_ID) WHERE Rental_ID = ?', [rental_id], (err, reviews) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error Can't Get Review");
      }
      db.all('SELECT AVG(Rating) AS Rating FROM review WHERE Rental_ID = ?', [rental_id], (err, rating) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Internal Server Error Can't Get AVG(Rating)");
        }
        res.render("view_dormitory", { owner: req.session.user, rental: rental_id, reviews: reviews, avg_rate: rating});
      });
    });
  } else {
    res.send('Please log in AS OWNER.');
  }
});



//-------------โซนทำงาน Backend------------------------
// <<<<<<<<<<<<<<<< อันเก่า <<<<<<<<<<<<<<<<<<<<<<<<<
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
  // console.log(formdata);

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


//Login Owner
app.post('/login_owner', async (req, res) => {
  const { login, password, rememberme } = req.body;
  const sql = "SELECT * FROM account WHERE (User_Name = ? OR Email = ?) AND Roles = 'owner'";
  db.get(sql, [login, login], async (err, owner) => {
    if (err) {
      console.error(err);
      return res.render("login_owner", { message: "Database error", formdata: { login } });
    }

    if (!owner) {
      return res.render("login_owner", { message: "Owner account not found ", formdata: { login } });
    }

    try {
      if (await bcrypt.compare(password, owner.Password)) {
        req.session.user = owner;
        req.session.roles = owner.Roles; // Store roles in session
        if (rememberme) {
          // Set a long-lived cookie if "rememberme" is checked
          req.session.cookie.maxAge = 1 * 24 * 60 * 60 * 1000; // 1 days
        }
        res.redirect('/protected_owner'); // Redirect to protected route
      } else {
        res.render("login_owner", { message: 'Password incorrect', formdata: { login } }); // Render login.ejs with error
      }
    } catch (bcryptErr) {
      console.error(bcryptErr);
      return res.render("login_owner", { message: "Authentication error", formdata: { login } });
    }
  });
});

// Reset password
app.post('/reset_password', async function (req, res) {
  let { login, roles, password, cpassword } = req.body;

  if (password !== cpassword) {
    return res.render("forgetpw", { message: "Passwords do not match!", formdata: { login, roles } });
  }

  let checkSql = `SELECT * FROM account WHERE User_Name = ? OR Email = ?`;
  db.get(checkSql, [login, login], async (err, row) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Internal Server Error");
      }

      if (!row) {
        return res.render(`login${roles === 'owner' ? '_owner' : ''}`,
          { message: "No account with this Username or Email", formdata: { login } });
      }

      let hashedPassword = await bcrypt.hash(password, 10); // Hash the new password

      let updateSql = `UPDATE account SET Password = ? WHERE (User_Name = ? OR Email = ?)`;
      db.run(updateSql, [hashedPassword, login, login], function (err) {
          if (err) {
              console.error("Database error:", err);
              return res.status(500).send("Internal Server Error");
          }

          console.log("Password updated successfully");
          res.redirect(`/login${row.Roles === 'owner' ? '_owner' : ''}`);
      });
  });
});
// >>>>>>>>>>>>>>>>>> จบโค้ดเก่า >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



// Logout
app.post('/logout', (req, res) => { 
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Logout failed');
    } else {
      res.redirect('/login_owner');
    }
  });
});



app.listen(port, () => {
  console.log(`Starting node.js at port ${port}`);
});