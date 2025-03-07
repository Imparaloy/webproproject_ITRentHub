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

// <<<<<<<<<<<<<<<<<<<<<<<<<Start Home File<<<<<<<<<<<<<<<<<<<<<<<<<
// static resourse & templating engine
app.use(express.static('public'));
// Set EJS as templating engine
app.set('view engine', 'ejs');

// Middleware ใช้สำหรับส่งข้อมูลไป post
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/uploads", express.static("uploads"));

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

// <<<<<<<<<<<<<<<< โค้ดจาก login <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
app.get("/", (req, res) => {
  res.send("Hello! REST API N");
});

app.get('/register', function (req, res) {
    res.render("register/register", { message: null, formdata: null });
});

app.get('/register_owner', function (req, res) {
  res.render("register/register_owner", { message: null, formdata: null });
});

app.get('/login', function (req, res) {
    res.render("login/login", { message: null, formdata: null });
});

app.get('/login_owner', function (req, res) {
  res.render("login/login_owner", { message: null, formdata: null });
  });

app.get('/reset_password', function (req, res) {
    let loginValue = req.query.login || '';
    let rolesValue = req.query.roles;
    if (loginValue == '') {
      if (rolesValue == "owner") {
        return res.render("login/login_owner", { message: "โปรดใส่ชื่อผู้ใช้หรืออีเมลก่อน", formdata: null });
      } else {
        return res.render("login/login", { message: "โปรดใส่ชื่อผู้ใช้หรืออีเมลก่อน", formdata: null });
      }
    }
    res.render("login/forgetpw", { message: null, formdata: { login: loginValue, roles: rolesValue } });
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
      res.render('owner/show_own_rental', { data : rows, owner : owner });
    });
  }
});
// ====== END OF WHAT YOU SHOULD DELETE ================}
// >>>>>>>>>>>>>>>>>> จบโค้ด login เก่า >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.get('/write_review', function (req, res) {
    if (req.query.Rental_ID && req.session.user) {
        const query = `SELECT * FROM rental_data WHERE Rental_ID = ?`;
        db.all(query, [req.query.Rental_ID], (err, rows) => {
            if (err) {
                console.log(err.message);
            } else {
                res.render('user/review', { rental: rows[0], user: req.session.user});
            }
        });
      } else {
        res.render("login/login", { message: "โปรดเข้าระบบก่อนเขียนรีวิว", formdata: null });
      }
});

