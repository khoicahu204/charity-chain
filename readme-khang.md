# Charity Chain - Quy Trình Hoạt Động

## Tổng Quan

Charity Chain là ứng dụng blockchain cho phép tạo và quản lý các chiến dịch từ thiện phi tập trung. Người dùng có thể tạo campaign, donate, và rút tiền một cách minh bạch thông qua smart contract.

---

## Cấu Trúc Project

```
charity-chain/
├── charity_donation/          # Backend (Smart Contract)
│   ├── contracts/
│   │   └── CharityDonation.vy    # Smart contract Vyper
│   └── scripts/
│       └── deploy.py              # Script deploy contract
│
└── frontend/                  # Frontend (React)
    └── src/
        ├── App.jsx                      # Component chính
        └── contracts/
            ├── contract-address.json    # Địa chỉ contract
            └── CharityDonation.json     # ABI contract
```

---

## 1. Backend (Smart Contract - Vyper)

### **Smart Contract Functions:**

| Function | Mô tả |
|----------|-------|
| `createCampaign()` | Tạo campaign mới với target amount và deadline |
| `donate()` | Donate ETH vào campaign |
| `checkGoal()` | Kiểm tra deadline & xác định campaign thành công/thất bại |
| `withdraw()` | Owner rút tiền khi campaign thành công |
| `refund()` | Donor nhận lại tiền khi campaign thất bại |

### **Deploy Process:**

```bash
# 1. Compile Vyper → Bytecode + ABI
# 2. Deploy lên blockchain (Hardhat/Geth)
# 3. Lưu địa chỉ contract → contract-address.json
# 4. Lưu ABI → CharityDonation.json

cd charity_donation
python scripts/deploy.py
```

---

## 2. Frontend (React + Ethers.js)

### **A. Khởi tạo (useEffect)**

```javascript
1. Kết nối blockchain → JsonRpcProvider(http://127.0.0.1:8545)
2. Lấy danh sách accounts → provider.listAccounts()
3. Load campaigns → fetchCampaigns()
```

### **B. Tương tác với Contract**

#### **Đọc dữ liệu (Read-Only)**
```javascript
getReadOnlyContract() → Contract(address, ABI, provider)
  ↓
fetchCampaigns() → contract.campaignCount() → contract.campaigns(i)
```

#### **Ghi dữ liệu (Write - cần Signer)**
```javascript
getContractWithSigner() → Contract(address, ABI, signer)
  ↓
createCampaign() → contract.createCampaign(...) → tx.wait()
donate() → contract.donate(id, {value: ETH}) → tx.wait()
```

### **C. Chuyển đổi Account**

```javascript
handleLogin(index) → setCurrentAccountIndex(index)
  ↓
activeAddress = accounts[currentAccountIndex]
  ↓
Hiển thị địa chỉ ví trên UI
```

**Accounts:**
- **Owner** = Account #0 (tạo campaign, withdraw)
- **Donor** = Account #1 (donate, refund)
- **User 2-19** = Accounts #2-19 (có thể donate)

---

## 3. Blockchain (Hardhat Node)

```bash
npx hardhat node
  ↓
Tạo 20 accounts, mỗi account 10,000 ETH
  ↓
Lắng nghe trên http://127.0.0.1:8545
  ↓
Xử lý transactions từ frontend
```

---

## 4. Quy Trình End-to-End

### **Bước 1: Owner tạo campaign**
```
Frontend → createCampaign() → Smart Contract → Blockchain
```

### **Bước 2: Donor donate**
```
Frontend → donate() → Smart Contract → Blockchain (chuyển ETH)
```

### **Bước 3: Sau deadline, check goal**
```
Frontend → checkGoal() → Smart Contract → Cập nhật isClosed, goalReached
```

### **Bước 4a: Campaign thành công**
```
Frontend → withdraw() → Smart Contract → Chuyển ETH cho Owner
```

### **Bước 4b: Campaign thất bại**
```
Frontend → refund() → Smart Contract → Hoàn ETH cho Donor
```

---

## 5. Các File Quan Trọng

| File | Vai trò |
|------|---------|
| `CharityDonation.vy` | Logic smart contract (Vyper) |
| `deploy.py` | Deploy contract lên blockchain |
| `App.jsx` | Giao diện + tương tác với contract |
| `contract-address.json` | Địa chỉ contract sau khi deploy |
| `CharityDonation.json` | ABI để frontend gọi contract |

---

## 6. Cách Chạy Project

### **Bước 1: Chạy Blockchain**
```bash
# Terminal 1
npx hardhat node
```

### **Bước 2: Deploy Contract**
```bash
# Terminal 2
cd charity_donation
C:\Users\krizb\ape310\Scripts\activate  # Activate Python env
python scripts/deploy.py
```

### **Bước 3: Chạy Frontend**
```bash
# Terminal 3
cd frontend
npm run dev
```

### **Bước 4: Mở trình duyệt**
```
http://localhost:5174
```

---

## 7. Luồng Dữ Liệu

```
Frontend (React)
    ↕ (Ethers.js)
Smart Contract (Vyper)
    ↕
Blockchain (Hardhat Node)
```

---

## 8. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contract** | Vyper |
| **Blockchain** | Hardhat Node (Local) |
| **Frontend** | React + Vite |
| **Web3 Library** | Ethers.js v6 |
| **Deployment** | Ape Framework |

---

## 9. Tính Năng Chính

✅ Tạo campaign với target amount và deadline  
✅ Donate ETH vào campaign  
✅ Tự động kiểm tra deadline và goal  
✅ Withdraw khi campaign thành công  
✅ Refund khi campaign thất bại  
✅ Hiển thị 20 accounts từ Hardhat  
✅ Chuyển đổi giữa Owner/Donor/User accounts  

---

## 10. Lưu Ý

- **Hardhat Node** tự động reset khi khởi động lại → Cần deploy lại contract
- **Owner** (Account #0) có quyền withdraw khi campaign thành công
- **Donor** (bất kỳ account nào) có thể donate và refund khi thất bại
- **Deadline** được tính bằng giây (Unix timestamp)
- **Target Amount** và **Donation** tính bằng ETH

---

## 11. Lưu Trữ Dữ Liệu (Quan Trọng)

Các campaigns **KHÔNG được lưu trong project** (không có file database nào trong folder), mà được lưu **trực tiếp trên blockchain** (Hardhat Node đang chạy ở localhost).

- **Cơ chế:** Dữ liệu được lưu trong **RAM** của Hardhat Node.
- **Hệ quả:** Nếu bạn tắt Hardhat Node (đóng terminal), **tất cả campaigns sẽ bị mất**.
- **Giải pháp:** Giữ terminal chạy Hardhat Node luôn mở trong quá trình development.

---

**Tác giả:** Khang  
**Ngày tạo:** 29/11/2025
