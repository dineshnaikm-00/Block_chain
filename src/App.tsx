import { useState, useEffect } from 'react';
import { TokenOverview } from './components/TokenOverview';
import { ProposalList } from './components/ProposalList';
import { CreateProposal } from './components/CreateProposal';
import { VotingInterface } from './components/VotingInterface';
import { ReputationLeaderboard } from './components/ReputationLeaderboard';
import { WalletConnect } from './components/WalletConnect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Shield, Vote, Trophy, Plus } from 'lucide-react';

export interface User {
  id: string;
  address: string;
  tokenBalance: number;
  reputation: number;
  votingPower: number;
  totalVotes: number;
  majorityAlignment: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
  contentType: 'approve' | 'remove';
  proposer: string;
  createdAt: number;
  votingEnds: number;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  voters: {
    address: string;
    votes: number;
    support: boolean;
    cost: number;
  }[];
}

// Mock initial data
const initialUser: User = {
  id: '1',
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  tokenBalance: 1000,
  reputation: 85,
  votingPower: 1.85,
  totalVotes: 42,
  majorityAlignment: 78,
};

const initialProposals: Proposal[] = [
  {
    id: '1',
    title: 'Remove spam post promoting fake cryptocurrency',
    description: 'This post contains misleading information about a cryptocurrency scam and should be removed to protect community members.',
    contentUrl: 'https://example.com/post/123',
    contentType: 'remove',
    proposer: '0x1a2b3c4d5e6f7g8h9i0j',
    createdAt: Date.now() - 3600000,
    votingEnds: Date.now() + 82800000,
    status: 'active',
    votesFor: 245,
    votesAgainst: 32,
    voters: [
      { address: '0x1a2b', votes: 10, support: true, cost: 100 },
      { address: '0x3c4d', votes: 5, support: false, cost: 25 },
    ],
  },
  {
    id: '2',
    title: 'Approve educational content about blockchain security',
    description: 'High-quality educational material that would benefit the community. Proposing approval and feature placement.',
    contentUrl: 'https://example.com/article/456',
    contentType: 'approve',
    proposer: '0x9i8h7g6f5e4d3c2b1a',
    createdAt: Date.now() - 7200000,
    votingEnds: Date.now() + 75600000,
    status: 'active',
    votesFor: 512,
    votesAgainst: 89,
    voters: [
      { address: '0x5e6f', votes: 15, support: true, cost: 225 },
      { address: '0x7g8h', votes: 8, support: true, cost: 64 },
    ],
  },
  {
    id: '3',
    title: 'Remove harassment and threatening comments',
    description: 'Multiple users reported threatening language in comments section. Immediate removal recommended.',
    contentUrl: 'https://example.com/comments/789',
    contentType: 'remove',
    proposer: '0x2b3c4d5e6f7g8h9i0j1a',
    createdAt: Date.now() - 86400000,
    votingEnds: Date.now() - 3600000,
    status: 'passed',
    votesFor: 891,
    votesAgainst: 45,
    voters: [],
  },
];

