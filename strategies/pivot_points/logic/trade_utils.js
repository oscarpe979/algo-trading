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

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          INITIALIZERS
/*-----------------------------------------------------------------------------------------------------------------------*/
// Instantiate the ALPACA API with configuration options
const alpaca = new Alpaca(alpacaOptions);

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          HELPERS
/*-----------------------------------------------------------------------------------------------------------------------*/

const watch = (pivotPointName, pivotPointPrice, nextPivotPointPrice, bar, monitoring) => {    
    PivotPoints.findOneAndUpdate(
        { _id: bar.S },
        {
            $set: {                
                monitoring: {
                    pointName: pivotPointName, // S3, S2, S1, PIVOTE, R1, R2
                    pointPrice: pivotPointPrice,
                    nextPointPrice: nextPivotPointPrice,
                    upOneFourth: bar.h >= (pivotPointPrice + (nextPivotPointPrice - pivotPointPrice)/4), // Checks if price went up one fourth of the way up
                    orderID: null, 
                    timeUpdated: moment().tz('America/New_York').toString(),
                },                
            },
        }
    ).then((doc) => {        
        console.log(`Monitoring new ${pivotPointName} crossover in ${bar.S}. Time: ${moment().tz('America/New_York').toString()}`);        
        // Cancel Ticker Orders if there any deriving from a previous monitoring.
        if(monitoring){
            cancelOrder(monitoring.orderID);
        }            
    }).catch(err=> console.log(`Error creating monitoring Object for ${bar.S}: ` + err));
}

const checkUpOneFourth = (currentBar, pivotPointsData) =>{

    // If monitoring object is null dont do anything 
    if(!pivotPointsData.monitoring)        
        return; 
       
    // If monitoring object exists then check if bar.c < monitoring.pointPrice. If true delete monitoring object and CANCEL ALL EXISTING ORDERS.
    if(pivotPointsData.monitoring && currentBar.c < pivotPointsData.monitoring.pointPrice) {
        PivotPoints.findOneAndUpdate(
            { _id: currentBar.S },
            {
                $set: {                
                    monitoring: null,               
                },
            }
        ).then((doc) => {        
            console.log(`No longer monitoring ${currentBar.S}. Time: ${moment().tz('America/New_York').toString()}`);   
            // Cancel Ticker Orders if any        
            cancelOrder(pivotPointsData.monitoring.orderID)      
        }).catch(err=> console.log(`Error deleting monitoring Object for ${bar.S}: ` + err));             
    }

    // If the price is up one fourth, place an order just in front of the pivot point.  
        //?????????????????????????????????????????? Buy 0.01% above the pivot point. Stop below 1%. Close positions @ 3.58 pm.
    else if(pivotPointsData.monitoring && 
            currentBar.c > pivotPointsData.monitoring.pointPrice && 
            currentBar.h >= (pivotPointsData.monitoring.pointPrice + (pivotPointsData.monitoring.nextPivotPointPrice - pivotPointsData.monitoring.pointPrice)/4)){
                PivotPoints.findOneAndUpdate(
                    { _id: currentBar.S },
                    {
                        $set: {                
                            upOneFourth: true,               
                        },
                    }
                ).then((doc) => {        
                    console.log(`${currentBar.S} has reached one fourth up. Time: ${moment().tz('America/New_York').toString()}`);   
                    // Create Bracket order using Alpaca     
                    createBracketOrder(currentBar.S, pivotPointsData.monitoring)  
                }).catch(err=> console.log(`Error creating monitoring Object for ${bar.S}: ` + err));  
    }
}

