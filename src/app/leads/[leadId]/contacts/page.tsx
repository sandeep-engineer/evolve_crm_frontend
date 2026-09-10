import { LeadProfileScreen } from "@/features/leads/lead-profile-screen";

type LeadRouteParams = Promise<{
  leadId: string;
}>

export default async function LeadProfilePage({
  params,
}: {
  params: LeadRouteParams;
}) {
  const { leadId } = await params;

  return <LeadProfileScreen activeTab="contacts" leadId={leadId} />;
}
