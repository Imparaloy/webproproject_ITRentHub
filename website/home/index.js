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
let db = new sqlite3.Database('itrentalhub_null.db', (err) => {    
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
  });

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

// <<<<<<<<<<<<<<<< โค้ดจาก login <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
app.get("/", (req, res) => {
  res.send("Hello! REST API N");
});

app.get('/register', function (req, res) {
    res.render("register", { message: null, formdata: null });
});

app.get('/login', function (req, res) {
    res.render("login", { message: null, formdata: null });
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
app.get('/protected', (req, res) => {
  if (req.session.user) { //ใช้เพื่อเช็คว่า login แล้ว
    res.send(`Welcome ${req.session.roles}, ${req.session.user.User_Name}! This is a protected route.`);
  } else {
    res.send('Please log in.');
  }
});
// ====== END OF WHAT YOU SHOULD DELETE ================}
// >>>>>>>>>>>>>>>>>> จบโค้ดจาก login >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.get('/write_review', function (req, res) {
    if (req.query.Rental_ID && req.session.user) {
        const query = `SELECT * FROM rental_data WHERE Rental_ID = ?`;
        db.all(query, [req.query.Rental_ID], (err, rows) => {
            if (err) {
                console.log(err.message);
            } else {
                res.render('review', { rental: rows[0], user: req.session.user});
            }
        });
      } else {
        res.redirect("login");
      }
    // res.render('review');
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
                    res.render('home', {
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
            res.render('Apartment', {
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

                        res.render("Show_data", { 
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
// >>>>>>>>>>>>>>>>> จบโค้ด regis_login >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


app.listen(port, () => {
    console.log(`Starting node.js at port ${port}`);
  });