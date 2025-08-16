const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Investment options configuration
const INVESTMENT_OPTIONS = {
  ppf: { name: 'PPF', minRate: 7.0, maxRate: 8.0, defaultRate: 7.5 },
  fd: { name: 'Fixed Deposit', minRate: 6.0, maxRate: 7.0, defaultRate: 6.5 },
  rd: { name: 'Recurring Deposit', minRate: 6.0, maxRate: 7.0, defaultRate: 6.5 },
  mutualFunds: { name: 'Mutual Funds', minRate: 10.0, maxRate: 12.0, defaultRate: 11.0 },
  niftyETF: { name: 'Nifty ETF', minRate: 10.0, maxRate: 12.0, defaultRate: 11.0 },
  goldETF: { name: 'Gold ETF', minRate: 5.0, maxRate: 6.0, defaultRate: 5.5 },
  sgb: { name: 'Sovereign Gold Bond', minRate: 5.0, maxRate: 6.0, defaultRate: 5.5 }
};

// Helper function to calculate compound interest
function calculateCompoundInterest(principal, monthlyContribution, annualRate, months) {
  const monthlyRate = annualRate / 100 / 12;
  let amount = principal;
  
  for (let i = 0; i < months; i++) {
    amount = amount * (1 + monthlyRate) + monthlyContribution;
  }
  
  return Math.round(amount);
}

// Helper function to calculate time to reach goal
function calculateTimeToGoal(monthlyContribution, goal, annualRate = 0) {
  if (monthlyContribution <= 0) return -1;
  
  if (annualRate === 0) {
    // Simple savings without interest
    return Math.ceil(goal / monthlyContribution);
  }
  
  const monthlyRate = annualRate / 100 / 12;
  let months = 0;
  let amount = 0;
  
  while (amount < goal && months < 1200) { // Max 100 years
    amount = amount * (1 + monthlyRate) + monthlyContribution;
    months++;
  }
  
  return months;
}

// Helper function to generate personalized recommendations
function generatePersonalizedRecommendations(income, expenses, savingsPerMonth, goal) {
  const recommendations = [];
  
  // Calculate savings rate
  const savingsRate = (savingsPerMonth / income) * 100;
  
  // Recommendations based on savings rate
  if (savingsRate < 20) {
    recommendations.push({
      type: 'savings_rate',
      message: 'Since your savings rate is only ' + savingsRate.toFixed(1) + '%, you should improve savings before going into Mutual Funds.',
      priority: 'high'
    });
  } else if (savingsRate >= 20 && savingsRate < 30) {
    recommendations.push({
      type: 'savings_rate',
      message: 'Your savings rate of ' + savingsRate.toFixed(1) + '% is good, but aim for 30% to accelerate your financial goals.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      type: 'savings_rate',
      message: 'Excellent savings rate of ' + savingsRate.toFixed(1) + '%! You are on track to achieve your financial goals faster.',
      priority: 'low'
    });
  }
  
  // Recommendations based on expense patterns
  const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + (expense || 0), 0);
  const rentExpense = expenses.rent || 0;
  const rentPercentage = (rentExpense / income) * 100;
  
  if (rentPercentage > 30) {
    recommendations.push({
      type: 'expense_pattern',
      message: 'Your housing cost is ' + rentPercentage.toFixed(1) + '% of income, which is high. The recommended is below 30%.',
      priority: 'high'
    });
  }
  
  // Add more personalized recommendations based on user's financial profile
  return recommendations;
}

