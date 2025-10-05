/**
 * @file trade_utils.js
 * @description This file contains the core utility functions that drive the pivot points trading strategy.
 * It includes logic for checking price crossovers against pivot points, monitoring potential trade setups,
 * creating and managing bracket orders with the Alpaca API, and handling various states of a trade.
 */

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/
import moment from "moment-timezone";
import Alpaca from "@alpacahq/alpaca-trade-api";
import PivotPoints from "../../../database_models/db_model_pivot_points.js";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          CONSTANTS
/*-----------------------------------------------------------------------------------------------------------------------*/
// Configuration options for the Alpaca API.
const alpacaOptions = {
	keyId: process.env.ALPACA_KEY_ID,
	secretKey: process.env.ALPACA_SECRET_KEY,
	paper: true, // Use paper trading account.
};

// --- Trade Parameters ---
const CASH_LIMIT_AVAILABLE_TO_BUY = 0.1; // Use only 10% of the account's buying power for a single trade.
const ENTRY_POINT_TOLERANCE = 0.01; // Place limit buy order $0.01 above the pivot point.
const SELL_POINT_TOLERANCE = 0.01; // Place take-profit limit sell order $0.01 below the next pivot point.
const STOP_LOSS_RISK_REWARD_RATIO = 1/3; // Defines the stop loss as one-third of the potential profit distance.

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/
// Instantiate the ALPACA API with configuration options.
const alpaca = new Alpaca(alpacaOptions);

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          HELPERS
/*-----------------------------------------------------------------------------------------------------------------------*/

/**
 * @async
 * @function monitor
 * @description Updates the database to start monitoring a stock after its price has crossed a pivot point.
 * This function creates a 'monitoring' object in the database for the given ticker.
 * @param {string} pivotPointName - The name of the pivot point that was crossed (e.g., 's2', 'pivot', 'r1').
 * @param {number} pointPrice - The price of the pivot point that was crossed.
 * @param {number} nextPointPrice - The price of the next pivot point, which serves as the potential target.
 * @param {object} bar - The current bar data that triggered the crossover.
 */
const monitor = async (pivotPointName, pointPrice, nextPointPrice, bar) => {      
    
    PivotPoints.findOneAndUpdate(
        { _id: bar.S },
        {
            $set: {                
                monitoring: {
                    pointName: pivotPointName,
                    pointPrice: pointPrice,
                    nextPointPrice: nextPointPrice,
                    upOneFourth: bar.h >= (pointPrice + (nextPointPrice - pointPrice)/4), // Check if the high of the crossover bar already met the 1/4 condition.
                    orderIDs: null, // Initialize orderIDs as null.
                    timeUpdated: moment().tz('America/New_York').toString(),
                },                
            },
        }
    ).then(async (doc) => {        
        // After creating the new monitoring object, immediately check if it meets the condition to place an order.
        await checkUpOneFourthNewMonitoring(bar, pointPrice, nextPointPrice)       
                    
    }).catch(err => {
        console.log(bar.S + ` - Error creating monitoring Object: ` + err)
        console.log(bar.S + ' - pivotPointName: ' + pivotPointName)
    });
         
}

/**
 * @async
 * @function checkUpOneFourthNewMonitoring
 * @description Checks if the price has risen by 25% of the distance to the next pivot point immediately after a new crossover.
 * If the condition is met, it triggers the creation of a bracket order.
 * @param {object} currentBar - The current bar data.
 * @param {number} pointPrice - The price of the pivot point that was crossed.
 * @param {number} nextPointPrice - The price of the next pivot point (the target).
 */
const checkUpOneFourthNewMonitoring = async (currentBar, pointPrice, nextPointPrice) =>{            
    // Condition: The bar's close is above the pivot and its high has reached at least 25% of the way to the next pivot.
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
                    // If the condition is met, create the bracket order.
                    await createBracketOrder(currentBar.S, pointPrice, nextPointPrice)  
                }).catch(err=> console.log(currentBar.S + ` - Error updating monitoring.upOneFourth Object. ` + err));  
    }
}

/**
 * @async
 * @function checkUpOneFourthOldMonitoring
 * @description Similar to `checkUpOneFourthNewMonitoring`, but for a monitoring object that already exists from a previous bar.
 * If the 1/4 condition is not met, it proceeds to check for a new crossover.
 * @param {object} currentBar - The current bar data.
 * @param {object} pivotPointsData - The complete pivot point and monitoring data for the ticker from the database.
 */
const checkUpOneFourthOldMonitoring = async (currentBar, pivotPointsData) =>{            
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
                    await createBracketOrder(currentBar.S, pivotPointsData.monitoring.pointPrice, pivotPointsData.monitoring.nextPointPrice)  
                }).catch(err=> console.log(currentBar.S + ' - Error updating monitoring.upOneFourth Object. ' + err));  
    }
    else{
        // If the 1/4 condition is not met, check if the price has crossed a different pivot point.
        await checkForCrossover(currentBar, pivotPointsData)
    }
}

