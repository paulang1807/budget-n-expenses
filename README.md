# Budget N Expenses 💰

A modern, responsive web application for tracking budgets, expenses, and financial health.

## Features
- **Transaction Management**: Add, edit, copy, and delete transactions.
- **Account Tracking**: Manage multiple accounts (Checking, Savings, Cash) and track real-time balances.
- **Categorization**: Organize spending with customizable categories and subcategories.
- **Reporting**: Visualized spending reports and filtering by time periods.
- **Budgeting**: Set and monitor budgets across different categories.

## Customizing Icons
The application supports a wide range of icons, including generic emojis and professional brand logos (Bank of America, Chase, Target, etc.).

### Using Preset Icons
1. Open the "Add" or "Edit" modal for an account, category, or retailer.
2. Scroll through the icon grid and select your preferred icon.

### Entering Custom Emojis
1. In the same icon selector section, look for the field labeled **"Or enter custom emoji"**.
2. Type or paste your desired emoji directly into the text input.
3. **Mac Tip**: Press `Cmd + Ctrl + Space` to open the system emoji picker and select one.

### Using SVG Brand Logos
For advanced users, you can also paste a raw SVG string into the custom icon field. The application will render it automatically if it matches the expected format (e.g., `<svg ...>...</svg>`).

### Managing the Icon Library
You can permanently add or remove icons from your library via the Settings menu:
1. Navigate to **Settings** -> **Icons** tab.
2. **To Add**: Enter an emoji or a full SVG string in the input field at the bottom and click **Add**.
   - **Emoji Example**: `🧙‍♂️` or `🌋`
   - **SVG Example**: `<svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="red" /></svg>`
3. **To Remove**: Click the trash icon (🗑️) on any icon card.
4. Added icons will immediately become available in all selection grids (Accounts, Categories, etc.).

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