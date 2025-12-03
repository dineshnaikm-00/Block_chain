import { User } from '../App';
import { Coins, TrendingUp, Award } from 'lucide-react';

interface TokenOverviewProps {
  user: User;
}

export function TokenOverview({ user }: TokenOverviewProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-blue-600" />
          <h3 className="text-slate-900">Your Governance Tokens</h3>
        </div>
        <div className="text-4xl text-slate-900 mb-1">{user.tokenBalance.toLocaleString()}</div>
        <p className="text-slate-500 text-sm">DAO Tokens Available</p>
      </div>

      <div className="pt-6 border-t border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-slate-700 text-sm">Reputation Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-slate-900">{user.reputation}/100</div>
            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                style={{ width: `${user.reputation}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-700 text-sm">Voting Power</span>
          </div>
          <div className="text-slate-900">{user.votingPower.toFixed(2)}x</div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-700 text-sm">Total Votes Cast</span>
          <div className="text-slate-900">{user.totalVotes}</div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-700 text-sm">Majority Alignment</span>
          <div className="text-slate-900">{user.majorityAlignment}%</div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-900 text-sm mb-2">💡 Boost Your Power</p>
          <p className="text-blue-700 text-xs">
            Vote consistently with the majority to increase your reputation and earn up to 2x voting power!
          </p>
        </div>
      </div>
    </div>
  );
}