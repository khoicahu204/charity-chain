import json
import os
import subprocess
from web3 import Web3

def main():
    # Connect to Anvil
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    
    vyper_path = "vyper"
    
    # --- 1. Compile CharityToken ---
    print("Compiling CharityToken.vy...")
    abi_process = subprocess.run([vyper_path, "-f", "abi", "contracts/CharityToken.vy"], capture_output=True, text=True)
    if abi_process.returncode != 0:
        print(f"Error compiling CharityToken ABI: {abi_process.stderr}")
        return
    token_abi = json.loads(abi_process.stdout)

    bytecode_process = subprocess.run([vyper_path, "-f", "bytecode", "contracts/CharityToken.vy"], capture_output=True, text=True)
    if bytecode_process.returncode != 0:
        print(f"Error compiling CharityToken Bytecode: {bytecode_process.stderr}")
        return
    token_bytecode = bytecode_process.stdout.strip()
    
    # --- 2. Compile CharityDonation ---
    print("Compiling CharityDonation.vy...")
    abi_process = subprocess.run([vyper_path, "-f", "abi", "contracts/CharityDonation.vy"], capture_output=True, text=True)
    if abi_process.returncode != 0:
        print(f"Error compiling CharityDonation ABI: {abi_process.stderr}")
        return
    donation_abi = json.loads(abi_process.stdout)

    bytecode_process = subprocess.run([vyper_path, "-f", "bytecode", "contracts/CharityDonation.vy"], capture_output=True, text=True)
    if bytecode_process.returncode != 0:
        print(f"Error compiling CharityDonation Bytecode: {bytecode_process.stderr}")
        return
    donation_bytecode = bytecode_process.stdout.strip()
    
    print("Compilation successful.")

    # --- 3. Deploy Contracts ---
    if w3.eth.accounts:
        deployer_address = w3.eth.accounts[0]
        print(f"Using unlocked account: {deployer_address}")
        
        # Deploy Token
        CharityToken = w3.eth.contract(abi=token_abi, bytecode=token_bytecode)
        tx_hash = CharityToken.constructor("Charity Token", "CHT", 18, 1000000 * 10**18).transact({
            'from': deployer_address,
            'gas': 3000000
        })
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        token_address = tx_receipt.contractAddress
        print(f"CharityToken deployed at: {token_address}")

        # Deploy Donation Contract
        CharityDonation = w3.eth.contract(abi=donation_abi, bytecode=donation_bytecode)
        tx_hash = CharityDonation.constructor(token_address).transact({
            'from': deployer_address,
            'gas': 3000000
        })
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        donation_address = tx_receipt.contractAddress
        print(f"CharityDonation deployed at: {donation_address}")

    else:
        # Fallback to Private Key
        deployer_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        print(f"Using hardcoded private key for: {deployer_address}")
        
        # Deploy Token
        CharityToken = w3.eth.contract(abi=token_abi, bytecode=token_bytecode)
        nonce = w3.eth.get_transaction_count(deployer_address)
        tx = CharityToken.constructor("Charity Token", "CHT", 18, 1000000 * 10**18).build_transaction({
            'from': deployer_address,
            'nonce': nonce,
            'gas': 3000000,
            'gasPrice': w3.eth.gas_price
        })
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        token_address = tx_receipt.contractAddress
        print(f"CharityToken deployed at: {token_address}")

        # Deploy Donation Contract
        CharityDonation = w3.eth.contract(abi=donation_abi, bytecode=donation_bytecode)
        nonce = w3.eth.get_transaction_count(deployer_address)
        tx = CharityDonation.constructor(token_address).build_transaction({
            'from': deployer_address,
            'nonce': nonce,
            'gas': 3000000,
            'gasPrice': w3.eth.gas_price
        })
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        donation_address = tx_receipt.contractAddress
        print(f"CharityDonation deployed at: {donation_address}")
    
    # --- 4. Save Artifacts ---
    frontend_path = "../frontend/src/contracts"
    os.makedirs(frontend_path, exist_ok=True)
    
    with open(f"{frontend_path}/contract-address.json", "w") as f:
        json.dump({
            "CharityDonation": donation_address,
            "CharityToken": token_address
        }, f)
        
    with open(f"{frontend_path}/CharityDonation.json", "w") as f:
        json.dump({"abi": donation_abi}, f, indent=2)

    with open(f"{frontend_path}/CharityToken.json", "w") as f:
        json.dump({"abi": token_abi}, f, indent=2)
        
    print("Artifacts saved to frontend/src/contracts")

if __name__ == "__main__":
    main()
