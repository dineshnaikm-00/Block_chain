import { useState } from 'react';
import { User, Proposal } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';
import { createProposalTx } from '../utils/web3';

interface CreateProposalProps {
  user: User;
  onCreateProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'votingEnds' | 'status' | 'votesFor' | 'votesAgainst' | 'voters'>) => void;
}

export function CreateProposal({ user, onCreateProposal }: CreateProposalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [contentType, setContentType] = useState<'approve' | 'remove'>('remove');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedContentUrl = contentUrl.trim();
    
    if (!trimmedTitle || !trimmedDescription || !trimmedContentUrl) {
      return;
    }

    setIsProcessing(true);
    setTxStatus('pending');
    setTxError(null);

    try {
      // This will trigger MetaMask popup for user to confirm/sign
      const result = await createProposalTx(trimmedTitle, trimmedDescription, trimmedContentUrl, contentType);
      
      if (result.success) {
        setTxStatus('success');
        
        // Process the proposal creation after successful signature
        setTimeout(() => {
          onCreateProposal({
            title: trimmedTitle,
            description: trimmedDescription,
            contentUrl: trimmedContentUrl,
            contentType,
            proposer: user.address,
          });

          // Reset form
          setTitle('');
          setDescription('');
          setContentUrl('');
          setContentType('remove');
          setTxStatus('idle');
          setIsProcessing(false);
        }, 1500);
      } else {
        setTxStatus('error');
        setTxError(result.error || 'Transaction failed');
        setIsProcessing(false);
      }
    } catch (error: any) {
      setTxStatus('error');
      setTxError(error.message || 'Transaction failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-slate-900">Create New Proposal</h3>
          <p className="text-slate-600 text-sm">Submit content for community moderation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="contentType" className="text-slate-700">
            Action Type
          </Label>
          <RadioGroup 
            value={contentType} 
            onValueChange={(value) => setContentType(value as 'approve' | 'remove')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2 bg-slate-50 rounded-xl p-4 flex-1 cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <RadioGroupItem value="approve" id="approve" />
              <Label htmlFor="approve" className="flex items-center gap-2 cursor-pointer flex-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-slate-900">Approve Content</div>
                  <div className="text-slate-600 text-xs">Propose to feature or approve</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 rounded-xl p-4 flex-1 cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
              <RadioGroupItem value="remove" id="remove" />
              <Label htmlFor="remove" className="flex items-center gap-2 cursor-pointer flex-1">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-slate-900">Remove Content</div>
                  <div className="text-slate-600 text-xs">Propose to hide or remove</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-700">
            Proposal Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief, descriptive title for your proposal"
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-slate-700">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain why this content should be approved or removed. Include relevant context and evidence."
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 min-h-32 focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contentUrl" className="text-slate-700">
            Content URL
          </Label>
          <Input
            id="contentUrl"
            type="url"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            placeholder="https://example.com/content"
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
            required
          />
          <p className="text-slate-500 text-xs mt-1">
            Link to the content being moderated (e.g., a post, comment, article, or image URL that needs community review)
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-900 text-sm mb-2">📋 Example Content URLs</p>
          <ul className="text-blue-800 text-xs space-y-1">
            <li>• Forum post: https://forum.example.com/post/12345</li>
            <li>• Social media: https://twitter.com/user/status/67890</li>
            <li>• Article: https://blog.example.com/article-title</li>
            <li>• Comment thread: https://site.com/comments/abc123</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-900 text-sm mb-2">⚠️ Important</p>
          <ul className="text-amber-800 text-xs space-y-1">
            <li>• Proposals cannot be edited once submitted</li>
            <li>• Voting period lasts 3 days from submission</li>
            <li>• False or malicious proposals may result in reputation loss</li>
          </ul>
        </div>

        {txStatus === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-blue-700 text-sm font-medium">Waiting for MetaMask confirmation...</p>
              <p className="text-blue-600 text-xs">Please confirm the transaction in your wallet</p>
            </div>
          </div>
        )}

        {txStatus === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-emerald-700 text-sm font-medium">Proposal created successfully!</p>
              <p className="text-emerald-600 text-xs">Your proposal has been submitted to the blockchain</p>
            </div>
          </div>
        )}

        {txStatus === 'error' && txError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm font-medium">Transaction Failed</p>
            <p className="text-red-600 text-xs">{txError}</p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          disabled={!title || !description || !contentUrl || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Submit Proposal'
          )}
        </Button>
      </form>
    </div>
  );
}