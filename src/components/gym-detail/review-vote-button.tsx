'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface ReviewVoteButtonProps {
  reviewId: string;
  initialVoteCount: number;
  initialHasVoted: boolean;
}

export function ReviewVoteButton({
  reviewId,
  initialVoteCount,
  initialHasVoted,
}: ReviewVoteButtonProps) {
  const { isSignedIn } = useUser();
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async () => {
    if (!isSignedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const method = hasVoted ? 'DELETE' : 'POST';
      const res = await fetch(`/api/reviews/${reviewId}/vote`, { method });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '투표에 실패했습니다.');
      }

      setHasVoted(data.voted);
      setVoteCount(data.voteCount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '투표에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={hasVoted ? 'default' : 'ghost'}
      size="sm"
      onClick={handleVote}
      disabled={isLoading}
      className={`h-7 px-2 text-xs gap-1 ${hasVoted ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <ThumbsUp className={`h-3 w-3 ${hasVoted ? 'fill-primary' : ''}`} strokeWidth={1.5} />
      )}
      <span>도움이 돼요</span>
      {voteCount > 0 && <span className="ml-1">{voteCount}</span>}
    </Button>
  );
}
