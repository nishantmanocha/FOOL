# Savings Planner App 💰

A comprehensive fullstack application built with React Native (Expo) frontend and Node.js backend to help users plan their savings goals and compare investment options to achieve them faster.

## 🚀 Features

### Frontend (React Native + Expo)
- **Onboarding Flow**: Welcome screens with income and expense input
- **Plan Dashboard**: Summary cards showing income, expenses, and savings potential
- **Investment Comparison**: Interactive charts comparing savings vs investment returns
- **Goals Management**: Create, edit, and track multiple savings goals
- **Educational Content**: Learn about different investment options
- **Settings**: Customize investment rates, backup/restore data, dark mode

### Backend (Node.js + Express)
- **Dynamic Calculations**: Real-time savings and investment projections
- **Multiple Investment Options**: PPF, FD, RD, Mutual Funds, Nifty ETF, Gold ETF, SGB
- **Improvement Tips**: AI-style suggestions to optimize savings
- **Educational API**: Comprehensive investment learning content

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo (latest)
- **React Navigation** for navigation
- **Lucide React Native** for icons
- **React Native Chart Kit** for beautiful charts
- **AsyncStorage** for local data persistence
- **Expo FileSystem** for data export/import

### Backend
- **Node.js** with Express
- **CORS** enabled for cross-origin requests
- **RESTful API** design
- **Dynamic calculations** (no hardcoded values)

## 📱 Screenshots & Features

### Key Screens
1. **OnboardingScreen** - Welcome flow with income/expense setup
2. **PlanScreen** - Main dashboard with savings summary and charts
3. **CompareScreen** - Investment comparison with interactive charts
4. **GoalsScreen** - Manage multiple savings goals
5. **GoalDetailScreen** - Detailed analysis for individual goals
6. **LearnScreen** - Educational content about investments
7. **SettingsScreen** - App configuration and data management

### Charts & Visualizations
- **Line Charts**: Growth projections over time
- **Bar Charts**: Final amount comparisons
- **Progress Bars**: Goal achievement tracking
- **Interactive Elements**: Tap to expand, filter by category

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Git

### Backend Setup
```bash
cd savings-planner-app/backend
npm install
npm start
```
The backend will run on `http://localhost:3000`

### Frontend Setup
```bash
cd savings-planner-app/frontend
npm install
expo start
```

### Available Scripts

#### Backend
- `npm start` - Start the server
- `npm run dev` - Start with development mode

#### Frontend
- `expo start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator (macOS only)
- `npm run web` - Run in web browser

## 📡 API Endpoints

### Core Endpoints
- `POST /calculate-savings` - Calculate savings potential
- `POST /calculate-investments` - Get investment projections
- `POST /improvement-tips` - Get personalized tips
- `GET /learn` - Fetch educational content
- `GET /investment-options` - Get available investment options
- `GET /health` - Health check endpoint

### Sample API Usage

```javascript
// Calculate savings
POST /calculate-savings
{
  "income": 50000,
  "expenses": {
    "rent": 15000,
    "food": 8000,
    "transport": 3000
  },
  "goal": 100000
}

// Get investment comparison
POST /calculate-investments
{
  "savingsPerMonth": 24000,
  "goal": 100000,
  "customRates": {
    "ppf": 7.5,
    "mutualFunds": 12.0
  }
}
```

## 💡 Key Features Explained

### Dynamic Calculations
- All calculations are performed in real-time based on user input
- No hardcoded values - everything adapts to user's financial situation
- Compound interest calculations for accurate projections

### Investment Options
- **PPF**: 7-8% annual returns, 15-year lock-in
- **Fixed Deposits**: 6-7% annual returns, various tenures
- **Mutual Funds**: 10-12% annual returns (equity)
- **Nifty ETF**: 10-12% annual returns (market tracking)
- **Gold ETF/SGB**: 5-6% annual returns plus gold appreciation

### Educational Content
- 10+ curated articles about investments
- Categories: Basics, Investment Strategy, Tax Planning
- Expandable content with "Learn More" sections

### Data Management
- Local storage with AsyncStorage
- Export/Import functionality for data backup
- Reset option for fresh start

## 🎨 UI/UX Design

### Design Principles
- **Clean & Modern**: Card-based layout with rounded corners
- **Intuitive Navigation**: Bottom tabs with clear icons
- **Visual Hierarchy**: Proper typography and color usage
- **Responsive**: Works on various screen sizes
- **Accessibility**: High contrast colors and readable fonts

### Color Scheme
- Primary: `#3B82F6` (Blue)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Error: `#EF4444` (Red)
- Background: `#F8FAFC` (Light Gray)

## 🔒 Security & Privacy

- **No Authentication Required**: App works offline-first
- **Local Data Storage**: All sensitive data stays on device
- **Optional Backup**: User-controlled data export
- **No External Analytics**: Privacy-focused design

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd savings-planner-app
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Start the frontend**
   ```bash
   cd frontend
   npm install
   expo start
   ```

4. **Open the app**
   - Scan QR code with Expo Go app (Android/iOS)
   - Press 'w' to open in web browser
   - Press 'a' for Android emulator
   - Press 'i' for iOS simulator

## 📈 Future Enhancements

- [ ] Push notifications for goal milestones
- [ ] Multiple currency support
- [ ] Investment tracking integration
- [ ] Social sharing features
- [ ] Advanced analytics dashboard
- [ ] Machine learning for personalized tips

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support, email support@savingsplanner.app or create an issue in the repository.

---

**Built with ❤️ using React Native + Node.js**