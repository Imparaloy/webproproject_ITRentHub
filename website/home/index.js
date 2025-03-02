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
    // all มีผลกลับมา run ไม่มีผลกลับมา
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
    //   console.log(rows);
            res.render('home', { data : rows, topRatedRentals: topRatedRentals, topRatedPetrentals: topRatedPetrentals});
          });
       });
    });
  });

  app.get('/Show_data', function (req, res) {
    let sql = `
    SELECT * 
    FROM rental_data rd
    LEFT JOIN rental_price rp ON rd.Rental_ID = rp.Rental_ID
    LEFT JOIN review rv ON rd.Rental_ID = rv.Rental_ID
    LEFT JOIN facility fa ON rd.Rental_ID = fa.Rental_ID
    WHERE rd.Rental_ID = ${req.query.Rental_ID}
    `;
    console.log(sql);
    db.all(sql, (err, rows) => {
        if (err) {
            console.log(err.message);
            res.status(500).send("Database error!"); // เพิ่มกรณี error
            return;
        }
        if (rows && rows.length > 0 && rows[0].Photo) {  // ใช้ rows แทน result
            let images = rows[0].Gallery.split(",");
            console.log("Images:", images);
            res.render("Show_data", { data: rows, images: images });
        } else {
            console.log("No data found or Gallery column is empty.");
            console.log("Images: []");
            res.render("Show_data", { data: rows, images: [] });  // ส่ง array ว่างถ้าไม่มีข้อมูล
        }
        console.log(rows);
    });
});

app.listen(port, () => {
    console.log(`Starting node.js at port ${port}`);
  });