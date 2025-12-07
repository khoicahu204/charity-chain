# Các Giao Diện Đồ Án - Charity Chain

## Tổng Quan

Charity-Chain DApp có **8 giao diện chính** được thiết kế với UX/UI hiện đại, responsive, và hỗ trợ dark mode.

---

## 1. Giao Diện Đăng Nhập (Login Page)

### Mô Tả
Trang đăng nhập yêu cầu kết nối MetaMask wallet để truy cập ứng dụng.

### Component
`Login.jsx`

### Tính Năng
- ✅ Connect MetaMask wallet
- ✅ Auto-detect MetaMask installation
- ✅ Network switching (Hardhat local)
- ✅ Error handling và hiển thị lỗi
- ✅ Responsive design

### UI Elements
- Logo CharityChain
- Connect Wallet button
- Error message display
- Instructions for users

### User Flow
```
User arrives → Click "Connect Wallet" → MetaMask popup → 
Approve connection → Check network → Switch if needed → 
Authenticated → Redirect to Dashboard
```

### Trạng Thái
- **Chưa cài MetaMask**: Hiển thị hướng dẫn cài đặt
- **Sai network**: Tự động đề nghị switch network
- **Từ chối kết nối**: Hiển thị lỗi

---

## 2. Giao Diện Dashboard (Main Page)

### Mô Tả
Trang chính hiển thị danh sách tất cả campaigns đang hoạt động.

### Component
`App.jsx` + `CampaignCard.jsx`

### Layout
```
┌─────────────────────────────────────────┐
│ Header (Balance, Buttons, Dark Mode)   │
├─────────────────────────────────────────┤
│ Title: "Active Campaigns"              │
│ [Search] [Filter] [+ Start Campaign]  │
├─────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │ Card │ │ Card │ │ Card │            │
│ │  #1  │ │  #2  │ │  #3  │            │
│ └──────┘ └──────┘ └──────┘            │
│ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │ Card │ │ Card │ │ Card │            │
│ │  #4  │ │  #5  │ │  #6  │            │
│ └──────┘ └──────┘ └──────┘            │
└─────────────────────────────────────────┘
```

### Tính Năng
- ✅ Grid layout responsive (1/2/3 columns)
- ✅ Search campaigns by name
- ✅ Filter by status (All/Active/Success/Failed)
- ✅ Real-time updates after transactions
- ✅ Loading states
- ✅ Empty state handling

### Search & Filter
```javascript
// Search by name
const matchesSearch = camp.name.toLowerCase().includes(searchTerm);

// Filter by status
const matchesStatus = 
  filterStatus === 'all' ? true :
  filterStatus === 'active' ? !camp.isClosed :
  filterStatus === 'success' ? camp.isClosed && camp.goalReached :
  filterStatus === 'failed' ? camp.isClosed && !camp.goalReached;
```

---

## 3. Giao Diện Tạo Campaign (Create Campaign Modal)

### Mô Tả
Modal popup để tạo campaign mới với đầy đủ thông tin.

### Component
`CreateCampaignModal.jsx`

### Form Fields
1. **Campaign Name** (required)
2. **Description** (required, textarea)
3. **Category** (dropdown)
   - General
   - Education
   - Health
   - Environment
   - Disaster Relief
   - Community
4. **Campaign Image** (optional)
   - Drag & drop upload
   - Preview image
   - Max 5MB
   - Formats: PNG, JPG, GIF, WebP
5. **Campaign Documents** (optional)
   - Upload PDF/DOC
   - Max 10MB
   - Show file name and size
6. **Target (CHT)** (required, number)
7. **Duration (Days)** (required, number)

### Upload Flow
```
User selects file → Validate file → Show preview → 
User submits → Upload to IPFS → Get CID → 
Create metadata JSON → Upload metadata → 
Call createCampaign → Success
```

### Validation
- ✅ Client-side validation (file type, size)
- ✅ Required fields check
- ✅ Positive numbers for target/duration
- ✅ IPFS upload error handling

### UI States
- **Uploading Image**: Progress indicator
- **Uploading Document**: Progress indicator
- **Creating Metadata**: Loading state
- **Confirming Transaction**: MetaMask popup

---

## 4. Giao Diện Campaign Card

### Mô Tả
Card hiển thị thông tin tóm tắt của một campaign.

