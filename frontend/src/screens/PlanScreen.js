import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  Calendar,
  DollarSign,
  Calculator,
  Lightbulb,
  Clock,
  Target,
  Edit3,
  Percent,
  X,
} from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

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

const PlanScreen = ({ navigation }) => {
  const { state, dispatch, actions } = useApp();
  const [salary, setSalary] = useState(state.user.income?.toString() || '');
  const [goal, setGoal] = useState('100000');
  const [expenses, setExpenses] = useState({
    rent: state.user.expenses?.rent?.toString() || '',
    emi: state.user.expenses?.emi?.toString() || '',
    food: state.user.expenses?.food?.toString() || '',
    transport: state.user.expenses?.transport?.toString() || '',
    utilities: state.user.expenses?.utilities?.toString() || '',
    entertainment: state.user.expenses?.entertainment?.toString() || '',
    other: state.user.expenses?.other?.toString() || '',
  });
  
  const [calculatedData, setCalculatedData] = useState(null);
  const [investmentData, setInvestmentData] = useState(null);
  const [tips, setTips] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [surplus, setSurplus] = useState(0);
  const [ratesModalVisible, setRatesModalVisible] = useState(false);
  const [editingRates, setEditingRates] = useState({});
  const [financialHealthScore, setFinancialHealthScore] = useState(null);
  const [wealthGap, setWealthGap] = useState(null);
  const [fireCalculation, setFireCalculation] = useState(null);
  const [age, setAge] = useState('30');
  const [currentSavings, setCurrentSavings] = useState('50000');

  // Auto-calculate surplus when salary or expenses change
  useEffect(() => {
    const numericSalary = parseFloat(salary) || 0;
    const totalExpenses = Object.values(expenses).reduce((sum, expense) => {
      return sum + (parseFloat(expense) || 0);
    }, 0);
    setSurplus(numericSalary - totalExpenses);
  }, [salary, expenses]);

  const expenseCategories = [
    { key: 'rent', label: 'Rent/EMI', icon: Receipt },
    { key: 'emi', label: 'Other EMIs', icon: DollarSign },
    { key: 'food', label: 'Food & Groceries', icon: PiggyBank },
    { key: 'transport', label: 'Transport', icon: TrendingUp },
    { key: 'utilities', label: 'Utilities', icon: Wallet },
    { key: 'entertainment', label: 'Entertainment', icon: Calendar },
    { key: 'other', label: 'Other', icon: Target },
  ];

  const handleCalculate = async () => {
    if (!salary || parseFloat(salary) <= 0) {
      Alert.alert('Error', 'Please enter a valid salary');
      return;
    }

    if (!goal || parseFloat(goal) <= 0) {
      Alert.alert('Error', 'Please enter a valid goal amount');
      return;
    }

    setLoading(true);
    try {
      const numericSalary = parseFloat(salary);
      const numericGoal = parseFloat(goal);
      const numericExpenses = {};
      
      Object.keys(expenses).forEach(key => {
        numericExpenses[key] = parseFloat(expenses[key]) || 0;
      });

      // Save to context
      dispatch({
        type: actions.SET_USER_DATA,
        payload: {
          income: numericSalary,
          expenses: numericExpenses,
          hasCompletedOnboarding: true,
        },
      });

      // Calculate goal timeframe in years
      const timeToGoalMonths = calculateTimeToGoal(surplus, numericGoal, 0);
      const goalTimeframeYears = timeToGoalMonths / 12;
      
      // Parse additional inputs
      const numericAge = parseInt(age) || 30;
      const numericCurrentSavings = parseFloat(currentSavings) || 0;

      // Call backend APIs
      const [
        savingsResponse, 
        investmentResponse, 
        tipsResponse, 
        recommendationsResponse,
        healthScoreResponse,
        wealthGapResponse,
        fireResponse
      ] = await Promise.all([
        api.calculateSavings(numericSalary, numericExpenses, numericGoal),
        api.calculateInvestments(surplus, numericGoal, state.settings.investmentRates),
        api.getImprovementTips(numericExpenses, numericSalary, numericGoal),
        api.getPersonalizedRecommendations(numericSalary, numericExpenses, surplus, numericGoal, goalTimeframeYears),
        api.getFinancialHealthScore(numericSalary, numericExpenses, surplus, numericGoal, numericCurrentSavings),
        api.getWealthGapAnalysis(numericAge, numericSalary * 12, numericCurrentSavings),
        api.calculateFIRE(Object.values(numericExpenses).reduce((sum, val) => sum + val, 0), numericCurrentSavings, numericSalary)
      ]);

      setCalculatedData(savingsResponse);
      setInvestmentData(investmentResponse);
      setTips(tipsResponse.tips || []);
      setRecommendations(recommendationsResponse);
      setFinancialHealthScore(healthScoreResponse);
      setWealthGap(wealthGapResponse);
      setFireCalculation(fireResponse);

    } catch (error) {
      console.error('Error calculating:', error);
      Alert.alert('Error', 'Failed to calculate projections. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRates = () => {
    setEditingRates({ ...state.settings.investmentRates });
    setRatesModalVisible(true);
  };

  const handleSaveRates = () => {
    dispatch({
      type: actions.UPDATE_SETTINGS,
      payload: { investmentRates: editingRates },
    });
    setRatesModalVisible(false);
  };

  const handleRateChange = (instrument, value) => {
    const numericValue = parseFloat(value) || 0;
    setEditingRates(prev => ({
      ...prev,
      [instrument]: numericValue,
    }));
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatTimeToGoal = (months) => {
    if (months < 0) return 'Cannot achieve';
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  };

  const renderInputForm = () => (
    <View style={styles.inputSection}>
      <Text style={styles.sectionTitle}>Financial Planning Calculator</Text>
      
      {/* Salary Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Monthly Salary</Text>
        <View style={styles.inputWrapper}>
          <DollarSign size={20} color="#6B7280" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your monthly salary"
            value={salary}
            onChangeText={setSalary}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Goal Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Savings Goal</Text>
        <View style={styles.inputWrapper}>
          <Target size={20} color="#6B7280" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your savings goal"
            value={goal}
            onChangeText={setGoal}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      {/* Current Savings Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current Savings</Text>
        <View style={styles.inputWrapper}>
          <PiggyBank size={20} color="#6B7280" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your current savings"
            value={currentSavings}
            onChangeText={setCurrentSavings}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      {/* Age Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your Age</Text>
        <View style={styles.inputWrapper}>
          <Calendar size={20} color="#6B7280" />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Expenses Section */}
      <Text style={styles.subSectionTitle}>Monthly Expenses</Text>
      {expenseCategories.map((category) => {
        const IconComponent = category.icon;
        return (
          <View key={category.key} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{category.label}</Text>
            <View style={styles.inputWrapper}>
              <IconComponent size={20} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="₹0"
                value={expenses[category.key]}
                onChangeText={(value) => 
                  setExpenses(prev => ({ ...prev, [category.key]: value }))
                }
                keyboardType="numeric"
              />
            </View>
          </View>
        );
      })}

      {/* Auto-calculated Surplus */}
      <View style={styles.surplusDisplay}>
        <Text style={styles.surplusLabel}>Available for Savings:</Text>
        <Text style={[
          styles.surplusValue, 
          surplus < 0 ? styles.surplusNegative : styles.surplusPositive
        ]}>
          {formatCurrency(surplus)}
        </Text>
      </View>

      {/* Calculate Button */}
      <TouchableOpacity 
        style={[styles.calculateButton, surplus <= 0 && styles.calculateButtonDisabled]} 
        onPress={handleCalculate}
        disabled={loading || surplus <= 0}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Calculator size={20} color="#fff" />
            <Text style={styles.calculateButtonText}>Calculate Projections</Text>
          </>
        )}
      </TouchableOpacity>

      {surplus <= 0 && (
        <Text style={styles.warningText}>
          Reduce expenses to enable savings calculations
        </Text>
      )}
    </View>
  );

  const renderSavingsTimeline = () => {
    if (!calculatedData) return null;

    return (
      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Savings Timeline</Text>
        
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Plain Savings (No Investment)</Text>
          <Text style={styles.timelineValue}>
            {formatTimeToGoal(calculatedData.timeToGoalMonths)}
          </Text>
          <Text style={styles.timelineSubtext}>
            Monthly savings: {formatCurrency(calculatedData.savingsPerMonth)}
          </Text>
        </View>
        
        {/* Financial Health Score */}
        {financialHealthScore && (
          <View style={styles.financialHealthSection}>
            <Text style={styles.subSectionTitle}>Financial Health Score</Text>
            <View style={styles.scoreCard}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>{financialHealthScore.totalScore}</Text>
                <Text style={styles.scoreLabel}>out of 100</Text>
              </View>
              
              <View style={styles.scoreBreakdown}>
                <Text style={styles.scoreBreakdownTitle}>Score Breakdown:</Text>
                <View style={styles.scoreBreakdownItem}>
                  <Text style={styles.scoreBreakdownLabel}>Savings Rate:</Text>
                  <Text style={styles.scoreBreakdownValue}>{financialHealthScore.savingsScore.score} pts</Text>
                </View>
                <View style={styles.scoreBreakdownItem}>
                  <Text style={styles.scoreBreakdownLabel}>Debt-to-Income:</Text>
                  <Text style={styles.scoreBreakdownValue}>{financialHealthScore.debtScore.score} pts</Text>
                </View>
                <View style={styles.scoreBreakdownItem}>
                  <Text style={styles.scoreBreakdownLabel}>Goal Progress:</Text>
                  <Text style={styles.scoreBreakdownValue}>{financialHealthScore.goalScore.score} pts</Text>
                </View>
              </View>
            </View>
            <View style={styles.scoreMessages}>
              <Text style={styles.scoreMessage}>{financialHealthScore.savingsScore.message}</Text>
              <Text style={styles.scoreMessage}>{financialHealthScore.debtScore.message}</Text>
              <Text style={styles.scoreMessage}>{financialHealthScore.goalScore.message}</Text>
            </View>
          </View>
        )}
        
        {/* Wealth Gap Analysis */}
        {wealthGap && (
          <View style={styles.wealthGapSection}>
            <Text style={styles.subSectionTitle}>Wealth Gap Analysis</Text>
            <View style={styles.wealthGapCard}>
              <Text style={styles.wealthGapTitle}>Age-Based Savings Benchmark</Text>
              <View style={styles.wealthGapItem}>
                <Text style={styles.wealthGapLabel}>Your Current Savings:</Text>
                <Text style={styles.wealthGapValue}>{formatCurrency(wealthGap.currentSavings)}</Text>
              </View>
              <View style={styles.wealthGapItem}>
                <Text style={styles.wealthGapLabel}>Recommended for Age {wealthGap.age}:</Text>
                <Text style={styles.wealthGapValue}>{formatCurrency(wealthGap.recommendedSavings)}</Text>
              </View>
              <View style={styles.wealthGapItem}>
                <Text style={styles.wealthGapLabel}>Gap:</Text>
                <Text style={[styles.wealthGapValue, wealthGap.wealthGap >= 0 ? styles.positiveGap : styles.negativeGap]}>
                  {wealthGap.wealthGap >= 0 ? '+' : ''}{formatCurrency(wealthGap.wealthGap)}
                </Text>
              </View>
              <Text style={styles.wealthGapMessage}>{wealthGap.message}</Text>
            </View>
          </View>
        )}
        
        {/* FIRE Calculator */}
        {fireCalculation && (
          <View style={styles.fireSection}>
            <Text style={styles.subSectionTitle}>FIRE Calculator</Text>
            <View style={styles.fireCard}>
              <Text style={styles.fireTitle}>Financial Independence, Retire Early</Text>
              <View style={styles.fireItem}>
                <Text style={styles.fireLabel}>FIRE Number (Target):</Text>
                <Text style={styles.fireValue}>{formatCurrency(fireCalculation.fireNumber)}</Text>
              </View>
              <View style={styles.fireItem}>
                <Text style={styles.fireLabel}>Years to FIRE:</Text>
                <Text style={styles.fireValue}>{fireCalculation.yearsToFIRE === -1 ? 'Not achievable' : `${fireCalculation.yearsToFIRE} years`}</Text>
              </View>
              <View style={styles.fireItem}>
                <Text style={styles.fireLabel}>Retirement Age:</Text>
                <Text style={styles.fireValue}>{parseInt(age) + Math.round(fireCalculation.yearsToFIRE)}</Text>
              </View>
              <Text style={styles.fireMessage}>{fireCalculation.message}</Text>
            </View>
          </View>
        )}
        
        {/* Personalized Recommendations */}
        {recommendations && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.subSectionTitle}>Personalized Recommendations</Text>
            
            {/* Savings Rate Recommendations */}
            {recommendations.recommendations?.map((recommendation, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={[styles.recommendationPriority, {
                  backgroundColor: recommendation.priority === 'high' ? '#EF4444' : 
                                  recommendation.priority === 'medium' ? '#F59E0B' : '#10B981'
                }]} />
                <Text style={styles.recommendationText}>{recommendation.message}</Text>
              </View>
            ))}

            {/* Portfolio Suggestions */}
             {recommendations.portfolioSuggestion && (
               <View style={styles.portfolioSuggestionCard}>
                 <Text style={styles.portfolioSuggestionTitle}>Goal-Based Portfolio Suggestion</Text>
                 <Text style={styles.portfolioSuggestionMessage}>
                   {recommendations.portfolioSuggestion.message}
                 </Text>
                 
                 <View style={styles.allocationContainer}>
                   {Object.entries(recommendations.portfolioSuggestion.allocation).map(([key, value], index) => (
                     <View key={index} style={styles.allocationItem}>
                       <View style={styles.allocationBar}>
                         <View 
                           style={[styles.allocationFill, { 
                             width: `${value}%`,
                             backgroundColor: index === 0 ? '#3B82F6' : 
                                           index === 1 ? '#10B981' : '#F59E0B'
                           }]} 
                         />
                       </View>
                       <View style={styles.allocationLabelContainer}>
                         <Text style={styles.allocationLabel}>
                           {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                         </Text>
                         <Text style={styles.allocationValue}>{value}%</Text>
                       </View>
                     </View>
                   ))}
                 </View>
                 
                 <Text style={styles.portfolioExplanation}>
                   {recommendations.portfolioSuggestion.explanation}
                 </Text>
               </View>
             )}

             {/* Example Texts */}
             {recommendations.examples && recommendations.examples.map((example, index) => (
               <View key={index} style={styles.exampleCard}>
                 <Text style={styles.exampleText}>{example.message}</Text>
               </View>
             ))}
           </View>
         )}
      </View>
    );
  };

  const getInvestmentRecommendation = (option, goalMonths) => {
    const goalYears = goalMonths / 12;
    const instrument = option.name;
    const rate = option.annualRate;
    
    let recommendation = {
      suitable: true,
      reasons: [],
      warnings: [],
      priority: 'medium'
    };

    // Goal duration analysis
    if (goalYears <= 3) {
      if (['Fixed Deposit', 'Recurring Deposit'].includes(instrument)) {
        recommendation.reasons.push('✅ Ideal for short-term goals (≤3 years)');
        recommendation.reasons.push('✅ Capital protection guaranteed');
        recommendation.priority = 'high';
      } else if (['Mutual Funds', 'Nifty ETF'].includes(instrument)) {
        recommendation.warnings.push('⚠️ High volatility risk for short-term goals');
        recommendation.suitable = false;
      }
    } else if (goalYears <= 7) {
      if (['Mutual Funds', 'Gold ETF'].includes(instrument)) {
        recommendation.reasons.push('✅ Good for medium-term goals (3-7 years)');
        recommendation.priority = 'high';
      }
    } else {
      if (['PPF', 'Nifty ETF', 'Mutual Funds', 'Sovereign Gold Bond'].includes(instrument)) {
        recommendation.reasons.push('✅ Excellent for long-term goals (≥7 years)');
        recommendation.priority = 'high';
      }
    }

    // Return rate analysis
    if (rate >= 10) {
      recommendation.reasons.push('✅ High expected returns');
      recommendation.reasons.push('✅ Better inflation protection');
    } else if (rate <= 7) {
      recommendation.reasons.push('✅ Stable & predictable returns');
    }

    // Risk & Security analysis
    if (['PPF', 'Fixed Deposit', 'Recurring Deposit'].includes(instrument)) {
      recommendation.reasons.push('✅ Government backed / Low risk');
      recommendation.reasons.push('✅ Capital protection guaranteed');
    } else if (['Sovereign Gold Bond'].includes(instrument)) {
      recommendation.reasons.push('✅ Government guaranteed');
      recommendation.reasons.push('✅ Additional 2.5% interest + gold appreciation');
    } else if (['Mutual Funds', 'Nifty ETF'].includes(instrument)) {
      recommendation.warnings.push('⚠️ Market risk - returns not guaranteed');
      recommendation.reasons.push('✅ Historically beats inflation');
    }

    // Liquidity analysis
    if (instrument === 'PPF') {
      recommendation.warnings.push('⚠️ 15-year lock-in period');
      recommendation.reasons.push('✅ Tax-free returns (EEE benefit)');
    } else if (['Mutual Funds', 'Nifty ETF', 'Gold ETF'].includes(instrument)) {
      recommendation.reasons.push('✅ High liquidity - can exit anytime');
      recommendation.reasons.push('✅ Flexible SIP amounts');
    } else if (['Fixed Deposit', 'Recurring Deposit'].includes(instrument)) {
      recommendation.warnings.push('⚠️ Early exit penalty applies');
    }

    // Tax benefits
    if (instrument === 'PPF') {
      recommendation.reasons.push('✅ 80C deduction + tax-free growth & withdrawal');
    } else if (instrument === 'Sovereign Gold Bond') {
      recommendation.reasons.push('✅ Tax-free if held till maturity (8 years)');
    }

    return recommendation;
  };

  const renderInvestmentOptions = () => {
    if (!investmentData) return null;

    const goalMonths = parseFloat(goal) / (calculatedData?.savingsPerMonth || 1);

    return (
      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Investment Options Analysis</Text>
        
        <View style={styles.investmentGrid}>
          {investmentData.comparisonVsSavings.map((option, index) => {
            const recommendation = getInvestmentRecommendation(option, goalMonths);
            return (
              <View key={index} style={[
                styles.investmentCard,
                recommendation.priority === 'high' && styles.investmentCardRecommended,
                !recommendation.suitable && styles.investmentCardNotSuitable
              ]}>
                <View style={styles.investmentHeader}>
                  <Text style={styles.investmentName}>{option.name}</Text>
                  <Text style={styles.investmentRate}>{option.annualRate}% p.a.</Text>
                </View>
                
                <Text style={styles.investmentTime}>
                  {formatTimeToGoal(option.timeToGoalMonths)}
                </Text>
                
                {option.timeSaved > 0 && (
                  <Text style={styles.timeSaved}>
                    {option.timeSaved} months faster
                  </Text>
                )}

                {recommendation.priority === 'high' && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                  </View>
                )}

                <View style={styles.reasonsContainer}>
                  {recommendation.reasons.slice(0, 2).map((reason, idx) => (
                    <Text key={idx} style={styles.reasonText}>{reason}</Text>
                  ))}
                  {recommendation.warnings.slice(0, 1).map((warning, idx) => (
                    <Text key={idx} style={styles.warningText}>{warning}</Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderChart = () => {
    if (!calculatedData || !investmentData) return null;

    const months = Array.from({ length: 24 }, (_, i) => i + 1);
    const savingsLine = months.map(month => calculatedData.savingsPerMonth * month);
    const bestInvestment = investmentData.comparisonVsSavings[0];
    const investmentRate = bestInvestment?.annualRate || 11;
    
    // Calculate compound growth for best investment
    const investmentLine = months.map(month => {
      const monthlyRate = investmentRate / 100 / 12;
      let amount = 0;
      for (let i = 0; i < month; i++) {
        amount = amount * (1 + monthlyRate) + calculatedData.savingsPerMonth;
      }
      return Math.round(amount);
    });

    const chartData = {
      labels: ['6', '12', '18', '24'],
      datasets: [
        {
          data: [savingsLine[5], savingsLine[11], savingsLine[17], savingsLine[23]],
          color: () => '#64748b',
          strokeWidth: 2,
        },
        {
          data: [investmentLine[5], investmentLine[11], investmentLine[17], investmentLine[23]],
          color: () => '#10b981',
          strokeWidth: 2,
        },
      ],
      legend: ['Savings Only', `Best Investment (${bestInvestment?.name})`],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Growth Comparison</Text>
        <LineChart
          data={chartData}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderTips = () => {
    if (tips.length === 0) return null;

    return (
      <View style={styles.tipsSection}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={20} color="#f59e0b" />
          <Text style={styles.tipsTitle}>Improvement Tips</Text>
        </View>
        {tips.slice(0, 3).map((tip, index) => (
          <View key={index} style={styles.tipCard}>
            <Text style={styles.tipText}>{tip.suggestion}</Text>
            {tip.timeSavedMonths && (
              <Text style={styles.tipBenefit}>
                💡 Save {tip.timeSavedMonths} months faster
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCurrentRates = () => (
    <View style={styles.ratesSection}>
      <View style={styles.ratesHeader}>
        <Text style={styles.ratesSectionTitle}>Current Market Rates</Text>
        <TouchableOpacity style={styles.editRatesButton} onPress={handleEditRates}>
          <Edit3 size={14} color="#3B82F6" />
          <Text style={styles.editRatesText}>Edit Rates</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.ratesCompact}>
        {Object.entries(state.settings.investmentRates).map(([key, rate]) => (
          <View key={key} style={styles.rateItem}>
            <Text style={styles.rateItemName}>
              {key === 'ppf' ? 'PPF' :
               key === 'fd' ? 'FD' :
               key === 'rd' ? 'RD' :
               key === 'mutualFunds' ? 'Mutual Funds' :
               key === 'niftyETF' ? 'Nifty ETF' :
               key === 'goldETF' ? 'Gold ETF' :
               key === 'sgb' ? 'SGB' : key}
            </Text>
            <Text style={styles.rateItemValue}>{rate}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRatesModal = () => (
    <Modal
      visible={ratesModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setRatesModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Interest Rates</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setRatesModalVisible(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {Object.entries(editingRates).map(([instrument, rate]) => (
              <View key={instrument} style={styles.rateInputItem}>
                <Text style={styles.rateInputLabel}>
                  {instrument === 'ppf' ? 'PPF' :
                   instrument === 'fd' ? 'Fixed Deposit' :
                   instrument === 'rd' ? 'Recurring Deposit' :
                   instrument === 'mutualFunds' ? 'Mutual Funds' :
                   instrument === 'niftyETF' ? 'Nifty ETF' :
                   instrument === 'goldETF' ? 'Gold ETF' :
                   instrument === 'sgb' ? 'Sovereign Gold Bond' : instrument}
                </Text>
                <View style={styles.rateInputContainer}>
                  <TextInput
                    style={styles.rateInput}
                    value={rate.toString()}
                    onChangeText={(value) => handleRateChange(instrument, value)}
                    keyboardType="numeric"
                    placeholder="0.0"
                  />
                  <Percent size={16} color="#6B7280" style={styles.percentIcon} />
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setRatesModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveRates}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Always show input form */}
        {renderInputForm()}

        {/* Show results only after calculation */}
        {calculatedData && (
          <>
            {renderSavingsTimeline()}
            {renderInvestmentOptions()}
            {renderChart()}
            {renderTips()}
          </>
        )}

        {/* Always show current market rates at bottom */}
        {renderCurrentRates()}
      </ScrollView>

      {/* Rates editing modal */}
      {renderRatesModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Financial Health Score Styles
  financialHealthSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#fff',
  },
  scoreBreakdown: {
    flex: 1,
  },
  scoreBreakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  scoreBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreBreakdownLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  scoreBreakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  scoreMessages: {
    marginTop: 12,
    marginHorizontal: 8,
  },
  scoreMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  
  // Wealth Gap Analysis Styles
  wealthGapSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  wealthGapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wealthGapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  wealthGapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wealthGapLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  wealthGapValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  positiveGap: {
    color: '#10B981',
  },
  negativeGap: {
    color: '#EF4444',
  },
  wealthGapMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 12,
    fontStyle: 'italic',
  },
  
  // FIRE Calculator Styles
  fireSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  fireCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fireTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  fireItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fireLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  fireValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  fireMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 12,
    fontStyle: 'italic',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  inputSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  surplusDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  surplusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  surplusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  surplusPositive: {
    color: '#10b981',
  },
  surplusNegative: {
    color: '#ef4444',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  calculateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningText: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  resultsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  timelineValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  timelineSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  investmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  investmentCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  investmentCardRecommended: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  investmentCardNotSuitable: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  investmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  investmentRate: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  investmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  timeSaved: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 6,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  recommendedBadgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  reasonsContainer: {
    marginTop: 6,
  },
  reasonText: {
    fontSize: 10,
    color: '#059669',
    marginBottom: 2,
    lineHeight: 14,
  },
  warningText: {
    fontSize: 10,
    color: '#dc2626',
    marginBottom: 2,
    lineHeight: 14,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  tipsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  tipCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
    marginBottom: 4,
  },
  tipBenefit: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  ratesSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ratesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  editRatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editRatesText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 3,
  },
  ratesCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
    width: '48%',
  },
  rateItemName: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  rateItemValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  rateInputItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rateInputLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  rateInput: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  percentIcon: {
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Styles for personalized recommendations section
  recommendationsSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  recommendationPriority: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  portfolioSuggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  portfolioSuggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  portfolioSuggestionMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  allocationContainer: {
    marginVertical: 12,
  },
  allocationItem: {
    marginBottom: 10,
  },
  allocationBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  allocationFill: {
    height: '100%',
    borderRadius: 4,
  },
  allocationLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  allocationLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  allocationValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  portfolioExplanation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  exampleCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  exampleText: {
    fontSize: 14,
    color: '#1F2937',
    fontStyle: 'italic',
  },
});

export default PlanScreen;