import React, { useState } from 'react';
import { Heart, User, Lock } from 'lucide-react';

const Login = ({ onLogin, loginError }) => {
  const [account, setAccount] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(account, privateKey);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-black flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 transition-colors duration-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full mb-4">
            <Heart className="w-8 h-8 text-rose-500 dark:text-rose-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent mb-2">
            CharityChain
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Login to manage campaigns</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Account Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Private Key
            </label>
            <input
              type="password"
              placeholder="0x..."
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
          </div>

          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
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

        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Test Accounts (Hardhat):</p>
          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <p>Owner: 0xf39F...2266</p>
            <p>Donater 1: 0x7099...79C8</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