### Component
`CampaignCard.jsx`

### Layout
```
┌─────────────────────────────┐
│ [Campaign Image from IPFS]  │
├─────────────────────────────┤
│ Campaign Name        [Badge]│
│ Description...              │
│                             │
│ 📄 View Campaign Documents  │
│                             │
│ Progress Bar: 50/100 CHT    │
│ ████████░░░░░░░░ 50%        │
│                             │
│ Deadline: 12/8/2025         │
│                             │
│ [Amount Input] [Donate]     │
│                             │
│ [Check Goal] [Withdraw]     │
│ [Refund] [Delete]           │
└─────────────────────────────┘
```

### Status Badges
- 🟢 **Active**: Campaign đang hoạt động
- 🔵 **Success**: Đạt mục tiêu
- 🔴 **Failed**: Không đạt mục tiêu

### Interactive Elements
1. **Image**: Hiển thị từ IPFS
2. **Documents Link**: Download từ IPFS
3. **Progress Bar**: Visual progress
4. **Donate Input**: Nhập số tiền
5. **Action Buttons**: 
   - Donate (all users)
   - Check Goal (when expired/reached)
   - Withdraw (owner only, success)
   - Refund (donors only, failed)
   - Delete (owner only, no funds)

### Conditional Rendering
```javascript
// Show donate if active
{!camp.isClosed && <DonateButton />}

// Show withdraw if owner and success
{isOwner && camp.isClosed && camp.goalReached && <WithdrawButton />}

// Show refund if failed
{camp.isClosed && !camp.goalReached && <RefundButton />}
```

---

## 5. Giao Diện Header

### Mô Tả
Navigation bar với thông tin user và các actions.

### Component
`Header.jsx`

### Layout
```
┌────────────────────────────────────────────────────┐
│ ❤️ CharityChain  [🌙] [History] [Simulate] [Reset]│
│                  [💰 981000.00 CHT] [Mint] [Logout]│
│                  [0xf39f...2266] [Owner]           │
└────────────────────────────────────────────────────┘
```

### Elements
1. **Logo**: CharityChain branding
2. **Dark Mode Toggle**: 🌙 / ☀️
3. **History Button**: Xem donation history
4. **Simulate Refund**: Demo refund workflow
5. **Reset Time**: Reset blockchain time
6. **Token Balance**: Hiển thị CHT balance
7. **Mint Button**: Mint tokens (owner only)
8. **Account Address**: Shortened address
9. **Owner Badge**: Hiển thị nếu là owner
10. **Logout Button**: Disconnect wallet

### Responsive
- Desktop: Full layout
- Tablet: Compact buttons
- Mobile: Hamburger menu

---

## 6. Giao Diện Donation History

### Mô Tả
Modal hiển thị lịch sử donations của user.

### Component
`DonationHistoryModal.jsx`

### Features
- ✅ Fetch donation events từ blockchain
- ✅ Filter donations của current user
- ✅ Hiển thị campaign name, amount, timestamp
- ✅ Link to campaign
- ✅ Total donated amount

### Data Source
```javascript
// Query DonationReceived events
const filter = contract.filters.DonationReceived(null, userAccount);
const events = await contract.queryFilter(filter);
```

### Table Layout
```
┌──────────────────────────────────────────┐
│ Your Donation History                    │
├──────────────────────────────────────────┤
│ Campaign      Amount    Date       Link  │
│ ─────────────────────────────────────────│
│ Education     10 CHT    12/7/2025  [→]  │
│ Health        20 CHT    12/6/2025  [→]  │
│ Environment   15 CHT    12/5/2025  [→]  │
├──────────────────────────────────────────┤
│ Total Donated: 45 CHT                    │
└──────────────────────────────────────────┘
```

---

## 7. Giao Diện Refund Simulation

### Mô Tả
Interactive demo để test refund workflow.

### Component
`RefundSimulation.jsx`

### Steps
```
Step 0: Setup
  ↓
Step 1: Create Campaign
  ↓
Step 2: Donate
  ↓
Step 3: Simulate Time → Expire → Check Goal
  ↓
Step 4: Refund
  ↓
Complete
```

### Progress Bar
```
[✓ Start] → [✓ Donate] → [✓ Expire] → [○ Refund]
```

