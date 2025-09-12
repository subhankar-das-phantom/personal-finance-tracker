# Personal Finance Tracker

A full-stack personal finance tracking application designed to help users manage their income, expenses, and budget goals effectively. This application provides a comprehensive overview of financial health, transaction management, and insightful reporting.

## Features

### User Management
*   **User Registration & Login:** Secure user authentication with JWT.
*   **User Dashboard:** Personalized overview of financial data upon login.

### Transaction Management
*   **Add/Edit/Delete Transactions:** Full CRUD operations for income and expense transactions.
*   **Categorization:** Assign categories to transactions for better organization.
*   **Filtering & Sorting:** Easily filter and sort transactions by type, category, date, and amount.
*   **Search:** Search transactions by description or category.
*   **CSV Export:** Export transaction data to a CSV file.

### Financial Overview & Reporting
*   **Dashboard Statistics:** View total income, total expenses, net balance, and transaction count.
*   **Monthly Trends:** Compare current and previous month's financial performance.
*   **Expense Breakdown Chart:** Visual representation of spending across different categories.
*   **PDF Report Generation:** Download a comprehensive financial report with detailed statistics, category breakdowns, monthly trends, and transaction history.

### Budgeting
*   **Set Budget Goals:** Create monthly budget goals for specific categories.
*   **Budget Progress Tracking:** Monitor spending against set budget goals, with indicators for overspending or remaining budget.
*   **Category Management:** Automatically suggests categories from existing transactions for budget setting.

## Technologies Used

### Backend (Node.js, Express, MongoDB)
*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web application framework for Node.js.
*   **MongoDB:** NoSQL database for storing user, transaction, and budget data.
*   **Mongoose:** MongoDB object data modeling (ODM) for Node.js.
*   **JWT (JSON Web Tokens):** For secure user authentication.
*   **Bcrypt.js:** For password hashing.
*   **CORS:** Middleware for enabling Cross-Origin Resource Sharing.
*   **Dotenv:** For managing environment variables.
*   **Chart.js Node Canvas:** For server-side chart rendering (used in PDF reports).
*   **PDFKit:** For generating PDF financial reports.

### Frontend (React, Vite, Material UI, TailwindCSS, Framer Motion)
*   **React:** JavaScript library for building user interfaces.
*   **Vite:** Fast build tool for modern web projects.
*   **React Router DOM:** For declarative routing in React applications.
*   **Axios:** Promise-based HTTP client for making API requests.
*   **Material UI (MUI):** React components for faster and easier web development.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
*   **Framer Motion:** A production-ready motion library for React.
*   **Lucide React:** A collection of beautiful, pixel-perfect icons.
*   **Recharts:** A composable charting library built on React components.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   Node.js (v14 or higher)
*   npm (Node Package Manager)
*   MongoDB instance (local or cloud-based, e.g., MongoDB Atlas)

### 1. Clone the Repository

```bash
git clone <repository_url>
cd personal-finance-tracker
```

### 2. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory and add the following environment variables:

```env
ATLAS_URI=<Your MongoDB Connection String>
JWT_SECRET=<A_Strong_Secret_Key_For_JWT>
```

*   Replace `<Your MongoDB Connection String>` with your MongoDB connection URI (e.g., from MongoDB Atlas).
*   Replace `<A_Strong_Secret_Key_For_JWT>` with a long, random string for JWT token signing.

Start the backend server:

```bash
npm run dev
```

The backend server will run on `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:

```bash
cd ../frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend application will typically run on `http://localhost:5173`.

## Usage

1.  **Register:** Open your browser and go to `http://localhost:5173`. Register a new user account.
2.  **Login:** Log in with your newly created credentials.
3.  **Dashboard:** Explore your financial overview, recent transactions, and expense charts.
4.  **Transactions:** Navigate to the "Transactions" page to add, edit, delete, filter, and export your financial transactions.
5.  **Budget Goals:** On the dashboard, use the "Set Budget Goal" quick action to create monthly budgets for different categories.
6.  **Reports:** Download a PDF financial report from the dashboard's quick actions.

## API Endpoints

The backend API is accessible at `http://localhost:5000/api`.

*   **`/api/users`**
    *   `POST /register`: Register a new user.
    *   `POST /login`: Log in a user and receive a JWT.
    *   `GET /me`: Get authenticated user's details (requires JWT).
*   **`/api/transactions`**
    *   `GET /`: Get all transactions for the authenticated user.
    *   `POST /`: Add a new transaction.
    *   `PUT /:id`: Update an existing transaction.
    *   `DELETE /:id`: Delete a transaction.
    *   `GET /summary`: Get a summary of expenses by category.
    *   `GET /stats`: Get overall financial statistics (income, expenses, net balance, monthly comparisons).
    *   `GET /chart-data`: Get data for expense category charts.
    *   `GET /report`: Generate and download a PDF financial report.
*   **`/api/budgetGoals`**
    *   `GET /`: Get all budget goals for the authenticated user.
    *   `POST /`: Add a new budget goal.
    *   `PUT /:id`: Update an existing budget goal.
    *   `DELETE /:id`: Delete a budget goal.
    *   `GET /progress`: Get budget progress for the current month.
    *   `GET /summary/:year/:month`: Get budget summary for a specific month/year.
    *   `GET /categories`: Get available categories from existing transactions.

## Project Structure

```
personal-finance-tracker/
├── backend/
│   ├── config/             # Configuration files (e.g., database config)
│   ├── controllers/        # Logic for handling requests
│   ├── middleware/         # Authentication middleware (auth.js)
│   ├── models/             # Mongoose schemas (user.model.js, transaction.model.js, budgetGoal.model.js)
│   ├── routes/             # API routes (users.js, transactions.js, budgetGoals.js)
│   ├── .env                # Environment variables (local)
│   ├── package.json        # Backend dependencies and scripts
│   ├── server.js           # Main backend application file
│   └── ...
└── frontend/
    ├── public/             # Static assets
    ├── src/
    │   ├── assets/         # Images, icons
    │   ├── components/     # Reusable React components (e.g., Navbar, TransactionForm)
    │   ├── context/        # React Context for global state (AuthContext.jsx)
    │   ├── pages/          # Main application pages (e.g., HomePage, LoginPage)
    │   ├── services/       # (Currently empty, API calls are in components)
    │   ├── App.css         # Global CSS for App
    │   ├── App.jsx         # Main React application component
    │   ├── index.css       # Global CSS
    │   └── main.jsx        # React entry point
    ├── .gitignore          # Git ignore rules
    ├── eslint.config.js    # ESLint configuration
    ├── index.html          # Main HTML file
    ├── package.json        # Frontend dependencies and scripts
    ├── README.md           # Frontend specific README (can be removed or merged)
    └── vite.config.js      # Vite configuration
```

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the ISC License.
