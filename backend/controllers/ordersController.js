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

    //Organize info in JSON
    const organizedTrades = response.data.map((bracketOrder) => {
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
          submitted_at: bracketOrder.submitted_at && moment(bracketOrder.submitted_at).format('DD/MM/YYYY h:mm:ss a'),
          filled_at: bracketOrder.filled_at && moment(bracketOrder.filled_at).format('DD/MM/YYYY h:mm:ss a'),
          canceled_at: bracketOrder.canceled_at && moment(bracketOrder.canceled_at).format('DD/MM/YYYY h:mm:ss a'),
          replaced_at: bracketOrder.replaced_at && moment(bracketOrder.replaced_at).format('DD/MM/YYYY h:mm:ss a'),

          stop_qty: bracketOrder.legs && bracketOrder.legs[1].qty,
          stop_filled_qty: bracketOrder.legs && bracketOrder.legs[1].filled_qty,
          stop_side: bracketOrder.legs && bracketOrder.legs[1].side,
          stop_type: bracketOrder.legs && bracketOrder.legs[1].type,
          stop_stop_price: bracketOrder.legs && bracketOrder.legs[1].stop_price,
          stop_filled_avg_price: bracketOrder.legs && bracketOrder.legs[1].filled_avg_price,
          stop_ammount: bracketOrder.legs && bracketOrder.legs[1].qty*bracketOrder.legs[1].filled_avg_price,
          stop_status: bracketOrder.legs && bracketOrder.legs[1].status,
          stop_submitted_at: bracketOrder.legs && bracketOrder.legs[1].submitted_at && moment(bracketOrder.legs[1].submitted_at).format('DD/MM/YYYY h:mm:ss a'),
          stop_filled_at: bracketOrder.legs && bracketOrder.legs[1].filled_at && moment(bracketOrder.legs[1].filled_at).format('DD/MM/YYYY h:mm:ss a'),
          stop_canceled_at: bracketOrder.legs && bracketOrder.legs[1].canceled_at && moment(bracketOrder.legs[1].canceled_at).format('DD/MM/YYYY h:mm:ss a'),
          stop_replaced_at: bracketOrder.legs && bracketOrder.legs[1].replaced_at && moment(bracketOrder.legs[1].replaced_at).format('DD/MM/YYYY h:mm:ss a'),

          limit_qty: bracketOrder.legs && bracketOrder.legs[0].qty,
          limit_filled_qty: bracketOrder.legs && bracketOrder.legs[0].filled_qty,
          limit_side: bracketOrder.legs && bracketOrder.legs[0].side,
          limit_type: bracketOrder.legs && bracketOrder.legs[0].type,       
          limit_limit_price: bracketOrder.legs && bracketOrder.legs[0].limit_price,
          limit_filled_avg_price: bracketOrder.legs && bracketOrder.legs[0].filled_avg_price,
          limit_ammount: bracketOrder.legs && bracketOrder.legs[0].qty*bracketOrder.legs[0].filled_avg_price,
          limit_status: bracketOrder.legs && bracketOrder.legs[0].status,
          limit_submitted_at: bracketOrder.legs && bracketOrder.legs[0].submitted_at && moment(bracketOrder.legs[0].submitted_at).format('DD/MM/YYYY h:mm:ss a'),
          limit_filled_at: bracketOrder.legs && bracketOrder.legs[0].filled_at && moment(bracketOrder.legs[0].filled_at).format('DD/MM/YYYY h:mm:ss a'),
          limit_canceled_at: bracketOrder.legs && bracketOrder.legs[0].canceled_at && moment(bracketOrder.legs[0].canceled_at).format('DD/MM/YYYY h:mm:ss a'),
          limit_replaced_at: bracketOrder.legs && bracketOrder.legs[0].replaced_at && moment(bracketOrder.legs[0].replaced_at).format('DD/MM/YYYY h:mm:ss a'),
        }  
      })

    res.json(organizedTrades)
    
}