// Helper function to calculate Financial Health Score (0-100)
function calculateFinancialHealthScore(income, expenses, savingsPerMonth, goal, currentSavings) {
  // Calculate savings rate
  const savingsRate = (savingsPerMonth / income) * 100;
  
  // Calculate Debt-to-Income ratio (if available)
  const monthlyDebtPayments = expenses.loans || 0;
  const dti = (monthlyDebtPayments / income) * 100;
  
  // Calculate goal progress
  const goalProgress = (currentSavings / goal) * 100;
  
  // Assign points based on savings rate (40 points max)
  let savingsScore = 0;
  if (savingsRate < 5) {
    savingsScore = 0;
  } else if (savingsRate >= 5 && savingsRate < 10) {
    savingsScore = 10;
  } else if (savingsRate >= 10 && savingsRate < 20) {
    savingsScore = 20;
  } else if (savingsRate >= 20 && savingsRate < 30) {
    savingsScore = 30;
  } else { // 30% or more
    savingsScore = 40;
  }
  
  // Assign points based on DTI (30 points max)
  let debtScore = 0;
  if (dti >= 50) {
    debtScore = 0;
  } else if (dti >= 40 && dti < 50) {
    debtScore = 10;
  } else if (dti >= 30 && dti < 40) {
    debtScore = 15;
  } else if (dti >= 20 && dti < 30) {
    debtScore = 20;
  } else { // Less than 20%
    debtScore = 30;
  }
  
  // Assign points based on goal progress (30 points max)
  let goalScore = 0;
  if (goalProgress < 25) {
    goalScore = 5;
  } else if (goalProgress >= 25 && goalProgress < 50) {
    goalScore = 15;
  } else if (goalProgress >= 50 && goalProgress < 75) {
    goalScore = 20;
  } else if (goalProgress >= 75 && goalProgress < 100) {
    goalScore = 25;
  } else { // 100% or more
    goalScore = 30;
  }
  
  // Calculate final score
  const finalScore = savingsScore + debtScore + goalScore;
  
  // Prepare detailed breakdown
  const scoreDetails = {
    savingsScore: {
      score: savingsScore,
      maxScore: 40,
      rate: savingsRate.toFixed(1) + '%',
      message: getScoreMessage('savings', savingsScore)
    },
    debtScore: {
      score: debtScore,
      maxScore: 30,
      rate: dti.toFixed(1) + '%',
      message: getScoreMessage('debt', debtScore)
    },
    goalScore: {
      score: goalScore,
      maxScore: 30,
      progress: goalProgress.toFixed(1) + '%',
      message: getScoreMessage('goal', goalScore)
    },
    totalScore: finalScore
  };
  
  return scoreDetails;
}

// Helper function to get score messages
function getScoreMessage(category, score) {
  const messages = {
    savings: {
      0: 'Critical: Your savings rate is too low. Immediate action needed.',
      10: 'Poor: Your savings rate needs significant improvement.',
      20: 'Fair: You are saving, but could do better to reach your goals faster.',
      30: 'Good: Your savings rate is solid. Keep it up!',
      40: 'Excellent: Your high savings rate will accelerate your financial goals.'
    },
    debt: {
      0: 'Critical: Your debt burden is very high. Focus on reducing debt.',
      10: 'Poor: Your debt-to-income ratio needs improvement.',
      15: 'Fair: Your debt level is manageable but could be better.',
      20: 'Good: Your debt level is well-controlled.',
      30: 'Excellent: Your low debt level gives you financial flexibility.'
    },
    goal: {
      5: 'Just starting: You are at the beginning of your journey.',
      15: 'Making progress: You are building momentum toward your goal.',
      20: 'Halfway there: You have made significant progress!',
      25: 'Almost there: Your goal is within reach!',
      30: 'Goal achieved: Congratulations on reaching your target!'
    }
  };
  
  // Return the appropriate message based on category and score
  const categoryMessages = messages[category];
  const scoreKeys = Object.keys(categoryMessages).map(Number).sort((a, b) => a - b);
  
  // Find the highest score key that is less than or equal to the given score
  let appropriateKey = scoreKeys[0];
  for (const key of scoreKeys) {
    if (key <= score) {
      appropriateKey = key;
    } else {
      break;
    }
  }
  
  return categoryMessages[appropriateKey];
}