const checkForCrossover = (currentBar, pivotPointsData) => {

    let pivotPoints = pivotPointsData.pivotPoints;    

    // Current Bar crossing S3
    if (currentBar.o <= pivotPoints.dailyPivotPoints.s3 && currentBar.c > pivotPoints.dailyPivotPoints.s3) {      
        console.log(currentBar.S + ' Crossed S3');
        watch('s3', pivotPoints.dailyPivotPoints.s3, pivotPoints.dailyPivotPoints.s2, currentBar, pivotPointsData.monitoring);     
    }

    // Current Bar crossing S2 
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.s3 &&
        currentBar.o <= pivotPoints.dailyPivotPoints.s2 && currentBar.c > pivotPoints.dailyPivotPoints.s2
    ) {        
        console.log(currentBar.S + ' Crossed S2');
        watch('s2', pivotPoints.dailyPivotPoints.s2, pivotPoints.dailyPivotPoints.s1, currentBar);
    } 

    // Current Bar crossing S1
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.s2 &&
        currentBar.o <= pivotPoints.dailyPivotPoints.s1 && currentBar.c > pivotPoints.dailyPivotPoints.s1
    ) {
        console.log(currentBar.S + ' Crossed S1');
        watch('s1', pivotPoints.dailyPivotPoints.s1, pivotPoints.dailyPivotPoints.pivot, currentBar);  
    } 
    
    // Current Bar crossing PIVOT
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.s1 &&
        currentBar.o <= pivotPoints.dailyPivotPoints.pivot && currentBar.c > pivotPoints.dailyPivotPoints.pivot
    ) {
        console.log(currentBar.S + ' Crossed Pivot');
        watch('pivot', pivotPoints.dailyPivotPoints.pivot, pivotPoints.dailyPivotPoints.r1, currentBar);  
    } 
    
    // Current Bar crossing R1
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.pivot &&
        currentBar.o <= pivotPoints.dailyPivotPoints.r1 && currentBar.c > pivotPoints.dailyPivotPoints.r1
    ) {
        console.log(currentBar.S + ' Crossed R1');
        watch('r1', pivotPoints.dailyPivotPoints.r1, pivotPoints.dailyPivotPoints.r2, currentBar);  
    } 
    
    // Current Bar crossing R2
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.ri &&
        currentBar.o <= pivotPoints.dailyPivotPoints.r2 && currentBar.c > pivotPoints.dailyPivotPoints.r2
    ) {
        console.log(currentBar.S + ' Crossed R2');
        watch('r2', pivotPoints.dailyPivotPoints.r2, pivotPoints.dailyPivotPoints.r3, currentBar);  
    } 
    
    // Current Bar crossing R3
    else if (
        currentBar.o > pivotPoints.dailyPivotPoints.r2 &&
        currentBar.o <= pivotPoints.dailyPivotPoints.r3 && currentBar.c > pivotPoints.dailyPivotPoints.r3
    ) {
        console.log(currentBar.S + ' Crossed R3, DONT BUY!!!!')
    }
}

const cancelOrder = (orderID) => {

}

const createBracketOrder = (ticker, monitoring) => {

    alpaca.getAccount()
        .then( account => {
            console.log({
                symbol: ticker,
                qty: Math.ceil(account.non_marginable_buying_power*CASH_LIMIT_AVAILABLE_TO_BUY/parseFloat((monitoring.pointPrice*1.01).toFixed(2))), // calculate quantity to buy.
                side: 'buy',
                type: 'limit',
                time_in_force: 'day',
                limit_price: parseFloat((monitoring.pointPrice*1.01).toFixed(2)), // 0.01% above our monitored pivot point. Rounded to 2 decimal places.
                order_class: 'bracket',
                take_profit: {
                    "limit_price": monitoring.nextPointPrice
                },
                stop_loss: {
                    "stop_price": monitoring.pointPrice*0.99, // Sell if price falls below 1% of the entry price.
                }
            }) 
        })

    // alpaca.createOrder({
    //     symbol: ticker,
    //     qty: number, ?????????????????
    //     side: 'buy',
    //     type: 'limit',
    //     time_in_force: 'day',
    //     limit_price: parseFloat((monitoring.pointPrice*1.01).toFixed(2)), // 0.01% above our monitored pivot point. Rounded to 2 decimal places.
    //     order_class: 'bracket',
    //     take_profit: {
    //         "limit_price": monitoring.nextPointPrice
    //     },
    //     stop_loss: {
    //         "stop_price": monitoring.pointPrice*0.99, // Sell if price falls below 1% of the entry price.
    //     }.
    //   })

}

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

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
