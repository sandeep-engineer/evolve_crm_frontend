import type { LeadProfileTab } from "./types";

const leadTabSegments: Record<Exclude<LeadProfileTab, "profile">, string> = {
  contacts: "contacts",
  followups: "follow-ups",
  timeline: "timeline",
  visits: "visits",
};

export function leadProfilePath(leadId: string) {
  return `/leads/${encodeURIComponent(leadId)}`;
}

export function leadProfileTabPath(leadId: string, tab: LeadProfileTab) {
  const basePath = leadProfilePath(leadId);
  if (tab === "profile") return basePath;
  return `${basePath}/${leadTabSegments[tab]}`;
}

export function leadListSearchPath(search: string) {
  const query = search.trim();
  return query ? `/leads?search=${encodeURIComponent(query)}` : "/leads";
}
