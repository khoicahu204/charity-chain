# Báo Cáo Phân Tích Tiêu Chí An Toàn Smart Contract

Tài liệu này phân tích việc đáp ứng 3 tiêu chí an toàn quan trọng trong Smart Contract `CharityDonation.vy`.

## Tiêu chí 1 – Reentrancy / Checks–Effects–Interactions (CEI)

Mô hình Checks-Effects-Interactions (CEI) được áp dụng để ngăn chặn tấn công Reentrancy.

### Hàm `withdraw()`
**Vị trí:** `CharityDonation.vy` (Lines 115-127)

```vyper
@external
def withdraw(_id: uint256):
    assert _id < self.campaignCount, "Campaign does not exist"
    assert not self.campaigns[_id].isDeleted, "Campaign is deleted"
    assert self.campaigns[_id].isClosed, "Campaign is not closed"
    assert self.campaigns[_id].goalReached, "Goal was not reached"
    assert msg.sender == self.campaigns[_id].owner, "Only owner can withdraw"
    amount: uint256 = self.campaigns[_id].amountRaised
    assert amount > 0, "No funds to withdraw"
    self.campaigns[_id].amountRaised = 0     
    send(msg.sender, amount)
    log Withdrawn(_id, msg.sender, amount)
```

**Mapping với CEI:**
*   **Checks:** Các lệnh `assert` từ dòng 116–120, 123 kiểm tra điều kiện hợp lệ.
*   **Effects:** Cập nhật trạng thái `self.campaigns[_id].amountRaised = 0` (dòng 124) **trước** khi chuyển tiền.
*   **Interactions:** Thực hiện `send(msg.sender, amount)` (dòng 126) sau khi đã cập nhật trạng thái, đảm bảo an toàn.

### Hàm `refund()`
**Vị trí:** `CharityDonation.vy` (Lines 132-145)

```vyper
@external
def refund(_id: uint256):
    assert _id < self.campaignCount, "Campaign does not exist"
    assert not self.campaigns[_id].isDeleted, "Campaign is deleted"
    assert self.campaigns[_id].isClosed, "Campaign is not closed"
    assert not self.campaigns[_id].goalReached, "Goal was reached, cannot refund"
    
    donated_amount: uint256 = self.contributions[_id][msg.sender]
    assert donated_amount > 0, "No contribution to refund"
    self.contributions[_id][msg.sender] = 0
    send(msg.sender, donated_amount)
    
    log Refunded(_id, msg.sender, donated_amount)
```

**Mapping với CEI:**
*   **Checks:** Các lệnh `assert` từ dòng 134–140.
*   **Effects:** Cập nhật `self.contributions[_id][msg.sender] = 0` (dòng 142).
*   **Interactions:** Thực hiện `send(msg.sender, donated_amount)` (dòng 143) sau khi đã cập nhật số dư đóng góp về 0.


* Insight: Thứ tự xử lý trong CEI là: Checks -> Effects -> Interactions. có nghĩa là trước khi send tiền, contract phải đảm bảo rằng:
    *   `assert` không có lỗi xảy ra.
    *   `self.contributions[_id][msg.sender] = 0` được cập nhật trước khi send.
Tránh hacker rút tiền lần 2 và biến self.contributions[_id][msg.sender] chưa được gán = 0 -> send tiền 2 lần.
---

## Tiêu chí 2 – Overflow / Underflow

Dự án sử dụng **Vyper 0.3.7**, phiên bản này có cơ chế kiểm tra overflow/underflow tích hợp sẵn (tương tự Solidity 0.8+).

**Khai báo phiên bản:**
```vyper
# @version ^0.3.7
```

### Bảo vệ Runtime
Các phép toán số nguyên được bảo vệ bởi runtime check của Vyper. Ví dụ:

*   **Tăng ID chiến dịch:**
    ```vyper
    self.campaignCount += 1
    ```
*   **Tính toán thời gian:**
    ```vyper
    deadline_timestamp: uint256 = block.timestamp + (_duration * 86400)
    ```
*   **Cộng dồn tiền quyên góp:**
    ```vyper
    self.campaigns[_id].amountRaised += msg.value
    self.contributions[_id][msg.sender] += msg.value
    ```

### Kiểm chứng thực nghiệm
Các script test đã được xây dựng để chứng minh cơ chế bảo vệ này hoạt động.

**1. Test Overflow `campaignCount`**
Script: `test_overflow_underflow.py`
Mô tả: Script cố gắng gọi `createCampaign` liên tục cho đến khi vượt quá giới hạn của kiểu dữ liệu (ví dụ uint8 trong môi trường test giả lập hoặc uint256 thực tế). Vyper 0.3.7 sẽ revert transaction khi xảy ra overflow thay vì wrap around.

