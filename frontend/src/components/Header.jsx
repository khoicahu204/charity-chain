import React from 'react';
import { Heart, Coins, LogOut } from 'lucide-react';

const Header = ({ account, tokenBalance, isOwner, onLogout, onMint }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="text-rose-500 w-8 h-8" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            CharityChain
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Token Balance Display */}
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg text-sm font-medium border border-purple-100">
            <Coins className="w-4 h-4 text-purple-600" />
            <span className="text-purple-900">{parseFloat(tokenBalance).toFixed(2)} CHT</span>
            {isOwner && (
              <button
                onClick={onMint}
                className="ml-2 text-xs bg-purple-200 hover:bg-purple-300 text-purple-800 px-2 py-0.5 rounded transition-colors"
                title="Mint 1000 CHT (Test)"
              >
                Mint
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {account.slice(0, 6)}...{account.slice(-4)}
            {isOwner && <span className="ml-2 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Owner</span>}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
