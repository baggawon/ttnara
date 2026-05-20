"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { tether_category } from "@prisma/client";
import { groupRegions } from "@/helpers/tetherRegion";
import type { TetherRegionSelectionWithCategory } from "@/app/api/tethers/read";

const REGION_CHIP_CAP = 4;

export const TetherRegionGroups = ({
  regions,
  categories,
  selectedParentName,
  className,
}: {
  regions: TetherRegionSelectionWithCategory[];
  categories: tether_category[];
  selectedParentName?: string | null;
  className?: string;
}) => {
  const regionGroups = useMemo(
    () => groupRegions(regions, categories),
    [regions, categories]
  );

  const [activeParentId, setActiveParentId] = useState<number | null>(() => {
    if (selectedParentName) {
      const matched = regionGroups.find(
        (g) => g.parentName === selectedParentName
      );
      if (matched) return matched.parentId;
    }
    return regionGroups[0]?.parentId ?? null;
  });
  const [showAllRegions, setShowAllRegions] = useState(false);

  // Filter change → snap to matched parent if present.
  useEffect(() => {
    if (!selectedParentName) return;
    const matched = regionGroups.find(
      (g) => g.parentName === selectedParentName
    );
    if (matched) setActiveParentId(matched.parentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParentName]);

  // Data refresh → if active parent disappeared, fall back to first.
  useEffect(() => {
    if (regionGroups.length === 0) {
      setActiveParentId(null);
      return;
    }
    const stillExists = regionGroups.some((g) => g.parentId === activeParentId);
    if (!stillExists) setActiveParentId(regionGroups[0].parentId);
  }, [regionGroups, activeParentId]);

  // Reset expand state on tab switch.
  useEffect(() => {
    setShowAllRegions(false);
  }, [activeParentId]);

  if (regionGroups.length === 0) return null;

  const activeGroup =
    regionGroups.find((g) => g.parentId === activeParentId) ??
    regionGroups[0] ??
    null;
  const activeChildren = activeGroup?.children ?? [];
  const visibleChildren = showAllRegions
    ? activeChildren
    : activeChildren.slice(0, REGION_CHIP_CAP);
  const hiddenChildCount = activeChildren.length - visibleChildren.length;

  return (
    <div
      className={clsx("flex flex-col cursor-default w-full", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Parent tabs */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {regionGroups.map((g) => {
          const isActive = g.parentId === activeGroup?.parentId;
          return (
            <button
              key={g.parentId}
              type="button"
              onClick={() => setActiveParentId(g.parentId)}
              className={clsx(
                "text-xs font-medium px-3 py-1 rounded-full transition shadow-sm",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {g.parentName}
            </button>
          );
        })}
      </div>

      {/* Children — indented and visually subordinate */}
      {activeChildren.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-3 pt-2 border-t border-dashed border-border">
          {visibleChildren.map((r) => (
            <span
              key={r.id}
              className="text-[11px] font-normal py-0.5 px-2 rounded bg-muted/50 text-muted-foreground max-w-full whitespace-normal break-words text-left leading-snug"
            >
              {r.category?.name ?? ""}
            </span>
          ))}
          {hiddenChildCount > 0 && !showAllRegions && (
            <button
              type="button"
              className="text-[11px] text-blue-500 hover:underline px-1"
              onClick={() => setShowAllRegions(true)}
            >
              +{hiddenChildCount} 더보기
            </button>
          )}
          {showAllRegions && activeChildren.length > REGION_CHIP_CAP && (
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:underline px-1"
              onClick={() => setShowAllRegions(false)}
            >
              접기
            </button>
          )}
        </div>
      )}
    </div>
  );
};
