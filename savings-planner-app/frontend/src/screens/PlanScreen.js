import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  Calendar,
  DollarSign,
  Edit3,
  Lightbulb,
  Clock,
} from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const PlanScreen = ({ navigation }) => {
  const { state, calculateSurplus } = useApp();
  const [savingsData, setSavingsData] = useState(null);
  const [investmentData, setInvestmentData] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.user.hasCompletedOnboarding) {
      loadData();
    }
  }, [state.user.income, state.user.expenses]);

  const loadData = async () => {
    setLoading(true);
    try {
      const surplus = calculateSurplus();
      
      if (surplus > 0) {
        // Get primary goal or use default
        const primaryGoal = state.goals.length > 0 ? state.goals[0] : { amount: 100000 };
        
        // Calculate savings
        const savingsResponse = await api.calculateSavings(
          state.user.income,
          state.user.expenses,
          primaryGoal.amount
        );
        setSavingsData(savingsResponse);

        // Calculate investment projections
        const investmentResponse = await api.calculateInvestments(
          surplus,
          primaryGoal.amount,
          state.settings.investmentRates
        );
        setInvestmentData(investmentResponse);

        // Get improvement tips
        const tipsResponse = await api.getImprovementTips(
          state.user.expenses,
          state.user.income,
          primaryGoal.amount
        );
        setTips(tipsResponse.tips || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
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

  const renderSummaryCard = (title, value, icon, color, subtitle) => {
    const IconComponent = icon;
    return (
      <View style={[styles.summaryCard, { borderLeftColor: color }]}>
        <View style={styles.summaryCardHeader}>
          <IconComponent size={24} color={color} />
          <Text style={styles.summaryCardTitle}>{title}</Text>
        </View>
        <Text style={styles.summaryCardValue}>{value}</Text>
        {subtitle && <Text style={styles.summaryCardSubtitle}>{subtitle}</Text>}
      </View>
    );
  };

  const renderComparisonChart = () => {
    if (!investmentData || !savingsData) return null;

    const months = Array.from({ length: 24 }, (_, i) => i + 1);
    const savingsLine = months.map(month => savingsData.savingsPerMonth * month);
    const bestInvestment = investmentData.comparisonVsSavings[0];
    const investmentRate = bestInvestment?.annualRate || 11;
    
    // Calculate compound growth for best investment
    const investmentLine = months.map(month => {
      const monthlyRate = investmentRate / 100 / 12;
      let amount = 0;
      for (let i = 0; i < month; i++) {
        amount = amount * (1 + monthlyRate) + savingsData.savingsPerMonth;
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
      legend: ['Savings Only', 'With Investment'],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Savings vs Investment Growth</Text>
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
      <View style={styles.tipsContainer}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={20} color="#f59e0b" />
          <Text style={styles.tipsTitle}>Improvement Tips</Text>
        </View>
        {tips.slice(0, 3).map((tip, index) => (
          <TouchableOpacity key={index} style={styles.tipCard}>
            <Text style={styles.tipText}>{tip.suggestion}</Text>
            {tip.timeSavedMonths && (
              <Text style={styles.tipBenefit}>
                Save {tip.timeSavedMonths} months
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!state.user.hasCompletedOnboarding) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.onboardingPrompt}>
          <PiggyBank size={80} color="#3B82F6" />
          <Text style={styles.onboardingTitle}>Welcome to Savings Planner!</Text>
          <Text style={styles.onboardingSubtitle}>
            Complete the setup to start planning your financial future
          </Text>
          <TouchableOpacity
            style={styles.onboardingButton}
            onPress={() => navigation.navigate('Onboarding')}
          >
            <Text style={styles.onboardingButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const surplus = calculateSurplus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          {renderSummaryCard(
            'Monthly Income',
            formatCurrency(state.user.income),
            Wallet,
            '#10b981'
          )}
          {renderSummaryCard(
            'Total Expenses',
            formatCurrency(Object.values(state.user.expenses).reduce((sum, exp) => sum + exp, 0)),
            Receipt,
            '#ef4444'
          )}
          {renderSummaryCard(
            'Available Surplus',
            formatCurrency(surplus),
            PiggyBank,
            '#3B82F6',
            surplus <= 0 ? 'Consider reducing expenses' : 'Great! You can save'
          )}
        </View>

        {/* Savings Recommendations */}
        {surplus > 0 && savingsData && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>Recommended Savings</Text>
            <View style={styles.recommendationGrid}>
              <View style={styles.recommendationCard}>
                <Calendar size={20} color="#3B82F6" />
                <Text style={styles.recommendationLabel}>Daily</Text>
                <Text style={styles.recommendationValue}>
                  {formatCurrency(savingsData.savingsPerDay)}
                </Text>
              </View>
              <View style={styles.recommendationCard}>
                <Clock size={20} color="#10b981" />
                <Text style={styles.recommendationLabel}>Weekly</Text>
                <Text style={styles.recommendationValue}>
                  {formatCurrency(savingsData.savingsPerWeek)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Goal Progress */}
        {state.goals.length > 0 && savingsData && investmentData && (
          <View style={styles.goalContainer}>
            <Text style={styles.sectionTitle}>Primary Goal Progress</Text>
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>{state.goals[0].title || 'My Goal'}</Text>
              <Text style={styles.goalAmount}>{formatCurrency(state.goals[0].amount)}</Text>
              
              <View style={styles.timeComparisonContainer}>
                <View style={styles.timeComparison}>
                  <Text style={styles.timeLabel}>Savings Only</Text>
                  <Text style={styles.timeValue}>
                    {formatTimeToGoal(savingsData.timeToGoalMonths)}
                  </Text>
                </View>
                <View style={styles.timeComparison}>
                  <Text style={styles.timeLabel}>Best Investment</Text>
                  <Text style={[styles.timeValue, styles.timeValueGreen]}>
                    {investmentData.comparisonVsSavings[0] && 
                     formatTimeToGoal(investmentData.comparisonVsSavings[0].timeToGoalMonths)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Comparison Chart */}
        {renderComparisonChart()}

        {/* Tips */}
        {renderTips()}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Goals')}
          >
            <Text style={styles.actionButtonText}>Manage Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate('Compare')}
          >
            <Text style={styles.actionButtonTextSecondary}>Compare Options</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  onboardingPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  onboardingButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  onboardingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryGrid: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryCardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  recommendationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  goalContainer: {
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  goalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginVertical: 8,
  },
  timeComparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  timeComparison: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  timeValueGreen: {
    color: '#10b981',
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
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  tipsContainer: {
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
    color: '#1e293b',
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
  },
  tipBenefit: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PlanScreen;