import React, { useState } from 'react';
import { CheckCircle, XCircle, FileText, DollarSign, LogOut } from 'lucide-react';
import { getIPFSUrl } from '../utils/ipfs';

const CampaignCard = ({ camp, isOwner, userAccount, onDonate, onCheckGoal, onWithdraw, onRefund, onDelete }) => {
  const [amount, setAmount] = useState('');

  const handleDonateClick = () => {
    onDonate(camp.id, amount);
    setAmount('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
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
            <span className="font-medium text-slate-900">{camp.amountRaised} CHT</span>
            <span className="text-slate-500">of {camp.targetAmount} CHT</span>
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
                placeholder="Amount (CHT)"
                step="1"
                min="1"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                onClick={handleDonateClick}
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
                onClick={() => onCheckGoal(camp.id)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
              >
                Check Goal
              </button>
            )}

            {isOwner && camp.isClosed && camp.goalReached && camp.owner.toLowerCase() === userAccount?.toLowerCase() && (
              <button
                onClick={() => onWithdraw(camp.id)}
                className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
              >
                <DollarSign className="w-3 h-3" /> Withdraw
              </button>
            )}

            {/* Refund is available for everyone (Donors need it) */}
            {camp.isClosed && !camp.goalReached && (
              <button
                onClick={() => onRefund(camp.id)}
                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                Refund
              </button>
            )}

            {/* Delete Button (Owner only, if no funds raised) */}
            {isOwner && Number(camp.amountRaised) === 0 && (
              <button
                onClick={() => onDelete(camp.id)}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
