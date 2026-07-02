'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useParams, usePathname} from 'next/navigation';
import {Tooltip} from '@mui/material';
import {
  FileText,
  BarChart3,
  TrendingDown,
  Activity,
  ExternalLink,
  BookOpen,
  Users,
  Sparkles,
} from 'lucide-react';
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebarContext,
} from './sidebar/SidebarContext';
import {useProblemMetadata} from '@/lib/contexts/ProblemMetadataContext';
import {slugifyMetricName} from '@/lib/metric-slug';
import {decodeRunId, encodeRunId} from '@/lib/run-id';
import {SidebarMenuItem} from './sidebar/SidebarMenuItem';
import {EntitiesNavSection} from './sidebar/EntitiesNavSection';
import {useAssistantContext} from './AssistantContext';
import {ASSISTANT_ENABLED} from '@platform/assistant-ui';
import {
  rebalancerDocsUrl,
  rebalancerWorkplaceUrl,
  thriftExplorerUrl,
} from '@platform/internal-links';

export {SidebarProvider, SidebarTrigger};

interface NavItem {
  title: string;
  segment: string;
  icon: React.ComponentType<{className?: string}>;
}

const navigationItems: NavItem[] = [
  {title: 'Summary', segment: '', icon: FileText},
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{runId: string}>();
  // params.runId is a percent-encoded route segment; recover the real id.
  const runId = decodeRunId(params.runId);
  const {isOpen, isCollapsed, isMobileOpen, closeMobile} = useSidebarContext();
  const {metadata} = useProblemMetadata();
  const {isOpen: isAssistantOpen, toggle: toggleAssistant} =
    useAssistantContext();

  const basePath = `/run/${encodeRunId(runId)}`;
  const thriftUrl = thriftExplorerUrl(encodeRunId(runId));
  const docsUrl = rebalancerDocsUrl();
  const workplaceUrl = rebalancerWorkplaceUrl();

  const isItemActive = (segment: string) => {
    const fullPath = basePath + segment;
    if (segment === '') {
      return pathname === basePath || pathname === basePath + '/';
    }
    return pathname.startsWith(fullPath);
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-14 items-center border-b border-gray-300 px-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-3 text-foreground no-underline min-w-0"
          onClick={closeMobile}>
          <Image
            src="/favicon.gif"
            alt="Rebalancer Explorer"
            width={32}
            height={32}
            className="shrink-0 rounded-lg"
            unoptimized
          />
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-semibold leading-none whitespace-nowrap">
                Rebalancer Explorer
              </span>
              <Tooltip title={runId} placement="bottom">
                <span
                  className="text-xs text-muted-foreground truncate cursor-pointer hover:text-foreground"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(runId);
                  }}>
                  {runId}
                </span>
              </Tooltip>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          {navigationItems.map(item => (
            <SidebarMenuItem
              key={item.segment}
              href={basePath + item.segment}
              icon={item.icon}
              title={item.title}
              isActive={isItemActive(item.segment)}
              isCollapsed={isCollapsed && !isMobileOpen}
              onClick={closeMobile}
            />
          ))}
          {thriftUrl != null && (
            <SidebarMenuItem
              href={thriftUrl}
              icon={ExternalLink}
              title="Thrift Explorer"
              isActive={false}
              isCollapsed={isCollapsed && !isMobileOpen}
              onClick={closeMobile}
              tooltip="Thrift Explorer is a UI tool designed to help you debug the input and output thrift structures of your rebalancer instance"
              target="_blank"
            />
          )}
        </div>

        <EntitiesNavSection
          basePath={basePath}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          isItemActive={isItemActive}
          closeMobile={closeMobile}
        />

        {/* Evaluation */}
        <div className="space-y-1">
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Evaluation
            </div>
          )}
          <SidebarMenuItem
            href={`${basePath}/constraints-objectives`}
            icon={BarChart3}
            title="Constraints & Objectives"
            isActive={isItemActive('/constraints-objectives')}
            isCollapsed={isCollapsed && !isMobileOpen}
            onClick={closeMobile}
            tooltip="Evaluate constraints and objectives w.r.t. different assignments"
          />
          {(metadata?.metricCollectionNames?.length ?? 0) > 0 && (
            <SidebarMenuItem
              href={`${basePath}/metrics/${slugifyMetricName(metadata!.metricCollectionNames[0])}`}
              icon={TrendingDown}
              title="Metrics"
              isActive={isItemActive('/metrics/')}
              isCollapsed={isCollapsed && !isMobileOpen}
              onClick={closeMobile}
              tooltip="Evaluate metrics (e.g., container utilizations) w.r.t. different assignments"
            />
          )}
        </div>

        {/* Profiling */}
        <div className="space-y-1">
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Profiling
            </div>
          )}
          <SidebarMenuItem
            href={`${basePath}/local-search-profiling`}
            icon={Activity}
            title="Local Search"
            isActive={isItemActive('/local-search-profiling')}
            isCollapsed={isCollapsed && !isMobileOpen}
            onClick={closeMobile}
            tooltip="Per-objective local search solver telemetry"
          />
        </div>

        {/* Help */}
        <div className="space-y-1">
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Help
            </div>
          )}
          {ASSISTANT_ENABLED && (
            <SidebarMenuItem
              icon={Sparkles}
              title="Assistant"
              isActive={isAssistantOpen}
              isCollapsed={isCollapsed && !isMobileOpen}
              onActivate={toggleAssistant}
              tooltip="AI assistant to help you understand this rebalancer run"
            />
          )}
          {docsUrl != null && (
            <SidebarMenuItem
              href={docsUrl}
              icon={BookOpen}
              title="Documentation"
              isActive={false}
              isCollapsed={isCollapsed && !isMobileOpen}
              onClick={closeMobile}
              target="_blank"
            />
          )}
          {workplaceUrl != null && (
            <SidebarMenuItem
              href={workplaceUrl}
              icon={Users}
              title="Workplace Group"
              isActive={false}
              isCollapsed={isCollapsed && !isMobileOpen}
              onClick={closeMobile}
              target="_blank"
            />
          )}
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        data-state={isOpen ? 'expanded' : 'collapsed'}
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-gray-300 bg-background transition-[width] duration-200 ease-in-out md:flex"
        style={{width: 'var(--sidebar-width)'}}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-300 bg-background transition-transform duration-200 ease-in-out md:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}>
        {sidebarContent}
      </aside>
    </>
  );
}

export function SidebarInset({children}: {children: React.ReactNode}) {
  return (
    <main className="flex flex-1 flex-col min-w-0 overflow-hidden transition-[margin-left] duration-200 ease-in-out md:ml-[var(--sidebar-width)]">
      {children}
    </main>
  );
}
