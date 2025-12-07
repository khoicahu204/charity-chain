# Các Nghiệp Vụ Chính - BPMN Diagrams

## 1. Create Campaign (Tạo Chiến Dịch)

```mermaid
graph TB
    subgraph Pool["Pool: Create Campaign Process"]
        subgraph User["Lane: User"]
            U1((Start)) --> U2[Nhập thông tin<br/>campaign]
            U2 --> U3{Upload<br/>files?}
        end
        
        subgraph Frontend["Lane: Frontend"]
            U3 -->|Yes| F1[Upload Image<br/>to IPFS]
            U3 -->|No| F4[Tạo Metadata]
            F1 --> F2[Upload Document<br/>to IPFS]
            F2 --> F4
            F4 --> F5[Upload Metadata<br/>to IPFS]
            F5 --> F6[Call createCampaign]
        end
        
        subgraph Contract["Lane: Smart Contract"]
            F6 --> C1{Validate<br/>inputs?}
            C1 -->|Valid| C2[Lưu Campaign]
            C1 -->|Invalid| C3[Revert]
            C2 --> C4[Emit Event]
        end
        
        C4 --> E1((End))
        C3 --> E2((End))
    end
```

---

## 2. Donate (Quyên Góp)

```mermaid
graph TB
    subgraph Pool["Pool: Donation Process"]
        subgraph User["Lane: User"]
            U1((Start)) --> U2[Chọn campaign<br/>& nhập số tiền]
        end
        
        subgraph Frontend["Lane: Frontend"]
            U2 --> F1{Check<br/>balance?}
            F1 -->|Insufficient| F2[Show error]
            F1 -->|OK| F3{Check<br/>allowance?}
            F3 -->|Need approve| F4[Approve tokens]
            F3 -->|OK| F5[Call donate]
            F4 --> F5
        end
        
        subgraph Token["Lane: Token Contract"]
            F4 --> T1[Approve]
            F5 --> T2[transferFrom]
        end
        
        subgraph Contract["Lane: Smart Contract"]
            T2 --> C1{Validate<br/>campaign?}
            C1 -->|Invalid| C2[Revert]
            C1 -->|Valid| C3[Update<br/>amountRaised]
            C3 --> C4[Save<br/>contribution]
            C4 --> C5[Emit Event]
        end
        
        F2 --> E1((End))
        C2 --> E1
        C5 --> E2((End))
    end
```

---

## 3. Check Goal (Kiểm Tra Mục Tiêu)

```mermaid
graph TB
    subgraph Pool["Pool: Check Goal Process"]
        subgraph User["Lane: User"]
            U1((Start)) --> U2[Click Check Goal]
        end
        
        subgraph Frontend["Lane: Frontend"]
            U2 --> F1[Call checkGoal]
        end
        
        subgraph Contract["Lane: Smart Contract"]
            F1 --> C1{Campaign<br/>exists?}
            C1 -->|No| C2[Revert]
            C1 -->|Yes| C3{Already<br/>closed?}
            C3 -->|Yes| C2
            C3 -->|No| C4{Target reached<br/>OR deadline?}
            C4 -->|No| C2
            C4 -->|Yes| C5[Set isClosed]
            C5 --> C6{Amount >=<br/>target?}
            C6 -->|Yes| C7[Set goalReached<br/>= true]
            C6 -->|No| C8[Set goalReached<br/>= false]
            C7 --> C9[Emit Event]
            C8 --> C9
        end
        
        C2 --> E1((End))
        C9 --> E2((End))
    end
```

---

## 4. Withdraw (Rút Tiền)

