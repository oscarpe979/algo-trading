# Algorithmic Trading Platform

This is a full-stack MERN (MongoDB, Express, React, Node.js) application for algorithmic trading. It uses the Alpaca API for trade execution and market data.

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd algo-trading-platform
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   npm install --prefix frontend
   ```

4. **Set up environment variables:**
   - Create a `.env` file in the `backend` directory.
   - Add the following variables:
     ```
     ALPACA_API_KEY_ID=<your-alpaca-api-key-id>
     ALPACA_API_SECRET_KEY=<your-alpaca-api-secret-key>
     MONGO_URI=<your-mongodb-uri>
     ```

## Usage

To run the application in development mode:

```bash
npm run dev
```

This will start both the backend server and the frontend client concurrently.

- Backend server will be running on `http://localhost:5000`
- Frontend client will be running on `http://localhost:3000`

## Available Scripts

### Root Directory

- `npm start`: Starts the backend server only.
- `npm run server`: Starts the backend server with `nodemon` for automatic restarts.
- `npm run client`: Starts the frontend client only.
- `npm run dev`: Starts both the backend and frontend servers concurrently.
- `npm run heroku-postbuild`: Installs frontend dependencies and builds the frontend for production.

### Frontend Directory (`frontend/`)

- `npm start`: Starts the React development server.
- `npm run build`: Builds the app for production to the `build` folder.
- `npm test`: Launches the test runner in interactive watch mode.
- `npm run eject`: Ejects the app from Create React App.