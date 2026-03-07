# Budget N Expenses 💰

A modern, responsive web application for tracking budgets, expenses, and financial health.

## Features
- **Transaction Management**: Add, edit, copy, and delete transactions.
- **Account Tracking**: Manage multiple accounts (Checking, Savings, Cash) and track real-time balances.
- **Categorization**: Organize spending with customizable categories and subcategories.
- **Reporting**: Visualized spending reports and filtering by time periods.
- **Budgeting**: Set and monitor budgets across different categories.

## Tech Stack
- **Frontend**: Vite, Vanilla JavaScript, CSS.
- **Backend**: Express.js, JSON-based storage.
- **Testing**: Vitest for both Frontend and Backend.

## Getting Started

### Prerequisites
- Node.js (v20 or later)
- npm

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd budget-n-expenses
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Initialize data from samples
   mkdir -p data
   cp data/accounts.json.example data/accounts.json
   cp data/budgets.json.example data/budgets.json
   cp data/categories.json.example data/categories.json
   cp data/retailers.json.example data/retailers.json
   cp data/transactions.json.example data/transactions.json
   npm start
   ```

3. **Setup Frontend**:
   In a new terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Running Tests
- **Backend Tests**: `cd backend && npm test`
- **Frontend Tests**: `cd frontend && npm test`

## Project Structure
- `backend/`: Express server, data logic, and JSON storage.
- `frontend/`: UI components, styling, and application logic.
- `requirements/`: Project requirements and design docs.