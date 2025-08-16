// API Configuration
const API_BASE_URL = 'https://bumpy-laws-prove.loca.lt'; // Change this to your backend URL

class ApiService {
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Calculate savings based on income and expenses
  async calculateSavings(income, expenses, goal) {
    return this.makeRequest('/calculate-savings', {
      method: 'POST',
      body: JSON.stringify({ income, expenses, goal }),
    });
  }

  // Calculate investment projections
  async calculateInvestments(savingsPerMonth, goal, customRates = null) {
    return this.makeRequest('/calculate-investments', {
      method: 'POST',
      body: JSON.stringify({ savingsPerMonth, goal, customRates }),
    });
  }

  // Get improvement tips
  async getImprovementTips(expenses, income, savingsGoal) {
    return this.makeRequest('/improvement-tips', {
      method: 'POST',
      body: JSON.stringify({ expenses, income, savingsGoal }),
    });
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(income, expenses, savingsPerMonth, goal, goalTimeframeYears) {
    return this.makeRequest('/personalized-recommendations', {
      method: 'POST',
      body: JSON.stringify({ income, expenses, savingsPerMonth, goal, goalTimeframeYears }),
    });
  }

  // Get financial health score
  async getFinancialHealthScore(income, expenses, savingsPerMonth, goal, currentSavings) {
    return this.makeRequest('/financial-health-score', {
      method: 'POST',
      body: JSON.stringify({ income, expenses, savingsPerMonth, goal, currentSavings }),
    });
  }

  // Get wealth gap analysis
  async getWealthGapAnalysis(age, annualIncome, currentSavings) {
    return this.makeRequest('/wealth-gap', {
      method: 'POST',
      body: JSON.stringify({ age, annualIncome, currentSavings }),
    });
  }

  // Get FIRE (Financial Independence, Retire Early) calculation
  async calculateFIRE(monthlyExpenses, currentSavings, monthlyIncome, investmentGrowthRate = 7) {
    return this.makeRequest('/fire-calculator', {
      method: 'POST',
      body: JSON.stringify({ monthlyExpenses, currentSavings, monthlyIncome, investmentGrowthRate }),
    });
  }

  // Get learning content
  async getLearningContent() {
    return this.makeRequest('/learn');
  }

  // Get investment options
  async getInvestmentOptions() {
    return this.makeRequest('/investment-options');
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }
}

export default new ApiService();