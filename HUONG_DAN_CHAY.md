# HƯỚNG DẪN CHẠY PROJECT CHARITY CHAIN

Bạn cần mở **3 Terminal** riêng biệt để chạy hệ thống.

## 1️⃣ Terminal 1: Chạy Blockchain Local (Hardhat Node)
Terminal này đóng vai trò là mạng blockchain. **Giữ terminal này luôn chạy**.

```bash
cd charity_donation
npx hardhat node
```

## 2️⃣ Terminal 2: Deploy Smart Contract
Dùng để đưa contract lên mạng. Chạy mỗi khi bạn khởi động lại Hardhat Node hoặc có sửa đổi code contract.

```bash
cd charity_donation
C:\Users\krizb\ape310\Scripts\python.exe scripts/deploy.py
```

## 3️⃣ Terminal 3: Chạy Frontend (Web App)
Dùng để chạy giao diện người dùng.

```bash
cd frontend
npm run dev
```

---

## 📝 Lưu ý quan trọng
1.  Nếu bạn tắt **Terminal 1** (Hardhat Node), toàn bộ dữ liệu (campaign, donation) sẽ mất.
2.  Khi bật lại **Terminal 1**, bạn **BẮT BUỘC** phải chạy lại **Terminal 2** để deploy contract mới.
3.  Web chạy tại: `http://localhost:5173`
