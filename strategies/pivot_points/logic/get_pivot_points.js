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

const getPivotPoints = async (symbol) => {
	// Gathering the Bar data for daily, weekly and monthly bars.
	let dayBar = await getLastDailyBar(symbol);
	let weekBar = await getLastWeeklyBar(symbol);
	let monthBar = await getLastMonthlyBar(symbol);
    
    // Calculate all the Pivots for all time frames
    let pivotDaily = (dayBar.HighPrice + dayBar.LowPrice + dayBar.ClosePrice)/3
    let pivotWeekly = (weekBar.HighPrice + weekBar.LowPrice + weekBar.ClosePrice)/3
    let pivotMonthly = (monthBar.HighPrice + monthBar.LowPrice + monthBar.ClosePrice)/3

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
