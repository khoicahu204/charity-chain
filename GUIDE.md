✅ BƯỚC 1 — Xác định project structure & tạo khung rỗng
✔ 1.1. Tạo project Ape

Dùng lệnh:

ape init charity_donation


Sau đó tạo các thư mục:

contracts/
scripts/
tests/
gui/

✔ 1.2. Tạo file contract rỗng

Tạo:

contracts/CharityDonation.vy


Bạn chỉ cần copy phần khung contract mình sẽ viết ở bước 2.

✔ 1.3. Tạo file cấu hình connection

Geth hoặc Ganache (Geth ưu tiên):

geth --dev --http --http.api eth,web3,net --ipcpath /tmp/geth.ipc

✅ BƯỚC 2 — Code Smart Contract CharityDonation.vy

Bạn đã có kinh nghiệm từ nhiều lab (Storage, Voting, Token, NFT).
=> Contract này dễ hơn Voting + NFT.

Mình sẽ code cho bạn một khung đầy đủ như sau (copy vào file):

📌 TẠM THỜI — Chỉ tạo khung contract

(Để tránh lỗi compile lúc đầu)

# @version ^0.4.3

struct Campaign:
    id: uint256
    owner: address
    name: String[100]
    description: String[200]
    targetAmount: uint256
    amountRaised: uint256
    deadline: uint256
    isClosed: bool
    goalReached: bool

event CampaignCreated:
    id: uint256
    owner: address
    target: uint256
    deadline: uint256

event DonationReceived:
    id: uint256
    donor: address
    amount: uint256

event GoalChecked:
    id: uint256
    reached: bool

event Withdrawn:
    id: uint256
    owner: address
    amount: uint256

event Refunded:
    id: uint256
    donor: address
    amount: uint256

campaigns: public(HashMap[uint256, Campaign])
contributions: public(HashMap[uint256, HashMap[address, uint256]])
campaignCount: public(uint256)

# ---------------------
# Tạo chiến dịch
# ---------------------
@external
def createCampaign(_name: String[100], _description: String[200], _target: uint256, _duration: uint256):
    pass

# ---------------------
# Donate
# ---------------------
@external
@payable
def donate(_id: uint256):
    pass

# ---------------------
# Check goal
# ---------------------
@external
def checkGoal(_id: uint256):
    pass

# ---------------------
# Withdraw (Owner)
# ---------------------
@external
def withdraw(_id: uint256):
    pass

# ---------------------
# Refund (Donor)
# ---------------------
@external
def refund(_id: uint256):
    pass


👉 Tiếp theo, bạn sẽ hoàn thiện phần logic theo outline.

📌 Nếu bạn muốn, mình viết luôn bản đầy đủ 100% logic ngay bây giờ.

✅ BƯỚC 3 — Viết scripts Python tương tác hợp đồng (backend)

Trong thư mục scripts/ tạo các file:

deploy_charity.py

create_campaign.py

donate.py

check_goal.py

withdraw.py

refund.py

get_info.py

Mỗi file chỉ cần làm giống lab Voting/DApp:

Ví dụ deploy:

def main():
    acct = accounts.load("chairperson")
    contract = project.CharityDonation.deploy(sender=acct)
    print("Contract deployed at:", contract.address)


=> Nhớ: re-use code từ bài voting – bạn đã làm rất tốt rồi.

✅ BƯỚC 4 — Xây giao diện GUI (PySide6)

Cực kỳ dễ vì bạn đã làm voting_gui_app.py rồi.

Tạo:

gui/charity_gui_app.py


Mini layout bạn cần:

✔ Tab 1 — Create Campaign

name

description

target ETH

duration (days)

button “Create”

✔ Tab 2 — Donate

chọn campaign ID

nhập số ETH

button “Donate”

✔ Tab 3 — Withdraw / Refund

chọn campaign

nút Withdraw (hiện nếu user = owner)

nút Refund (nếu user là donor)

✔ Tab 4 — View Logs

đọc event log bằng Web3.py

Mình có thể viết cho bạn full code UI nếu bạn muốn.

✅ BƯỚC 5 — Viết Test (Ape + PyTest)

Trong tests/test_charity.py:

test_create_campaign()

test_donate()

test_check_goal_reached()

test_withdraw()

test_refund()

Bạn làm test rất tốt trong Lab02/Lab03 rồi → chỉ cần copy mẫu.

🎉 VẬY BƯỚC TIẾP THEO BẠN NÊN LÀM GÌ?
👉 Làm theo đúng thứ tự:
1. Copy khung contract vào file CharityDonation.vy

(đã gửi ở trên)

2. Nhờ mình viết logic đầy đủ của contract

→ Đây là bước quan trọng nhất.

3. Triển khai (ape compile → ape run deploy)
4. Tạo script donate / withdraw / refund
5. Tạo GUI (từ Voting DApp → sửa lại cho hợp)
6. Viết test (từ Voting test → sửa lại)