```python
# Trích đoạn logic test
max_iterations = 300 
for i in range(max_iterations):
    try_index = current_count + i
    # ... gọi createCampaign ...
    # Mong đợi revert khi vượt giới hạn
```

**2. Test Overflow `donationPoints`** (nếu có)
Script: `test_donation_overflow.py`
Mô tả: Test việc cộng điểm thưởng để đảm bảo không bị overflow quay về 0.

---

Câu hỏi rất hay! Bạn đang thắc mắc tại sao trong code Smart Contract (hàm donate) không thấy dòng nào kiểm tra số dư ví người dùng (ví dụ: assert msg.sender.balance >= msg.value), nhưng khi chạy trên Web (Frontend) thì vẫn báo lỗi nếu không đủ tiền.

Lý do là vì việc kiểm tra số dư này được thực hiện ở lớp giao thức Ethereum (Protocol Layer), trước cả khi transaction chạm tới code Smart Contract của bạn.

Giải thích chi tiết:
Cơ chế của Ethereum Virtual Machine (EVM):
Khi bạn gửi một transaction (giao dịch) kèm theo ETH (value: amountWei), EVM sẽ tự động kiểm tra xem ví người gửi (msg.sender) có đủ tiền để trả cho:
Số tiền muốn gửi (msg.value).
Phí Gas (gasPrice * gasLimit).
Nếu KHÔNG ĐỦ TIỀN: Transaction sẽ bị từ chối ngay lập tức ở mức network/node. Nó thậm chí không bao giờ đi vào hàm donate để chạy dòng code đầu tiên. Do đó, bạn không cần (và cũng không thể) viết code check số dư trong hàm donate.
Tại sao Web (Frontend) lại handle được?
Khi bạn gọi await contract.donate(...) từ thư viện ethers.js hoặc web3.js trên frontend:
Ví Metamask (hoặc ví khác) sẽ bật lên.
Metamask tự động kiểm tra số dư của bạn. Nếu thấy không đủ, nút "Confirm" sẽ bị mờ đi hoặc hiện thông báo "Insufficient funds" ngay trên giao diện ví.
Nếu bạn cố tình bypass giao diện ví để gửi lệnh, node Ethereum (như Hardhat, Infura, Alchemy) sẽ trả về lỗi (ví dụ: sender doesn't have enough funds to send tx) và thư viện JS sẽ throw Error.
Tóm lại:
Smart Contract: Không cần check số dư người gửi vì EVM đã lo việc đó. Nếu code chạy được đến dòng 1, chắc chắn người gửi đã đủ tiền.
Frontend/Wallet: Tự động check trước để trải nghiệm người dùng tốt hơn (báo lỗi sớm thay vì chờ gửi transaction đi mới báo lỗi).
Đó là lý do bạn thấy mọi thứ hoạt động trơn tru dù không viết dòng code check balance nào trong Vyper.

## Tiêu chí 3 – Unexpected Ether

Contract được thiết kế để không phụ thuộc vào `address(this).balance` cho logic nghiệp vụ chính, tránh rủi ro từ việc nhận Ether không mong muốn (ví dụ qua `selfdestruct` của contract khác).

### Cấu trúc dữ liệu
Sử dụng các biến trạng thái để theo dõi tiền:
```vyper
campaigns: public(HashMap[uint256, Campaign])
contributions: public(HashMap[uint256, HashMap[address, uint256]])
campaignCount: public(uint256)
```

Trong struct `Campaign`:
```vyper
struct Campaign:
    # ...
    targetAmount: uint256
    amountRaised: uint256
    deadline: uint256
    # ...
```

### Logic xử lý tiền
Mọi logic cập nhật số dư đều dựa trên biến `amountRaised` và `contributions`, không dùng `self.balance`.

*   **Khi nhận tiền:**
    ```vyper
    self.campaigns[_id].amountRaised += msg.value
    self.contributions[_id][msg.sender] += msg.value
    ```

*   **Khi kiểm tra mục tiêu:**
    ```vyper
    is_target_reached: bool = self.campaigns[_id].amountRaised >= self.campaigns[_id].targetAmount
    ```

*   **Khi rút tiền (Withdraw):**
    ```vyper
    amount: uint256 = self.campaigns[_id].amountRaised
    # ...
    self.campaigns[_id].amountRaised = 0 
    ```

**Kết luận:**
Toàn bộ logic rút tiền và hoàn tiền chỉ thao tác trên `amountRaised` và `contributions`. Nếu có người gửi "unexpected Ether" vào contract (không thông qua hàm donate), số Ether đó sẽ nằm trong balance của contract nhưng không làm sai lệch logic của các chiến dịch, đảm bảo tính đúng đắn của hệ thống.

Kịch bản tấn công "Unexpected Ether"
Hãy tưởng tượng Smart Contract của bạn giống như một cái két sắt thông minh.

Quy tắc: Két sắt chỉ mở khi số tiền bên trong (this.balance) BẰNG ĐÚNG 100 đồng.
Logic code: if (this.balance == 100) { mở_két(); }
Hacker sẽ làm gì?

Hacker thấy trong két đang có 99 đồng.
Hacker muốn phá hoại, làm cho két không bao giờ mở được nữa.
Hacker dùng thủ thuật (ví dụ: selfdestruct) để ép két sắt nhận thêm 2 đồng.
Lúc này, số tiền trong két là 101 đồng (this.balance = 101).
Hậu quả: Điều kiện if (101 == 100) trở thành SAI. Két sắt bị kẹt vĩnh viễn!
Tại sao Contract của bạn AN TOÀN?
Trong code 
CharityDonation.vy
 của bạn, bạn KHÔNG dùng logic kiểu "so sánh tổng tiền trong két" như ví dụ trên.

Thay vào đó, bạn dùng một cuốn sổ ghi chép riêng (amountRaised):

Khi ai đó gửi tiền đàng hoàng (qua hàm donate), bạn ghi vào sổ: amountRaised += tiền.
Khi rút tiền, bạn chỉ nhìn vào sổ: if (amountRaised > 0) { cho_rút(); }.
Trong contract CharityDonation, đúng là nếu hacker gửi 100 ETH vào thì contract "lời" 100 ETH nằm chết ở đó.

Tin vui: Vì bạn code logic dựa trên amountRaised (biến nội bộ) chứ không dựa trên this.balance, nên hệ thống của bạn KHÔNG BỊ SẬP.
Tin buồn (nhẹ): Số tiền 100 ETH đó sẽ bị kẹt vĩnh viễn trong contract, không ai rút ra được (trừ khi bạn viết thêm hàm adminWithdrawAll - nhưng hàm này lại tạo ra rủi ro tập trung quyền lực).
Kết luận: Với contract hiện tại của bạn, hacker gửi tiền vào thì đúng là... cảm ơn hacker! 🤣 Bạn an toàn. Nhưng với nhiều loại contract khác (Game, DeFi), việc này có thể làm sập cả hệ thống.

Thực ra, project của bạn KHÔNG THỂ CHẶN được selfdestruct. Không một contract nào trên Ethereum có thể chặn được việc này cả. Nếu ai đó muốn dùng selfdestruct để ném tiền vào contract của bạn, họ chắc chắn sẽ làm được.

Tuy nhiên, project của bạn KHÔNG BỊ ẢNH HƯỞNG bởi hành động đó.

Sự khác biệt quan trọng:
Chặn (Prevent): Làm cho hành động gửi tiền thất bại. (Không thể làm được với selfdestruct).
Miễn nhiễm (Immune): Tiền cứ vào, nhưng hệ thống vẫn chạy đúng, không bị lỗi. (Project của bạn làm được điều này).
Tại sao project của bạn "Miễn nhiễm"?
Vì bạn thiết kế logic theo kiểu: "Tôi chỉ tin vào sổ sách của tôi, không tin vào số tiền trong két."

Sổ sách (amountRaised): Mỗi khi có người gọi hàm donate(), bạn ghi chép cẩn thận: "Ông A góp 10 đồng". Tổng amountRaised tăng lên 10.
Két sắt (this.balance): Là tổng số ETH thực tế đang nằm ở địa chỉ contract.
Khi Hacker dùng selfdestruct ném 100 ETH vào:

Két sắt (this.balance): Tăng lên 100 ETH. (Hacker thành công việc ném tiền).
Sổ sách (amountRaised): KHÔNG ĐỔI. (Vì hacker không đi qua hàm donate, nên bạn không ghi sổ).
Bạn rút tiền dựa trên con số trong SỔ SÁCH. Vì vậy, dù trong két có dư ra 100 ETH hay 1 tỷ ETH tiền "lạ" thì logic rút tiền của bạn vẫn hoạt động chính xác như chưa từng có chuyện gì xảy ra. Số tiền lạ kia cứ nằm đó, không làm hỏng việc của bạn.

Đó chính là cách bạn "handle" (xử lý/đối phó) với selfdestruct: Phớt lờ nó đi!