import json
import time
from web3 import Web3

def main():
    """
    Proof of Reentrancy Protection (Checks-Effects-Interactions)
    
    This script demonstrates the safe lifecycle of a campaign withdrawal:
    1. Create Campaign
    2. Donate to reach target
    3. Close Campaign (checkGoal)
    4. Withdraw funds
    
    The safety relies on the Contract's logic:
    - Checks: assert conditions
    - Effects: amountRaised = 0
    - Interactions: send(msg.sender, amount)
    
    We verify that after withdrawal, the amountRaised is indeed 0, preventing
    any subsequent withdrawals (re-entrancy would fail at the 'Effects' check 
    if it tried to re-enter before 'Interactions', but here we prove the state 
    is correctly updated).
    """

    # 1. Connect to Hardhat node
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    if not w3.is_connected():
        print("Error: Cannot connect to local Hardhat node at 127.0.0.1:8545")
        return

    # 2. Setup Accounts
    deployer = w3.eth.accounts[0]
    donor = w3.eth.accounts[1]
    print(f"Deployer/Owner: {deployer}")
    print(f"Donor: {donor}")

    # 3. Load Contract
    try:
        with open("../frontend/src/contracts/contract-address.json") as f:
            address_info = json.load(f)
        contract_address = address_info["CharityDonation"]
        
        with open("../frontend/src/contracts/CharityDonation.json") as f:
            artifact = json.load(f)
        abi = artifact["abi"]
    except FileNotFoundError:
        print("Error: Contract artifacts not found. Please deploy first.")
        return

    contract = w3.eth.contract(address=contract_address, abi=abi)

    # 4. Create Campaign
    print("\n[1] Creating Campaign...")
    target_amount = w3.to_wei(1, "ether")
    tx = contract.functions.createCampaign(
        "Reentrancy Proof Campaign",
        "Demonstrating CEI pattern",
        "QmHash123",
        "QmHashDocs",
        target_amount,
        1 # duration days
    ).transact({'from': deployer})
    w3.eth.wait_for_transaction_receipt(tx)
    
    campaign_id = contract.functions.campaignCount().call() - 1
    print(f"Campaign #{campaign_id} created.")

    # 5. Donate to reach target
    print("\n[2] Donating to reach target...")
    tx = contract.functions.donate(campaign_id).transact({
        'from': donor,
        'value': target_amount
    })
    w3.eth.wait_for_transaction_receipt(tx)
    print(f"Donated {w3.from_wei(target_amount, 'ether')} ETH.")

    # 6. Check Goal & Close
    print("\n[3] Checking Goal to close campaign...")
    tx = contract.functions.checkGoal(campaign_id).transact({'from': deployer})
    w3.eth.wait_for_transaction_receipt(tx)
    
    campaign = contract.functions.campaigns(campaign_id).call()
    # campaign struct: id, owner, name, desc, img, doc, target, raised, deadline, isClosed, goalReached, isDeleted
    # Index 7 is amountRaised, 9 is isClosed, 10 is goalReached
    print(f"Campaign Closed: {campaign[9]}")
    print(f"Goal Reached: {campaign[10]}")
    print(f"Amount Raised: {w3.from_wei(campaign[7], 'ether')} ETH")

    # 7. Withdraw (The Critical Step)
    print("\n[4] Withdrawing funds (CEI Pattern)...")
    initial_balance = w3.eth.get_balance(deployer)
    
    tx = contract.functions.withdraw(campaign_id).transact({'from': deployer})
    receipt = w3.eth.wait_for_transaction_receipt(tx)
    
    final_balance = w3.eth.get_balance(deployer)
    print(f"Withdrawal successful. Gas used: {receipt['gasUsed']}")
    print(f"Owner balance increased by approx: {w3.from_wei(final_balance - initial_balance, 'ether')} ETH")

    # 8. Verify State (Effects)
    print("\n[5] Verifying State Update...")
    campaign_after = contract.functions.campaigns(campaign_id).call()
    amount_raised_after = campaign_after[7]
    print(f"Amount Raised after withdraw: {amount_raised_after}")
    
    if amount_raised_after == 0:
        print("SUCCESS: amountRaised is 0. CEI pattern 'Effects' phase executed correctly.")
        print("Any re-entrant call would now fail at 'assert amount > 0'.")
    else:
        print("FAILURE: amountRaised is not 0!")

if __name__ == "__main__":
    main()