// Helper function to analyze wealth gap based on age and income
function analyzeWealthGap(age, annualIncome, currentSavings) {
  // Define recommended savings benchmarks by age
  let recommendedMultiplier = 0;
  
  if (age < 30) {
    recommendedMultiplier = 0.5; // Half annual salary for under 30
  } else if (age >= 30 && age < 40) {
    recommendedMultiplier = 1; // 1x annual salary by age 30
  } else if (age >= 40 && age < 50) {
    recommendedMultiplier = 3; // 3x annual salary by age 40
  } else if (age >= 50 && age < 60) {
    recommendedMultiplier = 6; // 6x annual salary by age 50
  } else if (age >= 60 && age < 65) {
    recommendedMultiplier = 8; // 8x annual salary by age 60
  } else {
    recommendedMultiplier = 10; // 10x annual salary by age 65
  }
  
  // Calculate recommended savings
  const recommendedSavings = annualIncome * recommendedMultiplier;
  
  // Calculate wealth gap
  const wealthGap = currentSavings - recommendedSavings;
  const wealthGapPercentage = (wealthGap / recommendedSavings) * 100;
  
  // Prepare result
  const result = {
    age,
    annualIncome,
    currentSavings,
    recommendedSavings,
    wealthGap,
    wealthGapPercentage: wealthGapPercentage.toFixed(1) + '%',
    status: wealthGap >= 0 ? 'ahead' : 'behind',
    message: ''
  };
  
  // Add appropriate message
  if (wealthGap >= 0) {
    result.message = `You're ahead of schedule by ₹${Math.abs(wealthGap).toLocaleString()}! Keep up the good work.`;
  } else {
    result.message = `You're behind schedule by ₹${Math.abs(wealthGap).toLocaleString()}. Consider increasing your savings rate.`;
  }
  
  return result;
}

// Helper function to calculate FIRE (Financial Independence, Retire Early)
function calculateFIRE(annualExpenses, currentSavings, annualSavings, investmentGrowthRate = 7) {
  // Calculate FIRE number (25x annual expenses using 4% rule)
  const fireNumber = annualExpenses / 0.04;
  
  // Convert growth rate to decimal
  const r = investmentGrowthRate / 100;
  
  // Calculate years to FIRE
  // Using the formula: log((annualSavings * (1 + r)) / (annualSavings + fireNumber * r)) / log(1 + r)
  let yearsToFIRE;
  
  if (currentSavings >= fireNumber) {
    yearsToFIRE = 0; // Already achieved FIRE
  } else if (annualSavings <= 0) {
    yearsToFIRE = Infinity; // Cannot achieve FIRE with negative or zero savings
  } else {
    const numerator = Math.log((annualSavings * (1 + r)) / (annualSavings + (fireNumber - currentSavings) * r));
    const denominator = Math.log(1 + r);
    yearsToFIRE = numerator / denominator;
    
    // Handle edge cases
    if (yearsToFIRE < 0 || !isFinite(yearsToFIRE)) {
      yearsToFIRE = Infinity;
    }
  }
  
  // Prepare result
  const result = {
    annualExpenses,
    fireNumber,
    currentSavings,
    annualSavings,
    investmentGrowthRate,
    yearsToFIRE: yearsToFIRE === Infinity ? -1 : yearsToFIRE.toFixed(1),
    achievable: yearsToFIRE !== Infinity,
    message: ''
  };
  
  // Add appropriate message
  if (yearsToFIRE === 0) {
    result.message = 'Congratulations! You have already achieved financial independence!';
  } else if (yearsToFIRE === Infinity) {
    result.message = 'With your current savings rate, FIRE is not achievable. Try increasing your savings or reducing expenses.';
  } else if (yearsToFIRE > 50) {
    result.message = `FIRE will take ${result.yearsToFIRE} years at your current rate. Consider increasing your savings rate significantly.`;
  } else if (yearsToFIRE > 20) {
    result.message = `You can achieve FIRE in ${result.yearsToFIRE} years. Increasing your savings rate will accelerate your timeline.`;
  } else {
    result.message = `Great! You're on track to achieve FIRE in ${result.yearsToFIRE} years.`;
  }
  
  return result;
}

