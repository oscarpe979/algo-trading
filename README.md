# Algorithmic Trading Platform

This is a full-stack MERN (MongoDB, Express, React, Node.js) application for algorithmic trading. It uses the Alpaca API for trade execution and market data.

## Backend Documentation

### Overview

The backend is a Node.js and Express application responsible for the core logic of the trading platform. Its primary functions are:
-   Connecting to the Alpaca API to fetch market data and execute trades.
-   Connecting to a MongoDB database to store trading data, such as calculated pivot points.
-   Implementing and running automated trading strategies.
-   Providing a REST API for the frontend to interact with the trading data.
-   Serving the React frontend in a production environment.

### Setup

1.  **Navigate to the root directory.**
2.  **Install backend dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    -   Create a `.env` file in the `backend` directory.
    -   Add the following variables:
        ```
        # Alpaca API Credentials
        ALPACA_KEY_ID=<your-alpaca-api-key-id>
        ALPACA_SECRET_KEY=<your-alpaca-api-secret-key>
        ALPACA_API_ENDPOINT=https://paper-api.alpaca.markets
        ALPACA_API_VERSION=v2

        # MongoDB Connection
        MONGO_URI=<your-mongodb-uri>

        # Server Configuration
        PORT=5000
        NODE_ENV=development
        ```

### API Endpoints

The backend exposes the following API endpoint:

-   **`GET /api/orders`**
    -   **Description:** Retrieves a comprehensive list of all historical trading orders from the Alpaca API. It processes the raw order data to identify and structure bracket orders, including their take-profit and stop-loss legs, and matches them with any corresponding market sell orders.
    -   **Query Parameters:** This endpoint accepts any query parameters supported by the [Alpaca Orders API](https://alpaca.markets/docs/api-references/trading-api/orders/#get-all-orders), such as `status`, `limit`, `after`, etc.
    -   **Returns:** A JSON array of organized trade objects.

### Trading Strategies

The backend currently implements the following trading strategy:

#### Pivot Points Strategy

-   **File Location:** `backend/strategies/pivot_points/`
-   **Description:** This strategy trades based on classic daily pivot points.
-   **Logic:**
    1.  **Daily Calculation:** Every weekday morning before the market opens (8:00 AM - 8:45 AM NY time), the strategy calculates daily, weekly, and monthly pivot points for a predefined list of tickers. These calculations are based on the previous day's, week's, and month's high, low, and close prices. The calculated points are stored in the MongoDB database.
    2.  **Real-time Monitoring:** At 9:45 AM, the strategy connects to a real-time market data stream via WebSocket.
    3.  **Trade Entry:** It monitors the price of each ticker. A buy signal is generated when the price crosses above a daily pivot level (S3, S2, S1, or the central pivot). Before placing an order, it confirms the upward momentum by waiting for the price to travel 25% of the distance to the next pivot level.
    4.  **Order Type:** When a trade is entered, a **bracket order** is placed. This includes:
        -   A `limit` order to buy at a price slightly above the crossed pivot point.
        -   A `take_profit` order at a price slightly below the next pivot level.
        -   A `stop_loss` order calculated based on a risk/reward ratio.
    5.  **End-of-Day:** At 3:58 PM, a cron job automatically cancels all pending orders and closes all open positions to ensure no positions are held overnight.

## Frontend Documentation

The frontend is a React application built with Create React App.

### Installation

1.  **Navigate to the root directory.**
2.  **Install frontend dependencies:**
   ```bash
   npm install --prefix frontend
   ```

## Combined Usage

To run the entire application (both backend and frontend) in development mode:

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