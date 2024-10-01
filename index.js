const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const methodOverride = require('method-override');


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/photos", express.static('photos'));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'rail_administration',
    password: '12345678',
});

connection.connect((err) => {
    if (err) {
        console.log('error in db connection' + JSON.stringify(err, undefined, 2));
    } else {
        console.log('db is connected successfully');
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Root route
app.get('/', (req, res) => {
    res.render("index.ejs"); // Replace with the desired view for the home page
});
// Root route
app.get('/index', (req, res) => {
    res.render("index.ejs"); // Replace with the desired view for the home page
});
// PNR Page
app.get('/pnr', (req, res) => {
    res.render('pnr.ejs');
});

// Register Page
app.get('/register', (req, res) => {
    res.render('register.ejs');
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login.ejs');
});
// tatkal page
app.get('/tatkal', (req, res) => {
    res.render('tatkal.ejs'); // Replace with the desired view for the home page
});

// maintainence Page
app.get('/maintenance', (req, res) => {
    res.render('maintenance.ejs');
});

// complaint Page
app.get('/complaintrefund', (req, res) => {
    res.render('complaintrefund.ejs');
});

// // findtrains Page
// app.get('/findtrains', (req, res) => {
//     res.render('findtrains.ejs');
// });
// Book Ticket
app.get('/findtrains', async (req, res) => {
    console.log(req.query);
    const { from, to, date, trainClass } = req.query;
    const routeQuery = 'SELECT ROUTE_ID FROM ROUTE WHERE ARRIVAL = ? AND DEPARTURE = ?';
    
    connection.query(routeQuery, [from, to], (err, routeResult) => {
        if (err) {
            console.log('Error in search_train (routeQuery):', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        
        
    
        
        const [routeIds] = routeResult.map(route => route.ROUTE_ID);
        
        const trainQuery = 'SELECT r.arrival AS arrival,c.type_class as trainClass, t.Time AS time,r.departure AS departure,r.distance AS distance,tr.fare AS fare, tr.no_of_tickets as availableTickets FROM train t JOIN route r ON t.route_id = r.route_id JOIN coaches c ON t.train_id = c.train_id JOIN ticket tr ON t.train_id = tr.train_id WHERE r.route_id = ?;'
        connection.query(trainQuery, [routeIds], (err, trainResult) => {
            if (err) {
                console.log('Error in search_train (trainQuery):', err);
                res.status(500).send('Internal Server Error');
            } else {
                [trainResult] = trainResult
                res.render('findtrains.ejs', { train: trainResult, trainClass });
            }
        });
        
    });
});

// PNR Status
app.get('/find_trains', (req, res) => {
    const { pnrNumber } = req.query;
    const sql = 'SELECT r.arrival AS arrival, c.type_class as trainClass, t.Time AS time, r.departure AS departure, r.distance AS distance, tr.fare AS fare, tr.no_of_tickets as availableTickets FROM train t JOIN route r ON t.route_id = r.route_id JOIN coaches c ON t.train_id = c.train_id JOIN ticket tr ON t.train_id = tr.train_id WHERE tr.ticket_id = ?;';

    connection.query(sql, [pnrNumber], (err, result) => {
        if (err) {
            console.log('Error in pnr:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (result.length > 0) {
                const trainDetails = {
                    arrival: result[0].arrival,
                    trainClass: result[0].trainClass,
                    time: result[0].time,
                    departure: result[0].departure,
                    distance: result[0].distance,
                    fare: result[0].fare,
                    availableTickets: result[0].availableTickets
                };

                // Render the findtrains.ejs template
                res.render('findtrains.ejs', { train: trainDetails });
            } else {
                res.status(404).send('PNR not found');
            }
        }
    });
});



// Register
app.get('/register', (req, res) => {
    const { type, name, dob, email, password } = req.body;
    const sql = 'INSERT INTO CUSTOMER (CUST_ID, CUST_NAME, GENDER, CUST_EMAIL, CUST_MOBILE) VALUES (?, ?, ?, ?)';
    const sql1='INSERT INTO LOGIN(ID,PASSWORD) VALUES(?,?)';
    connection.query(sql, [name, dob, email, password], (err, result) => {
        if (err) {
            console.log('Error in registration:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Registration successful');
            res.redirect('/'); // Redirect to home or login page after successful registration
        }
    });
});

// Login
app.get('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM LOGIN WHERE CUST_EMAIL = ? AND PASSWORD = ?';

    connection.query(sql, [email, password], (err, result) => {
        if (err) {
            console.log('Error in login:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (result.length > 0) {
                console.log('Login successful');
                res.redirect('/'); // Redirect to home or dashboard after successful login
            } else {
                console.log('Invalid credentials');
                res.status(401).send('Invalid credentials');
            }
        }
    });
});
// Tatkal Booking
app.post('/tatkal', (req, res) => {
    const { from, to, date, trainClass } = req.body;

    // Example query: SELECT * FROM TRAIN WHERE DEPARTURE = ? AND ARRIVAL = ? AND CLASS = ? AND DATE = ? AND AVAILABLE_SEATS > 0;
    const tatkalQuery = 'SELECT * FROM TRAIN WHERE DEPARTURE = ? AND ARRIVAL = ? AND CLASS = ? AND DATE = ? AND AVAILABLE_SEATS > 0';

    connection.query(tatkalQuery, [from, to, trainClass, date], (err, result) => {
        if (err) {
            console.log('Error in Tatkal Booking:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (result.length > 0) {
                // Assuming you have a table named TATKAL_BOOKINGS for recording Tatkal bookings
                // Example query: INSERT INTO TATKAL_BOOKINGS (TRAIN_ID, USER_ID, BOOKING_DATE) VALUES (?, ?, ?);
                const tatkalBookingQuery = 'INSERT INTO TATKAL_BOOKINGS (TRAIN_ID, USER_ID, BOOKING_DATE) VALUES (?, ?, ?)';
                connection.query(tatkalBookingQuery, [result[0].TRAIN_ID, /* replace with the actual user ID */, new Date()], (err, bookingResult) => {
                    if (err) {
                        console.log('Error in Tatkal Booking:', err);
                        res.status(500).send('Internal Server Error');
                    } else {
                        // Update the available seats in the TRAIN table
                        // Example query: UPDATE TRAIN SET AVAILABLE_SEATS = AVAILABLE_SEATS - 1 WHERE TRAIN_ID = ?;
                        const updateSeatsQuery = 'UPDATE TRAIN SET AVAILABLE_SEATS = AVAILABLE_SEATS - 1 WHERE TRAIN_ID = ?';
                        connection.query(updateSeatsQuery, [result[0].TRAIN_ID], (err) => {
                            if (err) {
                                console.log('Error updating available seats:', err);
                                res.status(500).send('Internal Server Error');
                            } else {
                                res.render('tatkal.ejs', { bookingDetails: result[0] });
                            }
                        });
                    }
                });
            } else {
                res.status(404).send('No available trains for Tatkal booking');
            }
        }
    });
});



// findtrains
// Assuming you have a route for train details like '/train/:id'
app.get('/findtrains/:id', (req, res) => {
    const trainId = req.params.id;

    // Example query: SELECT * FROM TRAIN WHERE ID = ?;
    const viewTrainQuery = 'SELECT * FROM TRAIN WHERE ID = ?';

    connection.query(viewTrainQuery, [trainId], (err, result) => {
        if (err) {
            console.log('Error retrieving train information:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (result.length > 0) {
                res.render('findtrains.ejs', { train: result[0] });
            } else {
                res.status(404).send('Train not found');
            }
        }
    });
});

// Maintenance Record
app.post('/maintenance', (req, res) => {
    const { maintenanceDate, numberOfTimes } = req.body;

    // Example query: INSERT INTO MAINTENANCE_RECORD (MAINTENANCE_DATE, NUMBER_OF_TIMES) VALUES (?, ?);
    const maintenanceQuery = 'INSERT INTO MAINTENANCE_RECORD (MAINTENANCE_DATE, NUMBER_OF_TIMES) VALUES (?, ?)';

    connection.query(maintenanceQuery, [maintenanceDate, numberOfTimes], (err, result) => {
        if (err) {
            console.log('Error recording maintenance:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('maintenance.ejs', { maintenanceDetails: { maintenanceDate, numberOfTimes } });
        }
    });
});

// Complaint and Refund
app.post('/complaintrefund', (req, res) => {
    const { complaintNumber, refundStatus, transactionType, amount } = req.body;

    // Example query: INSERT INTO COMPLAINT_REFUND (COMPLAINT_NUMBER, REFUND_STATUS, TRANSACTION_TYPE, AMOUNT) VALUES (?, ?, ?, ?);
    const complaintRefundQuery = 'INSERT INTO COMPLAINT_REFUND (COMPLAINT_NUMBER, REFUND_STATUS, TRANSACTION_TYPE, AMOUNT) VALUES (?, ?, ?, ?)';

    connection.query(complaintRefundQuery, [complaintNumber, refundStatus, transactionType, amount], (err, result) => {
        if (err) {
            console.log('Error recording complaint and refund:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('complaintrefund.ejs', { complaintRefundDetails: { complaintNumber, refundStatus, transactionType, amount } });
        }
    });
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});