```mermaid
graph TB
    subgraph Pool["Pool: Withdraw Process"]
        subgraph User["Lane: Campaign Owner"]
            U1((Start)) --> U2[Click Withdraw]
        end
        
        subgraph Frontend["Lane: Frontend"]
            U2 --> F1[Call withdraw]
        end
        
        subgraph Contract["Lane: Smart Contract"]
            F1 --> C1{Campaign<br/>closed?}
            C1 -->|No| C2[Revert]
            C1 -->|Yes| C3{Goal<br/>reached?}
            C3 -->|No| C2
            C3 -->|Yes| C4{Caller =<br/>owner?}
            C4 -->|No| C2
            C4 -->|Yes| C5{Has<br/>funds?}
            C5 -->|No| C2
            C5 -->|Yes| C6[amount =<br/>amountRaised]
            C6 --> C7[Set amountRaised<br/>= 0]
            C7 --> C8[Transfer to<br/>Token Contract]
        end
        
        subgraph Token["Lane: Token Contract"]
            C8 --> T1[Transfer tokens<br/>to owner]
        end
        
        subgraph Contract2["Lane: Smart Contract"]
            T1 --> C9[Emit Event]
        end
        
        C2 --> E1((End))
        C9 --> E2((End))
    end
```

---

## 5. Refund (Hoàn Tiền)

```mermaid
graph TB
    subgraph Pool["Pool: Refund Process"]
        subgraph User["Lane: Donor"]
            U1((Start)) --> U2[Click Refund]
        end
        
        subgraph Frontend["Lane: Frontend"]
            U2 --> F1[Call refund]
        end
        
        subgraph Contract["Lane: Smart Contract"]
            F1 --> C1{Campaign<br/>closed?}
            C1 -->|No| C2[Revert]
            C1 -->|Yes| C3{Goal NOT<br/>reached?}
            C3 -->|Reached| C2
            C3 -->|Not reached| C4{Has<br/>contribution?}
            C4 -->|No| C2
            C4 -->|Yes| C5[amount =<br/>contribution]
            C5 --> C6[Set contribution<br/>= 0]
            C6 --> C7[Transfer to<br/>Token Contract]
        end
        
        subgraph Token["Lane: Token Contract"]
            C7 --> T1[Transfer tokens<br/>to donor]
        end
        
        subgraph Contract2["Lane: Smart Contract"]
            T1 --> C8[Emit Event]
        end
        
        C2 --> E1((End))
        C8 --> E2((End))
    end
```

---

## 6. Delete Campaign (Xóa Chiến Dịch)

```mermaid
graph TB
    subgraph Pool["Pool: Delete Campaign Process"]
        subgraph User["Lane: Campaign Owner"]
            U1((Start)) --> U2[Click Delete]
        end
        
        subgraph Frontend["Lane: Frontend"]
            U2 --> F1[Call deleteCampaign]
        end
        
        subgraph Contract["Lane: Smart Contract"]
            F1 --> C1{Campaign<br/>exists?}
            C1 -->|No| C2[Revert]
            C1 -->|Yes| C3{Caller =<br/>owner?}
            C3 -->|No| C2
            C3 -->|Yes| C4{amountRaised<br/>= 0?}
            C4 -->|No| C2
            C4 -->|Yes| C5{Already<br/>deleted?}
            C5 -->|Yes| C2
            C5 -->|No| C6[Set isDeleted<br/>= true]
            C6 --> C7[Emit Event]
        end
        
        C2 --> E1((End))
        C7 --> E2((End))
    end
```

---

## Chú Thích BPMN

### Ký Hiệu
- `((Start))` - Start Event (hình tròn)
- `((End))` - End Event (hình tròn đậm)
- `[Activity]` - Task (hình chữ nhật bo góc)
- `{Decision?}` - Gateway (hình thoi)
- `-->` - Sequence Flow
- `subgraph` - Pool/Lane (phân chia trách nhiệm)

### Actors (Lanes)
- **User**: Người dùng (Owner/Donor)
- **Frontend**: Giao diện ứng dụng
- **Smart Contract**: Hợp đồng thông minh
- **Token Contract**: Hợp đồng ERC-20
- **IPFS**: Hệ thống lưu trữ phi tập trung
