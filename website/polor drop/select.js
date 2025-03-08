const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const dbPath = path.join(__dirname, 'itrentalhub.db');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// >>>>>>>>>>>>>>>>>>>>>>>>>Start Reserve File>>>>>>>>>>>>>>>>>>>>>>>>>

// แสดงหน้า Reserve Date
app.get('/reserve', (req, res) => {
  const roomId = req.query.room_id; // หรือ rental_id ตามที่คุณใช้
  const username = req.session.user ? req.session.user.User_Name : 'Guest';

  // ดึงข้อมูลห้องหรือหอพักจากฐานข้อมูล
  const query = `SELECT * FROM rooms WHERE Room_ID = ?`; // หรือ rental_data
  db.get(query, [roomId], (err, room) => {
      if (err) {
          console.error(err.message);
          return res.status(500).send('Database error');
      }

      if (!room) {
          return res.status(404).send('Room not found');
      }

      // ส่งข้อมูลไปยังหน้า Reserve
      res.render('user/reserve', { 
          username: username, 
          room: room // ส่งข้อมูลห้องผ่านตัวแปร room
      });
  });
});

app.post('/reserve', (req, res) => {
  const { room_id, name, phone, date, time } = req.body;

  // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
  if (!req.session.user) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนจอง' });
  }

  const userId = req.session.user.User_ID;

  // เพิ่มข้อมูลการจองลงในฐานข้อมูล
  const query = `
      INSERT INTO reservations (Room_ID, Name, Phone_Number, Date, Time, User_ID)
      VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [room_id, name, phone, date, time, userId], function(err) {
      if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, message: 'เพิ่มการจองเรียบร้อยแล้ว' });
  });
});

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

// >>>>>>>>>>>>>>>>>>>>>>>>>Start Select Dormitory File>>>>>>>>>>>>>>>>>>>>>>>>>

app.get('/dormitory/:userId', (req, res) => {
  const userId = req.params.userId;
  const db = new sqlite3.Database(dbPath);

  // ดึงข้อมูลหอพักที่เกี่ยวข้องกับผู้ใช้
  const query = `SELECT * FROM rental_data WHERE Owner_ID = ?`;

  db.all(query, [userId], (err, rows) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Database error');
      }

      // Log ข้อมูลที่ได้จากฐานข้อมูล
      console.log('ข้อมูลหอพักที่ดึงมา:', rows);

      if (rows.length === 0) {
          // Log ข้อมูลที่ส่งไปยังหน้า no_dormitory
          console.log('ส่งข้อมูลไปยังหน้า no_dormitory:', { username: username });
          res.render('owner/no_dormitory', { username: username });
      } else {
          // Log ข้อมูลที่ส่งไปยังหน้า select_dormitory
          console.log('ส่งข้อมูลไปยังหน้า select_dormitory:', { username: username, dormitories: rows });
          res.render('owner/select_dormitory', { username: username, dormitories: rows });
      }
  });
});
// >>>>>>>>>>>>>>>>>>>>>>>>>End Select Dormitory File>>>>>>>>>>>>>>>>>>>>>>>>>

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


