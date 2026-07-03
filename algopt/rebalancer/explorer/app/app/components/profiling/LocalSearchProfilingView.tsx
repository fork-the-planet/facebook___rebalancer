'use client';

import {useEffect, useState} from 'react';

import {Alert, Skeleton, Typography} from '@mui/material';

import {useRebalancerHandle} from '@/lib/contexts/RebalancerHandleContext';
import {fetchLocalSearchProfiles} from '@/lib/rebalancer-explorer-api';
import type {LocalSearchProfile} from '@/lib/rebalancer-explorer-types';

import LocalSearchProfileCard from './LocalSearchProfileCard';

export default function LocalSearchProfilingView() {
  const {
    handle,
    loading: handleLoading,
    error: handleError,
  } = useRebalancerHandle();

  const [profiles, setProfiles] = useState<LocalSearchProfile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (handle == null) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setProfiles(null);

    fetchLocalSearchProfiles(handle)
      .then(response => {
        if (!cancelled) {
          setProfiles(response.profiles);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to fetch local search profiles',
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (handleLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton variant="rectangular" height={48} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (handleError != null) {
    return (
      <div className="p-4">
        <Alert severity="error">{handleError}</Alert>
      </div>
    );
  }

  if (handle == null) {
    return (
      <div className="p-4">
        <Alert severity="warning">No handle available</Alert>
      </div>
    );
  }

  if (loading && profiles == null) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton variant="rectangular" height={48} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (error != null) {
    return (
      <div className="p-4">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Typography variant="h5">Local Search Profiling</Typography>

      {profiles != null && profiles.length === 0 ? (
        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            No local search profiling data is available for this run.
          </Typography>
          <Typography variant="body2" component="div">
            This typically means one of the following:
            <ul className="list-disc ml-6 mt-1">
              <li>The run did not use the local-search solver.</li>
              <li>
                The solver encountered an exception before producing a solution.
              </li>
            </ul>
          </Typography>
        </Alert>
      ) : (
        profiles?.map((profile, i) => (
          <LocalSearchProfileCard key={i} goalIndex={i} profile={profile} />
        ))
      )}
    </div>
  );
}
