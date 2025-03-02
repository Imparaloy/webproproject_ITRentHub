const express = require('express');
const app = express();
const port = 3000;

// ตั้งค่า EJS เป็น View Engine
app.set('view engine', 'ejs');
app.use(express.static('public')); // ใช้ไฟล์ CSS จาก public

// Mock data สำหรับทดสอบ
const rentals = [
    { id: 101, name: 'Luxury Apartment', type: 'Condo', status: 'Pending' },
    { id: 102, name: 'Downtown Studio', type: 'Studio', status: 'Approved' },
    { id: 103, name: 'Cozy Townhouse', type: 'House', status: 'Rejected' },
];

app.get('/admin', (req, res) => {
    res.render('adminpanel', { username: 'AdminUser', rentals });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
