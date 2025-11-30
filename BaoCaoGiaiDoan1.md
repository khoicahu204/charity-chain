# TÀI LIỆU MÔ TẢ ĐỒ ÁN CHARITY CHAIN

## 1. Các nghiệp vụ chính (Business Processes)

Dưới đây là các quy trình cốt lõi của hệ thống.

### 1.1. Quy trình Tạo Chiến dịch (Create Campaign)
Dành cho người gây quỹ (Owner).

```mermaid
sequenceDiagram
    participant Owner as Người dùng (Owner)
    participant FE as Frontend (React)
    participant IPFS as Pinata IPFS
    participant SC as Smart Contract
    
    Owner->>FE: Nhập thông tin (Tên, Mô tả, Target, Deadline)
    Owner->>FE: Chọn Ảnh & Tài liệu minh chứng
    FE->>IPFS: Upload Ảnh & Tài liệu
    IPFS-->>FE: Trả về ImageHash & DocumentsHash
    FE->>SC: Gọi hàm createCampaign(..., hashes)
    SC-->>FE: Xác nhận giao dịch thành công
    FE-->>Owner: Hiển thị chiến dịch mới trên Dashboard
```

### 1.2. Quy trình Quyên góp (Donate)
Dành cho nhà hảo tâm (Donater).

```mermaid
sequenceDiagram
    participant Donater as Nhà hảo tâm
    participant FE as Frontend
    participant SC as Smart Contract
    
    Donater->>FE: Chọn chiến dịch & Nhập số tiền (ETH)
    FE->>SC: Gọi hàm donate(campaignId) + gửi ETH
    SC->>SC: Cộng tiền vào amountRaised
    SC->>SC: Ghi nhận người đóng góp
    SC-->>FE: Emit event DonationReceived
    FE-->>Donater: Cập nhật thanh tiến độ (Progress Bar)
```

### 1.3. Quy trình Rút tiền / Hoàn tiền (Withdraw / Refund)
Xảy ra khi chiến dịch kết thúc (hết thời gian Deadline).

```mermaid
sequenceDiagram
    participant User as Người dùng (Owner/Donater)
    participant FE as Frontend
    participant SC as Smart Contract

    Note over User, SC: Điều kiện tiên quyết: Chiến dịch đã hết hạn (Deadline passed)

    alt Trường hợp 1: Đạt mục tiêu (Goal Reached)
        User->>FE: Owner nhấn nút "Withdraw"
        FE->>SC: Gọi hàm withdraw(campaignId)
        SC->>SC: Kiểm tra: Đã đạt Target? Là Owner?
        SC->>User: Chuyển toàn bộ ETH quỹ cho Owner
        SC-->>FE: Thông báo rút tiền thành công
    else Trường hợp 2: Không đạt mục tiêu (Goal Failed)
        User->>FE: Donater nhấn nút "Refund"
        FE->>SC: Gọi hàm refund(campaignId)
        SC->>SC: Kiểm tra: Chưa đạt Target? Đã từng donate?
        SC->>User: Hoàn lại số ETH đã góp cho Donater
        SC-->>FE: Thông báo hoàn tiền thành công
    end
```

---

## 2. Các ràng buộc logic (Business Rules & Constraints)

### 2.1. Ràng buộc dữ liệu đầu vào (Input Validation)
*   **Tạo chiến dịch:**
    *   Mục tiêu (Target) > 0.
    *   Thời hạn (Duration) > 0 ngày.
    *   Tên và mô tả bắt buộc nhập.
    *   File ảnh: PNG/JPG, max 5MB.
    *   File tài liệu: PDF/DOC, max 10MB.
*   **Quyên góp:**
    *   Số tiền > 0.
    *   Số dư ví > Số tiền quyên góp + Phí gas.

### 2.2. Ràng buộc nghiệp vụ (Smart Contract Logic)
*   **Rút tiền (Withdraw):** Chỉ Owner được rút khi đã hết hạn (Deadline passed) VÀ đạt mục tiêu (Goal reached).
*   **Hoàn tiền (Refund):** Donater được hoàn tiền khi đã hết hạn (Deadline passed) VÀ không đạt mục tiêu (Goal failed).
*   **Xóa chiến dịch:** Chỉ Owner được xóa khi chưa có ai quyên góp.

### 2.3. Ràng buộc bảo mật
*   **Authentication:** Đăng nhập bằng Private Key khớp với Address.

---

## 3. Các giao diện của đồ án (User Interfaces)

### 3.1. Màn hình Đăng nhập (Authentication)
*   Form đăng nhập với Wallet Address và Private Key.
*   Hiển thị danh sách Test Accounts gợi ý (từ Hardhat).

### 3.2. Màn hình Dashboard (Trang chủ)
*   **Header:** Logo, User Info (Address + Role), nút "Logout".
*   **Danh sách chiến dịch:** Hiển thị dạng lưới các thẻ chiến dịch (Campaign Cards).
*   **Nút tạo mới:** "Start Campaign" để mở modal tạo chiến dịch.

### 3.3. Chi tiết Thẻ Chiến dịch (Campaign Card)
*   **Thông tin:** Tên, Mô tả, Ảnh minh họa (IPFS), Link tài liệu (IPFS).
*   **Tiến độ:** Progress bar, Số tiền đã góp / Target, Deadline.
*   **Trạng thái:** Active (Đang chạy), Closed (Đã đóng), Goal Reached (Đạt mục tiêu).
*   **Tương tác:** Form nhập số tiền donate, các nút chức năng (Withdraw, Refund, Delete).

### 3.4. Modal Tạo Chiến dịch (Create Campaign Modal)
*   Form nhập thông tin chiến dịch.
*   **Upload Image:** Chọn ảnh cover cho chiến dịch (lưu trên IPFS).
*   **Upload Documents:** Chọn tài liệu minh chứng PDF/DOC (lưu trên IPFS).
