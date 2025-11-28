import json
import os
from ape import project
from web3 import Web3

def main():
    # Connect to Anvil
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    
    # Anvil Account 0
    deployer_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    
    print(f"Deploying from: {deployer_address}")
    
    # Get Contract Interface
    contract_interface = project.CharityDonation.contract_type
    
    # Convert ABI to list of dicts for Web3.py
    abi = [x.dict() for x in contract_interface.abi]
    bytecode = contract_interface.deployment_bytecode.bytecode
    
    # Create Contract Object
    CharityDonation = w3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Build Transaction
    nonce = w3.eth.get_transaction_count(deployer_address)
    tx = CharityDonation.constructor().build_transaction({
        'from': deployer_address,
        'nonce': nonce,
        'gas': 3000000,
        'gasPrice': w3.eth.gas_price
    })
    
    # Sign and Send
    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
    
    # NOTE: Using raw_transaction (snake_case)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction hash: {tx_hash.hex()}")
    
    # Wait for receipt
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    contract_address = tx_receipt.contractAddress
    print(f"Contract deployed at: {contract_address}")
    
    # Save Artifacts
    frontend_path = "../frontend/src/contracts"
    os.makedirs(frontend_path, exist_ok=True)
    
    with open(f"{frontend_path}/contract-address.json", "w") as f:
        json.dump({"CharityDonation": contract_address}, f)
        
    with open(f"{frontend_path}/CharityDonation.json", "w") as f:
        # Just save the ABI, not the full contract type which has non-serializable fields
        # The frontend only needs the ABI
        json.dump({"abi": abi}, f, indent=2)
        
    print("Artifacts saved to frontend/src/contracts")
