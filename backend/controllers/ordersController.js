import axios from "axios";
import moment from 'moment';

export async function getAllOrders(req, res) {
 
 
    const response = await axios({
        method: 'get',
        url: `${process.env.ALPACA_API_ENDPOINT}/${process.env.ALPACA_API_VERSION}/orders`,
        headers: {
            'APCA-API-KEY-ID': `${process.env.ALPACA_KEY_ID}`,
            'APCA-API-SECRET-KEY': `${process.env.ALPACA_SECRET_KEY}`,
        },
        params: req.query
    });

    //Filter all filled trades
    const filledOrders = response.data.filter(order => order.status === 'filled' && order.type === 'limit')

    //Join market sells to the correct bracket trade where no limit or stop sells were executed.
    const marketSellOrders = response.data.filter(order => order.type === 'market')

    //Organize info in JSON
    const organizedTrades = filledOrders.map((bracketOrder) => {
        return {
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
        }               
    })
  
    //Adds the Maket Sells to the correct respective bracket orders.
    const finalOrdersList = organizedTrades.map((order) => {
        //Looks if there's a market sell order for this bracketOrder.
        var foundMarketSellOrder = marketSellOrders.find(marketSellOrder => (marketSellOrder.symbol === order.symbol) && 
                                (marketSellOrder.qty === order.qty) &&
                                order.limit_canceled_at && order.limit_canceled_at === moment(marketSellOrder.submitted_at).format('DD/MM/YYYY h:mm a'))
        if(foundMarketSellOrder){
            return {
                ...order,
                limit_qty: foundMarketSellOrder.qty,
                limit_filled_qty: foundMarketSellOrder.filled_qty,
                limit_side: foundMarketSellOrder.side,
                limit_type: foundMarketSellOrder.type,       
                limit_limit_price: foundMarketSellOrder.limit_price,
                limit_filled_avg_price: foundMarketSellOrder.filled_avg_price,
                limit_ammount: foundMarketSellOrder.qty*foundMarketSellOrder.filled_avg_price,
                limit_status: foundMarketSellOrder.status,
                limit_submitted_at: foundMarketSellOrder.submitted_at && moment(foundMarketSellOrder.submitted_at).format('DD/MM/YYYY h:mm a'),
                limit_filled_at: foundMarketSellOrder.filled_at && moment(foundMarketSellOrder.filled_at).format('DD/MM/YYYY h:mm a'),
                limit_canceled_at: foundMarketSellOrder.canceled_at && moment(foundMarketSellOrder.canceled_at).format('DD/MM/YYYY h:mm a'),
                limit_replaced_at: foundMarketSellOrder.replaced_at && moment(foundMarketSellOrder.replaced_at).format('DD/MM/YYYY h:mm a'),
            }
        }
        else{
            return order
        }        
    });   

    res.json(finalOrdersList)
    
}
