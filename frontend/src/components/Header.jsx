import React from 'react';
import { Heart, Coins, LogOut, Moon, Sun, History, RotateCcw, RefreshCw } from 'lucide-react';

const Header = ({ account, tokenBalance, isOwner, onLogout, onMint, onOpenHistory, onOpenSimulation, onResetTime, toggleDarkMode, isDarkMode }) => {
  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="text-rose-500 w-8 h-8" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            CharityChain
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Refund Simulation Button */}
          <button
            onClick={onOpenSimulation}
            className="flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
            title="Simulate Refund Scenario"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Simulate Refund</span>
          </button>

          {/* Reset Time Button */}
          <button
            onClick={onResetTime}
            className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
            title="Reset Blockchain Time"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset Time</span>
          </button>

          {/* Token Balance Display */}
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg text-sm font-medium border border-purple-100 dark:border-purple-800">
            <Coins className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-900 dark:text-purple-200">{parseFloat(tokenBalance).toFixed(2)} CHT</span>
            {isOwner && (
              <button
                onClick={onMint}
                className="ml-2 text-xs bg-purple-200 dark:bg-purple-800 hover:bg-purple-300 dark:hover:bg-purple-700 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded transition-colors"
                title="Mint 1000 CHT (Test)"
              >
                Mint
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {account.slice(0, 6)}...{account.slice(-4)}
            {isOwner && <span className="ml-2 text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full">Owner</span>}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
