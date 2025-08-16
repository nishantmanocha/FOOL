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

// Routes

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
  console.log(`   GET  /learn`);
  console.log(`   GET  /investment-options`);
  console.log(`   GET  /health`);
});

module.exports = app;