const initialLeaderboard: User[] = [
  {
    id: '1',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    tokenBalance: 1000,
    reputation: 85,
    votingPower: 1.85,
    totalVotes: 42,
    majorityAlignment: 78,
  },
  {
    id: '2',
    address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q',
    tokenBalance: 2500,
    reputation: 92,
    votingPower: 2.15,
    totalVotes: 156,
    majorityAlignment: 89,
  },
  {
    id: '3',
    address: '0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k',
    tokenBalance: 750,
    reputation: 68,
    votingPower: 1.45,
    totalVotes: 28,
    majorityAlignment: 65,
  },
  {
    id: '4',
    address: '0x5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p',
    tokenBalance: 1800,
    reputation: 79,
    votingPower: 1.72,
    totalVotes: 83,
    majorityAlignment: 71,
  },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProposals = localStorage.getItem('dao-proposals');
    const savedLeaderboard = localStorage.getItem('dao-leaderboard');
    const savedUser = localStorage.getItem('dao-current-user');

    if (savedProposals) {
      setProposals(JSON.parse(savedProposals));
    } else {
      setProposals(initialProposals);
    }

    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    } else {
      setLeaderboard(initialLeaderboard);
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Save proposals to localStorage whenever they change
  useEffect(() => {
    if (proposals.length > 0) {
      localStorage.setItem('dao-proposals', JSON.stringify(proposals));
    }
  }, [proposals]);

  // Save leaderboard to localStorage whenever it changes
  useEffect(() => {
    if (leaderboard.length > 0) {
      localStorage.setItem('dao-leaderboard', JSON.stringify(leaderboard));
    }
  }, [leaderboard]);

  // Save current user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('dao-current-user', JSON.stringify(user));
      
      // Update user in leaderboard
      setLeaderboard(prevLeaderboard => {
        const userIndex = prevLeaderboard.findIndex(u => u.address === user.address);
        if (userIndex >= 0) {
          const newLeaderboard = [...prevLeaderboard];
          newLeaderboard[userIndex] = user;
          return newLeaderboard;
        }
        return prevLeaderboard;
      });
    } else {
      localStorage.removeItem('dao-current-user');
    }
  }, [user]);

  const handleWalletConnect = (address: string) => {
    // Check in saved leaderboard first
    const existingUser = leaderboard.find(u => u.address === address);
    if (existingUser) {
      setUser(existingUser);
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        address,
        tokenBalance: 1000, // Initial airdrop
        reputation: 50,
        votingPower: 1.5,
        totalVotes: 0,
        majorityAlignment: 0,
      };
      setUser(newUser);
      setLeaderboard([...leaderboard, newUser]);
    }
  };

  const handleDisconnect = () => {
    setUser(null);
  };
  
  const handleCreateProposal = (proposal: Omit<Proposal, 'id' | 'createdAt' | 'votingEnds' | 'status' | 'votesFor' | 'votesAgainst' | 'voters'>) => {
    if (!user) return;
    const newProposal: Proposal = {
      ...proposal,
      id: Date.now().toString(),
      createdAt: Date.now(),
      votingEnds: Date.now() + 86400000 * 3, // 3 days
      status: 'active',
      votesFor: 0,
      votesAgainst: 0,
      voters: [],
    };
    setProposals([newProposal, ...proposals]);
  };

  const handleVote = (proposalId: string, votes: number, support: boolean, cost: number) => {
    if (!user) return;
    
    setProposals(proposals.map(p => {
      if (p.id === proposalId) {
        const newVoter = {
          address: user.address,
          votes,
          support,
          cost,
        };
        
        const updatedVotesFor = support ? p.votesFor + votes : p.votesFor;
        const updatedVotesAgainst = !support ? p.votesAgainst + votes : p.votesAgainst;
        const totalVotes = updatedVotesFor + updatedVotesAgainst;
        const approvalRate = totalVotes > 0 ? updatedVotesFor / totalVotes : 0;
        
        // Check if proposal should be marked as 'passed' (ready for execution)
        let newStatus = p.status;
        if (p.status === 'active' && totalVotes >= 10 && approvalRate > 0.5) {
          newStatus = 'passed';
        }
        
        return {
          ...p,
          votesFor: updatedVotesFor,
          votesAgainst: updatedVotesAgainst,
          voters: [...p.voters, newVoter],
          status: newStatus,
        };
      }
      return p;
    }));

    // Update user balance and stats
    setUser({
      ...user,
      tokenBalance: user.tokenBalance - cost,
      totalVotes: user.totalVotes + 1,
    });

    // Update reputation based on voting with majority (simulated)
    setTimeout(() => {
      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) {
        const totalVotes = proposal.votesFor + proposal.votesAgainst + votes;
        const majoritySupport = proposal.votesFor > proposal.votesAgainst;
        
        if (majoritySupport === support) {
          // Voted with majority - increase reputation
          const reputationGain = Math.min(5, votes / 2);
          setUser(u => u ? ({
            ...u,
            reputation: Math.min(100, u.reputation + reputationGain),
            votingPower: 1 + (Math.min(100, u.reputation + reputationGain) / 100),
            majorityAlignment: Math.min(100, u.majorityAlignment + 1),
          }) : null);
        }
      }
    }, 500);
  };

  const handleExecuteProposal = (proposalId: string) => {
    setProposals(proposals.map(p => {
      if (p.id === proposalId) {
        const totalVotes = p.votesFor + p.votesAgainst;
        const approvalRate = totalVotes > 0 ? p.votesFor / totalVotes : 0;
        
        return {
          ...p,
          status: approvalRate > 0.5 ? 'executed' : 'rejected',
        };
      }
      return p;
    }));
  };

  if (!user) {
    return <WalletConnect onConnect={handleWalletConnect} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900">ContentDAO</h1>
                <p className="text-slate-600 text-sm">Decentralized Content Moderation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-slate-500 text-xs">Connected Wallet</p>
                <p className="text-slate-900 text-sm font-mono">{user.address.slice(0, 6)}...{user.address.slice(-4)}</p>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <TokenOverview user={user} />
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-slate-900 mb-3">How ContentDAO Works</h3>
              <div className="space-y-3 text-slate-700 text-sm">
                <p>• <span className="text-blue-600 font-medium">Exponential Voting:</span> Each additional vote costs exponentially more tokens (vote² tokens), preventing monopolization by large holders.</p>
                <p>• <span className="text-purple-600 font-medium">Reputation System:</span> Voting with the majority increases your reputation, which multiplies your voting power.</p>
                <p>• <span className="text-emerald-600 font-medium">Automatic Execution:</span> Proposals that reach majority approval are automatically executed by the smart contract.</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="proposals" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 shadow-sm">
            <TabsTrigger value="proposals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Vote className="w-4 h-4 mr-2" />
              Proposals
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals">
            <ProposalList 
              proposals={proposals} 
              onSelectProposal={setSelectedProposal}
              onExecute={handleExecuteProposal}
              userAddress={user.address}
            />
          </TabsContent>

          <TabsContent value="create">
            <CreateProposal 
              user={user} 
              onCreateProposal={handleCreateProposal}
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <ReputationLeaderboard users={leaderboard} currentUser={user} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Voting Modal */}
      {selectedProposal && (
        <VotingInterface
          proposal={selectedProposal}
          user={user}
          onClose={() => setSelectedProposal(null)}
          onVote={handleVote}
        />
      )}
    </div>
  );
}