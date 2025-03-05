const express = require("express");
const path = require("path");
const port = 3000;
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require("bcryptjs"); // ใช้ hash รหัส
const bodyParser = require("body-parser");
const session = require('express-session'); //ใช้ session เก็บข้อมูล cookie
const multer = require("multer");
const app = express();

// Connect to SQLite database
let db = new sqlite3.Database('itrentalhub.db', (err) => {    
  if (err) {
      return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).fields([
  { name: "Photo", maxCount: 1 }, // รับได้แค่ 1 รูป
  { name: "Gallery", maxCount: 6 }, // รับได้สูงสุด 5 รูป
]);
// static resourse & templating engine
app.use(express.static('public'));
// Set EJS as templating engine
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

// Starting the server
app.listen(port, () => {
   console.log("Server started.");
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

// ตัว show แค่เช็คว่ามีค่ามาแล้วจริง ADMIN เท่านั้นที่ควรดูได้
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

// {==== JUST FOR TEST DELETE WHEN GO TO REAL USE ==========================================
// เช็คว่า Login สำเร็จไหม
app.get('/protected', (req, res) => {
  if (req.session.user) { //ใช้เพื่อเช็คว่า login แล้ว
    res.send(`Welcome ${req.session.roles}, ${req.session.user.User_Name}! This is a protected route.`);
  } else {
    res.send('Please log in.');
  }
});

app.get('/protected_owner', (req, res) => {
  if (req.session.user && req.session.roles == "owner") {
    res.send(`Welcome OWNER prepare to get your RENT, ${req.session.user.User_Name}! This is a protected route.`);
  } else {
    res.send('Please log in AS OWNER.');
  }
});
// ====== END OF WHAT YOU SHOULD DELETE ================}

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
    // console.log(formdata);

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


//Login Normal User
app.post('/login', async (req, res) => {
  const { login, password, rememberme } = req.body;
  const sql = "SELECT * FROM account WHERE (User_Name = ? OR Email = ?) AND Roles = 'user'";
  db.get(sql, [login, login], async (err, user) => { 
    if (err) {
      console.error(err);
      return res.render("login", { message: "Database error", formdata: { login } });
    }

    if (!user) {
      return res.render("login", { message: "Renter account not found ", formdata: { login } });
    }

    try {
      if (await bcrypt.compare(password, user.Password)) {
        req.session.user = user;
        req.session.roles = user.Roles; // Store roles in session
        if (rememberme) {
          // Set a long-lived cookie if "rememberme" is checked
          req.session.cookie.maxAge = 1 * 24 * 60 * 60 * 1000; // 1 days
        }
        res.redirect('/protected'); // Redirect to protected route
      } else {
        res.render('login', { message: 'Password incorrect', formdata: { login } }); // Render login.ejs with error
      }
    } catch (bcryptErr) {
      console.error(bcryptErr);
      return res.render("login", { message: "Authentication error", formdata: { login } });
    }
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
app.get('/head', function (req, res) {
    res.render('head');
});
app.get('/select_data', function (req, res) {
    res.render('select_dorm');
});

app.get('/select_dorm', function (req, res) {
    res.render('select_dorm');
});

app.get('/view_dorm', function (req, res) {
    res.render('view_dorm');
});

app.get('/chat_dorm', function (req, res) {
    res.render('chat_dorm');
});

app.get('/reserve_dorm', function (req, res) {
    res.render('reserve_dorm');
});

app.get('/add_dorm', function (req, res) {
    res.render('add_dorm');
});

app.get('/insert_DormType', (req, res) => {
    req.session.Rental_Type = req.query.Rental_Type;
    req.session.save();
    console.log("Rental Type:", req.session.Rental_Type);
    res.render("add_dormdata")
 });

app.get('/add_dormdata', function (req, res) {
    res.render('add_dormdata');
});

app.get('/fill_dormdata', function (req, res) {
    res.render('fill_dormdata');
});
app.use("/uploads", express.static("uploads"));

app.post("/insert_DormData", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: err.message });
    }

    // ดึงข้อมูลจาก req.body
    const { Rental_Name, Gender, Description, Phone_number, Line_ID, Location } = req.body;
    const Rental_Type = req.session.Rental_Type;
    const Owner_ID = req.session.user.User_ID;

    // ตรวจสอบไฟล์ที่อัปโหลด
    const photoPath = req.files["Photo"] ? req.files["Photo"][0].path : "";
    const galleryPaths = req.files["Gallery"] ? req.files["Gallery"].map((file) => file.path).join(",") : "";

    // สร้าง Query SQL
    const query = `INSERT INTO rental_data 
      (Owner_ID, Rental_Name, Type, Gender, Description, Phone_number, Line_ID, Location, Photo, Gallery) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [Owner_ID, Rental_Name, Rental_Type, Gender, Description, Phone_number, Line_ID, Location, photoPath, galleryPaths], (err) => {
      if (err) {
        console.log(err.message);
        return res.status(500).json({ error: "Database error" });
      }
      db.get("SELECT last_insert_rowid() AS Rental_ID", (err, row) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Database error");
        }
    
        if (!row) {
          return res.status(404).send("No rental data found");
        }
    
        req.session.rental_id = row.Rental_ID;
        req.session.save();
        console.log("Rental ID set in session:", req.session.rental_id);

      });
      res.redirect("/add_dormdata");
    });
  });
});

app.get('/fill_price', function (req, res) {
    res.render('fill_price');
});

app.get('/insert_DormPrice', (req, res) => {
    const query = `INSERT INTO rental_price (Rental_ID, Advance_payment, Electric_price, 
    Water_price, Service_price, Phone_price, Internet_price)
    VALUES(${req.session.rental_id}, ${req.query.Advance_payment}, 
    ${req.query.Electric_price}, ${req.query.Water_price}, 
    ${req.query.Service_price}, ${req.query.Phone_price}, ${req.query.Internet_price}); `;
    db.run(query, (err, rows) => {
        if (err) {
            console.log(err.message);
            console.log("Please Insert DormData First");
        }
        res.redirect("/add_dormdata");
    });
});

app.get('/fill_dormfac', function (req, res) {
    res.render('fill_dormfac');
});

app.get('/insert_DormFac', (req, res) => {
  try {
      let facilities = JSON.parse(req.query.value || "{}"); // แปลง JSON เป็น Object

      // SQL Query (ใช้ ? เพื่อป้องกัน SQL Injection)
      const query = `INSERT INTO facility 
          (Rental_ID, Air_Conditioner, Furnished, Water_Heater
          , Fan, Refrigerator, Parking, Bicycle_Parking, Lift, Pool
          , Fitness, Security_keycard, Security_finger_print, CCTV
          , Security, In_Room_WIFI, Pets, Smoking, Laundry, Kitchen_Stove)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

      const values = [
          req.session.rental_id,  // Rental_ID (ค่าเริ่มต้น)
          facilities.Air_Conditioner || 0,
          facilities.Furnished || 0,
          facilities.Water_Heater || 0,
          facilities.Fan || 0,
          facilities.Refrigerator || 0,
          facilities.Parking || 0,
          facilities.Bicycle_Parking || 0,
          facilities.Lift || 0,
          facilities.Pool || 0,
          facilities.Fitness || 0,
          facilities.Security_keycard || 0,
          facilities.Security_finger_print || 0,
          facilities.cctv || 0,
          facilities.Security || 0,
          facilities.In_Room_WIFI || 0,
          facilities.Pets || 0,
          facilities.Smoking || 0,
          facilities.Laundry || 0,
          facilities.Kitchen_Stove || 0
      ];

      db.run(query, values, function (err) {
          if (err) {
              console.error("Error inserting data:", err.message);
              return res.status(500).send("Database error!");
          }
          res.redirect("/add_dormdata"); // Redirect หลังจากเพิ่มข้อมูล
      });

  } catch (error) {
      console.error("JSON Parsing Error:", error);
      res.status(400).send("Invalid data format");
  }
});

app.get('/fill_roomdata', function (req, res) {
  const query = `SELECT Room_Name, Room_Type, Size, Monthly_Rental, 
  Room_Status, Number_Available_Room FROM room_data 
  WHERE Rental_ID = ${req.session.rental_id}`;
    db.all(query, (err, rows) => {
      if (err) {
        console.log(err.message);
      }
      console.log(rows);
      res.render('fill_roomdata', { data : rows });
    });
});

app.get('/add_roomdata', function (req, res) {
  res.render('add_roomdata');
});

app.get('/insert_RoomData', (req, res) => {
    const query = `INSERT INTO room_data (Rental_ID, Room_Name, Room_Type, Size, 
    Monthly_Rental, Room_Status, Number_Available_Room)
    VALUES(${req.session.rental_id}, '${req.query.Room_Name}', '${req.query.Room_Type}', ${req.query.Size}
    , ${req.query.Monthly_Rental}, ${req.query.Room_Status}, ${req.query.Number_Available_Room});`;
    db.run(query, (err, rows) => {
        if (err) {
            console.log(err.message);
        }
        res.redirect("/fill_roomdata");
    });
});

app.get('/insert_RentalPrice', (req, res) => {
  db.get('SELECT MIN(Monthly_Rental) AS min_value, MAX(Monthly_Rental) AS max_value FROM room_data WHERE Rental_ID = ?'
    , [req.session.rental_id], (err, row) => {
    if (err) {
        return res.status(500).json({ error: err.message });
    }
    if (row) {
      // คำนวณค่า min และ max * 12
      const minTransformed = row.min_value * 12;
      const maxTransformed = row.max_value * 12;

      // รวมค่าเป็นข้อความ "min - max"
      const formattedText = `${minTransformed} - ${maxTransformed}`;

      db.run('UPDATE rental_price SET Rental_price = ? WHERE Rental_ID = ?',
          [formattedText, req.session.rental_id],
          function (err) {
              if (err) {
                  console.error('Error updating table_target:', err.message);
              } else {
                  console.log(`Updated table_target with value: ${formattedText}`);
                  res.redirect("/add_dormdata");
              }
          }
      );
    }  
  });
});
