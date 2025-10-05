import axios from "axios";
import moment from 'moment';

/**
 * @async
 * @function getAllOrders
 * @description This function retrieves all orders from the Alpaca API, filters them, and organizes the data into a JSON format.
 * It specifically processes bracket orders, identifies associated market sell orders, and combines them into a comprehensive trade list.
 * @param {object} req - The request object from Express.js, containing query parameters for the API call.
 * @param {object} res - The response object from Express.js.
 * @returns {object} - A JSON object containing the organized list of trades, including details for the primary order and its legs (stop and limit), as well as any associated market sell orders.
 */
export async function getAllOrders(req, res) {
 
 
    // Fetch all orders from the Alpaca API using the credentials and endpoint from environment variables.
    // The request parameters are passed from the original client request.
    const response = await axios({
        method: 'get',
        url: `${process.env.ALPACA_API_ENDPOINT}/${process.env.ALPACA_API_VERSION}/orders`,
        headers: {
            'APCA-API-KEY-ID': `${process.env.ALPACA_KEY_ID}`,
            'APCA-API-SECRET-KEY': `${process.env.ALPACA_SECRET_KEY}`,
        },
        params: req.query
    });

    // Filter the response data to get only filled or partially filled 'buy' limit orders.
    // These are considered the primary leg of a bracket order in this context.
    const filledOrders = response.data.filter(order => order.side === 'buy' && order.filled_at !== null && order.type === 'limit')
    
    // Filter the response data to get all 'sell' market orders.
    // These will be matched later to their corresponding bracket orders.
    const marketSellOrders = response.data.filter(order => order.side === 'sell' && order.type === 'market')

    // Map over the filtered 'buy' orders to create a structured JSON object for each trade.
    // This extracts the relevant information for the primary order and its legs (stop and limit).
    const organizedTrades = filledOrders.map((bracketOrder) => {
        return {
            // --- Main Order Details ---
            symbol: bracketOrder.symbol,
            qty: bracketOrder.qty,
            filled_qty: bracketOrder.filled_qty,
            side: bracketOrder.side,
            type: bracketOrder.type,       
            limit_price: bracketOrder.limit_price,
            stop_price: bracketOrder.stop_price,
            filled_avg_price: bracketOrder.filled_avg_price,
            ammount: bracketOrder.qty*bracketOrder.filled_avg_price,
            status: bracketOrder.status,
            submitted_at: bracketOrder.submitted_at && moment(bracketOrder.submitted_at).format('DD/MM/YYYY h:mm a'),
            filled_at: bracketOrder.filled_at && moment(bracketOrder.filled_at).format('DD/MM/YYYY h:mm a'),
            canceled_at: bracketOrder.canceled_at && moment(bracketOrder.canceled_at).format('DD/MM/YYYY h:mm a'),
            replaced_at: bracketOrder.replaced_at && moment(bracketOrder.replaced_at).format('DD/MM/YYYY h:mm a'),
    
            // --- Stop Loss Leg Details ---
            stop_qty: bracketOrder.legs && bracketOrder.legs[1].qty,
            stop_filled_qty: bracketOrder.legs && bracketOrder.legs[1].filled_qty,
            stop_side: bracketOrder.legs && bracketOrder.legs[1].side,
            stop_type: bracketOrder.legs && bracketOrder.legs[1].type,
            stop_stop_price: bracketOrder.legs && bracketOrder.legs[1].stop_price,
            stop_filled_avg_price: bracketOrder.legs && bracketOrder.legs[1].filled_avg_price,
            stop_ammount: bracketOrder.legs && bracketOrder.legs[1].qty*bracketOrder.legs[1].filled_avg_price,
            stop_status: bracketOrder.legs && bracketOrder.legs[1].status,
            stop_submitted_at: bracketOrder.legs && bracketOrder.legs[1].submitted_at && moment(bracketOrder.legs[1].submitted_at).format('DD/MM/YYYY h:mm a'),
            stop_filled_at: bracketOrder.legs && bracketOrder.legs[1].filled_at && moment(bracketOrder.legs[1].filled_at).format('DD/MM/YYYY h:mm a'),
            stop_canceled_at: bracketOrder.legs && bracketOrder.legs[1].canceled_at && moment(bracketOrder.legs[1].canceled_at).format('DD/MM/YYYY h:mm a'),
            stop_replaced_at: bracketOrder.legs && bracketOrder.legs[1].replaced_at && moment(bracketOrder.legs[1].replaced_at).format('DD/MM/YYYY h:mm a'),
    
            // --- Take Profit Leg (Limit) Details ---
            limit_qty: bracketOrder.legs && bracketOrder.legs[0].qty,
            limit_filled_qty: bracketOrder.legs && bracketOrder.legs[0].filled_qty,
            limit_side: bracketOrder.legs && bracketOrder.legs[0].side,
            limit_type: bracketOrder.legs && bracketOrder.legs[0].type,       
            limit_limit_price: bracketOrder.legs && bracketOrder.legs[0].limit_price,
            limit_filled_avg_price: bracketOrder.legs && bracketOrder.legs[0].filled_avg_price,
            limit_ammount: bracketOrder.legs && bracketOrder.legs[0].qty*bracketOrder.legs[0].filled_avg_price,
            limit_status: bracketOrder.legs && bracketOrder.legs[0].status,
            limit_submitted_at: bracketOrder.legs && bracketOrder.legs[0].submitted_at && moment(bracketOrder.legs[0].submitted_at).format('DD/MM/YYYY h:mm a'),
            limit_filled_at: bracketOrder.legs && bracketOrder.legs[0].filled_at && moment(bracketOrder.legs[0].filled_at).format('DD/MM/YYYY h:mm a'),
            limit_canceled_at: bracketOrder.legs && bracketOrder.legs[0].canceled_at && moment(bracketOrder.legs[0].canceled_at).format('DD/MM/YYYY h:mm a'),
            limit_replaced_at: bracketOrder.legs && bracketOrder.legs[0].replaced_at && moment(bracketOrder.legs[0].replaced_at).format('DD/MM/YYYY h:mm a'),

            // --- Market Sell Order Details (initialized as null) ---
            // These fields will be populated if a matching market sell order is found.
            market_qty: null,
            market_filled_qty: null,
            market_side: null,
            market_type: null,      
            market_limit_price: null,
            market_filled_avg_price: null,
            market_ammount: null,
            market_status: null,
            market_submitted_at: null,
            market_filled_at: null,
            market_canceled_at: null,
        }               
    })
  
    // Map over the organized trades to find and attach their corresponding market sell orders.
    const finalOrdersList = organizedTrades.map((order) => {
        // Find a market sell order that matches the symbol, quantity, and cancellation time of the limit order leg.
        // This logic assumes that a market sell order is placed immediately after the take-profit limit order is canceled.
        var foundMarketSellOrder = marketSellOrders.find(marketSellOrder => (marketSellOrder.symbol === order.symbol) && 
                                (marketSellOrder.qty === order.filled_qty || marketSellOrder.qty == (order.limit_qty - order.limit_filled_qty)) &&
                                order.limit_canceled_at && order.limit_canceled_at === moment(marketSellOrder.submitted_at).format('DD/MM/YYYY h:mm a'))

        // If a matching market sell order is found, merge its details into the trade object.
        if(foundMarketSellOrder){
            return {
                ...order,
                market_qty: foundMarketSellOrder.qty,
                market_filled_qty: foundMarketSellOrder.filled_qty,
                market_side: foundMarketSellOrder.side,
                market_type: foundMarketSellOrder.type,       
                market_limit_price: foundMarketSellOrder.limit_price,
                market_filled_avg_price: foundMarketSellOrder.filled_avg_price,
                market_ammount: foundMarketSellOrder.qty*foundMarketSellOrder.filled_avg_price,
                market_status: foundMarketSellOrder.status,
                market_submitted_at: foundMarketSellOrder.submitted_at && moment(foundMarketSellOrder.submitted_at).format('DD/MM/YYYY h:mm a'),
                market_filled_at: foundMarketSellOrder.filled_at && moment(foundMarketSellOrder.filled_at).format('DD/MM/YYYY h:mm a'),
                market_canceled_at: foundMarketSellOrder.canceled_at && moment(foundMarketSellOrder.canceled_at).format('DD/MM/YYYY h:mm a'),
            }
        }
        else{
            // If no matching market sell order is found, return the original trade object.
            return order
        }        
    });   

    // Send the final, comprehensive list of trades as a JSON response.
    res.json(finalOrdersList)
    
}
