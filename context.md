I. Giới thiệu đề tài

Lý do chọn đề tài

Vấn đề minh bạch trong quyên góp từ thiện (khó kiểm chứng, dễ nghi ngờ).

Blockchain phù hợp vì: bất biến, công khai, truy vết được.

Mục tiêu hệ thống

Xây dựng Hệ thống theo dõi quyên góp từ thiện minh bạch (Charity Donation Tracking) trên nền tảng Ethereum.

Cho phép:

Tạo chiến dịch quyên góp (charity campaign).

Người dùng gửi ETH ủng hộ.

Theo dõi số tiền, số lượt quyên góp theo thời gian.

Rút tiền / hoàn tiền theo luật rõ ràng (ràng buộc trong smart contract).

Phạm vi & đối tượng sử dụng

Đối tượng: tổ chức từ thiện, mạnh thường quân, người kiểm tra.

Phạm vi: chạy trên mạng local (Geth/Ganache), UI desktop (PySide6), không đi sâu web production.

Công cụ & nền tảng

Ngôn ngữ: Vyper, Python.

Framework: Ape Framework, Web3.py, PySide6.

Blockchain: Ganache & Geth (dev network).

Môi trường: Windows + virtualenv Python 3.10.

II. Cơ sở lý thuyết & Liên quan

Tổng quan Blockchain & Ethereum

Khối, chuỗi khối, consensus, transaction, gas.

Smart Contract & Vyper

Khái niệm, đặc điểm.

Cấu trúc cơ bản trong Vyper: state variables, function, decorator @view, @payable, @external.

Web3.py & Ape Framework

Kết nối node (HTTP/IPC).

Gửi transaction, gọi hàm read/write.

Ape: compile, deploy, test, chạy script.

Mô hình Crowdfunding / Donation trên blockchain

Ý tưởng gây quỹ: mục tiêu, deadline, refund logic.

Liên hệ với smart contract CrowdSaleToken bạn đã làm.

Event logging & minh bạch

Event trong Vyper.

Cách truy vấn event từ client (Web3.py) để chứng minh log giao dịch.

III. Phân tích yêu cầu hệ thống Charity Donation Tracking

Mô tả bài toán

Mỗi chiến dịch (campaign) có:

Tên, mô tả, chủ chiến dịch (owner).

Mục tiêu (targetAmount).

Deadline.

Người dùng có thể:

Quyên góp ETH vào chiến dịch.

Xem tổng số tiền đã quyên góp.

Chủ chiến dịch:

Rút tiền nếu đạt mục tiêu trước deadline.

Người quyên góp:

Được refund nếu không đạt mục tiêu sau deadline.

Yêu cầu chức năng

F1: Tạo chiến dịch mới.

F2: Donate ETH vào chiến dịch.

F3: Xem thông tin chiến dịch (số tiền hiện tại, số người ủng hộ).

F4: Check goal + đóng chiến dịch.

F5: Rút tiền nếu đạt mục tiêu.

F6: Refund cho người ủng hộ nếu không đạt.

Yêu cầu phi chức năng

Minh bạch, không sửa được lịch sử giao dịch.

An toàn: chỉ owner được rút tiền, người donate chỉ rút tiền của mình.

Dễ sử dụng: giao diện đơn giản (PySide6).

Map với Rubric của môn

Tiêu chí 1: Smart contract ≥ 3 nghiệp vụ + 2 ràng buộc logic.

Tiêu chí 2: DApp/Web3.py tương tác on-chain.

Tiêu chí 3: Lưu trữ thông tin chiến dịch & lịch sử donate (on-chain + metadata).

Tiêu chí 4: Có thể mở rộng gắn với ERC-20/NFT (ví dụ: token chứng nhận quyên góp).

IV. Thiết kế hệ thống
4.1 Kiến trúc tổng thể

Mô hình 3 lớp:

Blockchain layer: Smart contract CharityDonation.vy trên Geth.

Backend interaction: Script Python dùng Web3.py & Ape để:

Deploy contract.

Gọi donate, withdraw, refund, getCampaignInfo.

Frontend layer (GUI): PySide6 app:

Tab quản lý chiến dịch (tạo campaign, xem danh sách).

Tab donate.

Tab xem lịch sử giao dịch / log.

4.2 Thiết kế Smart Contract (Vyper)

Contract: CharityDonation.vy

Biến trạng thái:

struct Campaign:

id, name, description

owner: address

targetAmount: uint256

amountRaised: uint256

deadline: uint256

isClosed: bool

goalReached: bool

campaigns: HashMap[uint256, Campaign]

contributions: HashMap[uint256, HashMap[address, uint256]] // campaignId → (donor → amount)