// Helper function to suggest portfolio based on goal timeframe
function suggestPortfolioSplit(goalTimeframeYears) {
  let portfolioSuggestion = {};
  
  if (goalTimeframeYears < 2) {
    // Short-term goals (< 2 years)
    portfolioSuggestion = {
      type: 'short_term',
      message: 'For goals less than 2 years away, focus on RD/FD to preserve capital.',
      allocation: {
        fd: 70,
        rd: 30
      },
      explanation: 'Short-term goals require capital preservation. Fixed and Recurring Deposits offer guaranteed returns without market risk.'
    };
  } else if (goalTimeframeYears >= 2 && goalTimeframeYears <= 5) {
    // Medium-term goals (3-5 years)
    portfolioSuggestion = {
      type: 'medium_term',
      message: 'For goals 3-5 years away, consider a mix of Debt and Balanced Mutual Funds.',
      allocation: {
        debt_funds: 60,
        balanced_funds: 30,
        fd: 10
      },
      explanation: 'Medium-term goals allow for some market exposure while maintaining stability. A mix of debt and balanced funds provides moderate growth with managed risk.'
    };
  } else {
    // Long-term goals (10+ years)
    portfolioSuggestion = {
      type: 'long_term',
      message: 'For goals 10+ years away, focus on Mutual Funds/Nifty 50 with some Gold allocation.',
      allocation: {
        equity_funds: 70,
        nifty_etf: 20,
        gold: 10
      },
      explanation: 'Long-term goals benefit from equity exposure. The stock market historically outperforms other asset classes over 10+ year periods, while gold provides diversification.'
    };
  }
  
  return portfolioSuggestion;
}

// Helper function to generate example texts with real numbers
function generateExampleTexts(savingsPerMonth, goal) {
  const examples = [];
  
  // Calculate FD returns (assuming 6.5% annual rate)
  const fdYears = 5;
  const fdMonths = fdYears * 12;
  const fdAmount = calculateCompoundInterest(0, savingsPerMonth, 6.5, fdMonths);
  
  // Calculate Mutual Fund returns (assuming 11% annual rate)
  const mfAmount = calculateCompoundInterest(0, savingsPerMonth, 11, fdMonths);
  
  // Calculate the difference
  const difference = mfAmount - fdAmount;
  
  examples.push({
    type: 'comparison',
    message: `Your money in FD gives ₹${(fdAmount/1000).toFixed(1)}L in ${fdYears} years, but Mutual Funds could give ₹${(mfAmount/1000).toFixed(1)}L – a difference of ₹${(difference/1000).toFixed(1)}K, enough for a significant purchase.`
  });
  
  // Inflation example
  const inflationRate = 6;
  const realFdReturn = 6.5 - inflationRate;
  const inflationImpact = (inflationRate / 6.5) * 100;
  
  examples.push({
    type: 'inflation',
    message: `Inflation will eat ${inflationImpact.toFixed(0)}% of your FD return, so real profit is only ${realFdReturn.toFixed(1)}%.`
  });
  
  return examples;
}

// Routes

