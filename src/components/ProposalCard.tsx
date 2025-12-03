import { useState } from 'react';
import { Proposal } from '../App';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, Clock, ExternalLink, PlayCircle, Check, Loader2 } from 'lucide-react';
import { executeProposalTx } from '../utils/web3';

interface ProposalCardProps {
  proposal: Proposal;
  onVote: () => void;
  onExecute: () => void;
  userAddress?: string;
}

export function ProposalCard({ proposal, onVote, onExecute, userAddress }: ProposalCardProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);
  
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
  
  const timeRemaining = proposal.votingEnds - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);
  
  // Check if user has already voted
  const hasVoted = userAddress ? proposal.voters.some(v => v.address === userAddress) : false;
  const userVote = userAddress ? proposal.voters.find(v => v.address === userAddress) : null;
  
  const getStatusBadge = () => {
    switch (proposal.status) {
      case 'active':
        return <Badge className="bg-blue-600 hover:bg-blue-600 text-white">Active</Badge>;
      case 'passed':
        return <Badge className="bg-green-600 hover:bg-green-600 text-white">Passed</Badge>;
      case 'executed':
        return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Executed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600 hover:bg-red-600 text-white">Rejected</Badge>;
    }
  };

  const getContentTypeBadge = () => {
    return proposal.contentType === 'approve' ? (
      <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Approve Content
      </Badge>
    ) : (
      <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
        <XCircle className="w-3 h-3 mr-1" />
        Remove Content
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusBadge()}
            {getContentTypeBadge()}
          </div>
          <h4 className="text-slate-900 mb-2">{proposal.title}</h4>
          <p className="text-slate-600 text-sm mb-3">{proposal.description}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="font-mono">By {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
            <a 
              href={proposal.contentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View Content
            </a>
          </div>
        </div>
      </div>

      {/* Voting Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-700">For</span>
          </div>
          <span className="text-slate-900">{proposal.votesFor.toLocaleString()} votes ({forPercentage.toFixed(1)}%)</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-600"
              style={{ width: `${forPercentage}%` }}
            />
            <div 
              className="bg-gradient-to-r from-red-500 to-red-600"
              style={{ width: `${againstPercentage}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-slate-700">Against</span>
          </div>
          <span className="text-slate-900">{proposal.votesAgainst.toLocaleString()} votes ({againstPercentage.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Time Remaining & Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        {proposal.status === 'active' && (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              {daysRemaining > 0 ? (
                <span>{daysRemaining}d {hoursRemaining % 24}h remaining</span>
              ) : hoursRemaining > 0 ? (
                <span>{hoursRemaining}h remaining</span>
              ) : (
                <span>Ending soon</span>
              )}
            </div>
            {hasVoted ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  You voted {userVote?.support ? 'For' : 'Against'} ({userVote?.votes} votes)
                </span>
                <Button disabled className="bg-slate-400 text-white shadow-sm cursor-not-allowed">
                  <Check className="w-4 h-4 mr-2" />
                  Voted
                </Button>
              </div>
            ) : (
              <Button onClick={onVote} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Vote Now
              </Button>
            )}
          </>
        )}
        {proposal.status === 'passed' && (
          <>
            <div className="flex flex-col">
              <span className="text-emerald-600 text-sm">Ready for execution</span>
              {executeError && (
                <span className="text-red-500 text-xs">{executeError}</span>
              )}
            </div>
            <Button 
              onClick={async () => {
                setIsExecuting(true);
                setExecuteError(null);
                try {
                  const result = await executeProposalTx(proposal.id);
                  if (result.success) {
                    onExecute();
                  } else {
                    setExecuteError(result.error || 'Execution failed');
                  }
                } catch (error: any) {
                  setExecuteError(error.message || 'Execution failed');
                } finally {
                  setIsExecuting(false);
                }
              }} 
              disabled={isExecuting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </>
        )}
        {(proposal.status === 'executed' || proposal.status === 'rejected') && (
          <div className="w-full text-center text-slate-500 text-sm">
            {proposal.status === 'executed' ? 'Proposal executed successfully' : 'Proposal did not reach quorum'}
          </div>
        )}
      </div>
    </div>
  );
}