campaignCount: uint256

Events:

CampaignCreated(id, owner, target, deadline)

DonationReceived(id, donor, amount)

GoalChecked(id, goalReached)

Withdrawn(id, owner, amount)

Refunded(id, donor, amount)

Các hàm chính (nghiệp vụ):

createCampaign(name, description, targetAmount, duration)

Tăng campaignCount, tạo campaign mới.

donate(campaignId) @payable

Kiểm tra: !isClosed, block.timestamp < deadline.

Cập nhật amountRaised & contributions[campaignId][msg.sender].

checkGoalReached(campaignId)

Chỉ owner được gọi.

Nếu amountRaised ≥ targetAmount && trước deadline → goalReached = True.

Đóng campaign (isClosed = True).

withdraw(campaignId)

Chỉ owner, chỉ khi goalReached == True && isClosed == True.

refund(campaignId)

Cho donor, nếu goalReached == False && isClosed == True.

getCampaignInfo(campaignId) @view

Trả về các thông tin campaign để GUI hiển thị.

getContribution(campaignId, donor) @view

Ràng buộc logic (ví dụ):

assert msg.sender == owner khi withdraw.

assert block.timestamp > deadline khi cho phép refund.

assert contributions[campaignId][msg.sender] > 0 trước khi refund.

4.3 Thiết kế DApp (PySide6 GUI)

Màn hình/Tab 1: Campaign Manager

Form tạo chiến dịch:

Input: name, description, targetAmount (ETH), duration (ngày).

Nút “Create Campaign”.

Bảng danh sách chiến dịch:

ID, tên, owner, target, raised, deadline, status.

Nút “Check Goal” cho từng campaign.

Màn hình/Tab 2: Donate

Chọn campaign trong combobox/list.

Nhập số ETH muốn donate.

Nút “Donate”.

Hiển thị:

Số tiền đã donate của user này cho campaign.

Tổng số tiền raised.

Màn hình/Tab 3: Withdraw / Refund

Phần cho Owner:

Chọn campaign mình sở hữu.

Nút “Withdraw”.

Phần cho Donor:

Chọn campaign đã đóng mà không đạt target.

Nút “Refund”.

Hiển thị thông báo kết quả (hash giao dịch, status).

Màn hình/Tab 4 (nếu muốn): Log/History

Hiển thị danh sách event DonationReceived, Withdrawn, Refunded đọc từ blockchain.

V. Hiện thực & Triển khai

Thiết lập môi trường

Tạo virtualenv, cài eth-ape, vyper, web3.py, PySide6.

Chạy Geth ở chế độ dev (hoặc Ganache).

Viết & biên dịch smart contract

File: contracts/CharityDonation.vy.

Lệnh: ape compile.

Triển khai contract

File scripts/deploy_charity.py:

Kết nối network (ethereum:local:http://127.0.0.1:8545
).

Deploy contract.

In địa chỉ contract.

Viết script backend

scripts/create_campaign.py

scripts/donate.py

scripts/check_goal.py

scripts/withdraw_or_refund.py

Reuse cách bạn làm trong Lab02 & Lab03 (deploy.py, vote.py, give_right_to_vote.py).

Phát triển GUI

File: charity_gui_app.py.

Kết nối đến contract bằng Web3.py (sử dụng ABI + address).

Gắn các nút GUI với hàm tương ứng.

VI. Kiểm thử & Đánh giá

Kiểm thử smart contract bằng Ape + PyTest

File tests/test_charity_donation.py:

test_create_campaign

test_donate_and_raise

test_check_goal_and_withdraw

test_refund_when_not_reached

Kiểm thử DApp

Scenario 1: Tạo 1 campaign, 2 người donate, đạt target → owner withdraw.

Scenario 2: Tạo campaign không đạt target → donor refund thành công.

Đánh giá

Mức độ minh bạch: mọi donate & rút đều có event/log.

Mức độ an toàn: không ai rút tiền sai logic.

So sánh với hệ thống từ thiện truyền thống (Excel / Google Sheet).

VII. Kết luận & Hướng phát triển

Tóm tắt kết quả

Hoàn thành smart contract quản lý quyên góp.

Xây dựng DApp GUI minh bạch & trực quan.

Đảm bảo các tiêu chí của môn: smart contract, Web3, DApp, event log.

Hạn chế

Chỉ chạy trên mạng local (Geth dev).

UI đơn giản, chưa có xác thực người dùng / login.

Hướng phát triển

Deploy lên testnet (Sepolia).

Thêm NFT chứng nhận quyên góp (integration với Lab05).

Thêm dashboard thống kê (Power BI / web dashboard).

Thêm IPFS để lưu chứng từ/hóa đơn từ thiện.