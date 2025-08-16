import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  DollarSign, 
  Home, 
  Car, 
  ShoppingCart, 
  Utensils, 
  Plus,
  ChevronRight,
  PiggyBank,
  Target,
  TrendingUp
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { dispatch, actions } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState({
    rent: '',
    emi: '',
    food: '',
    transport: '',
    utilities: '',
    entertainment: '',
    other: '',
  });

  const expenseCategories = [
    { key: 'rent', label: 'Rent/EMI', icon: Home },
    { key: 'emi', label: 'Other EMIs', icon: Car },
    { key: 'food', label: 'Food & Groceries', icon: ShoppingCart },
    { key: 'transport', label: 'Transport', icon: Car },
    { key: 'utilities', label: 'Utilities', icon: Home },
    { key: 'entertainment', label: 'Entertainment', icon: Utensils },
    { key: 'other', label: 'Other', icon: Plus },
  ];

  const onboardingSteps = [
    {
      title: "Welcome to Savings Planner! 💰",
      subtitle: "Plan your financial future with smart savings and investment strategies",
      icon: PiggyBank,
    },
    {
      title: "Set Your Goals 🎯", 
      subtitle: "Compare savings vs investment returns to reach your goals faster",
      icon: Target,
    },
    {
      title: "Grow Your Wealth 📈",
      subtitle: "Learn about different investment options and make informed decisions",
      icon: TrendingUp,
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(onboardingSteps.length); // Move to income input
    }
  };

  const handleIncomeNext = () => {
    if (!income || parseFloat(income) <= 0) {
      Alert.alert('Error', 'Please enter a valid monthly income');
      return;
    }
    setCurrentStep(onboardingSteps.length + 1); // Move to expenses input
  };

  const handleFinishOnboarding = () => {
    const numericIncome = parseFloat(income) || 0;
    const numericExpenses = {};
    
    Object.keys(expenses).forEach(key => {
      numericExpenses[key] = parseFloat(expenses[key]) || 0;
    });

    dispatch({
      type: actions.SET_USER_DATA,
      payload: {
        income: numericIncome,
        expenses: numericExpenses,
        hasCompletedOnboarding: true,
      },
    });

    navigation.replace('Main');
  };

  const renderOnboardingStep = (step, index) => {
    const IconComponent = step.icon;
    return (
      <View style={styles.stepContainer} key={index}>
        <View style={styles.iconContainer}>
          <IconComponent size={80} color="#3B82F6" />
        </View>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
      </View>
    );
  };

  const renderIncomeInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputTitle}>What's your monthly income? 💼</Text>
      <Text style={styles.inputSubtitle}>This helps us calculate your savings potential</Text>
      
      <View style={styles.inputWrapper}>
        <DollarSign size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder="Enter monthly income"
          value={income}
          onChangeText={setIncome}
          keyboardType="numeric"
          autoFocus
        />
      </View>
      
      <TouchableOpacity style={styles.nextButton} onPress={handleIncomeNext}>
        <Text style={styles.nextButtonText}>Next</Text>
        <ChevronRight size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderExpensesInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputTitle}>Track your monthly expenses 📊</Text>
      <Text style={styles.inputSubtitle}>Enter your typical monthly spending in each category</Text>
      
      <ScrollView style={styles.expensesList} showsVerticalScrollIndicator={false}>
        {expenseCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <View key={category.key} style={styles.expenseItem}>
              <View style={styles.expenseHeader}>
                <IconComponent size={20} color="#3B82F6" />
                <Text style={styles.expenseLabel}>{category.label}</Text>
              </View>
              <TextInput
                style={styles.expenseInput}
                placeholder="₹0"
                value={expenses[category.key]}
                onChangeText={(value) => 
                  setExpenses(prev => ({ ...prev, [category.key]: value }))
                }
                keyboardType="numeric"
              />
            </View>
          );
        })}
      </ScrollView>
      
      <TouchableOpacity style={styles.finishButton} onPress={handleFinishOnboarding}>
        <Text style={styles.finishButtonText}>Start Planning</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentStep < onboardingSteps.length && (
          <>
            {renderOnboardingStep(onboardingSteps[currentStep], currentStep)}
            <View style={styles.pagination}>
              {onboardingSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentStep === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentStep === onboardingSteps.length - 1 ? "Let's Start" : "Next"}
              </Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
        
        {currentStep === onboardingSteps.length && renderIncomeInput()}
        {currentStep === onboardingSteps.length + 1 && renderExpensesInput()}
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 15,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10,
  },
  inputSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    color: '#1e293b',
  },
  expensesList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  expenseItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  expenseLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginLeft: 12,
  },
  expenseInput: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  finishButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;