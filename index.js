// Import necessary modules
const express = require('express');
const userModel = require('./models/userModel');
const expenseModel = require('./models/expenseModel'); // Correctly reference the Expense model
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route
app.get("/", (req, res) => {
    res.send("Hello! this is expense management backend...");
});

// User registration endpoint
app.post("/register", async (req, res) => {
    const { name, email, mobileNumber, password } = req.body;

    // Basic input validation
    if (!name || !email || !mobileNumber || !password) {
        return res.status(400).send({ message: "All fields (name, email, mobileNumber, password) are required" });
    }

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user object with the hashed password
        const user = {
            name,
            email,
            mobileNumber,
            password: hashedPassword
        };

        // Save the user in the database
        await userModel.create(user);

        // Respond with success message
        res.status(200).send({ message: "User registration has been done successfully" });

    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (err.code === 11000) {
            // Handle duplicate email or mobile number error
            return res.status(400).send({ message: "Email or mobile number already exists" });
        }
        res.status(500).send({ message: "Internal server error" });
    }
});

// Retrieve user details by user ID
app.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).send({ message: "User Not found..." });
        }

        // Respond with user details
        res.status(200).send({
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Internal Server error" });
    }
});

// Add a new expense
app.post('/AddExpense', async (req, res) => {
    const { userId, username, amount, participants } = req.body;

    // Input validation
    if (!userId || !username || !amount || !participants || !Array.isArray(participants)) {
        return res.status(400).send({ message: "Invalid data: userId, username, amount, and participants are required." });
    }

    // Validate main userId and username
    const userExists = await userModel.findById(userId);
    if (!userExists) {
        return res.status(404).send({ message: "User not found." });
    }

    // Validate each participant
    for (const participant of participants) {
        const participantExists = await userModel.findById(participant.userId);
        if (!participantExists) {
            return res.status(404).send({ message: `Participant userId ${participant.userId} not found.` });
        }

        if (!participant.username) {
            return res.status(400).send({ message: `Participant username is required for userId ${participant.userId}.` });
        }

        // Optional: further validation based on participant type
        if (participant.type === 'exact' && (participant.amountOwed == null || participant.amountOwed < 0)) {
            return res.status(400).send({ message: `Valid amountOwed is required for participant ${participant.userId} with type 'exact'.` });
        }
        if (participant.type === 'percentage' && (participant.percentage == null || participant.percentage < 0 || participant.percentage > 100)) {
            return res.status(400).send({ message: `Valid percentage (0-100) is required for participant ${participant.userId} with type 'percentage'.` });
        }
    }

    try {
        // Create the expense document
        const expense = await expenseModel.create({
            userId,
            username, // Include the username of the user who created the expense
            amount,
            participants,
        });

        // Respond with success message
        res.status(201).send({
            message: "Expense added successfully",
            expenseId: expense._id
        });
    } catch (err) {
        console.error("Error creating expense:", err);
        if (err.name === 'ValidationError') {
            return res.status(400).send({ message: err.message });
        }
        res.status(500).send({ message: "Internal server error" });
    }
});

// Fetch individual user expenses
app.get('/expense/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userExists = await userModel.findById(userId);
        if (!userExists) {
            return res.status(404).send({ message: "User not found" });
        }

        // Retrieve expenses for the user
        const expenses = await expenseModel.find({
            $or: [
                { userId },
                { "participants.userId": userId }
            ]
        });

        if (expenses.length === 0) {
            return res.status(404).send({ message: "No expenses found for this user." });
        }

        // Respond with expenses
        res.status(200).send({
            message: 'Expenses retrieved successfully',
            expenses
        });
    } catch (err) {
        console.log("Error retrieving expenses:", err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Retrieve all expenses from the database
app.get("/getAllExpense", async (req, res) => {
    try {
        const allExpenses = await expenseModel.find();
        if (allExpenses.length === 0) {
            return res.status(400).send({ message: 'No expenses found.' });
        }
        res.status(200).send({
            message: "Successfully fetched all the expenses",
            allExpenses
        });
    } catch (err) {
        console.error("Error retrieving overall expenses:", err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Download the balance sheet of all expenses
app.get('/download_balance_sheet', async (req, res) => {
    try {
        // Fetch all expenses from the database
        const expenses = await expenseModel.find().populate('participants.userId');
        if (!expenses.length) {
            return res.status(404).send({ message: 'No expenses found.' });
        }

        // Prepare data for the balance sheet
        const balanceSheetData = expenses.map(expense => {
            const createdBy = expense.username;
            const participantsString = expense.participants.map(p => {
                const participantName = p.username;
                return `${participantName} (${p.type})`;
            }).join(', ');

            return {
                ExpenseID: expense._id,
                CreatedBy: createdBy,
                Amount: expense.amount,
                Participants: participantsString,
                CreatedAt: expense.createdAt.toLocaleDateString()
            };
        });

        // Define CSV fields
        const fields = ['ExpenseID', 'CreatedBy', 'Amount', 'Participants', 'CreatedAt'];
        const json2csvParser = new Parser({ fields });

        // Generate CSV
        let csv;
        try {
            csv = json2csvParser.parse(balanceSheetData);
        } catch (error) {
            console.error('Error while generating CSV:', error);
            return res.status(500).send({ message: 'Failed to generate CSV' });
        }

        // Ensure directory exists for saving the CSV file
        const filePath = path.join(__dirname, 'files', 'balance_sheet.csv');
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Save CSV to file
        fs.writeFileSync(filePath, csv);

        // Send the file for download
        res.download(filePath, 'balance_sheet.csv', err => {
            if (err) {
                console.error('Error while downloading balance sheet:', err);
                res.status(500).send({ message: 'Error downloading balance sheet' });
            }
        });
    } catch (err) {
        console.error('Error retrieving balance sheet:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Start the server on port 9000
app.listen(9000, () => {
    console.log('Server is started on the port 9000');
});
