import React, { useEffect, useState } from 'react';
import { XCircle, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';

const DonationHistoryModal = ({ isOpen, onClose, contract, userAccount, campaigns }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && contract && userAccount) {
      fetchDonations();
    }
  }, [isOpen, contract, userAccount]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      // Create filter for DonationReceived event
      // Event signature: DonationReceived(uint256 indexed id, address indexed donor, uint256 amount)
      // We filter by donor = userAccount
      const filter = contract.filters.DonationReceived(null, userAccount);
      const events = await contract.queryFilter(filter);

      const formattedDonations = await Promise.all(events.map(async (event) => {
        const block = await event.getBlock();
        const campaignId = Number(event.args[0]); // Access by index for Vyper events sometimes, or name if ABI allows
        // Note: ethers v6 event args can be accessed by name if ABI has it. 
        // Vyper events usually have names. Let's try to map ID to campaign name.
        const campaign = campaigns.find(c => c.id === campaignId);
        
        return {
          hash: event.transactionHash,
          campaignName: campaign ? campaign.name : `Campaign #${campaignId}`,
          amount: ethers.formatEther(event.args[2]),
          date: new Date(block.timestamp * 1000).toLocaleDateString(),
          timestamp: block.timestamp
        };
      }));

      // Sort by newest first
      formattedDonations.sort((a, b) => b.timestamp - a.timestamp);
      setDonations(formattedDonations);
    } catch (error) {
      console.error("Error fetching donation history:", error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">My Donation History</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading history...</div>
        ) : donations.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>You haven't made any donations yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.hash} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{donation.campaignName}</h4>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {donation.date}
                    </span>
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${donation.hash}`} // Example link, though we are on local
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                      title="View Transaction"
                    >
                      <ExternalLink className="w-3 h-3" /> Tx
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-rose-500 dark:text-rose-400 text-lg">
                    {donation.amount} CHT
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationHistoryModal;
