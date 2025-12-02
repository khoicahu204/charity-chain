import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Plus, Heart, DollarSign, CheckCircle, XCircle, RefreshCw, User, LogOut, Lock, Upload, Image as ImageIcon, FileText } from 'lucide-react';
import CharityDonationArtifact from './contracts/CharityDonation.json';
import contractAddress from './contracts/contract-address.json';
import { uploadImageToPinata, getIPFSUrl, validateImageFile, validateDocumentFile, getFileIcon } from './utils/ipfs';

const CONTRACT_ADDRESS = contractAddress.CharityDonation;
const RPC_URL = "http://127.0.0.1:8545";

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedAccount, setAuthenticatedAccount] = useState('');
  const [authenticatedSigner, setAuthenticatedSigner] = useState(null);

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    account: '',
    privateKey: ''
  });
  const [loginError, setLoginError] = useState('');

  // Campaign State
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    imageHash: '',
    documentsHash: '',
    target: '0.01',
    duration: '1'
  });

  const [donationAmount, setDonationAmount] = useState({});
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Document Upload State
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Initial Load - Fetch campaigns if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaigns();
    }
  }, [isAuthenticated]);

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      // Validate inputs
      if (!loginForm.account || !loginForm.privateKey) {
        setLoginError('Please enter both account address and private key');
        return;
      }

      // Validate account address format
      if (!ethers.isAddress(loginForm.account)) {
        setLoginError('Invalid account address format');
        return;
      }

      // Create wallet from private key
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(loginForm.privateKey, provider);

      // Verify that the private key matches the account address
      if (wallet.address.toLowerCase() !== loginForm.account.toLowerCase()) {
        setLoginError('Private key does not match the account address');
        return;
      }

      // Authentication successful
      setAuthenticatedAccount(wallet.address);
      setAuthenticatedSigner(wallet);
      setIsAuthenticated(true);
      setLoginForm({ account: '', privateKey: '' });

    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid private key or account address');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthenticatedAccount('');
    setAuthenticatedSigner(null);
    setCampaigns([]);
    setDonationAmount({});
  };
  // Handle Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle Document Selection
  const handleDocumentSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setSelectedDocument(file);
  };
  // Remove selected document
  const handleRemoveDocument = () => {
    setSelectedDocument(null);
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

  // Helper to get Read-Only Contract
  const getReadOnlyContract = async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CharityDonationArtifact.abi,
      provider
    );
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
          imageHash: camp.imageHash, // NEW: IPFS hash
          documentsHash: camp.documentsHash, // NEW: IPFS hash
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
    }
    setLoading(false);
  };

  // Create Campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (Number(newCampaign.target) <= 0 || Number(newCampaign.duration) <= 0) {
      alert("Target and Duration must be positive numbers!");
      return;
    }
    try {
      // Get Pinata JWT token once
      const pinataJWT = import.meta.env.VITE_PINATA_JWT;
      if (!pinataJWT) {
        alert("Pinata JWT not configured. Please check .env file.");
        return;
      }

      setUploadingImage(true);

      // Upload image to IPFS if selected
      let imageHash = "";
      if (selectedImage) {
        imageHash = await uploadImageToPinata(selectedImage, pinataJWT);
        console.log("Image uploaded to IPFS:", imageHash);
      }

      setUploadingImage(false);

      // Upload document to IPFS if selected
      let documentsHash = "";
      if (selectedDocument) {
        setUploadingDocument(true);
        documentsHash = await uploadImageToPinata(selectedDocument, pinataJWT);
        console.log("Document uploaded to IPFS:", documentsHash);
        setUploadingDocument(false);
      }

      // Create campaign with image hash and documents hash
      const contract = await getContractWithSigner();
      const targetWei = ethers.parseEther(newCampaign.target);
      const tx = await contract.createCampaign(
        newCampaign.name,
        newCampaign.description,
        imageHash,        // IPFS hash for image
        documentsHash,    // IPFS hash for documents
        targetWei,
        newCampaign.duration
      );
      await tx.wait();
      // alert("Campaign created successfully!");
      setShowCreateModal(false);
      setNewCampaign({ name: '', description: '', target: '0.01', duration: '1' });
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedDocument(null);
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign. Check console.");
      setUploadingImage(false);
      setUploadingDocument(false);
    }
  };

  // Donate
  const handleDonate = async (id) => {
    if (!donationAmount[id] || Number(donationAmount[id]) <= 0) {
      alert("Please enter a valid positive amount!");
      return;
    }
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

  // Delete Campaign
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.deleteCampaign(id);
      await tx.wait();

      // alert("Campaign deleted successfully!");
      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert(`Failed to delete campaign. Error: ${error.message || error}`);
    }
  };

  // Check if current user is Owner (Account 0)
  const isOwner = authenticatedAccount.toLowerCase() === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();

  // Login Page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-4">
              <Heart className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent mb-2">
              CharityChain
            </h1>
            <p className="text-slate-600">Login to manage campaigns</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Account Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={loginForm.account}
                onChange={(e) => setLoginForm({ ...loginForm, account: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Private Key
              </label>
              <input
                type="password"
                placeholder="0x..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={loginForm.privateKey}
                onChange={(e) => setLoginForm({ ...loginForm, privateKey: e.target.value })}
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-rose-600 hover:to-purple-700 transition-all shadow-lg"
            >
              Login
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 font-medium mb-2">Test Accounts (Hardhat):</p>
            <div className="space-y-1 text-xs text-slate-500 font-mono">
              <p>Owner: 0xf39F...2266</p>
              <p>Donater 1: 0x7099...79C8</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Campaign Interface (after login)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="text-rose-500 w-8 h-8" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              CharityChain
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {authenticatedAccount.slice(0, 6)}...{authenticatedAccount.slice(-4)}
              {isOwner && <span className="ml-2 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Owner</span>}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Active Campaigns</h2>

          {/* Only Owner can create campaigns */}
          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Start Campaign
            </button>
          )}
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
                  {/* Campaign Image */}
                  {camp.imageHash && (
                    <img
                      src={getIPFSUrl(camp.imageHash)}
                      alt={camp.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
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
                  {/* Campaign Documents */}
                  {camp.documentsHash && (
                    <a
                      href={getIPFSUrl(camp.documentsHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm mb-4 w-fit"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Campaign Documents</span>
                    </a>
                  )}

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
                          step="0.01"
                          min="0.01"
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

                    {/* Owner/Admin Actions - Only visible to Owner */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      {isOwner && !camp.isClosed && (
                        <button
                          onClick={() => handleCheckGoal(camp.id)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Check Goal
                        </button>
                      )}

                      {isOwner && camp.isClosed && camp.goalReached && camp.owner.toLowerCase() === authenticatedAccount?.toLowerCase() && (
                        <button
                          onClick={() => handleWithdraw(camp.id)}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" /> Withdraw
                        </button>
                      )}

                      {/* Refund is available for everyone (Donors need it) */}
                      {camp.isClosed && !camp.goalReached && (
                        <button
                          onClick={() => handleRefund(camp.id)}
                          className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md transition-colors"
                        >
                          Refund
                        </button>
                      )}

                      {/* Delete Button (Owner only, if no funds raised) */}
                      {isOwner && Number(camp.amountRaised) === 0 && (
                        <button
                          onClick={() => handleDelete(camp.id)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" /> Delete
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
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Campaign Image (Optional)
                </label>

                {!imagePreview ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-rose-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('imageInput').click()}>
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">Click to upload image</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                    <input
                      id="imageInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Campaign Documents (Optional)
                </label>

                {!selectedDocument ? (
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('documentInput').click()}
                  >
                    <FileText className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">Upload PDF or DOC</p>
                    <p className="text-xs text-slate-400 mt-1">Up to 10MB</p>
                    <input
                      id="documentInput"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleDocumentSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-slate-700">{selectedDocument.name}</span>
                      <span className="text-xs text-slate-400">
                        ({(selectedDocument.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDocument}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
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
                    min="1"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    value={newCampaign.duration}
                    onChange={(e) => setNewCampaign({ ...newCampaign, duration: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingImage || uploadingDocument}
                className="w-full bg-rose-500 text-white py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? 'Uploading Image...' :
                  uploadingDocument ? 'Uploading Document...' :
                    'Create Campaign'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
