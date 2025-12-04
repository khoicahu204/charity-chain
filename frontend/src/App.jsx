import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Plus, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import CharityDonationArtifact from './contracts/CharityDonation.json';
import CharityTokenArtifact from './contracts/CharityToken.json';
import contractAddress from './contracts/contract-address.json';
import { uploadImageToPinata } from './utils/ipfs';

// Components
import Login from './components/Login';
import Header from './components/Header';
import CampaignCard from './components/CampaignCard';
import CreateCampaignModal from './components/CreateCampaignModal';

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

  // Initial Load - Fetch campaigns if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaigns();
      fetchTokenBalance();
    }
  }, [isAuthenticated]);

  // Login Handler
  const handleLogin = async (account, privateKey) => {
    setLoginError('');

    try {
      // Validate inputs
      if (!account || !privateKey) {
        setLoginError('Please enter both account address and private key');
        return;
      }

      // Validate account address format
      if (!ethers.isAddress(account)) {
        setLoginError('Invalid account address format');
        return;
      }

      // Create wallet from private key
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Verify that the private key matches the account address
      if (wallet.address.toLowerCase() !== account.toLowerCase()) {
        setLoginError('Private key does not match the account address');
        return;
      }

      // Authentication successful
      setAuthenticatedAccount(wallet.address);
      setAuthenticatedSigner(wallet);
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');

    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid private key or account address');
      toast.error('Login failed');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthenticatedAccount('');
    setAuthenticatedSigner(null);
    setCampaigns([]);
    setTokenBalance('0');
    toast.success('Logged out');
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
    if (Number(newCampaign.target) <= 0 || Number(newCampaign.duration) <= 0) {
      toast.error("Target and Duration must be positive numbers!");
      return;
    }

    const toastId = toast.loading('Creating campaign...');

    try {
      const pinataJWT = import.meta.env.VITE_PINATA_JWT;
      if (!pinataJWT) {
        toast.error("Pinata JWT not configured.", { id: toastId });
        return;
      }

      setUploadingImage(true);
      let imageHash = "";
      if (selectedImage) {
        toast.loading('Uploading image...', { id: toastId });
        imageHash = await uploadImageToPinata(selectedImage, pinataJWT);
      }
      setUploadingImage(false);

      setUploadingDocument(true);
      let documentsHash = "";
      if (selectedDocument) {
        toast.loading('Uploading document...', { id: toastId });
        documentsHash = await uploadImageToPinata(selectedDocument, pinataJWT);
      }
      setUploadingDocument(false);

      toast.loading('Confirming transaction...', { id: toastId });
      const contract = await getContractWithSigner();
      const targetWei = ethers.parseEther(newCampaign.target);
      const tx = await contract.createCampaign(
        newCampaign.name,
        newCampaign.description,
        imageHash,
        documentsHash,
        targetWei,
        newCampaign.duration
      );
      await tx.wait();
      
      toast.success("Campaign created successfully!", { id: toastId });
      setShowCreateModal(false);
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign.", { id: toastId });
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
      toast.error("Failed to donate.", { id: toastId });
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
      toast.error("Failed to check goal.", { id: toastId });
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
      const tx = await contract.refund(id);
      await tx.wait();

      toast.success("Refunded successfully!", { id: toastId });
      fetchCampaigns();
      fetchTokenBalance();
    } catch (error) {
      console.error("Error refunding:", error);
      toast.error("Failed to refund.", { id: toastId });
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

  // Check if current user is Owner (Account 0)
  const isOwner = authenticatedAccount.toLowerCase() === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();

  return (
    <>
      <Toaster position="top-right" />
      
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} loginError={loginError} />
      ) : (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Header 
            account={authenticatedAccount} 
            tokenBalance={tokenBalance} 
            isOwner={isOwner} 
            onLogout={handleLogout}
            onMint={handleMint}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Active Campaigns</h2>

              {isOwner && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Start Campaign
                </button>
              )}
            </div>

            {loading && campaigns.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                <p className="mt-2 text-slate-500">Loading campaigns...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((camp) => (
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
        </div>
      )}
    </>
  );
}

export default App;
