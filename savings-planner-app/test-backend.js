// Test script for Savings Planner Backend APIs
const API_BASE = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${endpoint}:`);
    console.log(JSON.stringify(result, null, 2));
    console.log('---\n');
    
    return result;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.message);
    console.log('---\n');
  }
}

async function runTests() {
  console.log('🚀 Testing Savings Planner Backend APIs\n');
  
  // Test 1: Health check
  await testAPI('/health');
  
  // Test 2: Calculate savings
  await testAPI('/calculate-savings', 'POST', {
    income: 50000,
    expenses: {
      rent: 15000,
      food: 8000,
      transport: 3000,
      utilities: 2000,
      entertainment: 2000,
      other: 1000
    },
    goal: 100000
  });
  
  // Test 3: Calculate investments
  await testAPI('/calculate-investments', 'POST', {
    savingsPerMonth: 19000,
    goal: 100000,
    customRates: {
      ppf: 7.5,
      mutualFunds: 12.0
    }
  });
  
  // Test 4: Get improvement tips
  await testAPI('/improvement-tips', 'POST', {
    expenses: {
      rent: 15000,
      food: 8000,
      transport: 3000,
      utilities: 2000,
      entertainment: 2000,
      other: 1000
    },
    income: 50000,
    savingsGoal: 100000
  });
  
  // Test 5: Get learning content
  await testAPI('/learn');
  
  // Test 6: Get investment options
  await testAPI('/investment-options');
  
  console.log('🎉 All tests completed!');
}

// Run tests
runTests();