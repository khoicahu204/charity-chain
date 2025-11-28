from ape import accounts, networks

def main():
    # Try to connect to the local node
    # with networks.parse_network_choice("ethereum:local:geth") as provider:
    # But since geth plugin failed, let's try generic http
    
    # Actually, let's just print accounts and their balances in the current context
    if len(accounts) > 0:
        for acc in accounts:
            print(f"Account: {acc.address}, Balance: {acc.balance}")
    else:
        print("No accounts found.")
        # Try test accounts
        for acc in accounts.test_accounts:
            print(f"Test Account: {acc.address}, Balance: {acc.balance}")