app.get('/home', function (req, res) {
    const query = 'SELECT * FROM rental_data';
    const query2 = `
        SELECT r.Rental_ID, r.Rental_Name, r.Photo, rp.Rental_price, AVG(rv.Rating) AS avg_Rating
        FROM rental_data r
        JOIN rental_price rp ON r.Rental_ID = rp.Rental_ID
        JOIN review rv ON r.Rental_ID = rv.Rental_ID
        GROUP BY r.Rental_ID, r.Rental_Name, r.Photo, rp.Rental_price
        ORDER BY avg_rating DESC
        LIMIT 4;
    `; // เลือก 4 อันดับคะแนนรีวิวสูงสุด
    const query3 = `
        SELECT r.Rental_ID, r.Rental_Name, r.Photo, rp.Rental_price, AVG(rv.Rating) AS avg_Rating
        FROM rental_data r
        JOIN rental_price rp ON r.Rental_ID = rp.Rental_ID
        JOIN review rv ON r.Rental_ID = rv.Rental_ID
        JOIN facility f ON r.Rental_ID = f.Rental_ID
        WHERE f.Pets = 1
        GROUP BY r.Rental_ID, r.Rental_Name, r.Photo, rp.Rental_price
        ORDER BY avg_Rating DESC
        LIMIT 4;
    `; // เลือก 4 อันดับคะแนนรีวิวสูงสุด และเลี้ยงสัตว์ได้
    const query4 = `
    SELECT name, name AS display_name  -- Use 'name' instead of 'column_name'
    FROM pragma_table_info('facility')
    WHERE name NOT IN ('Rental_ID')
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err.message);
        }
        db.all(query2, (err, topRatedRentals) => {
            if (err) {
                console.log(err.message);
            }
            db.all(query3, (err, topRatedPetrentals) => {
                if (err) {
                    console.log(err.message);
                }
                db.all(query4, (err, facilities) => {
                    if (err) {
                        console.log(err.message);
                    }
                    // Make sure you are passing 'facilities' here:
                    res.render('user/home', {
                        data: rows,
                        topRatedRentals: topRatedRentals,
                        topRatedPetrentals: topRatedPetrentals,
                        facilities: facilities,
                        user: req.session.user //เก็บ login session
                    });
                });
            });
        });
    });
});

app.get('/Apartment', function (req, res) {
    const query = `
        SELECT r.*, rp.Rental_price
        FROM rental_data r
        JOIN rental_price rp ON r.Rental_ID = rp.Rental_ID
    `;
    const query4 = `
        SELECT name, name AS display_name
        FROM pragma_table_info('facility')
        WHERE name NOT IN ('Rental_ID')
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err.message);
        }
        db.all(query4, (err, facilities) => {
            if (err) {
                console.log(err.message);
            }
            res.render('user/Apartment', {
                data: rows,
                facilities: facilities,
                user: req.session.user //เก็บ login session
            });
        });
    });
});

  app.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    const facilities = req.query.facilities;
    let sql = `
        SELECT r.Rental_ID, r.Rental_Name, r.Photo, rp.Rental_price
        FROM rental_data r
        JOIN rental_price rp ON r.Rental_ID = rp.Rental_ID
        LEFT JOIN facility f ON r.Rental_ID = f.Rental_ID
        WHERE r.Rental_Name LIKE '%${searchTerm}%'
    `;

    if (facilities) {
        const facilityList = facilities.split(',');
        facilityList.forEach(facility => {
            sql += ` AND f.${facility} = 1`;
        });
    }

    db.all(sql, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/Show_data', function (req, res) {
    let rentalId = req.query.Rental_ID;

    // Query หลักสำหรับข้อมูล rental, price, review, facility
    let mainSql = `
        SELECT * FROM rental_data rd
        LEFT JOIN rental_price rp ON rd.Rental_ID = rp.Rental_ID
        LEFT JOIN review rv ON rd.Rental_ID = rv.Rental_ID
        LEFT JOIN facility fa ON rd.Rental_ID = fa.Rental_ID
        WHERE rd.Rental_ID = ${rentalId}
    `;

    // Query สำหรับข้อมูล room_data
    let roomSql = `
        SELECT * FROM room_data rm
        WHERE rm.Rental_ID = ${rentalId}
    `;

    db.all(mainSql, (err, mainRows) => {
        if (err) {
            console.log(err.message);
            res.status(500).send("Database error!");
            return;
        }

        db.all(roomSql, (err, roomRows) => {
            if (err) {
                console.log(err.message);
                res.status(500).send("Database error!");
                return;
            }

            // ดึงข้อมูล facility
            let facilitySql = `SELECT * FROM facility WHERE Rental_ID = ${rentalId}`;
            db.get(facilitySql, (err, facilityRow) => {
                if (err) {
                    console.log(err.message);
                    res.status(500).send("Database error!");
                    return;
                }

                // ดึงค่าเฉลี่ยของ Rating
                let averageRatingSql = `
                    SELECT AVG(Rating) AS averageRating
                    FROM review
                    WHERE Rental_ID = ${rentalId}
                `;
                db.get(averageRatingSql, (err, averageRatingRow) => {
                    if (err) {
                        console.log(err.message);
                        res.status(500).send("Database error!");
                        return;
                    }

                    // ดึงข้อมูล reviews พร้อม User_Name
                    let reviewsSql = `
                        SELECT r.*, a.User_Name
                        FROM review r
                        LEFT JOIN account a ON r.User_ID = a.User_ID
                        WHERE r.Rental_ID = ${rentalId}
                    `;
                    db.all(reviewsSql, (err, reviews) => {
                        if (err) {
                            console.log(err.message);
                            res.status(500).send("Database error!");
                            return;
                        }

                        const description = mainRows[0].Description.replace(/\n/g, '<br>');
                        let images = mainRows[0].Gallery ? mainRows[0].Gallery.split(",") : [];

                        res.render("user/Show_data", { 
                            data: mainRows, 
                            images: images, 
                            description: description, 
                            rooms: roomRows,
                            facility: facilityRow,
                            averageRating: averageRatingRow.averageRating ? averageRatingRow.averageRating.toFixed(1) : 'N/A',
                            reviews: reviews, // ส่งข้อมูล reviews พร้อม User_Name ไปยัง template
                            user: req.session.user, //เก็บ login session
                            rentalId: req.query.Rental_ID
                        });

                        console.log("Main Rows:", mainRows);
                        console.log("Room Rows:", roomRows);
                        console.log("Facility Row:", facilityRow);
                        console.log("Average Rating:", averageRatingRow);
                        console.log("Reviews:", reviews);
                    });
                });
            });
        });
    });
});

