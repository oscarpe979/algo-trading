/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/
import moment from "moment-timezone";
import Alpaca from "@alpacahq/alpaca-trade-api";
import PivotPoints from "../../../database_models/db_model_pivot_points.js";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          CONSTANTS
/*-----------------------------------------------------------------------------------------------------------------------*/
const alpacaOptions = {
	keyId: process.env.ALPACA_KEY_ID,
	secretKey: process.env.ALPACA_SECRET_KEY,
	paper: true,
};

const CASH_LIMIT_AVAILABLE_TO_BUY = 0.1; // Only 10% of the account is available to trade
const ENTRY_POINT_TOLERANCE = 0.01; // 1 cents over the point.
const SELL_POINT_TOLERANCE = 0.01; // 1 cents under the point.
const STOP_LOSS_RISK_REWARD_RATIO = 1/3; // Stops are when price hits 99.1% of the Entry Price.

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/
// Instantiate the ALPACA API with configuration options
const alpaca = new Alpaca(alpacaOptions);

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          HELPERS
/*-----------------------------------------------------------------------------------------------------------------------*/

const monitor = async (pivotPointName, pointPrice, nextPointPrice, bar) => {      
    
    PivotPoints.findOneAndUpdate(
        { _id: bar.S },
        {
            $set: {                
                monitoring: {
                    pointName: pivotPointName, // S3, S2, S1, PIVOTE, R1, R2
                    pointPrice: pointPrice,
                    nextPointPrice: nextPointPrice,
                    upOneFourth: bar.h >= (pointPrice + (nextPointPrice - pointPrice)/4), // Checks if price went up one fourth of the way up
                    orderIDs: null, 
                    timeUpdated: moment().tz('America/New_York').toString(),
                },                
            },
        }
    ).then(async (doc) => {        
        console.log(bar.S + ` - Monitoring new ${pivotPointName} crossover. Time: ${moment().tz('America/New_York').toString()}...`);  
        await checkUpOneFourthNewMonitoring(bar, pointPrice, nextPointPrice)       
                    
    }).catch(err => {
        console.log(bar.S + ` - Error creating monitoring Object: ` + err)
        console.log(bar.S + ' - pivotPointName: ' + pivotPointName)
    });
         
}

const checkUpOneFourthNewMonitoring = async (currentBar, pointPrice, nextPointPrice) =>{            
       // If the price is up one fourth, place an order just in front of the pivot point.
    if(currentBar.c > pointPrice && 
            currentBar.h >= (pointPrice + (nextPointPrice - pointPrice)/4)){
                PivotPoints.findOneAndUpdate(
                    { _id: currentBar.S },
                    {
                        $set: {                
                            "monitoring.upOneFourth": true,               
                        },
                    }
                ).then(async (doc) => {        
                    console.log(currentBar.S + ` - Reached one fourth up. Time: ${moment().tz('America/New_York').toString()}`);
                    // Create Bracket order using Alpaca     
                    await createBracketOrder(currentBar.S, pointPrice, nextPointPrice)  
                }).catch(err=> console.log(currentBar.S + ` - Error updating monitoring.upOneFourth Object. ` + err));  
    }
    else{
        console.log(currentBar.S + ' - This bar has not reached 1/4 up.')
    }
}

const checkUpOneFourthOldMonitoring = async (currentBar, pivotPointsData) =>{            
    // If the price is up one fourth, place an order just in front of the pivot point.
    if(currentBar.c > pivotPointsData.monitoring.pointPrice && 
            currentBar.h >= (pivotPointsData.monitoring.pointPrice + (pivotPointsData.monitoring.nextPointPrice - pivotPointsData.monitoring.pointPrice)/4)){
                PivotPoints.findOneAndUpdate(
                    { _id: currentBar.S },
                    {
                        $set: {                
                            "monitoring.upOneFourth": true,               
                        },
                    }
                ).then(async (doc) => {        
                    console.log(currentBar.S + ` - Reached one fourth up (after old monitoring). Time: ${moment().tz('America/New_York').toString()}`);
                    // Create Bracket order using Alpaca     
                    await createBracketOrder(currentBar.S, pivotPointsData.monitoring.pointPrice, pivotPointsData.monitoring.nextPointPrice)  
                }).catch(err=> console.log(currentBar.S + ' - Error updating monitoring.upOneFourth Object. ' + err));  
    }
    else{
        console.log(currentBar.S + ' - This bar has not reached 1/4 up...')
        await checkForCrossover(currentBar, pivotPointsData)
    }
}

