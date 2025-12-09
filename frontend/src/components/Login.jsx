import React from 'react';
import { Heart, Wallet, Sun, Moon } from 'lucide-react';

const Login = ({ onConnect, loginError, toggleDarkMode, isDarkMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-black flex items-center justify-center p-4 transition-colors duration-200 relative">
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors backdrop-blur-sm shadow-sm"
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 transition-colors duration-200 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full mb-4">
            <Heart className="w-8 h-8 text-rose-500 dark:text-rose-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent mb-2">
            CharityChain
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Connect your wallet to start donating</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={onConnect}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Wallet className="w-6 h-6" />
            Connect MetaMask
          </button>

          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-left">
              {loginError}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Make sure you are connected to <strong>Localhost 8545</strong>
            </p>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-left">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Network Settings:</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                <li>RPC URL: http://127.0.0.1:8545</li>
                <li>Chain ID: 31337</li>
                <li>Currency: ETH</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
