# KM Tracker 🚀 (iOS Liquid Glass Mobile App)

An ultra-modern, production-ready React Native mobile application for iOS built with **Expo SDK 57**, **SQLite (`expo-sqlite`)**, **React Native Reanimated**, and an **iOS Liquid Glass & Glassmorphism design system**.

Includes automated CI/CD via **GitHub Actions** to build and archive `.ipa` files directly in GitHub.

---

## 📱 App Highlights & Architecture

- **100% Offline-First Storage:** Local privacy-focused persistence with SQLite (`expo-sqlite`). Zero remote dependencies, instant query response times.
- **iOS Liquid Glass & Glassmorphism Design:** Deep native iOS styling powered by `BlurView`, frosted translucent glass cards, neon gradient accents, thin illuminated borders, and ambient dark backgrounds.
- **60fps Fluid Motion & Micro-Animations:** Reanimated spring physics on buttons, morphing SVG sparkline charts, animated circular progress rings, and celebratory particle explosions upon reaching distance milestones.
- **Haptic Feedback:** Native tactile responses (`expo-haptics`) across touches, swipes, toggles, and deletion events.
- **Interactive Gestures:** Smooth swipe-to-delete cards with red glass reveal and tap-to-edit sheet transitions.

---

## 🎨 Screens & Feature Overview

### 1. 🏎️ Dashboard (Home)
- **Monthly Goal Hero Ring:** Animated SVG circular progress ring displaying real-time monthly goal completion with glowing head cap.
- **KPI Metrics Triad:** Animated rolling number counters for:
  - Total Kilometers
  - Current Month Distance
  - Active Consecutive Day Streak
- **7-Day Velocity Chart:** Interactive sparkline chart showing daily activity volume with tap tooltips.
- **Recent Activity Feed:** Latest logs with swipeable actions and instant tap-to-edit.
- **Quick "+ Add KM" Floating Action Button:** Frosted glass pill with spring expansion.

### 2. 📝 Add / Edit Journey Modal
- **Distance Entry:** Large high-contrast decimal input with quick `+1`, `+5`, `+10`, `+25` increment buttons.
- **Category Picker:** Glowing frosted pills for **Driving**, **Running**, **Walking**, **Cycling**, and **Other**.
- **Date Picker:** Preset "Today" shortcut or custom ISO date.
- **Interactive Validation:** Reanimated horizontal shake animation and error haptic feedback if input is invalid.

### 3. 📜 History & Log Screen
- **Real-Time Search:** Search notes, categories, distances, and dates.
- **Category Filter Bar:** One-tap filtering across activity types.
- **Grouped Time Headers:** Automatically grouped by *"Today"*, *"Yesterday"*, *"This Week"*, *"This Month"*, or month/year.
- **Swipe-to-Delete:** Gesture-driven swipe with red frosted glass background, haptic confirmation, and smooth collapse transition.

### 4. 📊 Analytics & Insights Screen
- **Timeframe Toggles:** Seamless animated switching between **Weekly**, **Monthly**, and **Yearly** views.
- **Distance Trajectory Sparkline:** Interactive bar columns with dynamic touch tooltips.
- **Activity Distribution:** Liquid segmented color progress bar and category cards showing distance, trips, and percentages.
- **Personal Records:** Longest single trip and total journeys records.
- **Milestones & Achievements:** Unlocked achievements (First Step, Silver Cruiser, Centurion Club, etc.) with animated progress bars.

### 5. ⚙️ Settings & Data Management
- **Interactive Goal Stepper:** Adjust your monthly KM target directly.
- **Unit Selector:** Toggle between Kilometers (`km`) and Miles (`mi`).
- **Tactile Switch:** Enable or disable haptic responses.
- **Data Export:**
  - **Export as JSON:** Shareable complete backup file.
  - **Export as CSV:** Compatible with Excel, Google Sheets, and Numbers.
- **Demo Data Generator:** Prepopulate rich sample data with one tap for instant testing.
- **Safety Wipe:** Permanent database reset with confirmation safeguards.

---

## 🗄️ Database Schema (SQLite)

```sql
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distance REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
```

---

## 🛠️ Tech Stack & Dependencies

| Dependency | Purpose |
| :--- | :--- |
| `expo` (SDK 57) | Mobile runtime framework |
| `react-native` (0.86) | Native cross-platform engine |
| `expo-sqlite` | High-performance local SQL database engine |
| `react-native-reanimated` | 60fps UI thread gestures and animations |
| `expo-blur` | Deep native iOS BlurView glassmorphism effects |
| `expo-haptics` | iOS Taptic Engine haptic responses |
| `react-native-svg` | Vector circular progress rings and gradient strokes |
| `react-native-gesture-handler` | Native Pan and swipe gestures |
| `@react-navigation/*` | Smooth fluid tab and screen routing |
| `expo-file-system` & `expo-sharing` | JSON & CSV export and iOS Share Sheet integration |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20+ installed
- CocoaPods (`sudo gem install cocoapods`) if running local iOS native builds on macOS
- Xcode installed (for iOS Simulator / device testing)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/milage.git
cd milage

# Install dependencies
npm install

# Typecheck code
npx tsc --noEmit

# Start development server
npx expo start
```

### Running on iOS Simulator
```bash
npx expo run:ios
```

---

## 🍎 GitHub Actions iOS IPA Build Workflow

The workflow at [`.github/workflows/build-ios.yml`](file:///.github/workflows/build-ios.yml) automates compiling and exporting the `.ipa` artifact on `macos-latest` runners.

### Configuring Apple Developer Credentials in GitHub Secrets

Navigate to your GitHub repository: **Settings > Secrets and variables > Actions > New repository secret**.

Add the following secrets:

| Secret Name | Description | Example / How to generate |
| :--- | :--- | :--- |
| `APPLE_CERTIFICATE_BASE64` | Base64-encoded Apple Distribution `.p12` certificate | `base64 -i distribution.p12 \| pbcopy` |
| `APPLE_CERTIFICATE_PASSWORD` | Password protecting the exported `.p12` certificate file | *Your certificate password* |
| `PROVISIONING_PROFILE_BASE64` | Base64-encoded iOS Distribution `.mobileprovision` file | `base64 -i profile.mobileprovision \| pbcopy` |
| `APPLE_TEAM_ID` | 10-character Apple Developer Team ID | Visible in Apple Developer Portal Account details (e.g. `ABC1234XYZ`) |
| `KEYCHAIN_PASSWORD` | *(Optional)* Temporary CI keychain password | e.g. `ci-secret-keychain-pass` |

> **Note on Unsigned Test Builds:**  
> If code-signing secrets are not configured, the GitHub Actions workflow automatically builds an unsigned test IPA package and uploads it as an artifact, allowing CI testing without immediate Apple Developer account setup!

### Triggering the Build
1. **Automated:** Push code to `main` or open a Pull Request.
2. **Manual:** Go to **Actions > Build iOS IPA > Run workflow**, select the branch, build configuration (`Release`/`Debug`), and distribution method (`app-store`, `ad-hoc`, `development`).
3. **Download IPA:** Once the pipeline finishes, click the run and download the **`KMTracker-iOS-IPA`** artifact.

---

## 🔒 Privacy & Data Sovereignty

All activity metrics and journey notes recorded by **KM Tracker** reside exclusively on the device within SQLite sandbox storage. The application does not transmit data to any third-party tracking services or external analytics endpoints.
