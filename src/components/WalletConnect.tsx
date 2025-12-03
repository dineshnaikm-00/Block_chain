import { useState } from 'react';
import { Button } from './ui/button';
import { Shield, Wallet, AlertCircle } from 'lucide-react';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        setIsConnecting(false);
        return;
      }

      // Force MetaMask to open and ask for permission every time
      // Using wallet_requestPermissions ensures the popup always appears
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // After user approves in MetaMask, get the selected accounts
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts && accounts.length > 0) {
        onConnect(accounts[0]);
      } else {
        setError('No account selected. Please select an account in MetaMask.');
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      // User rejected the request
      if (err.code === 4001) {
        setError('Connection rejected. Please approve the connection in MetaMask.');
      } else {
        setError(err.message || 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-slate-900 text-3xl mb-2">Welcome to ContentDAO</h1>
          <p className="text-slate-600">
            Decentralized content moderation powered by community governance
          </p>
        </div>

        {/* Connect Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
          <div className="space-y-6">
            <div>
              <h3 className="text-slate-900 mb-2">Connect Your Wallet</h3>
              <p className="text-slate-600 text-sm">
                Connect with MetaMask to access your governance tokens and participate in DAO voting.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-base shadow-lg"
            >
              {isConnecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect MetaMask
                </>
              )}
            </Button>

            <div className="pt-6 border-t border-slate-200">
              <p className="text-slate-500 text-xs mb-3">What you'll get:</p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>1,000 governance tokens airdrop for new members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Vote on content moderation proposals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Earn reputation and increase voting power</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            Don't have MetaMask?{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Install it here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
