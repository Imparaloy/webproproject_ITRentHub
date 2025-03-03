const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('itrentalhub.db', (err) => {    
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
  });
db.run(`INSERT INTO account (User_ID, User_Name, Email, Password, Phone_Number, Roles)
VALUES 
('U002', 'JaneSmith', 'janesmith@example.com', '$2b$10$QqQHgZ7hGeyqg/.Gg8KoiOslzWaa6.dTWPuXEgYb61jdGdM4NQq5S', '0987654321', 'Admin'),`);

// db.run(`INSERT INTO facility (Rental_ID, Air_Conditioner, Furnished, Water_Heater, Fan, Refrigerator, Parking, Bicycle_Parking, Lift, Pool, Fitness, Security_keycard, Security_finger_print, CCTV, Security, In_Room_WIFI, Pets, Smoking, Laundry, Kitchen_Stove)
//         VALUES 
//         (1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1),
//         (2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1),
//         (3, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1),
//         (4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1)`);

// db.run(`INSERT INTO rental_data (Rental_ID, Owner_ID, Rental_Name, Type, Description, Phone_number, Line_ID, Location, Photo, Gallery, Approved)
//         VALUES 
//         (1, 1, 'Sunny Apartment', 'Apartment', 'A cozy apartment in the city center.', '1234567890', 'sunny_apt', '123 Main St, City', 'sunny.jpg', 'gallery1.jpg', 1),
//         (2, 2, 'Green Dormitory', 'Dormitory', 'A spacious Dormitory with a garden.', '2345678901', 'green_Dormitory', '456 Elm St, City', 'green.jpg', 'gallery2.jpg', 1),
//         (3, 3, 'Blue Dormitory', 'Dormitory', 'A modern Dormitory near the beach.', '3456789012', 'blue_Dormitory', '789 Beach Rd, City', 'blue.jpg', 'gallery3.jpg', 1),
//         (4, 4, 'Red Apartment', 'Apartment', 'A luxurious Apartment with a great view.', '4567890123', 'red_Apartment', '101 Skyline Ave, City', 'red.jpg', 'gallery4.jpg', 1)`);

// db.run(`INSERT INTO rental_price (Rental_ID, rental_price, advance_payment, electric_price, water_price, service_price, phone_price, internet_price)
//                 VALUES 
//                 (1, 15000, 3000, 7.5, 20.0, 500.0, 300.0, 400.0),
//                 (2, 25000, 5000, 8.0, 25.0, 600.0, 350.0, 450.0),
//                 (3, 20000, 4000, 7.0, 22.0, 550.0, 320.0, 420.0),
//                 (4, 30000, 6000, 9.0, 30.0, 700.0, 400.0, 500.0)`);

// db.run(`INSERT INTO review (Rental_ID, User_ID, Rating, Comment)
//         VALUES 
//         (1, 1, 4.5, 'Great place to live, very convenient location.'),
//         (1, 2, 4.3, 'Clean and well-maintained apartment.'),
//         (1, 3, 4.7, 'Friendly staff and good facilities.'),
//         (1, 4, 4.6, 'Close to public transportation and shops.'),
//         (1, 5, 4.4, 'Quiet and peaceful environment.'),
//         (2, 1, 4.7, 'Beautiful Dormitory with a lovely garden.'),
//         (2, 2, 4.8, 'Spacious rooms and great amenities.'),
//         (2, 3, 4.6, 'Perfect for students, close to campus.'),
//         (2, 4, 4.5, 'Affordable and comfortable.'),
//         (2, 5, 4.9, 'Highly recommended for long stays.'),
//         (3, 1, 4.6, 'Amazing Dormitory close to the beach.'),
//         (3, 2, 4.5, 'Great view and relaxing atmosphere.'),
//         (3, 3, 4.7, 'Clean rooms and friendly environment.'),
//         (3, 4, 4.8, 'Perfect for beach lovers.'),
//         (3, 5, 4.4, 'Affordable price for the location.'),
//         (4, 1, 4.8, 'Luxurious Apartment with stunning views.'),
//         (4, 2, 4.9, 'Top-notch facilities and services.'),
//         (4, 3, 4.7, 'Modern design and comfortable living.'),
//         (4, 4, 4.6, 'Great for families and professionals.'),
//         (4, 5, 4.5, 'Excellent security and maintenance.')`);

// db.run(`INSERT INTO room_data (Rental_ID, Room_ID, Room_Name, Room_Type, Size, Monthly_Rental, Room_Status, Number_Available_Room)
//         VALUES 
//         (1, 1, 'Room 101', 'Standard', 30.5, 12000, 1, 5),
//         (1, 2, 'Room 102', 'Deluxe', 40.0, 15000, 1, 3),
//         (2, 3, 'Room 201', 'Standard', 35.0, 18000, 1, 4),
//         (2, 4, 'Room 202', 'Deluxe', 45.0, 22000, 1, 2),
//         (3, 5, 'Room 301', 'Standard', 32.0, 16000, 1, 6),
//         (3, 6, 'Room 302', 'Deluxe', 42.0, 20000, 1, 4),
//         (4, 7, 'Room 401', 'Standard', 38.0, 25000, 1, 3),
//         (4, 8, 'Room 402', 'Deluxe', 50.0, 30000, 1, 2)`);



db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Close the database connection.');
});