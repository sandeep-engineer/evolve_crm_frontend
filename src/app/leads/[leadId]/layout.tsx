import type { ReactNode } from "react";
import { LeadProfileScreen } from "@/features/leads/lead-profile-screen";

export default async function LeadProfileLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;

  return (
    <LeadProfileScreen key={leadId} leadId={leadId}>
      {children}
    </LeadProfileScreen>
  );
}
