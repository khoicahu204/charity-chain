import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Plus, RefreshCw, Search, Filter } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import CharityDonationArtifact from './contracts/CharityDonation.json';
import CharityTokenArtifact from './contracts/CharityToken.json';
import contractAddress from './contracts/contract-address.json';
import { uploadImageToPinata, uploadJSONToPinata } from './utils/ipfs';

// Components
import Login from './components/Login';
import Header from './components/Header';
import CampaignCard from './components/CampaignCard';
import CreateCampaignModal from './components/CreateCampaignModal';
import DonationHistoryModal from './components/DonationHistoryModal';
import RefundSimulation from './components/RefundSimulation';

const CONTRACT_ADDRESS = contractAddress.CharityDonation;
const TOKEN_ADDRESS = contractAddress.CharityToken;
const RPC_URL = "http://127.0.0.1:8545";

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedAccount, setAuthenticatedAccount] = useState('');
  const [authenticatedSigner, setAuthenticatedSigner] = useState(null);
  const [loginError, setLoginError] = useState('');

  // Campaign State
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Token State
  const [tokenBalance, setTokenBalance] = useState('0');

  // Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // New Features State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, success, failed

  // ... (useEffect for initial load) ...

  // ... (handleConnect) ...

  // ... (handleDisconnect) ...



  // Initial Load - Fetch campaigns if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaigns();
      fetchTokenBalance();
    }
  }, [isAuthenticated]);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // MetaMask Connection Handler
  const connectWallet = async () => {
    setLoginError('');

    if (!window.ethereum) {
      setLoginError('MetaMask is not installed!');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      // Create provider
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check Network and Switch if needed
      const network = await provider.getNetwork();
      const targetChainId = 31337n; // Anvil Chain ID

      if (network.chainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7A69' }], // 31337 in hex
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x7A69',
                    chainName: 'Localhost 8545',
                    rpcUrls: ['http://127.0.0.1:8545'],
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                  },
                ],
              });
            } catch (addError) {
              throw new Error('Failed to add Localhost network.');
            }
          } else {
            throw new Error('Failed to switch network.');
          }
        }
        // Refresh provider after switch
        // Note: chainChanged event will reload page, which is handled in useEffect
      }

      const signer = await provider.getSigner();
      setAuthenticatedAccount(account);
      setAuthenticatedSigner(signer);
      setIsAuthenticated(true);
      toast.success('Wallet connected!');

    } catch (error) {
      console.error("Connection error:", error);
      setLoginError('Failed to connect wallet: ' + error.message);
      toast.error(error.message);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAuthenticatedAccount(accounts[0]);
          // Re-create signer
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider.getSigner().then(signer => {
            setAuthenticatedSigner(signer);
          });
          toast.success('Account switched');
        } else {
          handleLogout();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  // Logout Handler
  const handleLogout = async () => {
    try {
      // Revoke permissions to force MetaMask to ask for connection again next time
      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }]
        });
      }
    } catch (error) {
      console.error("Error revoking permissions:", error);
    }

    setIsAuthenticated(false);
    setAuthenticatedAccount('');
    setAuthenticatedSigner(null);
    setCampaigns([]);
    setTokenBalance('0');
    toast.success('Disconnected');
  };

  // Helper to get Contract with Authenticated Signer
  const getContractWithSigner = async () => {
    if (!authenticatedSigner) return null;

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CharityDonationArtifact.abi,
      authenticatedSigner
    );
  };

  // Helper to get Token Contract with Authenticated Signer
  const getTokenContractWithSigner = async () => {
    if (!authenticatedSigner) return null;

    return new ethers.Contract(
      TOKEN_ADDRESS,
      CharityTokenArtifact.abi,
      authenticatedSigner
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

  // Fetch Token Balance
  const fetchTokenBalance = async () => {
    if (!authenticatedSigner) return;
    try {
      const tokenContract = await getTokenContractWithSigner();
      const balance = await tokenContract.balanceOf(authenticatedAccount);
      setTokenBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  // Mint Tokens (Test Function)
  const handleMint = async () => {
    const toastId = toast.loading('Minting tokens...');
    try {
      const tokenContract = await getTokenContractWithSigner();
      const minter = await tokenContract.minter();

      if (authenticatedAccount.toLowerCase() !== minter.toLowerCase()) {
        toast.error("Only the token minter (deployer) can mint tokens.", { id: toastId });
        return;
      }

      const tx = await tokenContract.mint(authenticatedAccount, ethers.parseEther("1000"));
      await tx.wait();
      toast.success("Minted 1000 CHT successfully!", { id: toastId });
      fetchTokenBalance();
    } catch (error) {
      console.error("Error minting tokens:", error);
      toast.error("Failed to mint tokens.", { id: toastId });
    }
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
        if (camp.isDeleted) continue;
        loadedCampaigns.push({
          id: i,
          owner: camp.owner,
          name: camp.name,
          description: camp.description,
          imageHash: camp.imageHash,
          documentsHash: camp.documentsHash,
          metadataHash: camp.metadataHash,
          targetAmount: ethers.formatEther(camp.targetAmount),
          amountRaised: ethers.formatEther(camp.amountRaised),
          deadline: Number(camp.deadline) * 1000,
          isClosed: camp.isClosed,
          goalReached: camp.goalReached
        });
      }
      setCampaigns(loadedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    }
    setLoading(false);
  };

  // Create Campaign
  const handleCreateCampaign = async (newCampaign, selectedImage, selectedDocument) => {
    // Validate inputs
    const totalHours = Number(newCampaign.duration) * 24 + Number(newCampaign.durationHours || 0);
    if (Number(newCampaign.target) <= 0 || totalHours <= 0) {
      toast.error("Target and Duration must be positive numbers!");
      return;
    }

    // Check for duplicate campaign name
    const isDuplicateName = campaigns.some(
      camp => camp.name.toLowerCase() === newCampaign.name.trim().toLowerCase()
    );

    if (isDuplicateName) {
      toast.error("A campaign with this name already exists. Please choose a different name.");
      return;
    }

    const toastId = toast.loading('Creating campaign...');

    try {
      const pinataJWT = import.meta.env.VITE_PINATA_JWT;
      if (!pinataJWT) {
        toast.error("Pinata JWT not configured.", { id: toastId });
        return;
      }

      const timestamp = new Date().getTime();
      const customName = `${timestamp}_${newCampaign.name.replace(/\s+/g, '_')}`;

      // Step 1: Upload image
      setUploadingImage(true);
      let imageHash = "";
      if (selectedImage) {
        toast.loading('Uploading image...', { id: toastId });
        imageHash = await uploadImageToPinata(selectedImage, pinataJWT, customName);
      }
      setUploadingImage(false);

      // Step 2: Upload document
      setUploadingDocument(true);
      let documentsHash = "";
      if (selectedDocument) {
        toast.loading('Uploading document...', { id: toastId });
        documentsHash = await uploadImageToPinata(selectedDocument, pinataJWT, customName);
      }
      setUploadingDocument(false);

      // Step 3: Create and upload metadata JSON
      toast.loading('Creating metadata...', { id: toastId });

      // Calculate total duration in hours
      const totalHours = Number(newCampaign.duration) * 24 + Number(newCampaign.durationHours || 0);

      const metadata = {
        version: "1.0",
        name: newCampaign.name,
        description: newCampaign.description,
        category: newCampaign.category || "General",
        createdAt: new Date().toISOString(),
        creator: {
          address: authenticatedAccount
        },
        media: {
          imageHash: imageHash,
          documentsHash: documentsHash
        },
        targetAmount: newCampaign.target,
        duration: {
          days: Number(newCampaign.duration),
          hours: Number(newCampaign.durationHours || 0),
          totalHours: totalHours
        }
      };

      const metadataHash = await uploadJSONToPinata(metadata, pinataJWT, customName);
      console.log("Metadata uploaded to IPFS:", metadataHash);

      // Step 4: Create campaign on blockchain
      toast.loading('Confirming transaction...', { id: toastId });
      const contract = await getContractWithSigner();
      const targetWei = ethers.parseEther(newCampaign.target);

      const tx = await contract.createCampaign(
        newCampaign.name,
        newCampaign.description,
        imageHash,
        documentsHash,
        metadataHash,
        targetWei,
        totalHours  // Send hours directly to contract
      );
      await tx.wait();

      toast.success("Campaign created successfully!", { id: toastId });
      setShowCreateModal(false);
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);

      // Check for MetaMask Nonce Mismatch / Internal JSON-RPC error
      if (error.message?.includes("Internal JSON-RPC error") || error.code === -32603) {
        toast.error(
          <div>
            Transaction failed due to chain reset.
            <br />
            <b>Please reset your MetaMask account:</b>
            <br />
            Settings &gt; Advanced &gt; Clear Activity Tab Data
          </div>,
          { id: toastId, duration: 8000 }
        );
      } else {
        toast.error("Failed to create campaign.", { id: toastId });
      }

      setUploadingImage(false);
      setUploadingDocument(false);
    }
  };

  // Donate
  const handleDonate = async (id, amount) => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid positive amount!");
      return;
    }

    const toastId = toast.loading('Processing donation...');

    try {
      const contract = await getContractWithSigner();
      const tokenContract = await getTokenContractWithSigner();
      const amountWei = ethers.parseEther(amount);

      // 1. Check Allowance
      const allowance = await tokenContract.allowance(authenticatedAccount, CONTRACT_ADDRESS);

      if (allowance < amountWei) {
        toast.loading('Please approve token transfer...', { id: toastId });
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountWei);
        await approveTx.wait();
        toast.success('Approval successful!', { id: toastId });
      }

      // 3. Donate
      toast.loading('Confirming donation...', { id: toastId });
      const tx = await contract.donate(id, amountWei);
      await tx.wait();

      toast.success("Donation successful!", { id: toastId });
      fetchCampaigns();
      fetchTokenBalance();
    } catch (error) {
      console.error("Error donating:", error);
      toast.error("Not enough money in wallet to donate.", { id: toastId });
    }
  };

  // Check Goal
  const handleCheckGoal = async (id) => {
    const toastId = toast.loading('Checking goal...');
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.checkGoal(id);
      await tx.wait();

      toast.success("Goal checked!", { id: toastId });
      fetchCampaigns();
    } catch (error) {
      console.error("Error checking goal:", error);
      toast.error("Not enough money in target to check goal.", { id: toastId });
    }
  };

  // Withdraw
  const handleWithdraw = async (id) => {
    const toastId = toast.loading('Withdrawing funds...');
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.withdraw(id);
      await tx.wait();

      toast.success("Funds withdrawn!", { id: toastId });
      fetchCampaigns();
      fetchTokenBalance();
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast.error("Failed to withdraw.", { id: toastId });
    }
  };

  // Refund
  const handleRefund = async (id) => {
    const toastId = toast.loading('Processing refund...');
    try {
      const contract = await getContractWithSigner();

      // Check contribution amount first
      const contribution = await contract.contributions(id, authenticatedAccount);
      if (contribution === 0n) {
        toast.error("You have not donated to this campaign or already refunded.", { id: toastId });
        return;
      }

      // Check if campaign needs to be closed first
      const camp = campaigns.find(c => c.id === id);
      if (camp && !camp.isClosed) {
        toast.loading('Finalizing campaign first...', { id: toastId });
        const closeTx = await contract.checkGoal(id);
        await closeTx.wait();
        toast.loading('Campaign finalized. Processing refund...', { id: toastId });
      }

      const tx = await contract.refund(id);
      await tx.wait();

      toast.success("Refunded successfully!", { id: toastId });
      fetchCampaigns();
      fetchTokenBalance();
    } catch (error) {
      console.error("Error refunding:", error);
      // Improved error parsing
      if (error.message.includes("No contribution")) {
        toast.error("You have no funds to refund.", { id: toastId });
      } else if (error.message.includes("Campaign is not closed")) {
        toast.error("Campaign is not closed yet.", { id: toastId });
      } else {
        toast.error("Failed to refund. check console for details", { id: toastId });
      }
    }
  };

  // Delete Campaign
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;

    const toastId = toast.loading('Deleting campaign...');
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.deleteCampaign(id);
      await tx.wait();

      toast.success("Campaign deleted successfully!", { id: toastId });
      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error(`Failed to delete: ${error.message || error}`, { id: toastId });
    }
  };

  // Filter Logic
  const filteredCampaigns = campaigns.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ? true :
        filterStatus === 'active' ? !camp.isClosed :
          filterStatus === 'success' ? camp.isClosed && camp.goalReached :
            filterStatus === 'failed' ? camp.isClosed && !camp.goalReached : true;

    return matchesSearch && matchesStatus;
  });

  // Check if current user is Owner (Account 0)
  const isOwner = authenticatedAccount.toLowerCase() === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Toaster position="top-right" />

      {!isAuthenticated ? (
        <Login
          onConnect={connectWallet}
          loginError={loginError}
          toggleDarkMode={toggleDarkMode}
          isDarkMode={darkMode}
        />
      ) : (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans transition-colors duration-200">
          <Header
            account={authenticatedAccount}
            tokenBalance={tokenBalance}
            isOwner={isOwner}
            onLogout={handleLogout}
            onMint={handleMint}
            onOpenHistory={() => setShowHistoryModal(true)}
            onOpenSimulation={() => setShowSimulationModal(true)}
            toggleDarkMode={toggleDarkMode}
            isDarkMode={darkMode}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Active Campaigns</h2>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    className="pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {isOwner && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" /> Start Campaign
                  </button>
                )}
              </div>
            </div>

            {loading && campaigns.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                <p className="mt-2 text-slate-500 dark:text-slate-400">Loading campaigns...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">No campaigns found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((camp) => (
                  <CampaignCard
                    key={camp.id}
                    camp={camp}
                    isOwner={isOwner}
                    userAccount={authenticatedAccount}
                    onDonate={handleDonate}
                    onCheckGoal={handleCheckGoal}
                    onWithdraw={handleWithdraw}
                    onRefund={handleRefund}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </main>

          {showCreateModal && (
            <CreateCampaignModal
              onClose={() => setShowCreateModal(false)}
              onCreate={handleCreateCampaign}
              uploadingImage={uploadingImage}
              uploadingDocument={uploadingDocument}
            />
          )}

          <DonationHistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            contract={authenticatedSigner ? new ethers.Contract(CONTRACT_ADDRESS, CharityDonationArtifact.abi, authenticatedSigner) : null}
            userAccount={authenticatedAccount}
            campaigns={campaigns}
          />

          <RefundSimulation
            isOpen={showSimulationModal}
            onClose={() => setShowSimulationModal(false)}
            signer={authenticatedSigner}
            userAccount={authenticatedAccount}
            refreshAppBalance={fetchTokenBalance}
          />
        </div>
      )}
    </div>
  );
}

export default App;
