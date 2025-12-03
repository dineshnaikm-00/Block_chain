import { Proposal } from '../App';
import { ProposalCard } from './ProposalCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, CheckCircle, List, Vote, User } from 'lucide-react';

interface ProposalListProps {
  proposals: Proposal[];
  onSelectProposal: (proposal: Proposal) => void;
  onExecute: (proposalId: string) => void;
  userAddress: string;
}

export function ProposalList({ proposals, onSelectProposal, onExecute, userAddress }: ProposalListProps) {
  const myProposals = proposals.filter(p => p.proposer === userAddress);
  const votedProposals = proposals.filter(p => p.voters.some(v => v.address === userAddress));
  const activeProposals = proposals.filter(p => p.status === 'active');
  const completedProposals = proposals.filter(p => p.status === 'executed' || p.status === 'passed');
  // All proposals excluding executed ones
  const allProposals = proposals.filter(p => p.status !== 'executed');

  const renderProposalSection = (sectionProposals: Proposal[], emptyMessage: string) => {
    if (sectionProposals.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sectionProposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onVote={() => onSelectProposal(proposal)}
            onExecute={() => onExecute(proposal.id)}
            userAddress={userAddress}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 shadow-sm flex-wrap h-auto">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <List className="w-4 h-4 mr-2" />
            All Proposals
            <span className="ml-2 px-2 py-0.5 bg-slate-100 data-[state=active]:bg-blue-500 rounded-full text-xs">
              {allProposals.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Vote className="w-4 h-4 mr-2" />
            Active
            <span className="ml-2 px-2 py-0.5 bg-slate-100 data-[state=active]:bg-blue-500 rounded-full text-xs">
              {activeProposals.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
            <span className="ml-2 px-2 py-0.5 bg-slate-100 data-[state=active]:bg-emerald-500 rounded-full text-xs">
              {completedProposals.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="my-proposals" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            My Proposals
            <span className="ml-2 px-2 py-0.5 bg-slate-100 data-[state=active]:bg-purple-500 rounded-full text-xs">
              {myProposals.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="voted" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Voted by Me
            <span className="ml-2 px-2 py-0.5 bg-slate-100 data-[state=active]:bg-indigo-500 rounded-full text-xs">
              {votedProposals.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderProposalSection(allProposals, 'No proposals yet. Create the first one!')}
        </TabsContent>

        <TabsContent value="active">
          {renderProposalSection(activeProposals, 'No active proposals at the moment.')}
        </TabsContent>

        <TabsContent value="completed">
          {renderProposalSection(completedProposals, 'No completed proposals yet.')}
        </TabsContent>

        <TabsContent value="my-proposals">
          {renderProposalSection(myProposals, "You haven't created any proposals yet.")}
        </TabsContent>

        <TabsContent value="voted">
          {renderProposalSection(votedProposals, "You haven't voted on any proposals yet.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}