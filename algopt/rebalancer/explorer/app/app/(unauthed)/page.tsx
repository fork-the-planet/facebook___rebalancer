'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Button, Card, CardContent, CardHeader, TextField} from '@mui/material';
import {ArrowRight, ExternalLink} from 'lucide-react';

import {encodeRunId} from '@/lib/run-id';
import {rebalancerWikiUrl} from '@platform/internal-links';

export default function Home() {
  const [runId, setRunId] = useState('');
  const router = useRouter();
  const wikiUrl = rebalancerWikiUrl();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (runId.trim()) {
      router.push(`/run/${encodeRunId(runId.trim())}/constraints-objectives`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader
          title="Rebalancer Explorer"
          subheader={
            <>
              {wikiUrl != null ? (
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-4">
                  Rebalancer
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                'Rebalancer'
              )}{' '}
              is a generic assignment solver that optimizes how objects are
              assigned to containers, subject to constraints and objectives. It
              powers service placement and other optimization use cases across
              Meta. Rebalancer Explorer lets you inspect and analyze the results
              of individual runs.
            </>
          }
          subheaderTypographyProps={{
            variant: 'body2',
            sx: {lineHeight: 1.6, mt: 0.5},
          }}
        />
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              id="run-id"
              label="Run ID"
              placeholder="e.g. expensive_dryrun_1772634401_..."
              value={runId}
              onChange={e => setRunId(e.target.value)}
              fullWidth
              size="small"
            />
            <Button
              type="submit"
              disabled={!runId.trim()}
              variant="contained"
              endIcon={<ArrowRight className="h-4 w-4" />}>
              Explore Run
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
