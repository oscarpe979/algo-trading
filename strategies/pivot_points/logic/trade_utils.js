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
const ENTRY_POINT_TOLERANCE = 1.001;
const SELL_POINT_TOLERANCE = 0.9923;
const STOP_LOSS_TOLERANCE = 0.995; // Stops are when price hits 99.1% of the Entry Price.

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/
// Instantiate the ALPACA API with configuration options
const alpaca = new Alpaca(alpacaOptions);

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          HELPERS
/*-----------------------------------------------------------------------------------------------------------------------*/

const monitor = (pivotPointName, pivotPointPrice, nextPivotPointPrice, bar, monitoring) => {      
    
    // If theres already orders in place for current pivot point, don't do anything.
    if(monitoring && monitoring.pointName === pivotPointName && monitoring.orderIDs)
        return; 

    PivotPoints.findOneAndUpdate(
        { _id: bar.S },
        {
            $set: {                
                monitoring: {
                    pointName: pivotPointName, // S3, S2, S1, PIVOTE, R1, R2
                    pointPrice: pivotPointPrice,
                    nextPointPrice: nextPivotPointPrice,
                    upOneFourth: bar.h >= (pivotPointPrice + (nextPivotPointPrice - pivotPointPrice)/4), // Checks if price went up one fourth of the way up
                    orderIDs: null, 
                    timeUpdated: moment().tz('America/New_York').toString(),
                },                
            },
        }
    ).then((doc) => {        
        console.log(`Monitoring new ${pivotPointName} crossover in ${bar.S}. Time: ${moment().tz('America/New_York').toString()}`);  
            
        // Cancel Ticker Orders if there are any deriving from a previous monitoring. Only fires if there is orders of a lower Pivot Point.
        if(monitoring && monitoring.pointName != pivotPointName && monitoring.orderIDs){         
            console.log("Orders for " + monitoring.pointName + "have been canceled.")
            cancelOrders(monitoring.orderIDs);   
        }     
                    
    }).catch(err => {
        console.log(`Error creating monitoring Object for ${bar.S}: ` + err)
        console.log('monitoring: ' + monitoring)
        console.log('pivotPointName: ' + pivotPointName)
    });
         
}

const checkUpOneFourth = (currentBar, pivotPointsData) =>{

    // If monitoring object doesn't exit OR if there are orders already put in place, don't do anything.
    if(!pivotPointsData.monitoring || pivotPointsData.monitoring.orderIDs)        
        return;
           
    // If bar.c < monitoring.pointPrice, delete monitoring object.
    if(currentBar.c < pivotPointsData.monitoring.pointPrice) {
        PivotPoints.findOneAndUpdate(
            { _id: currentBar.S },
            {
                $set: {                
                    monitoring: null,               
                },
            }
        ).then((doc) => {        
            console.log(`Price of ${currentBar.S} went below ${pivotPointsData.monitoring.pointPrice} - ${pivotPointsData.monitoring.pointName}`); 
            console.log(`No longer monitoring ${currentBar.S}. Time: ${moment().tz('America/New_York').toString()}`); 
        }).catch(err=> console.log(`Error deleting monitoring Object for ${currentBar.S}: ` + err));             
    }

    // If the price is up one fourth, place an order just in front of the pivot point.
    else if(currentBar.c > pivotPointsData.monitoring.pointPrice && 
            currentBar.h >= (pivotPointsData.monitoring.pointPrice + (pivotPointsData.monitoring.nextPointPrice - pivotPointsData.monitoring.pointPrice)/4)){
                PivotPoints.findOneAndUpdate(
                    { _id: currentBar.S },
                    {
                        $set: {                
                            "monitoring.upOneFourth": true,               
                        },
                    }
                ).then((doc) => {        
                    console.log(`${currentBar.S} has reached one fourth up. Time: ${moment().tz('America/New_York').toString()}`);

                    // Create Bracket order using Alpaca     
                    createBracketOrder(currentBar.S, pivotPointsData.monitoring)  
                }).catch(err=> console.log(`Error updating monitoring.upOneFourth Object for ${bar.S}: ` + err));  
    }
}