const checkForCrossover = async (currentBar, pivotPointsData) => {
    console.log(currentBar.S + ' - Checking crossover...')
    let pivotPoints = pivotPointsData.pivotPoints;   

    // Current Bar crossing S3
    if ((currentBar.o <= pivotPoints.dailyPivotPoints.s3 && currentBar.c > pivotPoints.dailyPivotPoints.s3) ||
        (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.s3 && currentBar.c > pivotPoints.dailyPivotPoints.s3)) {      
        console.log(currentBar.S + ' - Crossed S3. Time: ' + moment().tz('America/New_York').toString());
        await monitor('s3', pivotPoints.dailyPivotPoints.s3, pivotPoints.dailyPivotPoints.s2, currentBar);     
    }

    // Current Bar crossing S2 
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.s3 && currentBar.o <= pivotPoints.dailyPivotPoints.s2 && currentBar.c > pivotPoints.dailyPivotPoints.s2) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.s2 && currentBar.c > pivotPoints.dailyPivotPoints.s2)) {        
        console.log(currentBar.S + ' - Crossed S2. Time: ' + moment().tz('America/New_York').toString());
        await monitor('s2', pivotPoints.dailyPivotPoints.s2, pivotPoints.dailyPivotPoints.s1, currentBar);
    } 

    // Current Bar crossing S1
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.s2 && currentBar.o <= pivotPoints.dailyPivotPoints.s1 && currentBar.c > pivotPoints.dailyPivotPoints.s1) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.s1 && currentBar.c > pivotPoints.dailyPivotPoints.s1)) {
        console.log(currentBar.S + ' - Crossed S1. Time: ' + moment().tz('America/New_York').toString());
        await monitor('s1', pivotPoints.dailyPivotPoints.s1, pivotPoints.dailyPivotPoints.pivot, currentBar);  
    } 
    
    // Current Bar crossing PIVOT
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.s1 && currentBar.o <= pivotPoints.dailyPivotPoints.pivot && currentBar.c > pivotPoints.dailyPivotPoints.pivot) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.pivot && currentBar.c > pivotPoints.dailyPivotPoints.pivot)) {
        console.log(currentBar.S + ' - Crossed Pivot. Time: ' + moment().tz('America/New_York').toString());
        await monitor('pivot', pivotPoints.dailyPivotPoints.pivot, pivotPoints.dailyPivotPoints.r1, currentBar);  
    } 
    
    // Current Bar crossing R1
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.pivot && currentBar.o <= pivotPoints.dailyPivotPoints.r1 && currentBar.c > pivotPoints.dailyPivotPoints.r1) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.r1 && currentBar.c > pivotPoints.dailyPivotPoints.r1)) {
        console.log(currentBar.S + ' - Crossed R1. Time: ' + moment().tz('America/New_York').toString());
        await monitor('r1', pivotPoints.dailyPivotPoints.r1, pivotPoints.dailyPivotPoints.r2, currentBar);  
    } 
    
    // Current Bar crossing R2
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.r1 && currentBar.o <= pivotPoints.dailyPivotPoints.r2 && currentBar.c > pivotPoints.dailyPivotPoints.r2) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.r2 && currentBar.c > pivotPoints.dailyPivotPoints.r2)) {
        console.log(currentBar.S + ' - Crossed R2. Time: ' + moment().tz('America/New_York').toString());
        await monitor('r2', pivotPoints.dailyPivotPoints.r2, pivotPoints.dailyPivotPoints.r3, currentBar);  
    } 
    
    // Current Bar crossing R3
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.r2 && currentBar.o <= pivotPoints.dailyPivotPoints.r3 && currentBar.c > pivotPoints.dailyPivotPoints.r3) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.r3 && currentBar.c > pivotPoints.dailyPivotPoints.r3)) {
        console.log(currentBar.S + ' - Crossed R3, DONT BUY!!!!. Time: ' + moment().tz('America/New_York').toString())
    }
    
    else{
        console.log(currentBar.S + ' - No crossover found.')
    }
}

const cancelOrders = async (ticker, orderIDs) => {  
    if(orderIDs){
        await alpaca.cancelOrder(orderIDs.buy)
        await alpaca.cancelOrder(orderIDs.profit)
        await alpaca.cancelOrder(orderIDs.stop)
        console.log(ticker + ` - Orders have been cancelled.`)
    }  
}