// POST /personalized-recommendations
app.post('/personalized-recommendations', (req, res) => {
  try {
    const { income, expenses, savingsPerMonth, goal, goalTimeframeYears } = req.body;
    
    if (!income || !expenses || !savingsPerMonth || !goal) {
      return res.status(400).json({ 
        error: 'Missing required fields: income, expenses, savingsPerMonth, goal' 
      });
    }

    // Generate personalized recommendations
    const recommendations = generatePersonalizedRecommendations(income, expenses, savingsPerMonth, goal);
    
    // Generate portfolio suggestions based on goal timeframe
    const portfolioSuggestion = suggestPortfolioSplit(goalTimeframeYears || 5); // Default to 5 years if not provided
    
    // Generate example texts
    const examples = generateExampleTexts(savingsPerMonth, goal);
    
    res.json({
      recommendations,
      portfolioSuggestion,
      examples
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /financial-health-score
app.post('/financial-health-score', (req, res) => {
  try {
    const { income, expenses, savingsPerMonth, goal, currentSavings } = req.body;
    
    if (!income || !expenses || !savingsPerMonth || !goal || currentSavings === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: income, expenses, savingsPerMonth, goal, currentSavings' 
      });
    }

    // Calculate financial health score
    const healthScore = calculateFinancialHealthScore(income, expenses, savingsPerMonth, goal, currentSavings);
    
    res.json(healthScore);
  } catch (error) {
    console.error('Error calculating financial health score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /wealth-gap
app.post('/wealth-gap', (req, res) => {
  try {
    const { age, annualIncome, currentSavings } = req.body;
    
    if (!age || !annualIncome || currentSavings === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: age, annualIncome, currentSavings' 
      });
    }

    // Analyze wealth gap
    const wealthGapAnalysis = analyzeWealthGap(age, annualIncome, currentSavings);
    
    res.json(wealthGapAnalysis);
  } catch (error) {
    console.error('Error analyzing wealth gap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /fire-calculator
app.post('/fire-calculator', (req, res) => {
  try {
    const { monthlyExpenses, currentSavings, monthlyIncome, investmentGrowthRate } = req.body;
    
    if (!monthlyExpenses || currentSavings === undefined || !monthlyIncome) {
      return res.status(400).json({ 
        error: 'Missing required fields: monthlyExpenses, currentSavings, monthlyIncome' 
      });
    }

    // Calculate annual values
    const annualExpenses = monthlyExpenses * 12;
    const annualSavings = (monthlyIncome - monthlyExpenses) * 12;
    
    // Calculate FIRE
    const fireAnalysis = calculateFIRE(
      annualExpenses, 
      currentSavings, 
      annualSavings, 
      investmentGrowthRate || 7 // Default to 7% if not provided
    );
    
    res.json(fireAnalysis);
  } catch (error) {
    console.error('Error calculating FIRE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /calculate-savings
app.post('/calculate-savings', (req, res) => {
  try {
    const { income, expenses, goal } = req.body;
    
    if (!income || !expenses || !goal) {
      return res.status(400).json({ 
        error: 'Missing required fields: income, expenses, goal' 
      });
    }

    // Calculate total expenses
    const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + (expense || 0), 0);
    const savingsPerMonth = income - totalExpenses;
    
    if (savingsPerMonth <= 0) {
      return res.json({
        savingsPerMonth: 0,
        savingsPerWeek: 0,
        savingsPerDay: 0,
        timeToGoalMonths: -1,
        timeToGoalDays: -1,
        message: 'No surplus available for savings. Consider reducing expenses.'
      });
    }

    const savingsPerWeek = Math.round((savingsPerMonth * 12) / 52);
    const savingsPerDay = Math.round((savingsPerMonth * 12) / 365);
    const timeToGoalMonths = calculateTimeToGoal(savingsPerMonth, goal);
    const timeToGoalDays = timeToGoalMonths * 30;

    res.json({
      income,
      totalExpenses,
      savingsPerMonth,
      savingsPerWeek,
      savingsPerDay,
      timeToGoalMonths,
      timeToGoalDays,
      expenseBreakdown: expenses
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /calculate-investments
app.post('/calculate-investments', (req, res) => {
  try {
    const { savingsPerMonth, goal, customRates } = req.body;
    
    if (!savingsPerMonth || !goal) {
      return res.status(400).json({ 
        error: 'Missing required fields: savingsPerMonth, goal' 
      });
    }

    const results = {};
    const savingsOnly = {
      timeToGoalMonths: calculateTimeToGoal(savingsPerMonth, goal, 0),
      finalAmount: goal,
      totalContribution: savingsPerMonth * calculateTimeToGoal(savingsPerMonth, goal, 0),
      gain: 0
    };

    // Calculate for each investment option
    Object.keys(INVESTMENT_OPTIONS).forEach(key => {
      const option = INVESTMENT_OPTIONS[key];
      const rate = customRates && customRates[key] ? customRates[key] : option.defaultRate;
      const timeToGoal = calculateTimeToGoal(savingsPerMonth, goal, rate);
      const totalContribution = savingsPerMonth * timeToGoal;
      const gain = goal - totalContribution;
      
      results[key] = {
        name: option.name,
        annualRate: rate,
        timeToGoalMonths: timeToGoal,
        finalAmount: goal,
        totalContribution,
        gain,
        gainPercentage: totalContribution > 0 ? Math.round((gain / totalContribution) * 100) : 0
      };
    });

    // Add savings-only comparison
    results.savingsOnly = {
      name: 'Savings Only',
      annualRate: 0,
      ...savingsOnly
    };

    // Calculate projections for different time horizons
    const projections = {};
    [6, 12, 24, 36, 60, 120].forEach(months => {
      projections[months] = {};
      
      // Savings only
      projections[months].savingsOnly = savingsPerMonth * months;
      
      // Each investment option
      Object.keys(INVESTMENT_OPTIONS).forEach(key => {
        const option = INVESTMENT_OPTIONS[key];
        const rate = customRates && customRates[key] ? customRates[key] : option.defaultRate;
        projections[months][key] = calculateCompoundInterest(0, savingsPerMonth, rate, months);
      });
    });

    res.json({
      savingsPerMonth,
      goal,
      results,
      projections,
      comparisonVsSavings: Object.keys(results)
        .filter(key => key !== 'savingsOnly')
        .map(key => ({
          ...results[key],
          timeSaved: savingsOnly.timeToGoalMonths - results[key].timeToGoalMonths,
          timeSavedPercentage: Math.round(((savingsOnly.timeToGoalMonths - results[key].timeToGoalMonths) / savingsOnly.timeToGoalMonths) * 100)
        }))
        .sort((a, b) => b.timeSavedPercentage - a.timeSavedPercentage)
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /improvement-tips
app.post('/improvement-tips', (req, res) => {
  try {
    const { expenses, income, savingsGoal } = req.body;
    
    if (!expenses || !income || !savingsGoal) {
      return res.status(400).json({ 
        error: 'Missing required fields: expenses, income, savingsGoal' 
      });
    }

    const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + (expense || 0), 0);
    const currentSavings = income - totalExpenses;
    const currentTimeToGoal = currentSavings > 0 ? calculateTimeToGoal(currentSavings, savingsGoal) : -1;

    const tips = [];

    // Expense reduction tips
    Object.entries(expenses).forEach(([category, amount]) => {
      if (amount > 0) {
        const reductions = [500, 1000, Math.round(amount * 0.1), Math.round(amount * 0.2)];
        
        reductions.forEach(reduction => {
          if (reduction < amount && reduction > 0) {
            const newSavings = currentSavings + reduction;
            const newTimeToGoal = calculateTimeToGoal(newSavings, savingsGoal);
            const timeSaved = currentTimeToGoal - newTimeToGoal;
            
            if (timeSaved > 0) {
              tips.push({
                type: 'expense_reduction',
                category,
                suggestion: `Reduce ${category} by ₹${reduction}`,
                currentAmount: amount,
                newAmount: amount - reduction,
                monthlySavingsIncrease: reduction,
                timeSavedMonths: timeSaved,
                newTimeToGoalMonths: newTimeToGoal,
                impact: timeSaved > 6 ? 'high' : timeSaved > 2 ? 'medium' : 'low'
              });
            }
          }
        });
      }
    });

    // Investment tips
    if (currentSavings > 0) {
      const bestInvestmentOption = Object.keys(INVESTMENT_OPTIONS).reduce((best, current) => {
        const currentTime = calculateTimeToGoal(currentSavings, savingsGoal, INVESTMENT_OPTIONS[current].defaultRate);
        const bestTime = calculateTimeToGoal(currentSavings, savingsGoal, INVESTMENT_OPTIONS[best].defaultRate);
        return currentTime < bestTime ? current : best;
      });

      const investmentTimeToGoal = calculateTimeToGoal(currentSavings, savingsGoal, INVESTMENT_OPTIONS[bestInvestmentOption].defaultRate);
      const timeSavedByInvesting = currentTimeToGoal - investmentTimeToGoal;

      if (timeSavedByInvesting > 0) {
        tips.push({
          type: 'investment',
          suggestion: `Start investing in ${INVESTMENT_OPTIONS[bestInvestmentOption].name}`,
          currentTimeToGoal: currentTimeToGoal,
          newTimeToGoal: investmentTimeToGoal,
          timeSavedMonths: timeSavedByInvesting,
          expectedReturn: INVESTMENT_OPTIONS[bestInvestmentOption].defaultRate,
          impact: 'high'
        });
      }
    }

    // Income increase tips
    const incomeIncreases = [5000, 10000, 15000, 20000];
    incomeIncreases.forEach(increase => {
      const newSavings = currentSavings + increase;
      const newTimeToGoal = calculateTimeToGoal(newSavings, savingsGoal);
      const timeSaved = currentTimeToGoal - newTimeToGoal;
      
      if (timeSaved > 0) {
        tips.push({
          type: 'income_increase',
          suggestion: `Increase monthly income by ₹${increase}`,
          incomeIncrease: increase,
          newTimeToGoalMonths: newTimeToGoal,
          timeSavedMonths: timeSaved,
          impact: timeSaved > 12 ? 'high' : timeSaved > 6 ? 'medium' : 'low'
        });
      }
    });

    // Sort tips by impact and time saved
    const sortedTips = tips
      .sort((a, b) => {
        if (a.impact === b.impact) {
          return (b.timeSavedMonths || 0) - (a.timeSavedMonths || 0);
        }
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
      .slice(0, 10); // Return top 10 tips

    res.json({
      currentSavings,
      currentTimeToGoalMonths: currentTimeToGoal,
      totalTips: sortedTips.length,
      tips: sortedTips
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /learn
app.get('/learn', (req, res) => {
  try {
    const learningContent = [
      {
        id: 1,
        title: "What to check before investing?",
        category: "Basics",
        summary: "Key factors to evaluate before making any investment decision",
        content: "Before investing, check: 1) Expense ratio (lower is better), 2) Track record (consistent performance), 3) Benchmark comparison, 4) Your risk profile, 5) Tax implications, 6) Lock-in period, 7) Liquidity needs",
        learnMore: "Expense ratio should be <1% for equity funds, <0.5% for debt funds. Check 5-year returns, not just 1-year. Match investment risk with your risk appetite. Consider your investment horizon - don't invest in equity if you need money in <5 years."
      },
      {
        id: 2,
        title: "PPF Basics",
        category: "Tax-saving",
        summary: "Understanding Public Provident Fund benefits and limitations",
        content: "PPF offers 7.1% tax-free returns with 15-year lock-in. Max investment ₹1.5L/year. Triple tax benefit - deduction, tax-free growth, tax-free withdrawal.",
        learnMore: "PPF is ideal for long-term goals like retirement. You can extend in 5-year blocks after 15 years. Partial withdrawals allowed after 7th year. No risk as it's government-backed."
      },
      {
        id: 3,
        title: "What is SIP?",
        category: "Investment Strategy",
        summary: "Systematic Investment Plan for disciplined investing",
        content: "SIP helps invest fixed amount regularly in mutual funds. Benefits: rupee cost averaging, disciplined investing, power of compounding.",
        learnMore: "Start SIP as early as possible. Increase SIP amount annually by 10-15%. Don't stop SIP during market downturns - that's when you buy more units at lower prices."
      },
      {
        id: 4,
        title: "Gold ETF vs SGB",
        category: "Gold Investment",
        summary: "Comparing digital gold investment options",
        content: "Gold ETF: traded like stocks, no lock-in, 3% expense ratio. SGB: 8-year lock-in, 2.5% additional interest, tax-free if held till maturity.",
        learnMore: "SGB is better for long-term holders due to tax benefits and additional interest. Gold ETF is better for tactical allocation with flexibility to exit anytime."
      },
      {
        id: 5,
        title: "FD vs Debt Mutual Funds",
        category: "Debt Investment",
        summary: "Fixed deposits vs debt funds comparison",
        content: "FD: guaranteed returns, fully taxable. Debt MF: potentially higher returns, tax-efficient after 3 years, some risk.",
        learnMore: "For >3 years horizon, debt funds can be more tax-efficient. For emergency funds, FD/liquid funds are better. Ultra short-term funds for 6 months to 2 years."
      },
      {
        id: 6,
        title: "Risk vs Return",
        category: "Basics",
        summary: "Understanding the fundamental investing principle",
        content: "Higher potential returns come with higher risk. Equity > Debt > FD in both risk and potential returns.",
        learnMore: "Don't chase high returns without understanding risks. Diversify across asset classes. Your risk capacity depends on age, income stability, and investment horizon."
      },
      {
        id: 7,
        title: "Diversification 101",
        category: "Portfolio Management",
        summary: "Don't put all eggs in one basket",
        content: "Spread investments across different asset classes, sectors, and geographies to reduce risk.",
        learnMore: "Asset allocation example: 60% equity, 30% debt, 10% gold for young investors. Rebalance annually. International diversification through global funds."
      },
      {
        id: 8,
        title: "How to pick an index fund",
        category: "Mutual Funds",
        summary: "Choosing the right index fund for your portfolio",
        content: "Check: tracking error (lower better), expense ratio (<0.5%), fund size (>₹500 cr), tracking difference.",
        learnMore: "Nifty 50 for large-cap exposure, Nifty Next 50 for mid-cap, Nifty 500 for broader market. Choose funds with consistent low tracking error."
      },
      {
        id: 9,
        title: "What is RD and who should use it",
        category: "Traditional Savings",
        summary: "Recurring Deposits for regular savers",
        content: "RD allows monthly fixed deposits with guaranteed returns. Good for risk-averse investors wanting disciplined savings.",
        learnMore: "RD is like SIP for bank deposits. Returns are lower than equity but guaranteed. Good for short-term goals (1-5 years) where capital protection is important."
      },
      {
        id: 10,
        title: "Tax considerations overview",
        category: "Tax Planning",
        summary: "Understanding tax impact on investments",
        content: "LTCG on equity: 10% above ₹1L. STCG on equity: 15%. Debt funds taxed as per income slab after 2023 budget changes.",
        learnMore: "Hold equity investments for >1 year to get LTCG benefit. Debt funds lost indexation benefit post-2023. Consider tax-saving instruments like ELSS, PPF, ULIP for 80C deduction."
      }
    ];

    res.json({
      totalArticles: learningContent.length,
      categories: [...new Set(learningContent.map(item => item.category))],
      content: learningContent
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /investment-options
app.get('/investment-options', (req, res) => {
  try {
    res.json({
      options: INVESTMENT_OPTIONS,
      message: 'Available investment options with default rates'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Savings Planner Backend running on port ${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   POST /calculate-savings`);
  console.log(`   POST /calculate-investments`);
  console.log(`   POST /improvement-tips`);
  console.log(`   POST /personalized-recommendations`);
  console.log(`   POST /financial-health-score`);
  console.log(`   POST /wealth-gap`);
  console.log(`   POST /fire-calculator`);
  console.log(`   GET  /learn`);
  console.log(`   GET  /investment-options`);
  console.log(`   GET  /health`);
});

module.exports = app;