const checkForCrossover = (currentBar, pivotPointsData) => {

    let pivotPoints = pivotPointsData.pivotPoints;    

    // Current Bar crossing S3
    if (currentBar.o <= pivotPoints.dailyPivotPoints.s3 && currentBar.c > pivotPoints.dailyPivotPoints.s3) {      
        console.log(currentBar.S + ' Crossed S3');
        monitor('s3', pivotPoints.dailyPivotPoints.s3, pivotPoints.dailyPivotPoints.s2, currentBar, pivotPointsData.monitoring);     
    }

    // Current Bar crossing S2 
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.s3 &&
        currentBar.o <= pivotPoints.dailyPivotPoints.s2 && currentBar.c > pivotPoints.dailyPivotPoints.s2
    ) {        
        console.log(currentBar.S + ' Crossed S2');
        monitor('s2', pivotPoints.dailyPivotPoints.s2, pivotPoints.dailyPivotPoints.s1, currentBar, pivotPointsData.monitoring);
    } 

    // Current Bar crossing S1
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.s2 &&
        currentBar.o <= pivotPoints.dailyPivotPoints.s1 && currentBar.c > pivotPoints.dailyPivotPoints.s1
    ) {
        console.log(currentBar.S + ' Crossed S1');
        monitor('s1', pivotPoints.dailyPivotPoints.s1, pivotPoints.dailyPivotPoints.pivot, currentBar, pivotPointsData.monitoring);  
    } 
    
    // Current Bar crossing PIVOT
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.s1 &&
        currentBar.o <= pivotPoints.dailyPivotPoints.pivot && currentBar.c > pivotPoints.dailyPivotPoints.pivot
    ) {
        console.log(currentBar.S + ' Crossed Pivot');
        monitor('pivot', pivotPoints.dailyPivotPoints.pivot, pivotPoints.dailyPivotPoints.r1, currentBar, pivotPointsData.monitoring);  
    } 
    
    // Current Bar crossing R1
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.pivot &&
        currentBar.o <= pivotPoints.dailyPivotPoints.r1 && currentBar.c > pivotPoints.dailyPivotPoints.r1
    ) {
        console.log(currentBar.S + ' Crossed R1');
        monitor('r1', pivotPoints.dailyPivotPoints.r1, pivotPoints.dailyPivotPoints.r2, currentBar, pivotPointsData.monitoring);  
    } 
    
    // Current Bar crossing R2
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.ri &&
        currentBar.o <= pivotPoints.dailyPivotPoints.r2 && currentBar.c > pivotPoints.dailyPivotPoints.r2
    ) {
        console.log(currentBar.S + ' Crossed R2');
        monitor('r2', pivotPoints.dailyPivotPoints.r2, pivotPoints.dailyPivotPoints.r3, currentBar, pivotPointsData.monitoring);  
    } 
    
    // Current Bar crossing R3
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.r2 &&
        currentBar.o <= pivotPoints.dailyPivotPoints.r3 && currentBar.c > pivotPoints.dailyPivotPoints.r3
    ) {
        console.log(currentBar.S + ' Crossed R3, DONT BUY!!!!')
    }
}

const cancelOrders = (orderIDs) => {

}

const createBracketOrder = (ticker, monitoring) => {

    alpaca.getAccount()
        .then( account => {
            alpaca.createOrder({
                symbol: ticker,
                qty: Math.ceil(account.non_marginable_buying_power*CASH_LIMIT_AVAILABLE_TO_BUY/parseFloat((monitoring.pointPrice*ENTRY_POINT_TOLERANCE).toFixed(2))), // calculate quantity to buy.
                side: 'buy',
                type: 'limit',
                time_in_force: 'day',
                limit_price: parseFloat((monitoring.pointPrice*ENTRY_POINT_TOLERANCE).toFixed(2)), // 0.0005% above our monitored pivot point. Rounded to 2 decimal places.
                order_class: 'bracket',
                take_profit: {
                    "limit_price": parseFloat((monitoring.nextPointPrice*SELL_POINT_TOLERANCE).toFixed(2))
                },
                stop_loss: {
                    "stop_price": parseFloat(monitoring.pointPrice*STOP_LOSS_TOLERANCE).toFixed(2), // Sell if price falls below 1% of the entry price.
                }
            }).then( order => {
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
                    console.log(`Orders created for ${ticker}. OrderIDs have been updated. Time: ${moment().tz('America/New_York').toString()}`);   
                    
                }).catch(err=> {
                    console.log(`Error updating orderIDs for ${ticker}: ` + err)                    
                });
            })
        })      
}

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

// Executes every 60s when Alpaca Socket sends a bar.
export const checkOportunities = (currentBar, pivotPointsData) => {
    // Checks if there has been a crossover. If there has been, creates a monitoring object for the ticker in MongoDB.
    checkForCrossover(currentBar, pivotPointsData);

    // Updates the current monitoring object if meets the one fourth up rule. If the price falls below the pivot point, nullify the monitoring object.
    checkUpOneFourth(currentBar, pivotPointsData);    
}


/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/

export default { checkOportunities };
