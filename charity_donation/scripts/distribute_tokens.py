import json
from web3 import Web3

def main():
    """
    Script để phân phối CHT tokens từ deployer (account #0) 
    sang các accounts khác trong hardhat-accounts.json
    """
    # Connect to Hardhat node
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    assert w3.is_connected(), "Cannot connect to local Hardhat node at 127.0.0.1:8545"
    
    # Load token address
    with open("../frontend/src/contracts/contract-address.json") as f:
        address_info = json.load(f)
    token_address = address_info["CharityToken"]
    
    # Load token ABI
    with open("../frontend/src/contracts/CharityToken.json") as f:
        artifact = json.load(f)
    token_abi = artifact["abi"]
    
    token_contract = w3.eth.contract(address=token_address, abi=token_abi)
    
    # Load accounts from hardhat-accounts.json
    with open("hardhat-accounts.json") as f:
        accounts = json.load(f)
    
    # Deployer account (account #0) - người có tất cả tokens
    deployer = accounts[0]
    deployer_address = deployer["address"]
    deployer_private_key = deployer["privateKey"]
    
    print(f"Deployer: {deployer_address}")
    
    # Kiểm tra balance của deployer
    deployer_balance = token_contract.functions.balanceOf(deployer_address).call()
    print(f"Deployer balance: {w3.from_wei(deployer_balance, 'ether')} CHT")
    
    # Số lượng CHT để phân phối cho mỗi account (trừ deployer)
    amount_per_account = w3.to_wei(10000, "ether")  # 10,000 CHT mỗi account
    
    # Phân phối tokens cho các accounts khác (từ index 1 trở đi)
    for account in accounts[1:]:
        recipient_address = w3.to_checksum_address(account["address"])
        role = account.get("role", f"account_{account['index']}")
        
        print(f"\n[*] Transferring {w3.from_wei(amount_per_account, 'ether')} CHT to {role} ({recipient_address})...")
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(deployer_address)
        tx = token_contract.functions.transfer(
            recipient_address,
            amount_per_account
        ).build_transaction({
            'from': deployer_address,
            'nonce': nonce,
            'gas': 100000,
            'gasPrice': w3.eth.gas_price,
        })
        
        # Sign và send
        signed_tx = w3.eth.account.sign_transaction(tx, deployer_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        if receipt["status"] == 1:
            # Kiểm tra balance sau khi transfer
            new_balance = token_contract.functions.balanceOf(recipient_address).call()
            print(f"    ✓ Success! {role} now has {w3.from_wei(new_balance, 'ether')} CHT")
        else:
            print(f"    ✗ Failed! Transaction reverted")
    
    # Kiểm tra balance cuối cùng của deployer
    final_balance = token_contract.functions.balanceOf(deployer_address).call()
    print(f"\n[*] Deployer final balance: {w3.from_wei(final_balance, 'ether')} CHT")
    print("\n✓ Token distribution completed!")

if __name__ == "__main__":
    main()

