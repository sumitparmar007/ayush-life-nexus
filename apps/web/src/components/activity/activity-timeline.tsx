"use client";

import * as React from "react";
import { type ActivityItem } from "@/types/activity.ts";
import { ActivityCard } from "./activity-card.tsx";
import { isToday, isYesterday, isThisWeek, format } from "date-fns";

interface ActivityTimelineProps {
  activities: ActivityItem[];
  onMarkRead?: (id: string) => void;
}

interface GroupedActivities {
  label: string;
  items: ActivityItem[];
}

export function ActivityTimeline({
  activities,
  onMarkRead,
}: ActivityTimelineProps) {
  // Group activities chronologically
  const grouped = React.useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {
      Today: [],
      Yesterday: [],
      "Earlier this week": [],
    };
    const olderGroups: Record<string, ActivityItem[]> = {};

    for (const item of activities) {
      const date = item.timestamp;
      if (isToday(date)) {
        groups["Today"].push(item);
      } else if (isYesterday(date)) {
        groups["Yesterday"].push(item);
      } else if (isThisWeek(date)) {
        groups["Earlier this week"].push(item);
      } else {
        const monthYear = format(date, "MMMM yyyy");
        if (!olderGroups[monthYear]) {
          olderGroups[monthYear] = [];
        }
        olderGroups[monthYear].push(item);
      }
    }

    const result: GroupedActivities[] = [];
    if (groups["Today"].length > 0) {
      result.push({ label: "Today", items: groups["Today"] });
    }
    if (groups["Yesterday"].length > 0) {
      result.push({ label: "Yesterday", items: groups["Yesterday"] });
    }
    if (groups["Earlier this week"].length > 0) {
      result.push({ label: "Earlier this week", items: groups["Earlier this week"] });
    }
    for (const [label, items] of Object.entries(olderGroups)) {
      result.push({ label, items });
    }

    return result;
  }, [activities]);

  return (
    <div className="flex flex-col gap-6">
      {grouped.map((group) => (
        <div key={group.label} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </h3>
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {group.items.length} {group.items.length === 1 ? "event" : "events"}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {group.items.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