//Write Review
app.post('/write_review', function (req, res) {
    let formdata = {
        rentalId: req.body.rentalId,
        userId: req.session.user.User_ID,
        rating: req.body.rating,
        comment: req.body.review
    };
    // console.log(formdata);
    let checkSql = `SELECT * FROM review WHERE Rental_ID = ? AND User_ID = ?`;

    db.get(checkSql, [formdata.rentalId, formdata.userId], (err, row) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Internal Server Error"); // Return server error
        }
        if (row) {
            let updateSql = `UPDATE review SET Rating = ?, Comment = ? WHERE (Rental_ID = ? AND User_ID = ?)`;
            db.run(updateSql, [formdata.rating, formdata.comment, formdata.rentalId, formdata.userId], (err, row) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).send("Internal Server Error"); // Return server error
                } else {
                    console.log("a record inserted");
                    res.redirect('home');
                }
            });
        } else {
            let sql = `INSERT INTO review (Rental_ID, User_ID, Rating, Comment) VALUES (?, ?, ?, ?)`;
            db.run(sql, [formdata.rentalId, formdata.userId, formdata.rating, formdata.comment], (err, row) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).send("Internal Server Error"); // Return server error
                } else {
                    console.log("a record inserted");
                    res.redirect('home');
                }
            });
        }
    });
});

//>>>>>>>>>>>>>>>>>>>>>>> Backend regis_login >>>>>>>>>>>>>>>>>>>>>>>>>
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
      return res.render("register/register", { message: "รหัสผ่านไม่ตรงกัน!", formdata });
    }

    let checkSql = `SELECT * FROM account WHERE User_Name = ? OR Email = ?`;

    db.get(checkSql, [formdata.username, formdata.email], (err, row) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Internal Server Error"); // Return server error
        }

        if (row) {
            // If a user with the same username or email is found go back to register
            return res.render("register/register", { message: "มีชื่อผู้ใช้หรืออีเมลลงทะเบียนไว้ก่อนแล้ว!", formdata });

        }

        bcrypt.hash(formdata.password, 10, (err, hashedPassword) => { // hash password
            if (err) throw err;
            
            let sql = `INSERT INTO account (User_Name, Email, Password, Phone_Number, Roles)
            VALUES (?, ?, ?, ?, ?)`;
        
            db.run(sql, [formdata.username, formdata.email, hashedPassword, formdata.phone, formdata.roles], function (err, result) {
                if (err) throw err;
                console.log("a record inserted");
                res.redirect('login');
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
    return res.render("register/register_owner", { message: "รหัสผ่านไม่ตรงกัน!", formdata });
  }

  let checkSql = `SELECT * FROM account WHERE User_Name = ? OR Email = ?`;

  db.get(checkSql, [formdata.username, formdata.email], (err, row) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Internal Server Error"); // Return server error
      }

      if (row) {
          // If a user with the same username or email is found go back to register_owner
          return res.render("register/register_owner", { message: "มีชื่อผู้ใช้หรืออีเมลลงทะเบียนไว้ก่อนแล้ว!", formdata });

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
      return res.render("login/login", { message: "ฐานข้อมูลขัดข้อง", formdata: { login } });
    }

    if (!user) {
      return res.render("login/login", { message: "ไม่พบบัญชีผู้เช่า", formdata: { login } });
    }

    try {
      if (await bcrypt.compare(password, user.Password)) {
        req.session.user = user;
        req.session.roles = user.Roles; // Store roles in session
        if (rememberme) {
          // Set a long-lived cookie if "rememberme" is checked
          req.session.cookie.maxAge = 1 * 24 * 60 * 60 * 1000; // 1 days
        }
        res.redirect('/home'); // Redirect to protected route
      } else {
        res.render('login/login', { message: 'รหัสผ่านไม่ถูกต้อง', formdata: { login } }); // Render login.ejs with error
      }
    } catch (bcryptErr) {
      console.error(bcryptErr);
      return res.render("login/login", { message: "การยืนยันตัวตนขัดข้อง", formdata: { login } });
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
      return res.render("login/login_owner", { message: "ฐานข้อมูลขัดข้อง", formdata: { login } });
    }

    if (!owner) {
      return res.render("login/login_owner", { message: "ไม่พบบัญชีเจ้าของหอพัก", formdata: { login } });
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
        res.render("login/login_owner", { message: 'รหัสผ่านไม่ถูกต้อง', formdata: { login } }); // Render login.ejs with error
      }
    } catch (bcryptErr) {
      console.error(bcryptErr);
      return res.render("login/login_owner", { message: "การยืนยันตัวตนขัดข้อง", formdata: { login } });
    }
  });
});

