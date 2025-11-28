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
# Create Campaign
# ---------------------
@external
def createCampaign(_name: String[100], _description: String[200], _target: uint256, _duration: uint256):
    newId: uint256 = self.campaignCount
    deadline_timestamp: uint256 = block.timestamp + (_duration * 86400) # _duration is in days

    self.campaigns[newId] = Campaign(
        id=newId,
        owner=msg.sender,
        name=_name,
        description=_description,
        targetAmount=_target,
        amountRaised=0,
        deadline=deadline_timestamp,
        isClosed=False,
        goalReached=False
    )

    self.campaignCount += 1
    log CampaignCreated(newId, msg.sender, _target, deadline_timestamp)

# ---------------------
# Donate
# ---------------------
@external
@payable
def donate(_id: uint256):
    assert _id < self.campaignCount, "Campaign does not exist"
    assert not self.campaigns[_id].isClosed, "Campaign is closed"
    assert block.timestamp < self.campaigns[_id].deadline, "Campaign deadline passed"
    assert msg.value > 0, "Donation amount must be greater than 0"

    self.campaigns[_id].amountRaised += msg.value
    self.contributions[_id][msg.sender] += msg.value

    log DonationReceived(_id, msg.sender, msg.value)

# ---------------------
# Check Goal
# ---------------------
@external
def checkGoal(_id: uint256):
    assert _id < self.campaignCount, "Campaign does not exist"
    assert not self.campaigns[_id].isClosed, "Campaign is already closed"
    # Allow checking goal if target reached OR deadline passed
    # If target reached before deadline, we can close early? Or wait?
    # Requirement: "Check goal + close campaign"
    
    # Logic: If deadline passed OR target reached, we can finalize.
    # Let's stick to: Can finalize if deadline passed OR target met.
    
    # Actually, usually we check if deadline passed to decide success/fail.
    # But if they hit target early, they might want to close early.
    
    is_target_reached: bool = self.campaigns[_id].amountRaised >= self.campaigns[_id].targetAmount
    is_deadline_passed: bool = block.timestamp >= self.campaigns[_id].deadline
    
    assert is_target_reached or is_deadline_passed, "Campaign is still ongoing and target not reached"

    self.campaigns[_id].isClosed = True
    self.campaigns[_id].goalReached = is_target_reached
    
    log GoalChecked(_id, is_target_reached)

# ---------------------
# Withdraw (Owner)
# ---------------------
@external
def withdraw(_id: uint256):
    assert _id < self.campaignCount, "Campaign does not exist"
    assert self.campaigns[_id].isClosed, "Campaign is not closed"
    assert self.campaigns[_id].goalReached, "Goal was not reached"
    assert msg.sender == self.campaigns[_id].owner, "Only owner can withdraw"

    amount: uint256 = self.campaigns[_id].amountRaised
    # Reset amountRaised to prevent re-entrancy/multiple withdrawals (though re-entrancy guard is better)
    # But here we just set it to 0 or track withdrawn status. 
    # Since we close the campaign, and check goalReached, we should ensure we don't withdraw twice.
    # Simple way: check balance.
    
    # Better: transfer and let Vyper handle it. 
    # But wait, if we set amountRaised to 0, it might affect history?
    # Let's just transfer. The logic relies on `isClosed` and `goalReached`.
    # To prevent double withdraw, we can check if balance > 0? 
    # Or just rely on the fact that the contract holds the funds.
    # Actually, if multiple campaigns exist, the contract holds ALL funds.
    # So we MUST track if this specific campaign's funds were withdrawn.
    # Let's set amountRaised to 0 after withdraw to prevent double withdraw.
    
    assert amount > 0, "No funds to withdraw"
    self.campaigns[_id].amountRaised = 0 
    
    send(msg.sender, amount)
    log Withdrawn(_id, msg.sender, amount)

# ---------------------
# Refund (Donor)
# ---------------------
@external
def refund(_id: uint256):
    assert _id < self.campaignCount, "Campaign does not exist"
    assert self.campaigns[_id].isClosed, "Campaign is not closed"
    assert not self.campaigns[_id].goalReached, "Goal was reached, cannot refund"
    
    donated_amount: uint256 = self.contributions[_id][msg.sender]
    assert donated_amount > 0, "No contribution to refund"

    self.contributions[_id][msg.sender] = 0
    send(msg.sender, donated_amount)
    
    log Refunded(_id, msg.sender, donated_amount)

# ---------------------
# Getters (Optional, for easy UI access if not using public vars directly)
# ---------------------
@external
@view
def getCampaign(_id: uint256) -> Campaign:
    return self.campaigns[_id]
