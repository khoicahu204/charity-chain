import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { X, ArrowRight, CheckCircle, AlertCircle, Clock, DollarSign, RotateCcw, Play, FastForward, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CharityDonationArtifact from '../contracts/CharityDonation.json';
import CharityTokenArtifact from '../contracts/CharityToken.json';
import contractAddress from '../contracts/contract-address.json';

const CONTRACT_ADDRESS = contractAddress.CharityDonation;
const TOKEN_ADDRESS = contractAddress.CharityToken;

const RefundSimulation = ({ 
  isOpen, 
  onClose, 
  signer, 
  userAccount,
  refreshAppBalance
}) => {
  const [step, setStep] = useState(0); // 0: Setup, 1: Campaign Created, 2: Donated, 3: Failed, 4: Refunded
  const [loading, setLoading] = useState(false);
  
  // Simulation Data
  const [campaignId, setCampaignId] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [donationAmount, setDonationAmount] = useState('10');
  const [targetAmount, setTargetAmount] = useState('100');
  
  // Balances Tracking
  const [initialBalance, setInitialBalance] = useState('0');
  const [afterDonationBalance, setAfterDonationBalance] = useState('0');
  const [afterRefundBalance, setAfterRefundBalance] = useState('0');
  
  // Contracts
  const [donationContract, setDonationContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  useEffect(() => {
    if (signer && userAccount) {
      try {
        const dc = new ethers.Contract(CONTRACT_ADDRESS, CharityDonationArtifact.abi, signer);
        const tc = new ethers.Contract(TOKEN_ADDRESS, CharityTokenArtifact.abi, signer);
        setDonationContract(dc);
        setTokenContract(tc);
        
        // Fetch initial balance
        tc.balanceOf(userAccount).then(bal => {
          setInitialBalance(ethers.formatEther(bal));
        }).catch(err => console.error("Error fetching balance:", err));
      } catch (error) {
        console.error("Error initializing contracts:", error);
        toast.error("Failed to initialize simulation. Check console.");
      }
    }
  }, [signer, userAccount]);

  const snapshotIdRef = React.useRef(null);

  const takeSnapshot = async () => {
    try {
      const rpcUrl = "http://127.0.0.1:8545";
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "evm_snapshot",
          params: [],
          id: new Date().getTime()
        })
      });
      const data = await response.json();
      snapshotIdRef.current = data.result;
      console.log("Snapshot taken:", data.result);
    } catch (e) {
      console.error("Failed to take snapshot", e);
    }
  };

  const revertSnapshot = async () => {
    if (!snapshotIdRef.current) return;
    try {
      const rpcUrl = "http://127.0.0.1:8545";
      await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "evm_revert",
          params: [snapshotIdRef.current],
          id: new Date().getTime()
        })
      });
      console.log("Reverted to snapshot:", snapshotIdRef.current);
      snapshotIdRef.current = null;
    } catch (e) {
      console.error("Failed to revert snapshot", e);
    }
  };

  // Handle Open/Close Snapshot Logic
  useEffect(() => {
    if (isOpen) {
      takeSnapshot();
    } else {
      revertSnapshot();
      // Reset internal state when closing
      setStep(0);
      setCampaignId(null);
      setCampaignData(null);
      setAfterDonationBalance('0');
      setAfterRefundBalance('0');
    }
  }, [isOpen]);

  const resetSimulation = async () => {
    await revertSnapshot();
    await takeSnapshot(); // Take a new snapshot for the next run
    
    setStep(0);
    setCampaignId(null);
    setCampaignData(null);
    setAfterDonationBalance('0');
    setAfterRefundBalance('0');
    // Refetch initial balance
    if (tokenContract && userAccount) {
      tokenContract.balanceOf(userAccount).then(bal => {
        setInitialBalance(ethers.formatEther(bal));
      }).catch(console.error);
    }
  };

  // Step 1: Create Campaign
  const handleCreateCampaign = async () => {
    if (!donationContract) {
      toast.error("Contracts not initialized. Please reconnect wallet.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Creating simulation campaign...');
    
    try {
      // Create a campaign with 1 day duration (we will fast forward)
      const targetWei = ethers.parseEther(targetAmount);
      // Using dummy IPFS hashes for simulation
      const tx = await donationContract.createCampaign(
        "Refund Simulation Campaign",
        "This is a test campaign to demonstrate the refund process.",
        "QmTestImageHash", 
        "QmTestDocHash",
        targetWei,
        1 // 1 day duration
      );
      const receipt = await tx.wait();
      
      // Find the CampaignCreated event to get ID
      // In ethers v6, we can parse logs or just fetch the latest count - 1
      const count = await donationContract.campaignCount();
      const newId = Number(count) - 1;
      
      setCampaignId(newId);
      setCampaignData({
        id: newId,
        target: targetAmount,
        raised: '0',
        deadline: new Date(Date.now() + 86400000).toLocaleString() // Approx
      });
      
      setStep(1);
      toast.success("Simulation campaign created!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to create campaign", { id: toastId });
    }
    setLoading(false);
  };

  // Step 2: Donate
  const handleDonate = async () => {
    if (!donationContract || !tokenContract) return;
    setLoading(true);
    const toastId = toast.loading('Processing donation...');
    
    try {
      const amountWei = ethers.parseEther(donationAmount);
      
      // Approve
      const allowance = await tokenContract.allowance(userAccount, CONTRACT_ADDRESS);
      if (allowance < amountWei) {
        toast.loading('Approving tokens...', { id: toastId });
        const appTx = await tokenContract.approve(CONTRACT_ADDRESS, amountWei);
        await appTx.wait();
      }
      
      // Donate
      toast.loading('Donating...', { id: toastId });
      const tx = await donationContract.donate(campaignId, amountWei);
      await tx.wait();
      
      // Update Balance
      const newBal = await tokenContract.balanceOf(userAccount);
      setAfterDonationBalance(ethers.formatEther(newBal));
      
      // Update Campaign Data
      setCampaignData(prev => ({
        ...prev,
        raised: donationAmount
      }));
      
      setStep(2);
      toast.success("Donation successful!", { id: toastId });
      refreshAppBalance();
    } catch (error) {
      console.error(error);
      toast.error("Donation failed", { id: toastId });
    }
    setLoading(false);
  };

  // Step 3: Fast Forward & Fail
  const handleSimulateFailure = async () => {
    if (!donationContract) return;
    setLoading(true);
    const toastId = toast.loading('Simulating time passing...');
    
    try {
      // Increase time by 2 days (172800 seconds) to ensure deadline passed
      // Use direct RPC call to bypass MetaMask limitations for dev methods
      const rpcUrl = "http://127.0.0.1:8545";
      
      await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [172800], // 2 days in seconds
          id: new Date().getTime()
        })
      });

      await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "evm_mine",
          params: [],
          id: new Date().getTime() + 1
        })
      });
      
      toast.loading('Checking goal...', { id: toastId });
      const tx = await donationContract.checkGoal(campaignId);
      await tx.wait();
      
      setStep(3);
      toast.success("Campaign expired and failed!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to simulate time passing. Ensure local node is running at port 8545.", { id: toastId });
    }
    setLoading(false);
  };

  // Step 4: Refund
  const handleRefund = async () => {
    if (!donationContract || !tokenContract) return;
    setLoading(true);
    const toastId = toast.loading('Processing refund...');
    
    try {
      const tx = await donationContract.refund(campaignId);
      await tx.wait();
      
      const newBal = await tokenContract.balanceOf(userAccount);
      setAfterRefundBalance(ethers.formatEther(newBal));
      
      setStep(4);
      toast.success("Refund successful!", { id: toastId });
      refreshAppBalance();
    } catch (error) {
      console.error(error);
      toast.error("Refund failed", { id: toastId });
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-slate-200 dark:border-slate-700 relative z-10">
          
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-500" />
              Refund Simulation
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 focus:outline-none">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            
            {/* Progress Bar */}
            <div className="mb-8 relative">
              {/* Line - positioned to align with icons (h-8 = 32px, center = 16px = top-4) */}
              <div className="absolute left-0 top-4 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700"></div>
              
              <div className="flex justify-between relative z-10">
                {[
                  { icon: Play, label: "Start" },
                  { icon: DollarSign, label: "Donate" },
                  { icon: Clock, label: "Expire" },
                  { icon: RotateCcw, label: "Refund" }
                ].map((s, i) => (
                  <div key={i} className={`flex flex-col items-center gap-2 ${step >= i + 1 ? 'text-rose-500' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                      step >= i + 1 
                        ? 'border-rose-500 bg-rose-50 dark:bg-slate-900' 
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {step > i + 1 ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-medium select-none bg-white dark:bg-slate-800 px-1 rounded">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              
              {/* Step 0: Setup */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Simulation Setup</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      We will create a temporary campaign, donate to it, simulate time passing to make it expire without reaching the goal, and then trigger a refund.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Campaign Target (CHT)</label>
                      <input 
                        type="number" 
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Donation Amount (CHT)</label>
                      <input 
                        type="number" 
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-slate-600 dark:text-slate-400">Current Balance:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{parseFloat(initialBalance).toFixed(2)} CHT</span>
                  </div>

                  <button 
                    onClick={handleCreateCampaign}
                    disabled={loading}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    Start Simulation (Create Campaign)
                  </button>
                </div>
              )}

              {/* Step 1: Donate */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-200">Campaign Created!</h4>
                      <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                        ID: #{campaignId} • Target: {targetAmount} CHT • Deadline: 1 Day
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Your Balance:</span>
                      <span className="font-mono font-bold">{parseFloat(initialBalance).toFixed(2)} CHT</span>
                    </div>
                    <div className="flex justify-between text-rose-500">
                      <span>To Donate:</span>
                      <span className="font-mono font-bold">-{donationAmount} CHT</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleDonate}
                    disabled={loading}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                    Donate {donationAmount} CHT
                  </button>
                </div>
              )}

              {/* Step 2: Wait & Fail */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Balance Before</div>
                      <div className="font-mono font-bold text-lg">{parseFloat(initialBalance).toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center border-2 border-rose-500/20">
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Balance After</div>
                      <div className="font-mono font-bold text-lg text-rose-500">{parseFloat(afterDonationBalance).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                    <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Time Travel Needed
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      The campaign is currently active. To trigger a refund, we need the campaign to expire without reaching its target ({targetAmount} CHT).
                      <br/><br/>
                      Current Raised: {campaignData?.raised} CHT
                    </p>
                  </div>

                  <button 
                    onClick={handleSimulateFailure}
                    disabled={loading}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FastForward className="w-5 h-5" />}
                    Simulate 2 Days Passing & Check Goal
                  </button>
                </div>
              )}

              {/* Step 3: Refund */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-200">Campaign Failed</h4>
                      <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                        Goal not reached ({campaignData?.raised}/{targetAmount} CHT) and deadline passed.
                        <br/>
                        You are now eligible for a refund.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Current Balance:</span>
                      <span className="font-mono font-bold">{parseFloat(afterDonationBalance).toFixed(2)} CHT</span>
                    </div>
                    <div className="flex justify-between text-green-500">
                      <span>Refund Amount:</span>
                      <span className="font-mono font-bold">+{donationAmount} CHT</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleRefund}
                    disabled={loading}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                    Claim Refund
                  </button>
                </div>
              )}

              {/* Step 4: Completed */}
              {step === 4 && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Refund Complete!</h3>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-slate-500 mb-1">Initial</div>
                      <div className="font-mono font-bold">{parseFloat(initialBalance).toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="text-slate-500 mb-1">After Donate</div>
                      <div className="font-mono font-bold text-rose-500">{parseFloat(afterDonationBalance).toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-green-500/20">
                      <div className="text-slate-500 mb-1">Final</div>
                      <div className="font-mono font-bold text-green-500">{parseFloat(afterRefundBalance).toFixed(2)}</div>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400">
                    The tokens have been returned to your wallet.
                  </p>

                  <button 
                    onClick={resetSimulation}
                    className="text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Start Another Simulation
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundSimulation;
