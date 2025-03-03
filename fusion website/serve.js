const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));

let db = new sqlite3.Database("itrentalhub_null.db", (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Connected to the SQlite database.");
});

app.get("/admin", function (req, res) {
    let sql = `
    SELECT Rental_ID AS id, Rental_Name AS name, Type AS type
    FROM rental_data`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.log(err.message);
            res.status(500).send("Database error!");
            return;
        }
        
        res.render("adminpanel", { rentals: rows });
    });
});

// app.post("/update-status", (req, res) => {
//     const { rentalId, status } = req.body;
    
//     let sql = `UPDATE rental_data SET status = ? WHERE Rental_ID = ?`;
//     db.run(sql, [status, rentalId], function (err) {
//         if (err) {
//             return res.status(500).send("Database update error!");
//         }
//         res.redirect("/admin");
//     });
// });

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});