// Reset password
app.post('/reset_password', async function (req, res) {
  let { login, roles, password, cpassword } = req.body;

  if (password !== cpassword) {
    return res.render("login/forgetpw", { message: "รหัสผ่านไม่ตรงกัน!", formdata: { login, roles } });
  }

  let checkSql = `SELECT * FROM account WHERE User_Name = ? OR Email = ?`;
  db.get(checkSql, [login, login], async (err, row) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Internal Server Error");
      }

      if (!row) {
        return res.render(`login/login${roles === 'owner' ? '_owner' : ''}`,
          { message: "ไม่มีบัญชีชื่อผู้ใช้หรืออีเมลนี้", formdata: { login } });
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

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Logout failed');
    } else {
      res.redirect('/home');
    }
  });
});
// >>>>>>>>>>>>>>>>> จบโค้ด regis_login >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// >>>>>>>>>>>>>>>>>>>>>>>>>End Home File>>>>>>>>>>>>>>>>>>>>>>>>>

// <<<<<<<<<<<<<<<<<<<<<<<<<Start Add Domitory File<<<<<<<<<<<<<<<<<<<<<<<<<
// Upload img to uploads folder
const upload = multer({ storage: storage }).fields([
  { name: "Photo", maxCount: 1 }, // รับได้แค่ 1 รูป
  { name: "Gallery", maxCount: 50 }, // รับได้สูงสุด 50 รูป
]);

// >>>>>>>>>>>>>>>> 1. Path >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


// ตัว show แค่เช็คว่ามีค่ามาแล้วจริง ADMIN เท่านั้นที่ควรดูได้
app.get('/show', function (req, res) {
  const query = 'SELECT * FROM account';
  // all มีผลกลับมา run ไม่มีผลกลับมา
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
  //   console.log(rows);
    res.render('admin/show_account', { data : rows });
  });
});


//-------------โซนทำงาน Backend------------------------
// CODE Sunja
app.get('/select_data', function (req, res) {
    res.render('owner/select_dormitory', { owner: req.session.user });
});

app.get('/select_dorm', function (req, res) {
    res.render('owner/select_dorm', { owner: req.session.user });
});

app.get('/view_dorm', function (req, res) { //ไม่ได้ใช้
    res.render('owner/view_dorm', { owner: req.session.user });
});

app.get('/chat_dorm', function (req, res) {
    res.render('owner/chat_dorm', { owner: req.session.user });
});

app.get('/reserve_dorm', function (req, res) {
    res.render('owner/reserve_dorm', { owner: req.session.user });
});

// Start Adding Dorm to DB
app.get('/add_dorm', function (req, res) {
    res.render('owner/add_dorm', { owner: req.session.user });
});

app.get('/insert_DormType', (req, res) => {
    req.session.Rental_Type = req.query.Rental_Type;
    req.session.save();
    console.log("Rental Type:", req.session.Rental_Type);
    res.render('owner/add_dormdata', { owner: req.session.user })
 });

app.get('/add_dormdata', function (req, res) {
    res.render('owner/add_dormdata', { owner: req.session.user });
});

app.get('/fill_dormdata', function (req, res) {
    res.render('owner/fill_dormdata', { owner: req.session.user });
});


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
    res.render('owner/fill_price', { owner: req.session.user });
});

app.get('/insert_DormPrice', (req, res) => {
    const query = `INSERT INTO rental_price (Rental_ID, Advance_payment, Electric_price, 
    Water_price, Service_price, Phone_price, Internet_price)
    VALUES( ?, ?, ?, ?, ?, ?, ?); `;

    const price = [
      req.session.rental_id,
      req.query.Advance_payment || 0,
      req.query.Electric_price || 0,
      req.query.Water_price || 0,
      req.query.Service_price || 0,
      req.query.Phone_price || 0,
      req.query.Internet_price || 0
    ];

    db.run(query, price, (err, rows) => {
        if (err) {
            console.log("Price Error rentalid=" + req.session.rental_id);
            console.log(err.message);
            console.log("Please Insert DormData First");
        }
        console.log("Successfully Insert PRICE");
        res.redirect("/add_dormdata");
    });
});

app.get('/fill_dormfac', function (req, res) {
    res.render('owner/fill_dormfac', { owner: req.session.user });
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
      res.render('owner/fill_roomdata', { owner: req.session.user, data : rows });
    });
});

app.get('/add_roomdata', function (req, res) {
  res.render('owner/add_roomdata', { owner: req.session.user });
});

