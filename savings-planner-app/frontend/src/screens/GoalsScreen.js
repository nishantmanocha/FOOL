import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';

const GoalsScreen = ({ navigation }) => {
  const { state, dispatch, actions, calculateSurplus } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    amount: '',
    targetDate: '',
  });

  const handleAddGoal = () => {
    setEditingGoal(null);
    setGoalForm({ title: '', amount: '', targetDate: '' });
    setModalVisible(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title || '',
      amount: goal.amount.toString(),
      targetDate: goal.targetDate || '',
    });
    setModalVisible(true);
  };

  const handleSaveGoal = () => {
    if (!goalForm.title.trim() || !goalForm.amount) {
      Alert.alert('Error', 'Please enter a title and amount for your goal');
      return;
    }

    const goalData = {
      title: goalForm.title.trim(),
      amount: parseFloat(goalForm.amount),
      targetDate: goalForm.targetDate,
      createdAt: new Date().toISOString(),
    };

    if (editingGoal) {
      dispatch({
        type: actions.UPDATE_GOAL,
        payload: { ...goalData, id: editingGoal.id },
      });
    } else {
      dispatch({
        type: actions.ADD_GOAL,
        payload: goalData,
      });
    }

    setModalVisible(false);
    setGoalForm({ title: '', amount: '', targetDate: '' });
  };

  const handleDeleteGoal = (goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({
              type: actions.DELETE_GOAL,
              payload: goalId,
            });
          },
        },
      ]
    );
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

  const formatTimeToGoal = (months) => {
    if (months < 0) return 'Cannot achieve';
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const renderGoalCard = ({ item: goal }) => {
    const surplus = calculateSurplus();
    const savingsOnlyTime = calculateTimeToGoal(goal.amount, surplus, 0);
    const investmentTime = calculateTimeToGoal(goal.amount, surplus, 11); // Using average equity return

    return (
      <TouchableOpacity
        style={styles.goalCard}
        onPress={() => navigation.navigate('GoalDetail', { goal })}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Target size={20} color="#3B82F6" />
            <Text style={styles.goalTitle}>{goal.title}</Text>
          </View>
          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditGoal(goal)}
            >
              <Edit3 size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteGoal(goal.id)}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.goalAmount}>{formatCurrency(goal.amount)}</Text>

        {goal.targetDate && (
          <View style={styles.targetDateContainer}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.targetDate}>Target: {goal.targetDate}</Text>
          </View>
        )}

        <View style={styles.timeEstimates}>
          <View style={styles.timeEstimate}>
            <Text style={styles.timeLabel}>Savings Only</Text>
            <Text style={styles.timeValue}>{formatTimeToGoal(savingsOnlyTime)}</Text>
          </View>
          <View style={styles.timeEstimate}>
            <Text style={styles.timeLabel}>With Investment</Text>
            <Text style={[styles.timeValue, styles.timeValueGreen]}>
              {formatTimeToGoal(investmentTime)}
            </Text>
          </View>
        </View>

        {surplus > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              Monthly contribution: {formatCurrency(surplus)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: '20%' } // This would be calculated based on actual progress
                ]}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Target size={80} color="#CBD5E1" />
      <Text style={styles.emptyStateTitle}>No Goals Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Set your first savings goal to start planning your financial future
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddGoal}>
        <Plus size={20} color="#fff" />
        <Text style={styles.emptyStateButtonText}>Add Your First Goal</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGoalModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingGoal ? 'Edit Goal' : 'Add New Goal'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Emergency Fund, New Car, Vacation"
                value={goalForm.title}
                onChangeText={(text) => setGoalForm({ ...goalForm, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign size={20} color="#6B7280" />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="Enter amount"
                  value={goalForm.amount}
                  onChangeText={(text) => setGoalForm({ ...goalForm, amount: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Date (Optional)</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={20} color="#6B7280" />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="YYYY-MM-DD"
                  value={goalForm.targetDate}
                  onChangeText={(text) => setGoalForm({ ...goalForm, targetDate: text })}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveGoal}
            >
              <Text style={styles.saveButtonText}>
                {editingGoal ? 'Update' : 'Save'} Goal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {state.goals.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={state.goals}
          renderItem={renderGoalCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.goalsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderGoalModal()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  goalsList: {
    padding: 16,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  goalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 12,
  },
  targetDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  targetDate: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  timeEstimates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeEstimate: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timeValueGreen: {
    color: '#10B981',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWithIconText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
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

export default GoalsScreen;