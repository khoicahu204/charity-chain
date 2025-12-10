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
      // Check if user is owner
      const isOwner = userAccount.toLowerCase() === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();

      // Fetch ALL events first (Vyper events are not indexed, so we can't filter by topic)
      const filter = contract.filters.DonationReceived();
      const events = await contract.queryFilter(filter);

      // Filter events in memory
      // If Owner: Keep ALL events
      // If User: Keep only events where donor === userAccount
      const filteredEvents = isOwner
        ? events
        : events.filter(event => event.args[1].toLowerCase() === userAccount.toLowerCase());

      const formattedDonations = await Promise.all(filteredEvents.map(async (event) => {
        const block = await event.getBlock();
        const campaignId = Number(event.args[0]);
        const donorAddress = event.args[1];
        const campaign = campaigns.find(c => c.id === campaignId);

        return {
          hash: event.transactionHash,
          campaignName: campaign ? campaign.name : `Campaign #${campaignId}`,
          donor: donorAddress, // Add donor address for Owner view
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
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Donation History</h3>
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

                  {/* Show Donor Address if it's not the current user (meaning we are Owner viewing others) */}
                  {donation.donor && donation.donor.toLowerCase() !== userAccount.toLowerCase() && (
                    <div className="text-xs text-rose-500 dark:text-rose-400 mb-1 font-mono">
                      From: {donation.donor.slice(0, 6)}...{donation.donor.slice(-4)}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {donation.date}
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${donation.hash}`}
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
