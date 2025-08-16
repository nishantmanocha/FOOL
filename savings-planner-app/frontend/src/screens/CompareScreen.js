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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart,
  LineChart,
} from 'react-native-chart-kit';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  CheckSquare,
  Square,
  BarChart3,
  Info,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const CompareScreen = ({ navigation }) => {
  const { state, calculateSurplus } = useApp();
  const [goalAmount, setGoalAmount] = useState('100000');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [selectedHorizon, setSelectedHorizon] = useState(24);
  const [selectedInstruments, setSelectedInstruments] = useState([
    'ppf',
    'mutualFunds',
    'niftyETF',
    'fd',
  ]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  const horizonOptions = [6, 12, 24, 36, 60, 120];
  const investmentOptions = {
    ppf: { name: 'PPF', rate: 7.5, color: '#3B82F6' },
    fd: { name: 'Fixed Deposit', rate: 6.5, color: '#EF4444' },
    rd: { name: 'Recurring Deposit', rate: 6.5, color: '#F97316' },
    mutualFunds: { name: 'Mutual Funds', rate: 11.0, color: '#10B981' },
    niftyETF: { name: 'Nifty ETF', rate: 11.0, color: '#8B5CF6' },
    goldETF: { name: 'Gold ETF', rate: 5.5, color: '#F59E0B' },
    sgb: { name: 'Sovereign Gold Bond', rate: 5.5, color: '#D97706' },
  };

  useEffect(() => {
    const surplus = calculateSurplus();
    if (surplus > 0) {
      setMonthlyContribution(surplus.toString());
    }
  }, [state.user.income, state.user.expenses]);

  useEffect(() => {
    if (monthlyContribution && goalAmount) {
      loadComparisonData();
    }
  }, [monthlyContribution, goalAmount, selectedHorizon, selectedInstruments]);

  const loadComparisonData = async () => {
    if (!monthlyContribution || !goalAmount) return;

    setLoading(true);
    try {
      const contribution = parseFloat(monthlyContribution);
      const goal = parseFloat(goalAmount);

      if (contribution <= 0 || goal <= 0) {
        Alert.alert('Error', 'Please enter valid amounts');
        return;
      }

      const response = await api.calculateInvestments(
        contribution,
        goal,
        state.settings.investmentRates
      );
      
      setComparisonData(response);
    } catch (error) {
      console.error('Error loading comparison data:', error);
      Alert.alert('Error', 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const toggleInstrument = (instrument) => {
    setSelectedInstruments(prev => {
      if (prev.includes(instrument)) {
        return prev.filter(item => item !== instrument);
      } else {
        return [...prev, instrument];
      }
    });
  };

  const calculateCompoundInterest = (principal, monthlyContribution, annualRate, months) => {
    const monthlyRate = annualRate / 100 / 12;
    let amount = principal;
    
    for (let i = 0; i < months; i++) {
      amount = amount * (1 + monthlyRate) + monthlyContribution;
    }
    
    return Math.round(amount);
  };

  const renderHorizonSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Investment Horizon</Text>
      <View style={styles.horizonGrid}>
        {horizonOptions.map(months => (
          <TouchableOpacity
            key={months}
            style={[
              styles.horizonButton,
              selectedHorizon === months && styles.horizonButtonActive,
            ]}
            onPress={() => setSelectedHorizon(months)}
          >
            <Text style={[
              styles.horizonButtonText,
              selectedHorizon === months && styles.horizonButtonTextActive,
            ]}>
              {months < 12 ? `${months}M` : `${months / 12}Y`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInstrumentSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Investment Options</Text>
      <View style={styles.instrumentGrid}>
        {Object.entries(investmentOptions).map(([key, option]) => {
          const isSelected = selectedInstruments.includes(key);
          const IconComponent = isSelected ? CheckSquare : Square;
          
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.instrumentCard,
                isSelected && styles.instrumentCardActive,
              ]}
              onPress={() => toggleInstrument(key)}
            >
              <View style={styles.instrumentHeader}>
                <IconComponent size={20} color={isSelected ? '#3B82F6' : '#64748b'} />
                <Text style={[
                  styles.instrumentName,
                  isSelected && styles.instrumentNameActive,
                ]}>
                  {option.name}
                </Text>
              </View>
              <Text style={styles.instrumentRate}>{option.rate}% p.a.</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderLineChart = () => {
    if (!comparisonData || selectedInstruments.length === 0) return null;

    const months = Array.from({ length: selectedHorizon }, (_, i) => i + 1);
    const contribution = parseFloat(monthlyContribution);
    
    // Generate data for selected instruments
    const datasets = [];
    const colors = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#F97316', '#D97706'];
    
    // Savings only line
    datasets.push({
      data: months.filter((_, i) => i % Math.max(1, Math.floor(selectedHorizon / 6)) === 0)
        .map(month => contribution * month),
      color: () => '#64748b',
      strokeWidth: 2,
    });

    // Investment lines
    selectedInstruments.forEach((instrument, index) => {
      const rate = investmentOptions[instrument].rate;
      datasets.push({
        data: months.filter((_, i) => i % Math.max(1, Math.floor(selectedHorizon / 6)) === 0)
          .map(month => calculateCompoundInterest(0, contribution, rate, month)),
        color: () => colors[index % colors.length],
        strokeWidth: 2,
      });
    });

    const chartData = {
      labels: months.filter((_, i) => i % Math.max(1, Math.floor(selectedHorizon / 6)) === 0)
        .map(month => month.toString()),
      datasets,
      legend: ['Savings', ...selectedInstruments.map(key => investmentOptions[key].name)],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Growth Over Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Math.max(width - 40, selectedHorizon * 15)}
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
                r: '3',
                strokeWidth: '1',
              },
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      </View>
    );
  };

  const renderBarChart = () => {
    if (!comparisonData || selectedInstruments.length === 0) return null;

    const contribution = parseFloat(monthlyContribution);
    const savingsAmount = contribution * selectedHorizon;
    
    const finalAmounts = selectedInstruments.map(instrument => {
      const rate = investmentOptions[instrument].rate;
      return calculateCompoundInterest(0, contribution, rate, selectedHorizon);
    });

    finalAmounts.unshift(savingsAmount); // Add savings only at the beginning

    const labels = ['Savings', ...selectedInstruments.map(key => investmentOptions[key].name.split(' ')[0])];
    
    const chartData = {
      labels,
      datasets: [{
        data: finalAmounts,
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Final Amount Comparison</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            width={Math.max(width - 40, labels.length * 80)}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
              style: { borderRadius: 16 },
            }}
            style={styles.chart}
            fromZero
          />
        </ScrollView>
      </View>
    );
  };

  const renderComparisonTable = () => {
    if (!comparisonData || selectedInstruments.length === 0) return null;

    const contribution = parseFloat(monthlyContribution);
    const savingsAmount = contribution * selectedHorizon;
    
    const tableData = selectedInstruments.map(instrument => {
      const option = investmentOptions[instrument];
      const finalAmount = calculateCompoundInterest(0, contribution, option.rate, selectedHorizon);
      const gain = finalAmount - savingsAmount;
      const gainPercentage = ((gain / savingsAmount) * 100).toFixed(1);
      
      return {
        name: option.name,
        rate: option.rate,
        finalAmount,
        gain,
        gainPercentage,
      };
    }).sort((a, b) => b.finalAmount - a.finalAmount);

    return (
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>Detailed Comparison</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Investment</Text>
          <Text style={styles.tableHeaderText}>Rate</Text>
          <Text style={styles.tableHeaderText}>Final Amount</Text>
          <Text style={styles.tableHeaderText}>Gain vs Savings</Text>
        </View>
        
        {/* Savings only row */}
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Savings Only</Text>
          <Text style={styles.tableCell}>0%</Text>
          <Text style={styles.tableCell}>₹{savingsAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.tableCell}>-</Text>
        </View>
        
        {tableData.map((row, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{row.name}</Text>
            <Text style={styles.tableCell}>{row.rate}%</Text>
            <Text style={styles.tableCell}>₹{row.finalAmount.toLocaleString('en-IN')}</Text>
            <Text style={[styles.tableCell, styles.gainText]}>
              +₹{row.gain.toLocaleString('en-IN')} ({row.gainPercentage}%)
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Goal Amount</Text>
              <View style={styles.inputWrapper}>
                <DollarSign size={16} color="#666" />
                <TextInput
                  style={styles.textInput}
                  value={goalAmount}
                  onChangeText={setGoalAmount}
                  keyboardType="numeric"
                  placeholder="Enter goal amount"
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Monthly SIP</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={16} color="#666" />
                <TextInput
                  style={styles.textInput}
                  value={monthlyContribution}
                  onChangeText={setMonthlyContribution}
                  keyboardType="numeric"
                  placeholder="Monthly amount"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Horizon Selector */}
        {renderHorizonSelector()}

        {/* Instrument Selector */}
        {renderInstrumentSelector()}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Calculating projections...</Text>
          </View>
        )}

        {!loading && (
          <>
            {/* Line Chart */}
            {renderLineChart()}

            {/* Bar Chart */}
            {renderBarChart()}

            {/* Comparison Table */}
            {renderComparisonTable()}

            {/* Set as Plan Button */}
            <TouchableOpacity
              style={styles.setPlanButton}
              onPress={() => {
                Alert.alert(
                  'Set as Plan',
                  'This will update your current plan with the selected parameters.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Confirm', 
                      onPress: () => {
                        navigation.navigate('Plan');
                        Alert.alert('Success', 'Plan updated successfully!');
                      }
                    },
                  ]
                );
              }}
            >
              <Target size={20} color="#fff" />
              <Text style={styles.setPlanButtonText}>Set as My Plan</Text>
            </TouchableOpacity>
          </>
        )}
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
  inputSection: {
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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 0.48,
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
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  selectorContainer: {
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
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  horizonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  horizonButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '15%',
    alignItems: 'center',
  },
  horizonButtonActive: {
    backgroundColor: '#3B82F6',
  },
  horizonButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  horizonButtonTextActive: {
    color: '#fff',
  },
  instrumentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  instrumentCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  instrumentCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3B82F6',
  },
  instrumentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  instrumentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  instrumentNameActive: {
    color: '#1d4ed8',
  },
  instrumentRate: {
    fontSize: 12,
    color: '#6b7280',
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
    color: '#111827',
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
    color: '#111827',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  gainText: {
    color: '#059669',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  setPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  setPlanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CompareScreen;