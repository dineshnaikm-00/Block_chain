// Web3 utility functions for blockchain transactions
// This file handles all MetaMask interactions

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window.ethereum !== 'undefined';
};

// Get current connected account
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) return null;
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting account:', error);
    return null;
  }
};

// Request MetaMask to sign and send a transaction
// This will ALWAYS show the MetaMask popup
export const sendTransaction = async (
  to: string,
  value: string,
  data: string
): Promise<TransactionResult> => {
  if (!isMetaMaskInstalled()) {
    return { success: false, error: 'MetaMask is not installed' };
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    if (!accounts || accounts.length === 0) {
      return { success: false, error: 'No account connected' };
    }

    // This will trigger MetaMask popup for user confirmation
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: accounts[0],
          to: to,
          value: value, // In wei (hex)
          data: data,
        },
      ],
    });

    return { success: true, hash: txHash };
  } catch (error: any) {
    console.error('Transaction failed:', error);
    if (error.code === 4001) {
      return { success: false, error: 'Transaction rejected by user' };
    }
    return { success: false, error: error.message || 'Transaction failed' };
  }
};

// Sign a message with MetaMask (for actions that need signature but no gas)
// This will ALWAYS show the MetaMask popup
export const signMessage = async (message: string): Promise<TransactionResult> => {
  if (!isMetaMaskInstalled()) {
    return { success: false, error: 'MetaMask is not installed' };
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    if (!accounts || accounts.length === 0) {
      return { success: false, error: 'No account connected' };
    }

    // This will trigger MetaMask popup for signature
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]],
    });

    return { success: true, hash: signature };
  } catch (error: any) {
    console.error('Signing failed:', error);
    if (error.code === 4001) {
      return { success: false, error: 'Signature rejected by user' };
    }
    return { success: false, error: error.message || 'Signing failed' };
  }
};

// Simulate a contract call that triggers MetaMask
// For demo purposes - creates a transaction to show MetaMask popup
export const simulateContractCall = async (
  action: string,
  params: Record<string, any>
): Promise<TransactionResult> => {
  if (!isMetaMaskInstalled()) {
    return { success: false, error: 'MetaMask is not installed' };
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    if (!accounts || accounts.length === 0) {
      return { success: false, error: 'No account connected' };
    }

    // Create a message that describes the action
    const message = JSON.stringify({
      action,
      params,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    });

    // Request signature from MetaMask - this ALWAYS shows the popup
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [`ContentDAO Action: ${action}\n\nDetails:\n${JSON.stringify(params, null, 2)}\n\nTimestamp: ${new Date().toISOString()}`, accounts[0]],
    });

    return { success: true, hash: signature };
  } catch (error: any) {
    console.error('Contract call failed:', error);
    if (error.code === 4001) {
      return { success: false, error: 'Action rejected by user' };
    }
    return { success: false, error: error.message || 'Action failed' };
  }
};

// Voting transaction - triggers MetaMask popup
export const voteOnProposal = async (
  proposalId: string,
  votes: number,
  support: boolean,
  tokenCost: number
): Promise<TransactionResult> => {
  return simulateContractCall('VOTE', {
    proposalId,
    votes,
    support: support ? 'FOR' : 'AGAINST',
    tokenCost,
  });
};

// Create proposal transaction - triggers MetaMask popup
export const createProposalTx = async (
  title: string,
  description: string,
  contentUrl: string,
  contentType: string
): Promise<TransactionResult> => {
  return simulateContractCall('CREATE_PROPOSAL', {
    title,
    description,
    contentUrl,
    contentType,
  });
};

// Execute proposal transaction - triggers MetaMask popup
export const executeProposalTx = async (
  proposalId: string
): Promise<TransactionResult> => {
  return simulateContractCall('EXECUTE_PROPOSAL', {
    proposalId,
  });
};

// Listen for account changes
export const onAccountChange = (callback: (accounts: string[]) => void): void => {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('accountsChanged', callback);
  }
};

// Listen for network changes
export const onNetworkChange = (callback: (chainId: string) => void): void => {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('chainChanged', callback);
  }
};
