import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  Shield,
  PiggyBank,
  Target,
} from 'lucide-react-native';
import api from '../services/api';

const LearnScreen = () => {
  const [learningContent, setLearningContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    loadLearningContent();
  }, []);

  const loadLearningContent = async () => {
    try {
      const response = await api.getLearningContent();
      setLearningContent(response.content);
      setCategories(['All', ...response.categories]);
    } catch (error) {
      console.error('Error loading learning content:', error);
      // Fallback content if API fails
      setLearningContent(fallbackContent);
      setCategories(['All', 'Basics', 'Investment Strategy', 'Tax Planning']);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filteredContent = selectedCategory === 'All' 
    ? learningContent 
    : learningContent.filter(item => item.category === selectedCategory);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Basics': return Shield;
      case 'Investment Strategy': return TrendingUp;
      case 'Tax Planning': return Target;
      default: return PiggyBank;
    }
  };

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category && styles.categoryButtonTextActive,
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderLearningItem = ({ item }) => {
    const isExpanded = expandedItems.has(item.id);
    const IconComponent = getCategoryIcon(item.category);
    const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

    return (
      <View style={styles.learningCard}>
        <TouchableOpacity
          style={styles.learningHeader}
          onPress={() => toggleExpanded(item.id)}
        >
          <View style={styles.learningTitleContainer}>
            <IconComponent size={20} color="#3B82F6" />
            <View style={styles.learningTitleText}>
              <Text style={styles.learningTitle}>{item.title}</Text>
              <Text style={styles.learningCategory}>{item.category}</Text>
            </View>
          </View>
          <ChevronIcon size={20} color="#6B7280" />
        </TouchableOpacity>

        <Text style={styles.learningSummary}>{item.summary}</Text>
        <Text style={styles.learningContent}>{item.content}</Text>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.learnMoreHeader}>
              <Lightbulb size={16} color="#F59E0B" />
              <Text style={styles.learnMoreTitle}>Learn More</Text>
            </View>
            <Text style={styles.learnMoreContent}>{item.learnMore}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading educational content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BookOpen size={24} color="#3B82F6" />
        <Text style={styles.headerTitle}>Learn & Grow</Text>
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filteredContent}
        renderItem={renderLearningItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.learningList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Fallback content in case API fails
const fallbackContent = [
  {
    id: 1,
    title: "What to check before investing?",
    category: "Basics",
    summary: "Key factors to evaluate before making any investment decision",
    content: "Before investing, check: 1) Expense ratio (lower is better), 2) Track record (consistent performance), 3) Benchmark comparison, 4) Your risk profile, 5) Tax implications, 6) Lock-in period, 7) Liquidity needs",
    learnMore: "Expense ratio should be <1% for equity funds, <0.5% for debt funds. Check 5-year returns, not just 1-year. Match investment risk with your risk appetite. Consider your investment horizon - don't invest in equity if you need money in <5 years."
  },
  {
    id: 2,
    title: "PPF Basics",
    category: "Tax Planning",
    summary: "Understanding Public Provident Fund benefits and limitations",
    content: "PPF offers 7.1% tax-free returns with 15-year lock-in. Max investment ₹1.5L/year. Triple tax benefit - deduction, tax-free growth, tax-free withdrawal.",
    learnMore: "PPF is ideal for long-term goals like retirement. You can extend in 5-year blocks after 15 years. Partial withdrawals allowed after 7th year. No risk as it's government-backed."
  },
  {
    id: 3,
    title: "What is SIP?",
    category: "Investment Strategy",
    summary: "Systematic Investment Plan for disciplined investing",
    content: "SIP helps invest fixed amount regularly in mutual funds. Benefits: rupee cost averaging, disciplined investing, power of compounding.",
    learnMore: "Start SIP as early as possible. Increase SIP amount annually by 10-15%. Don't stop SIP during market downturns - that's when you buy more units at lower prices."
  },
  {
    id: 4,
    title: "Risk vs Return",
    category: "Basics",
    summary: "Understanding the fundamental investing principle",
    content: "Higher potential returns come with higher risk. Equity > Debt > FD in both risk and potential returns.",
    learnMore: "Don't chase high returns without understanding risks. Diversify across asset classes. Your risk capacity depends on age, income stability, and investment horizon."
  },
  {
    id: 5,
    title: "Diversification 101",
    category: "Investment Strategy",
    summary: "Don't put all eggs in one basket",
    content: "Spread investments across different asset classes, sectors, and geographies to reduce risk.",
    learnMore: "Asset allocation example: 60% equity, 30% debt, 10% gold for young investors. Rebalance annually. International diversification through global funds."
  },
];

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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  categoryFilter: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  learningList: {
    padding: 16,
  },
  learningCard: {
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
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  learningTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  learningTitleText: {
    marginLeft: 12,
    flex: 1,
  },
  learningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  learningCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  learningSummary: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  learningContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  learnMoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  learnMoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 6,
  },
  learnMoreContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default LearnScreen;