const createBracketOrder = async (ticker, pointPrice, nextPointPrice) => {

    alpaca.getAccount()
        .then( async (account) => {
            alpaca.createOrder({
                symbol: ticker,
                qty: Math.ceil(account.non_marginable_buying_power*CASH_LIMIT_AVAILABLE_TO_BUY/parseFloat((pointPrice + ENTRY_POINT_TOLERANCE).toFixed(2))), // calculate quantity to buy.
                side: 'buy',
                type: 'limit',
                time_in_force: 'day',
                limit_price: parseFloat((pointPrice + ENTRY_POINT_TOLERANCE).toFixed(2)), // 0.0005% above our monitored pivot point. Rounded to 2 decimal places.
                order_class: 'bracket',
                take_profit: {
                    "limit_price": parseFloat((nextPointPrice - SELL_POINT_TOLERANCE).toFixed(2))
                },
                stop_loss: {
                    "stop_price": parseFloat(pointPrice - ((nextPointPrice - pointPrice)*STOP_LOSS_RISK_REWARD_RATIO)).toFixed(2), // Sell if price falls below 1% of the entry price.
                }
            }).then( async (order) => {
                console.log(ticker + ` - Orders created. Time: ${moment().tz('America/New_York').toString()}`);
                // console.log(`Orders Data: ${JSON.stringify(order)}.`);
                // Update orderIDs in monitoring object
                PivotPoints.findOneAndUpdate(
                    { _id: ticker },
                    {
                        $set: {                
                            "monitoring.orderIDs": {
                                buy: order.id,
                                profit: order.legs[0].id,
                                stop: order.legs[1].id
                            },               
                        },
                    }
                ).then((doc) => {        
                    console.log(ticker + ` - OrderIDs have been updated in database. Time: ${moment().tz('America/New_York').toString()}`);
                    
                }).catch(err=> {
                    console.log(ticker + ` - Error updating orderIDs: ` + err)                
                });
            })
        })      
}

const isThereOpenOrders = async (orderIDs) => {
    let profitOrder = await alpaca.getOrder(orderIDs.profit)
	let stopOrder = await alpaca.getOrder(orderIDs.stop)
	return (profitOrder.filled_at == null && stopOrder.filled_at == null) &&
            (profitOrder.canceled_at == null && stopOrder.canceled_at == null)
}

const isOrderFilled = async (orderID) => {
    let order = await alpaca.getOrder(orderID);    
    return !(order.filled_at == null);
}

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

// Executes every 60s when Alpaca Socket sends a bar.
export const checkOportunities = async (currentBar, pivotPointsData, barsHour, barsMinute) => {
    if(!pivotPointsData.monitoring){
        console.log(currentBar.S + ' - No previous monitoring...')        
        await checkForCrossover(currentBar, pivotPointsData);
    }
    
    else {
        console.log(currentBar.S + ' - There is an existing monitoring object...')
        if(pivotPointsData.monitoring.orderIDs){
            console.log(currentBar.S + ' - There are orders already put in place...')
            if(await isThereOpenOrders(pivotPointsData.monitoring.orderIDs)){
                console.log(currentBar.S + ' - Orders are still open...')
                if( await isOrderFilled(pivotPointsData.monitoring.orderIDs.buy)){
                    console.log(currentBar.S + ' - We are currently holding a position.')                
                }
                else { 
                    // Closes pending orders if it's 3:30pm
					if (barsHour >= 15 && barsMinute >= 30) {
						await cancelOrders(currentBar.S, pivotPointsData.monitoring.orderIDs);
					}
                    // Cancels Orders if they are too close to the next Pivot Point up. (50% of the distance)
                    if(currentBar.c > (pivotPointsData.monitoring.pointPrice + (pivotPointsData.monitoring.nextPointPrice - pivotPointsData.monitoring.pointPrice)*0.5)){
                        console.log(currentBar.S + ' - Current bar has crossed next pivot point...')
                        await cancelOrders(currentBar.S, pivotPointsData.monitoring.orderIDs);
                        await checkForCrossover(currentBar, pivotPointsData);
                    } 

                    else{
                        console.log(currentBar.S + ' - Waiting for price drop to start a position.')
                    }                   
                }
            }
            else{
                console.log(currentBar.S + ' - Orders are closed...')
                await checkForCrossover(currentBar, pivotPointsData);
            }
        }
        else{    
            console.log(currentBar.S + ' - No orders put in place yet...')           
            await checkUpOneFourthOldMonitoring(currentBar, pivotPointsData)
        }                      
    } 
    
    //Save Current bar in DB
    await PivotPoints.findOneAndUpdate(
        { _id: currentBar.S },
        {
            $set: {
                latestMinuteBar: currentBar
            },
        }
    ).catch((err) =>
    console.log(
        "Error updating latest minute bar for " + ticker + ": " + err
    )
);
}


/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/

export default { checkOportunities };
