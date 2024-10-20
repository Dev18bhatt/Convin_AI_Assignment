# Expense Management Backend

This is an Expense Management backend application built using Node.js and Express. It allows users to register, add expenses, retrieve user details, and download a balance sheet of all expenses in CSV format.

## Technologies Used

- **Node.js**: JavaScript runtime for building server-side applications.
- **Express**: Web framework for building APIs and handling requests.
- **MongoDB**: NoSQL database for storing user and expense data.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB and Node.js.
- **bcrypt**: Library for hashing passwords to enhance security.
- **json2csv**: Library for converting JSON data to CSV format.
- **fs**: Node.js built-in module for file system operations.
- **path**: Node.js built-in module for handling file paths.

## Installation

1. Clone the repository.
2. Navigate to the project directory.
3. Run `npm install` to install all dependencies.
4. Set up your MongoDB database and configure the connection in your application.
5. Start the server using `node app.js`.

## API Endpoints

### 1. Home Route

- **Endpoint**: `GET /`
- **Description**: Returns a simple greeting message.
- **Response**: `Hello! this is expense management backend...`

### 2. User Registration

- **Endpoint**: `POST /register`
- **Description**: Registers a new user.
- **Request Body**:
  - `name`: User's name (required)
  - `email`: User's email (required)
  - `mobileNumber`: User's mobile number (required)
  - `password`: User's password (required)
- **Response**:
  - `200`: Registration successful.
  - `400`: Validation error (missing fields).
  - `500`: Internal server error or duplicate user.

### 3. Retrieve User Details

- **Endpoint**: `GET /user/:id`
- **Description**: Fetches user details by user ID.
- **Response**:
  - `200`: User details (name, email, mobile number).
  - `404`: User not found.
  - `500`: Internal server error.

### 4. Add a New Expense

- **Endpoint**: `POST /AddExpense`
- **Description**: Adds a new expense.
- **Request Body**:
  - `userId`: ID of the user adding the expense (required)
  - `username`: Username of the user (required)
  - `amount`: Amount of the expense (required)
  - `participants`: Array of participant objects (required)
    - Each participant should have a `userId`, `username`, `type`, and optional `amountOwed` or `percentage`.
- **Response**:
  - `201`: Expense added successfully.
  - `400`: Validation error (missing or invalid data).
  - `404`: User not found.
  - `500`: Internal server error.

### 5. Fetch User Expenses

- **Endpoint**: `GET /expense/:userId`
- **Description**: Retrieves all expenses for a specific user.
- **Response**:
  - `200`: List of expenses for the user.
  - `404`: User not found or no expenses found.
  - `500`: Internal server error.

### 6. Retrieve All Expenses

- **Endpoint**: `GET /getAllExpense`
- **Description**: Fetches all expenses from the database.
- **Response**:
  - `200`: List of all expenses.
  - `400`: No expenses found.
  - `500`: Internal server error.

### 7. Download Balance Sheet

- **Endpoint**: `GET /download_balance_sheet`
- **Description**: Downloads a CSV file containing all expenses.
- **Response**:
  - `200`: CSV file downloaded successfully.
  - `404`: No expenses found.
  - `500`: Error generating or downloading CSV.

## File Structure
