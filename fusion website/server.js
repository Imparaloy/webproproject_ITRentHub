const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// ตั้งค่า EJS และ Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// เชื่อมต่อฐานข้อมูล
const db = new sqlite3.Database('itrentalhub.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// สร้างตาราง reservations หากยังไม่มี
db.run(`CREATE TABLE IF NOT EXISTS reservations (
    Reservation_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Rental_ID INTEGER NOT NULL,
    Name TEXT NOT NULL,
    Phone TEXT NOT NULL,
    Date TEXT NOT NULL,
    Time TEXT NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Rental_ID) REFERENCES rental_data (Rental_ID)
)`);

// แสดงหน้า Reserve Date
app.get('/reserve', (req, res) => {
    res.render('reserve');
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
            res.json({ success: true, message: 'Reservation added successfully' });
        });
});

app.get('/reserve', (req, res) => {
    res.render('reserve', { script: "js/reserve.js" });
});


// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
