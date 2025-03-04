const express = require("express");
const path = require("path");
const port = 3000;
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

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ตัว show แค่เช็คว่ามีค่ามาแล้วจริง ADMIN เท่านั้นที่ควรดูได้
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
                        facilities: facilities 
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
                facilities: facilities
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
                            reviews: reviews // ส่งข้อมูล reviews พร้อม User_Name ไปยัง template
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

app.listen(port, () => {
    console.log(`Starting node.js at port ${port}`);
  });