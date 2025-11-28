from ape import accounts, project
from web3 import Web3

def main():
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    anvil_account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    balance = w3.eth.get_balance(anvil_account)
    print(f"Anvil Account: {anvil_account}, Balance: {balance}")
    
    # Also check the account Ape was trying to use
    ape_account = "0x1CAC56fE2FBeA7fef57f0d53218338Db96778Fe7" # From previous log
    balance_ape = w3.eth.get_balance(ape_account)
    print(f"Ape Account: {ape_account}, Balance: {balance_ape}")
