from ape import networks

def main():
    with networks.parse_network_choice("hardhat:hardhat:hardhat"):
        # Contract address (from latest deployment)
        contract_address = "0xdbC43Ba45381e02825b14322cDdd15eC4B3164E6"
        
        # Account addresses
        owner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        donater1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        donater2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        
        from ape import networks
        provider = networks.provider
        
        print("\n=== Contract Balance ===")
        contract_balance = provider.get_balance(contract_address)
        print(f"Contract: {contract_balance / 10**18:.4f} ETH")
        
        print("\n=== Account Balances ===")
        owner_balance = provider.get_balance(owner)
        print(f"Owner (Account #0): {owner_balance / 10**18:.4f} ETH")
        
        donater1_balance = provider.get_balance(donater1)
        print(f"Donater 1 (Account #1): {donater1_balance / 10**18:.4f} ETH")
        
        donater2_balance = provider.get_balance(donater2)
        print(f"Donater 2 (Account #2): {donater2_balance / 10**18:.4f} ETH")
        
        print("\n=== Summary ===")
        print(f"Total in contract: {contract_balance / 10**18:.4f} ETH")
        print("This should match the sum of all donations made to active campaigns.")

if __name__ == "__main__":
    main()
