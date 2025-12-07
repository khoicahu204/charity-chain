#!/usr/bin/env python3
"""
Test script for REFUND functionality
Demonstrates the complete refund workflow when a campaign fails
"""

from ape import accounts, project, networks, chain

def main():
    print("\n" + "="*60)
    print("CHARITY CHAIN - REFUND TEST SCRIPT")
    print("="*60 + "\n")
    
    # Connect to Hardhat network
    with networks.parse_network_choice("http://127.0.0.1:8545"):
        # Use Hardhat's unlocked accounts (these have ETH)
        hardhat_accounts = [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",  # Account 0
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",  # Account 1
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",  # Account 2
        ]
        
        owner = accounts[hardhat_accounts[0]]
        donor1 = accounts[hardhat_accounts[1]]
        donor2 = accounts[hardhat_accounts[2]]
        
        print(f"👤 Owner: {owner.address}")
        print(f"👤 Donor 1: {donor1.address}")
        print(f"👤 Donor 2: {donor2.address}\n")
        
        # Deploy Token
        print("📝 Deploying CharityToken...")
        token = project.CharityToken.deploy(
            "Charity Token",
            "CHT",
            18,
            1000000 * 10**18,  # 1 million tokens
            sender=owner
        )
        print(f"✅ Token deployed at: {token.address}\n")
        
        # Deploy CharityDonation
        print("📝 Deploying CharityDonation...")
        charity = project.CharityDonation.deploy(
            token.address,
            sender=owner
        )
        print(f"✅ CharityDonation deployed at: {charity.address}\n")
        
        # Transfer tokens to donors
        print("💸 Transferring tokens to donors...")
        token.transfer(donor1.address, 1000 * 10**18, sender=owner)
        token.transfer(donor2.address, 1000 * 10**18, sender=owner)
        print(f"✅ Donor 1 balance: {token.balanceOf(donor1.address) / 10**18} CHT")
        print(f"✅ Donor 2 balance: {token.balanceOf(donor2.address) / 10**18} CHT\n")
        
        # Create campaign (target: 1000 CHT, duration: 1 day)
        print("🎯 Creating campaign...")
        target_amount = 1000 * 10**18
        charity.createCampaign(
            "Help Children",
            "Campaign for children education",
            "",  # imageHash
            "",  # documentsHash
            target_amount,
            1,  # 1 day duration
            sender=owner
        )
        campaign_id = 0
        print(f"✅ Campaign created with ID: {campaign_id}")
        print(f"   Target: {target_amount / 10**18} CHT\n")
        
        # Approve tokens for donation
        print("🔓 Approving tokens for CharityDonation contract...")
        token.approve(charity.address, 500 * 10**18, sender=donor1)
        token.approve(charity.address, 300 * 10**18, sender=donor2)
        print("✅ Tokens approved\n")
        
        # Donate (total: 800 CHT < 1000 CHT target)
        print("💰 Donating tokens...")
        charity.donate(campaign_id, 500 * 10**18, sender=donor1)
        print(f"✅ Donor 1 donated: 500 CHT")
        
        charity.donate(campaign_id, 300 * 10**18, sender=donor2)
        print(f"✅ Donor 2 donated: 300 CHT")
        
        campaign = charity.campaigns(campaign_id)
        print(f"   Total raised: {campaign.amountRaised / 10**18} CHT")
        print(f"   Goal reached: {campaign.goalReached}\n")
        
        # Fast-forward time past deadline using Hardhat
        print("⏰ Fast-forwarding time past deadline...")
        # Increase time by 2 days (86400 * 2 seconds)
        chain.provider.make_request("evm_increaseTime", [86400 * 2])
        chain.provider.make_request("evm_mine", [])
        print("✅ Time advanced by 2 days\n")
        
        # Check goal (should fail because 800 < 1000)
        print("🔍 Checking campaign goal...")
        charity.checkGoal(campaign_id, sender=owner)
        campaign = charity.campaigns(campaign_id)
        print(f"✅ Campaign closed")
        print(f"   Goal reached: {campaign.goalReached}")
        print(f"   Is closed: {campaign.isClosed}\n")
        
        # Get balances before refund
        donor1_balance_before = token.balanceOf(donor1.address)
        donor2_balance_before = token.balanceOf(donor2.address)
        
        print("💳 Balances BEFORE refund:")
        print(f"   Donor 1: {donor1_balance_before / 10**18} CHT")
        print(f"   Donor 2: {donor2_balance_before / 10**18} CHT\n")
        
        # REFUND TEST
        print("="*60)
        print("🔄 TESTING REFUND FUNCTIONALITY")
        print("="*60 + "\n")
        
        # Donor 1 refund
        print("💸 Donor 1 requesting refund...")
        contribution1 = charity.contributions(campaign_id, donor1.address)
        print(f"   Contribution: {contribution1 / 10**18} CHT")
        charity.refund(campaign_id, sender=donor1)
        print("✅ Refund successful!\n")
        
        # Donor 2 refund
        print("💸 Donor 2 requesting refund...")
        contribution2 = charity.contributions(campaign_id, donor2.address)
        print(f"   Contribution: {contribution2 / 10**18} CHT")
        charity.refund(campaign_id, sender=donor2)
        print("✅ Refund successful!\n")
        
        # Get balances after refund
        donor1_balance_after = token.balanceOf(donor1.address)
        donor2_balance_after = token.balanceOf(donor2.address)
        
        print("="*60)
        print("📊 REFUND TEST RESULTS")
        print("="*60 + "\n")
        
        print("💳 Balances AFTER refund:")
        print(f"   Donor 1: {donor1_balance_after / 10**18} CHT")
        print(f"   Donor 2: {donor2_balance_after / 10**18} CHT\n")
        
        print("📈 Refund amounts:")
        print(f"   Donor 1 refunded: {(donor1_balance_after - donor1_balance_before) / 10**18} CHT")
        print(f"   Donor 2 refunded: {(donor2_balance_after - donor2_balance_before) / 10**18} CHT\n")
        
        # Verify contributions are cleared
        final_contribution1 = charity.contributions(campaign_id, donor1.address)
        final_contribution2 = charity.contributions(campaign_id, donor2.address)
        
        print("✅ Verification:")
        print(f"   Donor 1 remaining contribution: {final_contribution1 / 10**18} CHT")
        print(f"   Donor 2 remaining contribution: {final_contribution2 / 10**18} CHT")
        
        if final_contribution1 == 0 and final_contribution2 == 0:
            print("\n🎉 REFUND TEST PASSED! All tokens returned successfully!")
        else:
            print("\n❌ REFUND TEST FAILED! Some contributions not cleared!")
        
        print("\n" + "="*60 + "\n")
