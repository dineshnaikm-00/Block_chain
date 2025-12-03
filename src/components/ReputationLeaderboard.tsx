import { User } from '../App';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface ReputationLeaderboardProps {
  users: User[];
  currentUser: User;
}

export function ReputationLeaderboard({ users, currentUser }: ReputationLeaderboardProps) {
  const sortedUsers = [...users].sort((a, b) => b.reputation - a.reputation);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-slate-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <Award className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-slate-900">Reputation Leaderboard</h3>
          <p className="text-slate-600 text-sm">Top contributors to the DAO</p>
        </div>
      </div>

      <div className="space-y-1">
        {sortedUsers.map((user, index) => {
          const isCurrentUser = user.address === currentUser.address;
          
          return (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                isCurrentUser
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 text-center">
                  {getRankIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-mono text-sm truncate">
                      {user.address.slice(0, 6)}...{user.address.slice(-4)}
                    </span>
                    {isCurrentUser && (
                      <span className="text-blue-600 text-xs">(You)</span>
                    )}
                  </div>
                  <div className="text-slate-600 text-xs">
                    {user.totalVotes} votes • {user.majorityAlignment}% alignment
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-slate-900 text-sm">{user.reputation}</div>
                  <div className="text-slate-500 text-xs">reputation</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-purple-600 text-sm">
                    <TrendingUp className="w-3 h-3" />
                    {user.votingPower.toFixed(2)}x
                  </div>
                  <div className="text-slate-500 text-xs">power</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-purple-900 text-sm mb-2">💎 How to Climb the Ranks</p>
          <ul className="text-purple-800 text-xs space-y-1">
            <li>• Vote consistently to build your reputation</li>
            <li>• Align with community consensus to gain bonus reputation</li>
            <li>• Higher reputation = more voting power (up to 2x)</li>
            <li>• Top contributors shape the future of content moderation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}