const express = require('express');
const userModel = require('./models/userModel');
const expenseModel = require('./models/expenseModel'); // Correctly reference the Expense model
const bcrypt = require('bcrypt');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello world");
});

// register end point
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
        let doc = await userModel.create(user);

        // Respond with success message
        res.status(200).send({ message: "User registration has been done successfully" });

    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (err.code === 11000) {
            return res.status(400).send({ message: "Email or mobile number already exists" });
        }
        res.status(500).send({ message: "Internal server error" });
    }
});

// Retrieve User Details
app.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel.findById(userId);

        // Fix the variable name to 'user' instead of 'findUser'
        if (!user) {
            return res.status(404).send({ message: "User Not found..." });
        }

        res.status(200).send({
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ message: "Internal Server error" });
    }
});

// Add Expense
app.post('/expense', async (req, res) => {
    const { userId, amount, participants } = req.body;

    // Input validation
    if (!userId || !amount || !participants || !Array.isArray(participants)) {
        return res.status(400).send({ message: "Invalid data: userId, amount, and participants are required." });
    }

    // Validate userId
    const userExists = await userModel.findById(userId);
    if (!userExists) {
        return res.status(404).send({ message: "User not found." });
    }

    // Validate each participant and calculate their share
    const totalPercentage = participants.reduce((total, participant) => {
        if (participant.type === 'percentage') {
            return total + (participant.percentage || 0);
        }
        return total;
    }, 0);

    if (totalPercentage > 100) {
        return res.status(400).send({ message: "Total percentage exceeds 100%." });
    }

    // Prepare data for saving expense
    const updatedParticipants = participants.map(participant => {
        if (participant.type === 'equal') {
            participant.amountOwned = amount / participants.length; // Equal split
            participant.percentage = (1 / participants.length) * 100; // Each participant owes 100% divided by number of participants
        } else if (participant.type === 'percentage') {
            // Calculate the amount owned based on percentage
            participant.amountOwned = (participant.percentage / 100) * amount;
        }
        return participant;
    });
    console.log('update participants --> ', updatedParticipants);

    try {
        // Create the expense document
        const expense = await expenseModel.create({
            userId,
            amount,
            participants: updatedParticipants,
        });

        res.status(201).send({
            message: "Expense added successfully",
            expenseId: expense._id
        });
    } catch (err) {
        console.error("Error creating expense:", err); // Log the error
        if (err.name === 'ValidationError') {
            return res.status(400).send({ message: err.message });
        }
        res.status(500).send({ message: "Internal server error" });
    }
});

app.listen(9000, () => {
    console.log('server is started on the port 9000');
});