/**
 * @async
 * @function checkForCrossover
 * @description Checks if the current bar's price has crossed any of the daily pivot points in an upward direction.
 * It compares the current bar's open and close to the previous bar's close to determine if a crossover occurred.
 * @param {object} currentBar - The current bar data.
 * @param {object} pivotPointsData - The pivot point data for the ticker from the database.
 */
const checkForCrossover = async (currentBar, pivotPointsData) => {
    let pivotPoints = pivotPointsData.pivotPoints;   

    // Logic for crossing Support 3 (S3)
    if ((currentBar.o <= pivotPoints.dailyPivotPoints.s3 && currentBar.c > pivotPoints.dailyPivotPoints.s3) ||
        (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.s3 && currentBar.c > pivotPoints.dailyPivotPoints.s3)) {      
        await monitor('s3', pivotPoints.dailyPivotPoints.s3, pivotPoints.dailyPivotPoints.s2, currentBar);     
    }

    // Logic for crossing Support 2 (S2)
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.s3 && currentBar.o <= pivotPoints.dailyPivotPoints.s2 && currentBar.c > pivotPoints.dailyPivotPoints.s2) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.s2 && currentBar.c > pivotPoints.dailyPivotPoints.s2)) {        
        await monitor('s2', pivotPoints.dailyPivotPoints.s2, pivotPoints.dailyPivotPoints.s1, currentBar);
    } 

    // Logic for crossing Support 1 (S1)
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.s2 && currentBar.o <= pivotPoints.dailyPivotPoints.s1 && currentBar.c > pivotPoints.dailyPivotPoints.s1) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.s1 && currentBar.c > pivotPoints.dailyPivotPoints.s1)) {
        await monitor('s1', pivotPoints.dailyPivotPoints.s1, pivotPoints.dailyPivotPoints.pivot, currentBar);  
    } 
    
    // Logic for crossing the central Pivot Point (P)
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.s1 && currentBar.o <= pivotPoints.dailyPivotPoints.pivot && currentBar.c > pivotPoints.dailyPivotPoints.pivot) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.pivot && currentBar.c > pivotPoints.dailyPivotPoints.pivot)) {
        await monitor('pivot', pivotPoints.dailyPivotPoints.pivot, pivotPoints.dailyPivotPoints.r1, currentBar);  
    } 
    
    // Logic for crossing Resistance 1 (R1)
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.pivot && currentBar.o <= pivotPoints.dailyPivotPoints.r1 && currentBar.c > pivotPoints.dailyPivotPoints.r1) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.r1 && currentBar.c > pivotPoints.dailyPivotPoints.r1)) {
        await monitor('r1', pivotPoints.dailyPivotPoints.r1, pivotPoints.dailyPivotPoints.r2, currentBar);  
    } 
    
    // Logic for crossing Resistance 2 (R2)
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.r1 && currentBar.o <= pivotPoints.dailyPivotPoints.r2 && currentBar.c > pivotPoints.dailyPivotPoints.r2) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.r2 && currentBar.c > pivotPoints.dailyPivotPoints.r2)) {
        await monitor('r2', pivotPoints.dailyPivotPoints.r2, pivotPoints.dailyPivotPoints.r3, currentBar);  
    } 
    
    // Logic for crossing Resistance 3 (R3) - No buy signal here.
    else if ((currentBar.o > pivotPoints.dailyPivotPoints.r2 && currentBar.o <= pivotPoints.dailyPivotPoints.r3 && currentBar.c > pivotPoints.dailyPivotPoints.r3) ||
    (pivotPointsData.latestMinuteBar && pivotPointsData.latestMinuteBar.c < pivotPoints.dailyPivotPoints.r3 && currentBar.c > pivotPoints.dailyPivotPoints.r3)) {
        //console.log(currentBar.S + ' - Crossed R3, DONT BUY!!!!. Time: ' + moment().tz('America/New_York').toString())
    }
}

/**
 * @async
 * @function cancelOrders
 * @description Cancels all three legs of a bracket order (buy, take-profit, stop-loss).
 * @param {string} ticker - The stock ticker symbol.
 * @param {object} orderIDs - An object containing the IDs of the buy, profit, and stop orders.
 */
const cancelOrders = async (ticker, orderIDs) => {  
    if(orderIDs){
        await alpaca.cancelOrder(orderIDs.buy)
        await alpaca.cancelOrder(orderIDs.profit)
        await alpaca.cancelOrder(orderIDs.stop)
        console.log(ticker + ` - Orders have been cancelled.`)
    }  
}

/**
 * @async
 * @function createBracketOrder
 * @description Creates a bracket order using the Alpaca API.
 * The order consists of a limit buy order, a take-profit limit sell order, and a stop-loss sell order.
 * @param {string} ticker - The stock ticker symbol.
 * @param {number} pointPrice - The price of the pivot point used as the basis for the entry price.
 * @param {number} nextPointPrice - The price of the next pivot point, used as the basis for the take-profit price.
 */
