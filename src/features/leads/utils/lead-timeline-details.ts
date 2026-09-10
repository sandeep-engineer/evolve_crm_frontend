import type { LeadTimelineEvent } from "@/lib/api/leads";
import {
  formatDateTime,
  formatDays,
  formatEnum,
  formatPreferredTime,
} from "./lead-formatters";

export function timelineDetails(event: LeadTimelineEvent) {
  const metadata = objectMetadata(event.metadata);
  if (event.eventType === "LEAD_CREATED") {
    const profile = objectMetadata(metadata.profile);
    const phones = objectMetadata(metadata.phones);
    const assignment = objectMetadata(metadata.assignment);
    return compactDetails([
      detail("Lead", stringValue(profile.fullName)),
      detail("Source", enumValue(profile.source)),
      detail("Primary phone", stringValue(phones.primary)),
      detail("Programs", snapshotNames(metadata.interests)),
      detail("Goals", snapshotNames(metadata.goals)),
      detail("Assigned to", userValue(assignment)),
    ]);
  }
  if (event.eventType === "LEAD_PROFILE_UPDATED") {
    const changes = objectMetadata(metadata.changes);
    return Object.entries(changes)
      .slice(0, 8)
      .map(([field, change]) => {
        const changeRecord = objectMetadata(change);
        return detail(formatEnum(field), `${timelineValue(changeRecord.before)} -> ${timelineValue(changeRecord.after)}`);
      });
  }
  if (event.eventType === "LEAD_ASSIGNMENT_CHANGED") {
    return compactDetails([
      detail("Previous assignee", userValue(objectMetadata(metadata.previousAssignedUser))),
      detail("New assignee", userValue(objectMetadata(metadata.newAssignedUser))),
    ]);
  }
  if (event.eventType === "LEAD_VISIT_RECORDED") {
    const captured = objectMetadata(metadata.capturedPreferences);
    return compactDetails([
      detail("Visit date", dateValue(metadata.visitedAt)),
      detail("Programs", snapshotNames(metadata.programs)),
      detail("Captured intent", enumValue(captured.currentIntent)),
      detail("Preferred days", Array.isArray(captured.preferredDays) ? formatDays(numberArray(captured.preferredDays)) : null),
      detail("Preferred time", formatPreferredTime(stringValue(captured.preferredStartTime), stringValue(captured.preferredEndTime))),
      detail("Next action", stringValue(metadata.nextActionNote)),
    ]);
  }
  if (event.eventType.startsWith("FOLLOW_UP_")) {
    const followUp = objectMetadata(
      event.eventType === "FOLLOW_UP_RESCHEDULED"
        ? metadata.replacementFollowUp
        : metadata.followUp,
    );
    return compactDetails([
      detail("Scheduled for", dateValue(followUp.scheduledAt)),
      detail("Channel", enumValue(followUp.channel)),
      detail("Status", enumValue(followUp.status)),
      detail("Assigned to", userValue(objectMetadata(metadata.assignee))),
      detail("Reason", stringValue(metadata.reason) ?? stringValue(followUp.reasonDetails)),
      detail("Completed at", dateValue(followUp.completedAt)),
      detail("Cancelled at", dateValue(followUp.cancelledAt)),
    ]);
  }
  if (event.eventType === "LEAD_CONTACT_RECORDED") {
    const contact = objectMetadata(metadata.contact);
    return compactDetails([
      detail("Contacted at", dateValue(contact.contactedAt)),
      detail("Channel", enumValue(contact.channel)),
      detail("Outcome", enumValue(contact.outcome)),
      detail("Notes", stringValue(contact.notes)),
    ]);
  }
  if (event.eventType === "LEAD_NOTE_ADDED") {
    return compactDetails([detail("Note", stringValue(metadata.body))]);
  }
  if (event.eventType === "LEAD_MARKED_LOST") {
    return compactDetails([
      detail("Previous stage", enumValue(metadata.previousStage)),
      detail("Previous status", enumValue(metadata.previousStatus)),
      detail("Lost reason", enumValue(metadata.lostReason)),
      detail("Lost explanation", stringValue(metadata.lostExplanation)),
      detail("Cancelled follow-ups", cancelledFollowUpsValue(metadata.cancelledFollowUps)),
    ]);
  }
  if (event.eventType === "LEAD_REENGAGED") {
    return compactDetails([
      detail("Restored stage", enumValue(metadata.restoredStage)),
      detail("New status", enumValue(metadata.newStatus)),
      detail("Previous lost reason", enumValue(metadata.previousLostReason)),
      detail("Note", stringValue(metadata.note)),
    ]);
  }
  if (event.eventType === "LEAD_ARCHIVED") {
    return compactDetails([
      detail("Previous stage", enumValue(metadata.previousStage)),
      detail("Previous status", enumValue(metadata.previousStatus)),
      detail("Reason", stringValue(metadata.reason)),
      detail("Cancelled follow-ups", cancelledFollowUpsValue(metadata.cancelledFollowUps)),
    ]);
  }
  if (event.eventType === "LEAD_REACTIVATED") {
    return compactDetails([
      detail("Restored stage", enumValue(metadata.restoredStage)),
      detail("Restored status", enumValue(metadata.restoredStatus)),
      detail("Reason", stringValue(metadata.reason)),
    ]);
  }
  return [detail("Metadata version", String(event.metadataVersion))];
}

function detail(label: string, value: string | null) {
  return { label, value: value || "Not set" };
}

function compactDetails(details: Array<{ label: string; value: string }>) {
  return details.filter((item) => item.value !== "Not set");
}

function objectMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function enumValue(value: unknown) {
  const text = stringValue(value);
  return text ? formatEnum(text) : null;
}

function dateValue(value: unknown) {
  const text = stringValue(value);
  return text ? formatDateTime(text) : null;
}

function snapshotNames(value: unknown) {
  if (!Array.isArray(value)) return null;
  const names = value
    .map((item) => {
      const record = objectMetadata(item);
      return stringValue(record.name) ?? stringValue(record.programNameSnapshot);
    })
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(", ") : null;
}

function userValue(value: Record<string, unknown>) {
  const name = stringValue(value.name);
  if (!name) return null;
  const role = enumValue(value.role);
  return role ? `${name} (${role})` : name;
}

function timelineValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not set";
  if (Array.isArray(value)) {
    const numbers = numberArray(value);
    if (numbers.length === value.length) return formatDays(numbers);
    return value.map(timelineValue).join(", ");
  }
  const record = objectMetadata(value);
  if (Object.keys(record).length) {
    return userValue(record) ?? stringValue(record.name) ?? stringValue(record.id) ?? "Recorded";
  }
  return enumValue(value) ?? stringValue(value) ?? "Recorded";
}

function numberArray(value: unknown[]) {
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));
}

function cancelledFollowUpsValue(value: unknown) {
  const record = objectMetadata(value);
  const count = stringValue(record.count);
  if (!count || count === "0") return null;
  const truncated = record.truncated === true ? " or more" : "";
  return `${count}${truncated} cancelled`;
}
