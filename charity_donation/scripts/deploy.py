import json
import os
import subprocess
from web3 import Web3

def main():
    # Connect to Anvil
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    
    print("Compiling CharityDonation.vy using vyper...")
    # Compile using vyper CLI
    # We need to use the full path to vyper if it's not in PATH, but let's assume it is or use the known path
    vyper_path = r"C:\Users\krizb\ape310\Scripts\vyper.exe"
    
    # Get ABI
    abi_process = subprocess.run([vyper_path, "-f", "abi", "contracts/CharityDonation.vy"], capture_output=True, text=True)
    if abi_process.returncode != 0:
        print(f"Error compiling ABI: {abi_process.stderr}")
        return
    abi = json.loads(abi_process.stdout)

    # Get Bytecode
    bytecode_process = subprocess.run([vyper_path, "-f", "bytecode", "contracts/CharityDonation.vy"], capture_output=True, text=True)
    if bytecode_process.returncode != 0:
        print(f"Error compiling Bytecode: {bytecode_process.stderr}")
        return
    bytecode = bytecode_process.stdout.strip()
    
    print("Compilation successful.")

    # Create Contract Object
    CharityDonation = w3.eth.contract(abi=abi, bytecode=bytecode)

    # Check if we have access to unlocked accounts (like in Geth --dev)
    if w3.eth.accounts:
        deployer_address = w3.eth.accounts[0]
        print(f"Using unlocked account from node: {deployer_address}")
        
        # Build Transaction (for Geth we can just send it)
        tx_hash = CharityDonation.constructor().transact({
            'from': deployer_address,
            'gas': 3000000
        })
    else:
        # Fallback to Private Key (Anvil / Ganache default)
        deployer_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        
        print(f"Using hardcoded private key for: {deployer_address}")
        
        nonce = w3.eth.get_transaction_count(deployer_address)
        tx = CharityDonation.constructor().build_transaction({
            'from': deployer_address,
            'nonce': nonce,
            'gas': 3000000,
            'gasPrice': w3.eth.gas_price
        })
        
        # Sign and Send
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
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
        # Save ABI
        json.dump({"abi": abi}, f, indent=2)
        
    print("Artifacts saved to frontend/src/contracts")

if __name__ == "__main__":
    main()