const createBracketOrder = async (ticker, pointPrice, nextPointPrice) => {
    // Get account details to determine buying power.
    alpaca.getAccount()
        .then( async (account) => {
            // Create the bracket order.
            alpaca.createOrder({
                symbol: ticker,
                qty: Math.ceil(account.non_marginable_buying_power*CASH_LIMIT_AVAILABLE_TO_BUY/parseFloat((pointPrice + ENTRY_POINT_TOLERANCE).toFixed(2))), // Calculate quantity based on available cash and entry price.
                side: 'buy',
                type: 'limit',
                time_in_force: 'day',
                limit_price: parseFloat((pointPrice + ENTRY_POINT_TOLERANCE).toFixed(2)), // Set limit buy price slightly above the pivot.
                order_class: 'bracket',
                take_profit: {
                    "limit_price": parseFloat((nextPointPrice - SELL_POINT_TOLERANCE).toFixed(2)) // Set take-profit price slightly below the next pivot.
                },
                stop_loss: {
                    "stop_price": parseFloat(pointPrice - ((nextPointPrice - pointPrice)*STOP_LOSS_RISK_REWARD_RATIO)).toFixed(2), // Set stop-loss based on the risk/reward ratio.
                }
            }).then( async (order) => {
                console.log(ticker + ` - Orders created. Time: ${moment().tz('America/New_York').toString()}`);
                // After creating the order, update the database with the new order IDs for tracking.
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

/**
 * @async
 * @function isThereOpenOrders
 * @description Checks if the take-profit and stop-loss legs of a bracket order are still open (not filled or canceled).
 * @param {object} orderIDs - An object containing the IDs of the profit and stop orders.
 * @returns {Promise<boolean>} A promise that resolves to true if both orders are open, false otherwise.
 */
const isThereOpenOrders = async (orderIDs) => {
    let profitOrder = await alpaca.getOrder(orderIDs.profit)
	let stopOrder = await alpaca.getOrder(orderIDs.stop)
	return (profitOrder.filled_at == null && stopOrder.filled_at == null) &&
            (profitOrder.canceled_at == null && stopOrder.canceled_at == null)
}

/**
 * @async
 * @function isOrderFilled
 * @description Checks if a specific order has been filled.
 * @param {string} orderID - The ID of the order to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the order is filled, false otherwise.
 */
const isOrderFilled = async (orderID) => {
    let order = await alpaca.getOrder(orderID);    
    return !(order.filled_at == null);
}

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

/**
 * @async
 * @function checkOportunities
 * @description This is the main decision-making function that is executed for each incoming bar.
 * It orchestrates the entire trading logic by checking the state of a trade (e.g., no monitoring, monitoring, orders placed)
 * and calling the appropriate helper functions.
 * @param {object} currentBar - The current bar data from the WebSocket stream.
 * @param {object} pivotPointsData - The pivot point and monitoring data for the ticker from the database.
 * @param {number} barsHour - The hour of the current bar's timestamp.
 * @param {number} barsMinute - The minute of the current bar's timestamp.
 */
export const checkOportunities = async (currentBar, pivotPointsData, barsHour, barsMinute) => {
    // State 1: No previous monitoring for this ticker.
    if(!pivotPointsData.monitoring){
        // Start by checking for a new pivot point crossover.
        await checkForCrossover(currentBar, pivotPointsData);
    }
    // State 2: A monitoring object already exists.
    else {
        // State 2a: Orders have already been placed.
        if(pivotPointsData.monitoring.orderIDs){
            // Check if the take-profit and stop-loss orders are still active.
            if(await isThereOpenOrders(pivotPointsData.monitoring.orderIDs)){
                // Check if the initial buy order has been filled.
                if( await isOrderFilled(pivotPointsData.monitoring.orderIDs.buy)){
                    // Position is currently held, do nothing and wait for take-profit or stop-loss to hit.
                }
                // The buy order is still pending.
                else { 
                    // If it's near the end of the trading day, cancel the pending order.
					if (barsHour >= 15 && barsMinute >= 30) {
						await cancelOrders(currentBar.S, pivotPointsData.monitoring.orderIDs);
					}
                    // If the price has moved up by 50% of the distance to the next pivot, cancel the pending order as the opportunity might be missed.
                    if(currentBar.c > (pivotPointsData.monitoring.pointPrice + (pivotPointsData.monitoring.nextPointPrice - pivotPointsData.monitoring.pointPrice)*0.5)){
                        await cancelOrders(currentBar.S, pivotPointsData.monitoring.orderIDs);
                        // After canceling, check for a new crossover opportunity.
                        await checkForCrossover(currentBar, pivotPointsData);
                    } 
                }
            }
            // The take-profit or stop-loss order has been filled or canceled.
            else{
                // The trade is complete, so look for a new crossover opportunity.
                await checkForCrossover(currentBar, pivotPointsData);
            }
        }
        // State 2b: Monitoring, but no orders placed yet.
        else{    
            // Check if the price has moved 1/4 of the way to the next pivot to trigger an order.
            await checkUpOneFourthOldMonitoring(currentBar, pivotPointsData)
        }                      
    } 
    
    // After all checks, update the database with the latest bar data for the next iteration.
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