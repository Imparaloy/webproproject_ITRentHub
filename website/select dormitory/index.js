const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เชื่อมต่อกับฐานข้อมูล SQLite
const db = new sqlite3.Database(path.join(__dirname, 'itrentalhub.db'), (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to the SQLite database');
    }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ดึงข้อมูลหอพักของผู้ใช้
app.get('/dormitory', (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).send('User ID is required');
    }

    // ดึงชื่อผู้ใช้จากฐานข้อมูล
    db.get('SELECT name FROM users WHERE User_ID = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).send('Database query error');
        }

        const username = user ? user.name : 'Guest';

        // ดึงข้อมูลหอพักของผู้ใช้
        db.all('SELECT * FROM dormitory WHERE owner_id = ?', [userId], (err, dormitories) => {
            if (err) {
                return res.status(500).send('Database query error');
            }

            if (dormitories.length === 0) {
                return res.render('no_dormitory', { username });
            }

            res.render('select_dormitory', { username, dormitories });
        });
    });
});

// หน้าเลือกหอพัก (ดึงข้อมูลทั้งหมด)
app.get('/select_dormitory', (req, res) => {
    db.all('SELECT * FROM dormitory', [], (err, dormitories) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.render('select_dormitory', { username: "Guest", dormitories });
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
