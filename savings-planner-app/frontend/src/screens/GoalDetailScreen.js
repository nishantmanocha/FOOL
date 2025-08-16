import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import {
  Target,
  Calendar,
  TrendingUp,
  Share2,
  Download,
  ArrowLeft,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

const GoalDetailScreen = ({ route, navigation }) => {
  const { goal } = route.params;
  const { calculateSurplus } = useApp();
  const [projectionData, setProjectionData] = useState(null);

  useEffect(() => {
    calculateProjections();
  }, []);

  const calculateProjections = () => {
    const surplus = calculateSurplus();
    if (surplus <= 0) return;

    const months = Array.from({ length: 60 }, (_, i) => i + 1);
    const savingsProjection = months.map(month => surplus * month);
    const investmentProjection = months.map(month => {
      const monthlyRate = 11 / 100 / 12; // 11% annual return
      let amount = 0;
      for (let i = 0; i < month; i++) {
        amount = amount * (1 + monthlyRate) + surplus;
      }
      return Math.round(amount);
    });

    setProjectionData({
      months,
      savingsProjection,
      investmentProjection,
      surplus,
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculateTimeToGoal = (goalAmount, savingsPerMonth, annualRate = 0) => {
    if (savingsPerMonth <= 0) return -1;
    
    if (annualRate === 0) {
      return Math.ceil(goalAmount / savingsPerMonth);
    }
    
    const monthlyRate = annualRate / 100 / 12;
    let months = 0;
    let amount = 0;
    
    while (amount < goalAmount && months < 1200) {
      amount = amount * (1 + monthlyRate) + savingsPerMonth;
      months++;
    }
    
    return months;
  };

  const exportGoalData = async () => {
    try {
      const surplus = calculateSurplus();
      const savingsTime = calculateTimeToGoal(goal.amount, surplus, 0);
      const investmentTime = calculateTimeToGoal(goal.amount, surplus, 11);

      const exportData = {
        goal: {
          title: goal.title,
          amount: goal.amount,
          targetDate: goal.targetDate,
        },
        analysis: {
          monthlySurplus: surplus,
          timeToGoalSavingsOnly: savingsTime,
          timeToGoalWithInvestment: investmentTime,
          timeSaved: savingsTime - investmentTime,
        },
        projections: projectionData,
        exportedAt: new Date().toISOString(),
      };

      const fileName = `goal_${goal.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
      
      const shareResult = await Share.share({
        url: fileUri,
        title: `${goal.title} - Financial Analysis`,
      });

      if (shareResult.action === Share.sharedAction) {
        Alert.alert('Success', 'Goal data exported successfully!');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export goal data');
    }
  };

  const renderChart = () => {
    if (!projectionData) return null;

    const chartData = {
      labels: projectionData.months.filter((_, i) => i % 12 === 0).map(m => `${Math.floor(m/12)}Y`),
      datasets: [
        {
          data: projectionData.savingsProjection.filter((_, i) => i % 12 === 0),
          color: () => '#64748b',
          strokeWidth: 2,
        },
        {
          data: projectionData.investmentProjection.filter((_, i) => i % 12 === 0),
          color: () => '#10b981',
          strokeWidth: 2,
        },
      ],
      legend: ['Savings Only', 'With Investment'],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Savings vs Investment Projection</Text>
        <LineChart
          data={chartData}
          width={width - 40}
          height={220}
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

  const renderScheduleTable = () => {
    if (!projectionData) return null;

    const surplus = projectionData.surplus;
    const savingsTime = calculateTimeToGoal(goal.amount, surplus, 0);
    const investmentTime = calculateTimeToGoal(goal.amount, surplus, 11);

    const scheduleData = [];
    for (let i = 1; i <= Math.min(investmentTime, 24); i++) {
      const savingsAmount = surplus * i;
      const monthlyRate = 11 / 100 / 12;
      let investmentAmount = 0;
      for (let j = 0; j < i; j++) {
        investmentAmount = investmentAmount * (1 + monthlyRate) + surplus;
      }
      
      scheduleData.push({
        month: i,
        savings: Math.round(savingsAmount),
        investment: Math.round(investmentAmount),
      });
    }

    return (
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>Month-by-Month Schedule</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Month</Text>
          <Text style={styles.tableHeaderText}>Savings Only</Text>
          <Text style={styles.tableHeaderText}>With Investment</Text>
        </View>
        
        {scheduleData.slice(0, 12).map((row, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{row.month}</Text>
            <Text style={styles.tableCell}>{formatCurrency(row.savings)}</Text>
            <Text style={[styles.tableCell, styles.investmentCell]}>
              {formatCurrency(row.investment)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const surplus = calculateSurplus();
  const savingsTime = calculateTimeToGoal(goal.amount, surplus, 0);
  const investmentTime = calculateTimeToGoal(goal.amount, surplus, 11);
  const timeSaved = savingsTime - investmentTime;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Details</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={exportGoalData}
        >
          <Share2 size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Goal Info */}
        <View style={styles.goalInfo}>
          <View style={styles.goalHeader}>
            <Target size={24} color="#3B82F6" />
            <Text style={styles.goalTitle}>{goal.title}</Text>
          </View>
          <Text style={styles.goalAmount}>{formatCurrency(goal.amount)}</Text>
          
          {goal.targetDate && (
            <View style={styles.targetDateContainer}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.targetDate}>Target Date: {goal.targetDate}</Text>
            </View>
          )}
        </View>

        {/* Analysis Summary */}
        <View style={styles.analysisContainer}>
          <Text style={styles.sectionTitle}>Analysis Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Monthly Contribution</Text>
              <Text style={styles.summaryValue}>{formatCurrency(surplus)}</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Time Saved</Text>
              <Text style={[styles.summaryValue, styles.timeSavedValue]}>
                {timeSaved > 0 ? `${timeSaved} months` : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Savings Only</Text>
              <Text style={styles.comparisonTime}>
                {savingsTime > 0 ? `${savingsTime} months` : 'Cannot achieve'}
              </Text>
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>With Investment (11%)</Text>
              <Text style={[styles.comparisonTime, styles.investmentTime]}>
                {investmentTime > 0 ? `${investmentTime} months` : 'Cannot achieve'}
              </Text>
            </View>
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Schedule Table */}
        {renderScheduleTable()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={exportGoalData}
          >
            <Download size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Export Data</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  shareButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  goalInfo: {
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
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  goalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  targetDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetDate: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  analysisContainer: {
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timeSavedValue: {
    color: '#10B981',
  },
  comparisonContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 16,
    color: '#374151',
  },
  comparisonTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  investmentTime: {
    color: '#10B981',
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
  tableContainer: {
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
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  investmentCell: {
    color: '#059669',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default GoalDetailScreen;