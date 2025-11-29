import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Plus, Heart, DollarSign, CheckCircle, XCircle, RefreshCw, User, LogOut } from 'lucide-react';
import CharityDonationArtifact from './contracts/CharityDonation.json';
import contractAddress from './contracts/contract-address.json';

const CONTRACT_ADDRESS = contractAddress.CharityDonation;
const RPC_URL = "http://127.0.0.1:8545";

function App() {
  // State
  const [accounts, setAccounts] = useState([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    target: '',
    duration: ''
  });

  const [donationAmount, setDonationAmount] = useState({});

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const accs = await provider.listAccounts();
        setAccounts(accs);
        if (accs.length > 0) {
          setCurrentAccountIndex(0);
        }
        fetchCampaigns();
      } catch (error) {
        console.error("Failed to connect to blockchain:", error);
        alert("Failed to connect to blockchain. Make sure Geth/Anvil is running.");
      }
    };
    init();
  }, []);

  // Helper to get Contract with Signer
  const getContractWithSigner = async () => {
    if (accounts.length === 0) return null;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    // Use the currently selected account index
    const signer = await provider.getSigner(currentAccountIndex);

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CharityDonationArtifact.abi,
      signer
    );
  };

  // Helper to get Read-Only Contract
  const getReadOnlyContract = async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CharityDonationArtifact.abi,
      provider
    );
  };

  // Login / Switch Account
  const handleLogin = (index) => {
    setCurrentAccountIndex(index);
  };

  // Fetch Campaigns
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const contract = await getReadOnlyContract();
      const count = await contract.campaignCount();
      const loadedCampaigns = [];
      for (let i = 0; i < count; i++) {
        const camp = await contract.campaigns(i);
        loadedCampaigns.push({
          id: i,
          owner: camp.owner,
          name: camp.name,
          description: camp.description,
          targetAmount: ethers.formatEther(camp.targetAmount),
          amountRaised: ethers.formatEther(camp.amountRaised),
          deadline: Number(camp.deadline) * 1000, // Convert to ms
          isClosed: camp.isClosed,
          goalReached: camp.goalReached
        });
      }
      setCampaigns(loadedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
    setLoading(false);
  };

  // Create Campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const contract = await getContractWithSigner();
      const targetWei = ethers.parseEther(newCampaign.target);

      const tx = await contract.createCampaign(
        newCampaign.name,
        newCampaign.description,
        targetWei,
        newCampaign.duration
      );
      await tx.wait();

      alert("Campaign created successfully!");
      setShowCreateModal(false);
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign. Check console.");
    }
  };

  // Donate
  const handleDonate = async (id) => {
    if (!donationAmount[id]) return;
    try {
      const contract = await getContractWithSigner();
      const amountWei = ethers.parseEther(donationAmount[id]);

      const tx = await contract.donate(id, { value: amountWei });
      await tx.wait();

      alert("Donation successful!");
      fetchCampaigns();
      setDonationAmount({ ...donationAmount, [id]: '' });
    } catch (error) {
      console.error("Error donating:", error);
      alert("Failed to donate. Check console.");
    }
  };

  // Check Goal
  const handleCheckGoal = async (id) => {
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.checkGoal(id);
      await tx.wait();

      alert("Goal checked!");
      fetchCampaigns();
    } catch (error) {
      console.error("Error checking goal:", error);
      alert("Failed to check goal (maybe deadline not passed yet?).");
    }
  };

  // Withdraw
  const handleWithdraw = async (id) => {
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.withdraw(id);
      await tx.wait();

      alert("Funds withdrawn!");
      fetchCampaigns();
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("Failed to withdraw.");
    }
  };

  // Refund
  const handleRefund = async (id) => {
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.refund(id);
      await tx.wait();

      alert("Refunded successfully!");
      fetchCampaigns();
    } catch (error) {
      console.error("Error refunding:", error);
      alert("Failed to refund.");
    }
  };

  // Get current active address based on currentAccountIndex
  const activeAddress = accounts.length > 0 && accounts[currentAccountIndex]
    ? (typeof accounts[currentAccountIndex] === 'string' ? accounts[currentAccountIndex] : accounts[currentAccountIndex].address)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="text-rose-500 w-8 h-8" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              CharityChain (Local Dev)
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Account Switcher */}
            {accounts.length > 0 && (
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                {accounts.length === 1 ? (
                  // If only 1 account, show Owner and Donor (both use same account)
                  <>
                    <button
                      onClick={() => handleLogin(0)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentAccountIndex === 0
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Owner
                    </button>
                    <button
                      onClick={() => handleLogin(0)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all text-slate-500 hover:text-slate-700`}
                    >
                      Donor
                    </button>
                  </>
                ) : (
                  // If multiple accounts, Owner = account 0, Donor = account 1, rest are User X
                  <>
                    <button
                      onClick={() => handleLogin(0)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentAccountIndex === 0
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Owner
                    </button>
                    <button
                      onClick={() => handleLogin(1)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentAccountIndex === 1
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Donor
                    </button>
                    {accounts.slice(2).map((acc, idx) => (
                      <button
                        key={typeof acc === 'string' ? acc : acc.address}
                        onClick={() => handleLogin(idx + 2)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentAccountIndex === idx + 2
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        User {idx + 2}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeAddress && (
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Active Campaigns</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Start Campaign
          </button>
        </div>

        {/* Campaign Grid */}
        {loading && campaigns.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
            <p className="mt-2 text-slate-500">Loading campaigns...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((camp) => (
              <div key={camp.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{camp.name}</h3>
                    {camp.isClosed ? (
                      camp.goalReached ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Success
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )
                    ) : (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2 h-10">{camp.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-900">{camp.amountRaised} ETH</span>
                      <span className="text-slate-500">of {camp.targetAmount} ETH</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((Number(camp.amountRaised) / Number(camp.targetAmount)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mb-6">
                    Deadline: {new Date(camp.deadline).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {!camp.isClosed && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Amount (ETH)"
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          value={donationAmount[camp.id] || ''}
                          onChange={(e) => setDonationAmount({ ...donationAmount, [camp.id]: e.target.value })}
                        />
                        <button
                          onClick={() => handleDonate(camp.id)}
                          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
                        >
                          Donate
                        </button>
                      </div>
                    )}

                    {/* Owner/Admin Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      {!camp.isClosed && (
                        <button
                          onClick={() => handleCheckGoal(camp.id)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Check Goal
                        </button>
                      )}

                      {camp.isClosed && camp.goalReached && camp.owner.toLowerCase() === activeAddress?.toLowerCase() && (
                        <button
                          onClick={() => handleWithdraw(camp.id)}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" /> Withdraw
                        </button>
                      )}

                      {camp.isClosed && !camp.goalReached && (
                        <button
                          onClick={() => handleRefund(camp.id)}
                          className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md transition-colors"
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Start a Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    value={newCampaign.target}
                    onChange={(e) => setNewCampaign({ ...newCampaign, target: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    value={newCampaign.duration}
                    onChange={(e) => setNewCampaign({ ...newCampaign, duration: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 text-white py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors mt-2"
              >
                Create Campaign
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
