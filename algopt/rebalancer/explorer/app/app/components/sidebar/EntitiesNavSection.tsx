'use client';

import React from 'react';
import {Circle, Archive, Boxes, Ruler} from 'lucide-react';
import {useProblemMetadata} from '@/lib/contexts/ProblemMetadataContext';
import {SidebarMenuItem} from './SidebarMenuItem';
import {CollapsibleNavSection} from './CollapsibleNavSection';

interface EntitiesNavSectionProps {
  basePath: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isItemActive: (segment: string) => boolean;
  closeMobile: () => void;
}

export function EntitiesNavSection({
  basePath,
  isCollapsed,
  isMobileOpen,
  isItemActive,
  closeMobile,
}: EntitiesNavSectionProps) {
  const {metadata} = useProblemMetadata();
  const collapsed = isCollapsed && !isMobileOpen;

  if (!metadata) {
    return null;
  }

  const scopeNames = metadata.scopeNames ?? [];
  const dynamicDimensionNames = metadata.dynamicDimensionNames ?? [];

  const scopeItems = scopeNames.map(name => (
    <SidebarMenuItem
      key={`scope-${name}`}
      href={`${basePath}/entity/${encodeURIComponent(name)}`}
      icon={Boxes}
      title={name}
      isActive={isItemActive(`/entity/${encodeURIComponent(name)}`)}
      isCollapsed={collapsed}
      onClick={closeMobile}
    />
  ));

  const dynamicDimensionItems = dynamicDimensionNames.map(name => (
    <SidebarMenuItem
      key={`dd-${name}`}
      href={`${basePath}/dynamic-dimensions/${encodeURIComponent(name)}`}
      icon={Ruler}
      title={name}
      isActive={isItemActive(`/dynamic-dimensions/${encodeURIComponent(name)}`)}
      isCollapsed={collapsed}
      onClick={closeMobile}
    />
  ));

  return (
    <div className="space-y-1">
      {!collapsed && (
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Entities
        </div>
      )}

      <SidebarMenuItem
        href={`${basePath}/entity/${encodeURIComponent(metadata.objectName)}`}
        icon={Circle}
        title={metadata.objectName}
        isActive={isItemActive(
          `/entity/${encodeURIComponent(metadata.objectName)}`,
        )}
        isCollapsed={collapsed}
        onClick={closeMobile}
        tooltip="Object info"
      />
      <SidebarMenuItem
        href={`${basePath}/entity/${encodeURIComponent(metadata.containerName)}`}
        icon={Archive}
        title={metadata.containerName}
        isActive={isItemActive(
          `/entity/${encodeURIComponent(metadata.containerName)}`,
        )}
        isCollapsed={collapsed}
        onClick={closeMobile}
        tooltip="Container info"
      />

      {scopeNames.length > 0 && (
        <CollapsibleNavSection
          title="Scopes"
          icon={Boxes}
          isCollapsed={collapsed}>
          {scopeItems}
        </CollapsibleNavSection>
      )}

      {dynamicDimensionNames.length > 0 && (
        <CollapsibleNavSection
          title="Dynamic Dimensions"
          icon={Ruler}
          isCollapsed={collapsed}>
          {dynamicDimensionItems}
        </CollapsibleNavSection>
      )}
    </div>
  );
}
