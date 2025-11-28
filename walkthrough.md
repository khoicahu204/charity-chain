# Charity Donation DApp - Run Guide

This guide details how to run the full stack (Blockchain + Frontend) for the Charity Donation project.

## Prerequisites
*   **Python 3.10+** (for Ape Framework)
*   **Node.js 18+** (for React Frontend)
*   **Local Blockchain Node** (Geth or Anvil)

## Step 1: Start Local Blockchain
We use `geth` (via Ape) or `anvil` (Foundry) to run a local Ethereum network.
Since we configured Ape to use `http://127.0.0.1:8545`, you can run any local node on that port.

**Option A: Using Geth (if installed)**
```bash
geth --dev --http --http.api eth,web3,net --http.corsdomain "*" --ipcpath /tmp/geth.ipc
```

**Option B: Using Anvil (Recommended for Dev)**
If you have `foundry` installed, `anvil` is faster.
```bash
anvil
```
*Note: The current setup assumes a node running at `http://127.0.0.1:8545`.*

## Step 2: Deploy Smart Contract
Open a new terminal in the project root:

```bash
cd charity_donation
ape run scripts/deploy.py --network http://127.0.0.1:8545
```

**Success Output:**
```
Contract deployed at: 0x...
Artifacts saved to frontend/src/contracts
```
This step generates `contract-address.json` and `CharityDonation.json` which the frontend needs to talk to the blockchain.

## Step 3: Start Frontend
Open another terminal:

```bash
cd frontend
npm install  # Only first time
npm run dev
```

The app will start at `http://localhost:5173`.

## Step 4: Usage Flow (Local Wallet)
The application is configured to use a **Local Wallet** system for development, so you **do not** need Metamask.

1.  **Open App:** Go to `http://localhost:5173`.
2.  **Auto-Login:** You are automatically logged in as the **Owner** (Account 0).
3.  **Create Campaign:**
    *   Click "Start Campaign".
    *   Fill in details (e.g., Target: 10 ETH, Duration: 30 days).
    *   Click "Create". The transaction happens instantly.
4.  **Donate:**
    *   Switch to **Donor** using the button in the top-right corner.
    *   Enter amount (e.g., 5 ETH) on the campaign card.
    *   Click "Donate".
5.  **Check Goal / Withdraw:**
    *   If target reached, switch back to **Owner**.
    *   Click "Check Goal" (updates status).
    *   Click "Withdraw" (claims funds).

## Troubleshooting
*   **"Contract not found":**
    *   Ensure you ran `ape run scripts/deploy.py` *after* starting the blockchain.
    *   Ensure the frontend is reading the latest address (refresh page).
*   **Balance is 0:**
    *   Ensure your local node (Anvil/Geth) is actually running.
    *   The hardcoded keys in `App.jsx` correspond to the default accounts of Anvil. If you use Geth, you might need to fund them or update the keys.
