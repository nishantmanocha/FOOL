import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

// Initial state
const initialState = {
  user: {
    income: 0,
    expenses: {},
    hasCompletedOnboarding: false,
  },
  goals: [],
  settings: {
    darkMode: false,
    investmentRates: {
      ppf: 7.5,
      fd: 6.5,
      rd: 6.5,
      mutualFunds: 11.0,
      niftyETF: 11.0,
      goldETF: 5.5,
      sgb: 5.5,
    },
  },
  currentPlan: null,
};

// Action types
export const ACTIONS = {
  SET_USER_DATA: 'SET_USER_DATA',
  UPDATE_INCOME: 'UPDATE_INCOME',
  UPDATE_EXPENSES: 'UPDATE_EXPENSES',
  ADD_GOAL: 'ADD_GOAL',
  UPDATE_GOAL: 'UPDATE_GOAL',
  DELETE_GOAL: 'DELETE_GOAL',
  SET_CURRENT_PLAN: 'SET_CURRENT_PLAN',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  LOAD_DATA: 'LOAD_DATA',
  RESET_DATA: 'RESET_DATA',
  COMPLETE_ONBOARDING: 'COMPLETE_ONBOARDING',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_USER_DATA:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case ACTIONS.UPDATE_INCOME:
      return {
        ...state,
        user: { ...state.user, income: action.payload },
      };

    case ACTIONS.UPDATE_EXPENSES:
      return {
        ...state,
        user: { ...state.user, expenses: action.payload },
      };

    case ACTIONS.COMPLETE_ONBOARDING:
      return {
        ...state,
        user: { ...state.user, hasCompletedOnboarding: true },
      };

    case ACTIONS.ADD_GOAL:
      return {
        ...state,
        goals: [...state.goals, { ...action.payload, id: Date.now().toString() }],
      };

    case ACTIONS.UPDATE_GOAL:
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? { ...goal, ...action.payload } : goal
        ),
      };

    case ACTIONS.DELETE_GOAL:
      return {
        ...state,
        goals: state.goals.filter(goal => goal.id !== action.payload),
      };

    case ACTIONS.SET_CURRENT_PLAN:
      return {
        ...state,
        currentPlan: action.payload,
      };

    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case ACTIONS.LOAD_DATA:
      return {
        ...state,
        ...action.payload,
      };

    case ACTIONS.RESET_DATA:
      return initialState;

    default:
      return state;
  }
}

// Storage keys
const STORAGE_KEY = '@savings_planner_data';

// Context provider
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from storage on app start
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save to storage whenever state changes
  useEffect(() => {
    saveToStorage();
  }, [state]);

  const loadFromStorage = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: ACTIONS.LOAD_DATA, payload: parsedData });
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  };

  const saveToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  };

  // Helper functions
  const calculateSurplus = () => {
    const totalExpenses = Object.values(state.user.expenses).reduce(
      (sum, expense) => sum + (expense || 0),
      0
    );
    return state.user.income - totalExpenses;
  };

  const exportData = () => {
    return JSON.stringify(state, null, 2);
  };

  const importData = (jsonData) => {
    try {
      const parsedData = JSON.parse(jsonData);
      dispatch({ type: ACTIONS.LOAD_DATA, payload: parsedData });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  };

  const contextValue = {
    state,
    dispatch,
    calculateSurplus,
    exportData,
    importData,
    actions: ACTIONS,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}