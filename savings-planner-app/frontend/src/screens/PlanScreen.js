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
  const [loading, setLoading] = useState(false);
  const [surplus, setSurplus] = useState(0);
  const [ratesModalVisible, setRatesModalVisible] = useState(false);
  const [editingRates, setEditingRates] = useState({});

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

      // Call backend APIs
      const [savingsResponse, investmentResponse, tipsResponse] = await Promise.all([
        api.calculateSavings(numericSalary, numericExpenses, numericGoal),
        api.calculateInvestments(surplus, numericGoal, state.settings.investmentRates),
        api.getImprovementTips(numericExpenses, numericSalary, numericGoal)
      ]);

      setCalculatedData(savingsResponse);
      setInvestmentData(investmentResponse);
      setTips(tipsResponse.tips || []);

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
      </View>
    );
  };

  const renderInvestmentOptions = () => {
    if (!investmentData) return null;

    return (
      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Investment Options Timeline</Text>
        
        {investmentData.comparisonVsSavings.map((option, index) => (
          <View key={index} style={styles.investmentCard}>
            <View style={styles.investmentHeader}>
              <Text style={styles.investmentName}>{option.name}</Text>
              <Text style={styles.investmentRate}>{option.annualRate}% p.a.</Text>
            </View>
            <Text style={styles.investmentTime}>
              {formatTimeToGoal(option.timeToGoalMonths)}
            </Text>
            <Text style={styles.timeSaved}>
              {option.timeSaved > 0 && `${option.timeSaved} months faster`}
            </Text>
          </View>
        ))}
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
        <Text style={styles.sectionTitle}>Current Market Rates</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditRates}>
          <Edit3 size={16} color="#3B82F6" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.ratesGrid}>
        {Object.entries(state.settings.investmentRates).map(([key, rate]) => (
          <View key={key} style={styles.rateCard}>
            <Text style={styles.rateName}>
              {key === 'ppf' ? 'PPF' :
               key === 'fd' ? 'Fixed Deposit' :
               key === 'rd' ? 'Recurring Deposit' :
               key === 'mutualFunds' ? 'Mutual Funds' :
               key === 'niftyETF' ? 'Nifty ETF' :
               key === 'goldETF' ? 'Gold ETF' :
               key === 'sgb' ? 'Sovereign Gold Bond' : key}
            </Text>
            <Text style={styles.rateValue}>{rate}% p.a.</Text>
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

        {/* Always show current market rates */}
        {renderCurrentRates()}

        {/* Show results only after calculation */}
        {calculatedData && (
          <>
            {renderSavingsTimeline()}
            {renderInvestmentOptions()}
            {renderChart()}
            {renderTips()}
          </>
        )}
      </ScrollView>

      {/* Rates editing modal */}
      {renderRatesModal()}
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
  investmentCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  investmentRate: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  investmentTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  timeSaved: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  ratesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rateCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rateName: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default PlanScreen;