import { useState } from 'react';
import { Proposal, User } from '../App';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Info, TrendingUp } from 'lucide-react';

interface VotingInterfaceProps {
  proposal: Proposal;
  user: User;
  onClose: () => void;
  onVote: (proposalId: string, votes: number, support: boolean, cost: number) => void;
}

export function VotingInterface({ proposal, user, onClose, onVote }: VotingInterfaceProps) {
  const [voteAmount, setVoteAmount] = useState(1);
  const [support, setSupport] = useState(true);

  // Quadratic voting: cost = votes^2
  const calculateCost = (votes: number) => {
    return Math.ceil(votes * votes);
  };

  // Apply reputation multiplier to actual voting power
  const getEffectiveVotes = (votes: number) => {
    return Math.ceil(votes * user.votingPower);
  };

  const cost = calculateCost(voteAmount);
  const effectiveVotes = getEffectiveVotes(voteAmount);
  const canAfford = cost <= user.tokenBalance;

  const handleVote = () => {
    if (!canAfford) return;
    onVote(proposal.id, effectiveVotes, support, cost);
    onClose();
  };

  const hasVoted = proposal.voters.some(v => v.address === user.address);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-900">Cast Your Vote</DialogTitle>
          <DialogDescription className="text-slate-600">
            {proposal.title}
          </DialogDescription>
        </DialogHeader>

        {hasVoted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-slate-900 mb-2">You've Already Voted</h4>
            <p className="text-slate-600">You can only vote once per proposal</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Vote Direction */}
            <div className="space-y-3">
              <label className="text-slate-700 text-sm">Vote Direction</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSupport(true)}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    support
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className={`w-6 h-6 mx-auto mb-2 ${support ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div className={support ? 'text-emerald-700' : 'text-slate-600'}>Support</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSupport(false)}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    !support
                      ? 'bg-red-50 border-red-500'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <XCircle className={`w-6 h-6 mx-auto mb-2 ${!support ? 'text-red-600' : 'text-slate-400'}`} />
                  <div className={!support ? 'text-red-700' : 'text-slate-600'}>Oppose</div>
                </button>
              </div>
            </div>

            {/* Vote Amount */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 text-sm">Number of Votes</label>
                <div className="text-slate-900 text-2xl">{voteAmount}</div>
              </div>
              <Slider
                value={[voteAmount]}
                onValueChange={(value) => setVoteAmount(value[0])}
                min={1}
                max={Math.min(31, Math.floor(Math.sqrt(user.tokenBalance)))}
                step={1}
                className="py-2"
              />
            </div>

            {/* Quadratic Cost Display */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-slate-700 text-sm">Exponential Voting Cost</p>
                  <p className="text-slate-600 text-xs">
                    Each vote costs exponentially more to prevent whales from dominating decisions.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Base votes</span>
                  <span className="text-slate-900">{voteAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-purple-600" />
                    Reputation multiplier
                  </span>
                  <span className="text-purple-700">{user.votingPower.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Effective votes</span>
                  <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
                    {effectiveVotes}
                  </Badge>
                </div>
                <div className="h-px bg-slate-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-slate-700">Token cost</span>
                  <div className="text-right">
                    <div className="text-slate-900 text-lg">{cost.toLocaleString()} tokens</div>
                    <div className="text-slate-500 text-xs">
                      {voteAmount} votes² = {cost} tokens
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Check */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-slate-600 text-sm">Your balance</span>
              <span className={`text-sm ${canAfford ? 'text-emerald-600' : 'text-red-600'}`}>
                {user.tokenBalance.toLocaleString()} tokens
              </span>
            </div>

            {!canAfford && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-700 text-sm">
                  ⚠️ Insufficient tokens. Reduce vote amount or acquire more tokens.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVote}
                disabled={!canAfford}
                className={`flex-1 text-white shadow-sm ${
                  support
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {support ? 'Vote For' : 'Vote Against'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}