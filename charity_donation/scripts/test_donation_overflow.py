import json
from web3 import Web3


def main():
    """
    Test that donationPoints (uint8) in CharityDonation does not silently overflow.

    We repeatedly call donatePoints(0, 1) until the transaction reverts.
    If overflow were allowed, donationPoints[0] would wrap from 255 -> 0 and
    calls would keep succeeding. With Vyper 0.3.7, we expect a revert once
    it tries to go beyond 255.
    """

    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    assert w3.is_connected(), "Cannot connect to local Hardhat node"

    acct = w3.eth.accounts[0]
    print(f"Using account: {acct}")

    with open("../frontend/src/contracts/contract-address.json") as f:
        addr_info = json.load(f)
    contract_address = addr_info["CharityDonation"]

    with open("../frontend/src/contracts/CharityDonation.json") as f:
        artifact = json.load(f)
    abi = artifact["abi"]

    contract = w3.eth.contract(address=contract_address, abi=abi)

    current = contract.functions.donationPoints(0).call()
    print(f"Current donationPoints[0]: {current}")

    for i in range(1, 300):
        print(f"[*] donatePoints call #{i} ...", end=" ", flush=True)
        tx = contract.functions.donatePoints(0, 1).build_transaction(
            {
                "from": acct,
                "nonce": w3.eth.get_transaction_count(acct),
                "gas": 200000,
                "gasPrice": w3.eth.gas_price,
            }
        )

        signed = w3.eth.account.sign_transaction(
            tx,
            private_key="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        )

        try:
            tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            if receipt["status"] == 1:
                print("OK")
            else:
                print("REVERT (status=0)")
                break
        except Exception as e:
            print("REVERT (exception):", e)
            break


if __name__ == "__main__":
    main()


