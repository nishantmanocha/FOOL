import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  Moon,
  Sun,
  TrendingUp,
  Download,
  Upload,
  RotateCcw,
  Percent,
  X,
  Edit3,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Share } from 'react-native';

const SettingsScreen = () => {
  const { state, dispatch, actions, exportData, importData } = useApp();
  const [ratesModalVisible, setRatesModalVisible] = useState(false);
  const [editingRates, setEditingRates] = useState({});

  const handleToggleDarkMode = (value) => {
    dispatch({
      type: actions.UPDATE_SETTINGS,
      payload: { darkMode: value },
    });
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

  const handleExportData = async () => {
    try {
      const data = exportData();
      const fileName = `savings_planner_backup_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      Alert.alert(
        'Export Successful',
        `Data exported to ${fileName}. You can share this file to backup your data.`,
        [
          {
            text: 'Share',
            onPress: async () => {
              const { action } = await Share.share({ url: fileUri });
              if (action === Share.sharedAction) {
                Alert.alert('Success', 'Backup shared successfully!');
              }
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const fileContent = await FileSystem.readAsStringAsync(result.uri);
        const success = importData(fileContent);
        
        if (success) {
          Alert.alert('Success', 'Data imported successfully!');
        } else {
          Alert.alert('Error', 'Invalid backup file format');
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import data');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your data including goals, settings, and user information. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: actions.RESET_DATA });
            Alert.alert('Success', 'All data has been reset');
          },
        },
      ]
    );
  };

  const renderSettingItem = (title, subtitle, onPress, rightComponent) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent}
    </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Edit Investment Rates</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setRatesModalVisible(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {Object.entries(editingRates).map(([instrument, rate]) => (
              <View key={instrument} style={styles.rateItem}>
                <Text style={styles.rateLabel}>
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
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          {renderSettingItem(
            'Dark Mode',
            'Toggle between light and dark theme',
            () => handleToggleDarkMode(!state.settings.darkMode),
            <View style={styles.switchContainer}>
              <Sun size={16} color={state.settings.darkMode ? "#6B7280" : "#F59E0B"} />
              <Switch
                value={state.settings.darkMode}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={state.settings.darkMode ? '#fff' : '#f4f3f4'}
                style={styles.switch}
              />
              <Moon size={16} color={state.settings.darkMode ? "#3B82F6" : "#6B7280"} />
            </View>
          )}
        </View>

        {/* Investment Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Settings</Text>
          {renderSettingItem(
            'Expected Returns',
            'Customize expected annual returns for different investments',
            handleEditRates,
            <View style={styles.iconContainer}>
              <Edit3 size={20} color="#6B7280" />
            </View>
          )}
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          {renderSettingItem(
            'Backup Data',
            'Export your data for safekeeping',
            handleExportData,
            <View style={styles.iconContainer}>
              <Download size={20} color="#10B981" />
            </View>
          )}
          {renderSettingItem(
            'Restore Data',
            'Import data from a backup file',
            handleImportData,
            <View style={styles.iconContainer}>
              <Upload size={20} color="#3B82F6" />
            </View>
          )}
          {renderSettingItem(
            'Reset All Data',
            'Permanently delete all data and start fresh',
            handleResetData,
            <View style={styles.iconContainer}>
              <RotateCcw size={20} color="#EF4444" />
            </View>
          )}
        </View>

        {/* Current Settings Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Investment Rates</Text>
          <View style={styles.ratesDisplay}>
            {Object.entries(state.settings.investmentRates).map(([instrument, rate]) => (
              <View key={instrument} style={styles.rateDisplayItem}>
                <Text style={styles.rateDisplayLabel}>
                  {instrument === 'ppf' ? 'PPF' :
                   instrument === 'fd' ? 'Fixed Deposit' :
                   instrument === 'rd' ? 'Recurring Deposit' :
                   instrument === 'mutualFunds' ? 'Mutual Funds' :
                   instrument === 'niftyETF' ? 'Nifty ETF' :
                   instrument === 'goldETF' ? 'Gold ETF' :
                   instrument === 'sgb' ? 'Sovereign Gold Bond' : instrument}
                </Text>
                <Text style={styles.rateDisplayValue}>{rate}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.appInfo}>
            <Text style={styles.appName}>Savings Planner</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              Plan your savings goals and compare investment options to achieve them faster.
            </Text>
          </View>
        </View>
      </ScrollView>

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
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
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
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    marginHorizontal: 8,
  },
  iconContainer: {
    padding: 4,
  },
  ratesDisplay: {
    padding: 16,
  },
  rateDisplayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rateDisplayLabel: {
    fontSize: 14,
    color: '#374151',
  },
  rateDisplayValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  appInfo: {
    padding: 16,
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
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
  rateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rateLabel: {
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

export default SettingsScreen;