### Features
- ✅ Configurable target and donation amounts
- ✅ Visual progress tracking
- ✅ Balance tracking (before/after)
- ✅ Time manipulation (evm_increaseTime)
- ✅ Snapshot/revert for clean state
- ✅ Step-by-step guidance

### Balance Tracking
```
Initial: 981000 CHT
After Donate: 980990 CHT (-10)
After Refund: 981000 CHT (+10)
```

---

## 8. Dark Mode

### Mô Tả
Toàn bộ app hỗ trợ dark mode với smooth transitions.

### Implementation
```javascript
// Toggle dark mode
const [darkMode, setDarkMode] = useState(() => {
  return localStorage.getItem('theme') === 'dark';
});

// Apply to document
useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [darkMode]);
```

### Color Scheme

**Light Mode:**
- Background: `bg-slate-50`
- Cards: `bg-white`
- Text: `text-slate-900`
- Borders: `border-slate-200`

**Dark Mode:**
- Background: `bg-slate-900`
- Cards: `bg-slate-800`
- Text: `text-white`
- Borders: `border-slate-700`

### Transition
```css
transition-colors duration-200
```

---

## Design System

### Colors
- **Primary**: Rose 500 (`#f43f5e`)
- **Success**: Green 500 (`#22c55e`)
- **Warning**: Amber 500 (`#f59e0b`)
- **Error**: Red 500 (`#ef4444`)
- **Info**: Blue 500 (`#3b82f6`)

### Typography
- **Headings**: Bold, Slate 900/White
- **Body**: Regular, Slate 600/Slate 400
- **Mono**: Font-mono for numbers

### Spacing
- Padding: `p-4`, `p-6`, `p-8`
- Gap: `gap-2`, `gap-4`, `gap-6`
- Margin: `mb-2`, `mb-4`, `mb-6`

### Border Radius
- Small: `rounded-lg` (8px)
- Medium: `rounded-xl` (12px)
- Large: `rounded-2xl` (16px)
- Full: `rounded-full`

---

## Responsive Breakpoints

```css
/* Mobile First */
default: < 640px

/* Tablet */
sm: 640px

/* Desktop */
md: 768px
lg: 1024px
xl: 1280px
```

### Grid Responsive
```javascript
// Campaign cards
grid-cols-1           // Mobile: 1 column
md:grid-cols-2        // Tablet: 2 columns
lg:grid-cols-3        // Desktop: 3 columns
```

---

## Accessibility

### Features
- ✅ Keyboard navigation
- ✅ Focus states
- ✅ ARIA labels
- ✅ Semantic HTML
- ✅ Color contrast (WCAG AA)
- ✅ Screen reader friendly

### Focus Styles
```css
focus:outline-none 
focus:ring-2 
focus:ring-rose-500
```

---

## Toast Notifications

### Types
- **Loading**: Spinner + message
- **Success**: ✓ Green
- **Error**: ✗ Red
- **Info**: ℹ Blue

### Usage
```javascript
// Loading
const toastId = toast.loading('Processing...');

// Success
toast.success('Done!', { id: toastId });

// Error
toast.error('Failed!', { id: toastId });
```

### Position
```javascript
<Toaster position="top-right" />
```

---

## Animation & Transitions

### Hover Effects
```css
hover:bg-rose-600
hover:scale-105
hover:shadow-lg
```

### Loading States
```css
animate-spin      // Spinner
animate-pulse     // Skeleton
```

### Modal Transitions
```css
backdrop-blur-sm
transition-opacity
```

---

## Icons

### Library
Lucide React

### Common Icons
- `Plus`: Create
- `DollarSign`: Donate
- `RotateCcw`: Refund
- `CheckCircle`: Success
- `AlertCircle`: Warning
- `Clock`: Time
- `RefreshCw`: Loading

---

## Summary

Charity-Chain DApp có **8 giao diện chính** với:

✅ **Modern UI/UX**: Clean, intuitive design
✅ **Dark Mode**: Full support
✅ **Responsive**: Mobile, tablet, desktop
✅ **Accessible**: WCAG compliant
✅ **Interactive**: Real-time updates
✅ **Professional**: Production-ready quality

Tất cả giao diện được thiết kế để cung cấp trải nghiệm người dùng tốt nhất cho nền tảng quyên góp từ thiện blockchain.
