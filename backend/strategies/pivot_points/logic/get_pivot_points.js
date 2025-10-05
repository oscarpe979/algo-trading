/**
 * @file get_pivot_points.js
 * @description This file is responsible for calculating pivot points (including support and resistance levels)
 * for different timeframes (daily, weekly, monthly) based on historical bar data.
 */

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          IMPORTS
/*-----------------------------------------------------------------------------------------------------------------------*/

import {
	getLastDailyBar,
	getLastWeeklyBar,
	getLastMonthlyBar,
} from "./get_bars.js";

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          LOGIC
/*-----------------------------------------------------------------------------------------------------------------------*/

/**
 * @async
 * @function getPivotPoints
 * @description Calculates daily, weekly, and monthly pivot points for a given stock symbol.
 * It fetches the last bar for each timeframe and uses the standard pivot point formulas to calculate
 * the pivot, as well as three levels of support (s1, s2, s3) and resistance (r1, r2, r3).
 * @param {string} symbol - The stock ticker symbol (e.g., "QQQ").
 * @returns {Promise<object>} A promise that resolves to an object containing the calculated pivot points
 * for daily, weekly, and monthly timeframes. Each timeframe includes r3, r2, r1, pivot, s1, s2, and s3 levels.
 */
const getPivotPoints = async (symbol) => {
	// Gathering the bar data for daily, weekly, and monthly timeframes.
	let dayBar = await getLastDailyBar(symbol);
	let weekBar = await getLastWeeklyBar(symbol);
	let monthBar = await getLastMonthlyBar(symbol);
    
    // --- Pivot Point Calculations ---
    // Calculate the central pivot point for each timeframe using the classic formula: (High + Low + Close) / 3.
    let pivotDaily = (dayBar.HighPrice + dayBar.LowPrice + dayBar.ClosePrice)/3
    let pivotWeekly = (weekBar.HighPrice + weekBar.LowPrice + weekBar.ClosePrice)/3
    let pivotMonthly = (monthBar.HighPrice + monthBar.LowPrice + monthBar.ClosePrice)/3

	// Construct the final object with all calculated pivot points, formatted to two decimal places.
    // The `toFixed(2)*1` trick rounds the number and converts it back from a string to a number.
	let pivotPoints = {
		dailyPivotPoints: {
			r3: (((pivotDaily*2) - dayBar.LowPrice) + (dayBar.HighPrice - dayBar.LowPrice)).toFixed(2)*1,
			r2: (pivotDaily + (dayBar.HighPrice - dayBar.LowPrice)).toFixed(2)*1,
			r1: ((pivotDaily*2) - dayBar.LowPrice).toFixed(2)*1,
			pivot: (pivotDaily).toFixed(2)*1,
			s1: ((pivotDaily*2) - dayBar.HighPrice).toFixed(2)*1,
			s2: (pivotDaily - (dayBar.HighPrice - dayBar.LowPrice)).toFixed(2)*1,
			s3: (((pivotDaily*2) - dayBar.HighPrice) - (dayBar.HighPrice - dayBar.LowPrice)).toFixed(2)*1,
		},
		weeklyPivotPoints: {
			r3: (((pivotWeekly*2) - weekBar.LowPrice) + (weekBar.HighPrice - weekBar.LowPrice)).toFixed(2)*1,
			r2: (pivotWeekly + (weekBar.HighPrice - weekBar.LowPrice)).toFixed(2)*1,
			r1: ((pivotWeekly*2) - weekBar.LowPrice).toFixed(2)*1,
			pivot: (pivotWeekly).toFixed(2)*1,
			s1: ((pivotWeekly*2) - weekBar.HighPrice).toFixed(2)*1,
			s2: (pivotWeekly - (weekBar.HighPrice - weekBar.LowPrice)).toFixed(2)*1,
			s3: (((pivotWeekly*2) - weekBar.HighPrice) - (weekBar.HighPrice - weekBar.LowPrice)).toFixed(2)*1,
		},
		monthlyPivotPoints: {
			r3: (((pivotMonthly*2) - monthBar.LowPrice) + (monthBar.HighPrice - monthBar.LowPrice)).toFixed(2)*1,
			r2: (pivotMonthly + (monthBar.HighPrice - monthBar.LowPrice)).toFixed(2)*1,
			r1: ((pivotMonthly*2) - monthBar.LowPrice).toFixed(2)*1,
			pivot: (pivotMonthly).toFixed(2)*1,
			s1: ((pivotMonthly*2) - monthBar.HighPrice).toFixed(2)*1,
			s2: (pivotMonthly - (monthBar.HighPrice - monthBar.LowPrice)).toFixed(2)*1,
			s3: (((pivotMonthly*2) - monthBar.HighPrice) - (monthBar.HighPrice - monthBar.LowPrice)).toFixed(2)*1
		},
	};

    return pivotPoints;
};

/**-----------------------------------------------------------------------------------------------------------------------
/*                                          EXPORT
/*-----------------------------------------------------------------------------------------------------------------------*/
export default getPivotPoints;