export type DashboardSnapshot = {
  memberSummary: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    newClientsThisMonth: number;
    membershipExpiringSoon: number;
    pendingActivation: number;
    frozen: number;
    expired: number;
  };
  trialSummary: {
    trialsScheduled: number;
    trialsToday: number;
    awaitingDecision: number;
    convertedToMember: number;
    lostAfterTrial: number;
  };
  leadSummary: {
    totalLeads: number;
    newToday: number;
    notYetContacted: number;
    followUpDueToday: number;
    scheduledFollowUps: number;
    lostDeclined: number;
  };
  paymentDues: {
    totalPaymentDue: number;
    dueToday: number;
    overdue: number;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export async function getDashboardSnapshot(token: string) {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Unable to load dashboard.";
    throw new Error(message);
  }

  return data as DashboardSnapshot;
}
