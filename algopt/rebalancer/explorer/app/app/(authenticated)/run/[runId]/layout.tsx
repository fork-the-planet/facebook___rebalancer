'use client';

import {IconButton, Tooltip} from '@mui/material';
import {ExternalLink, History, X} from 'lucide-react';
import {use} from 'react';

import {
  AssistantProvider,
  useAssistantContext,
} from '@/app/components/AssistantContext';
import {
  ASSISTANT_ENABLED,
  RebalancerExplorerAssistant,
} from '@platform/assistant-ui';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/app/components/Sidebar';
import {
  internalExplorerUrl,
  metamateConversationUrl,
} from '@platform/internal-links';
import UserInfo from '@/app/components/UserInfo';
import {ProblemMetadataProvider} from '@/lib/contexts/ProblemMetadataContext';
import {RebalancerHandleProvider} from '@/lib/contexts/RebalancerHandleContext';
import {WaitForSandbox} from '@/lib/contexts/WaitForSandbox';
import {decodeRunId} from '@/lib/run-id';

const ASSISTANT_PANEL_WIDTH = 480;

function AssistantPanel() {
  const {isOpen, close, view, toggleHistory, conversationId} =
    useAssistantContext();

  if (!ASSISTANT_ENABLED || !isOpen) {
    return null;
  }

  const isHistoryActive = view === 'history';
  const historyLabel = isHistoryActive ? 'Back to chat' : 'Chat history';
  const metamateUrl =
    conversationId != null ? metamateConversationUrl(conversationId) : null;

  return (
    <aside
      className="sticky top-0 h-screen flex flex-col border-l border-gray-300 bg-background shrink-0 self-start"
      style={{width: ASSISTANT_PANEL_WIDTH}}>
      <div className="flex h-12 items-center justify-between border-b border-gray-300 px-4 shrink-0">
        <span className="text-sm font-semibold">
          {isHistoryActive ? 'Chat history' : 'Rebalancer Assistant'}
        </span>
        <div className="flex items-center gap-1">
          {!isHistoryActive && metamateUrl != null && (
            <Tooltip title="Open in Metamate">
              <IconButton
                size="small"
                component="a"
                href={metamateUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in Metamate">
                <ExternalLink className="size-4" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={historyLabel}>
            <IconButton
              size="small"
              onClick={toggleHistory}
              aria-label={historyLabel}
              aria-pressed={isHistoryActive}
              sx={
                isHistoryActive
                  ? {backgroundColor: 'rgba(37, 99, 235, 0.12)'}
                  : undefined
              }>
              <History className="size-4" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={close}
            aria-label="Close Rebalancer Assistant">
            <X className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <RebalancerExplorerAssistant />
      </div>
    </aside>
  );
}
export default function RunLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{runId: string}>;
}) {
  const {runId} = use(params);
  const decodedRunId = decodeRunId(runId);
  const internalUrl = internalExplorerUrl(decodedRunId);

  return (
    <RebalancerHandleProvider runId={decodedRunId}>
      <WaitForSandbox>
        <ProblemMetadataProvider>
          <AssistantProvider>
            <SidebarProvider>
              <Sidebar />
              <SidebarInset>
                <header className="flex h-14 items-center justify-between border-b border-gray-300 px-4 shrink-0">
                  <SidebarTrigger />
                  <div className="flex items-center gap-3">
                    {internalUrl != null && (
                      <Tooltip title="Switch to internal version (opens in a new tab)">
                        <a
                          href={internalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
                          <ExternalLink className="h-4 w-4" />
                          Switch to internal version
                        </a>
                      </Tooltip>
                    )}
                    <UserInfo />
                  </div>
                </header>
                <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
                  {children}
                </div>
              </SidebarInset>
              <AssistantPanel />
            </SidebarProvider>
          </AssistantProvider>
        </ProblemMetadataProvider>
      </WaitForSandbox>
    </RebalancerHandleProvider>
  );
}
