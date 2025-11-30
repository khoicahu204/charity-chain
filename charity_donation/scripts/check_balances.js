const { ethers } = require("ethers");

async function checkBalances() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Contract address (from latest deployment)
    const contractAddress = "0xdbC43Ba45381e02825b14322cDdd15eC4B3164E6";

    // Account addresses
    const owner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const donater1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const donater2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

    console.log("\n=== Contract Balance ===");
    const contractBalance = await provider.getBalance(contractAddress);
    console.log(`Contract: ${ethers.formatEther(contractBalance)} ETH`);

    console.log("\n=== Account Balances ===");
    const ownerBalance = await provider.getBalance(owner);
    console.log(`Owner (Account #0): ${ethers.formatEther(ownerBalance)} ETH`);

    const donater1Balance = await provider.getBalance(donater1);
    console.log(`Donater 1 (Account #1): ${ethers.formatEther(donater1Balance)} ETH`);

    const donater2Balance = await provider.getBalance(donater2);
    console.log(`Donater 2 (Account #2): ${ethers.formatEther(donater2Balance)} ETH`);

    console.log("\n=== Summary ===");
    console.log(`Total in contract: ${ethers.formatEther(contractBalance)} ETH`);
    console.log(`This should match the sum of all donations made to active campaigns.`);
}

checkBalances()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