app.get('/insert_RoomData', (req, res) => {
    const query = `INSERT INTO room_data (Rental_ID, Room_Name, Room_Type, Size, 
    Monthly_Rental, Room_Status, Number_Available_Room)
    VALUES(${req.session.rental_id}, '${req.query.Room_Name}', '${req.query.Room_Type}', ${req.query.Size}
    , ${req.query.Monthly_Rental}, ${req.query.Room_Status}, ${req.query.Number_Available_Room});`;
    db.run(query, (err, rows) => {
        if (err) {
          console.log("Room Error rentalid=" + req.session.rental_id);
          console.log(err.message);
          console.log("Please Insert DormData First");
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
      // คำนวณค่า min และ max
      const minTransformed = row.min_value;
      const maxTransformed = row.max_value;

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

//เปิดหน้า view_dormitory ถ้า login เป็น owner
app.get('/view_dormitory', (req, res) => {
  if (req.session.user && req.session.roles == "owner") {
    const rental_id = req.query.rental_id; //รับ "/view_dormitory?rental_id=<%= item.Rental_ID %>" จาก show_own_rental
    if (!rental_id) { //ถ้าไม่มี rental_id ให้ส่งกลับไปหน้าเลือกดูหอพัก
      return res.redirect('show_own_rental');
    }
    const sql = `SELECT * FROM review JOIN account USING (User_ID) WHERE Rental_ID = ?`
    db.all(sql, [rental_id], (err, reviews) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error Can't Get Review");
      }
      db.all('SELECT AVG(Rating) AS Rating FROM review WHERE Rental_ID = ?', [rental_id], (err, rating) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Internal Server Error Can't Get AVG(Rating)");
        }
        db.all('SELECT Rental_Name FROM rental_data WHERE Rental_ID = ?', [rental_id], (err, name) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Internal Server Error Can't Get AVG(Rating)");
          }
          res.render("owner/view_dormitory", { owner: req.session.user, rental: name[0], reviews: reviews, avg_rate: rating});
        });
      });
    });
  } else {
    res.send('Please log in AS OWNER.');
  }
});
// >>>>>>>>>>>>>>>>>>>>>>>>>End Add Domitory File>>>>>>>>>>>>>>>>>>>>>>>>>

// >>>>>>>>>>>>>>>>>>>>>>>>>Start Reserve File>>>>>>>>>>>>>>>>>>>>>>>>>
// แสดงหน้า Reserve Date
app.get('/reserve', (req, res) => {
  if (req.session.user) {
    res.render('user/reserve', {username: req.session.user} );
  } else {
    res.render("login/login", { message: "โปรดเข้าระบบก่อนจะจองห้อง", formdata: null });
  }
  
});

// เพิ่มข้อมูลการจองลงในฐานข้อมูล
app.post('/reserve', (req, res) => {
  const { rental_id, name, phone, date, time } = req.body;
  
  db.run(`INSERT INTO reservations (Rental_ID, Name, Phone, Date, Time) VALUES (?, ?, ?, ?, ?)`,
      [rental_id, name, phone, date, time],
      function (err) {
          if (err) {
              console.error(err.message);
              return res.status(500).json({ error: 'Database error' });
          }
          res.json({ success: true, message: 'เพิ่มการจองเรียบร้อยแล้ว' });
      });
});

// app.get('/reserve', (req, res) => {
//   res.render('user/reserve', { script: "js/reserve.js" });
// });

// >>>>>>>>>>>>>>>>>>>>>>>>>End Reserve File>>>>>>>>>>>>>>>>>>>>>>>>>

// >>>>>>>>>>>>>>>>>>>>>>>>>Start AdminPanle File>>>>>>>>>>>>>>>>>>>>>>>>>

// admin
app.get("/admin", function (req, res) {
  let sql = `
  SELECT Rental_ID AS id, Rental_Name AS name, Type AS type, Approved AS status
  FROM rental_data`;

  const username = req.session.user;
  
  db.all(sql, [], (err, rows) => {
      if (err) {
          console.log(err.message);
          res.status(500).send("Database error!");
          return;
      }
      
      res.render("admin/adminpanel", { rentals: rows , username: username });
  });
});

app.post("/update-status", (req, res) => {
  const { rentalId, status } = req.body;
  
  let sql = `UPDATE rental_data SET Approved = ? WHERE Rental_ID = ?`;
  db.run(sql, [status, rentalId], function (err) {
      if (err) {
          return res.status(500).send("Database update error!");
      }
      res.redirect("admin/adminpanel");
  });
});

// >>>>>>>>>>>>>>>>>>>>>>>>>End AdminPanle File>>>>>>>>>>>>>>>>>>>>>>>>>


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});