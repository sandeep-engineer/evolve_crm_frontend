"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { AuthApiError, getCurrentUser, type AuthUser } from "@/lib/api/auth";
import { LeadApiError } from "@/lib/api/leads";
import { clearSession, getAccessToken, getStoredUser, saveSession } from "@/lib/session";
import { LeadProfileDialog } from "./components/lead-profile-dialog";
import { LeadWorkflowDialogs } from "./components/lead-workflow-dialogs";
import { Alert } from "./components/shared";
import { useLeadContactsController } from "./hooks/use-lead-contacts-controller";
import { useLeadFollowUpsController } from "./hooks/use-lead-follow-ups-controller";
import { useLeadProfileDetailController } from "./hooks/use-lead-profile-detail-controller";
import { useLeadTimelineController } from "./hooks/use-lead-timeline-controller";
import { useLeadVisitsController } from "./hooks/use-lead-visits-controller";
import { leadListSearchPath, leadProfileTabPath } from "./lead-routes";
import type { LeadProfileTab } from "./types";

type LeadProfileScreenProps = {
  activeTab: LeadProfileTab;
  leadId: string;
};

export function LeadProfileScreen({ activeTab, leadId }: LeadProfileScreenProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notice, setNotice] = useState("");
  const canUseLeads = Boolean(user && user.role !== "LEAD_CALLER");

  const handleLeadApiError = useCallback((apiError: unknown) => {
    if (apiError instanceof LeadApiError && apiError.status === 401) {
      clearSession();
      router.replace("/");
      return true;
    }
    return false;
  }, [router]);

  const navigateToTab = useCallback((tab: LeadProfileTab) => {
    router.push(leadProfileTabPath(leadId, tab));
  }, [leadId, router]);

  useEffect(() => {
    const accessToken = getAccessToken();
    const storedUser = getStoredUser();
    if (!accessToken) {
      router.replace("/");
      return;
    }

    const currentToken = accessToken;
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser(currentToken);
        if (!isMounted) return;
        setUser(currentUser);
        saveSession(currentToken, currentUser);
      } catch (apiError) {
        if (apiError instanceof AuthApiError && apiError.status === 401) {
          clearSession();
          router.replace("/");
        }
      }
    }

    const timeout = window.setTimeout(() => {
      if (!isMounted) return;
      setToken(currentToken);
      setUser(storedUser);
      void loadCurrentUser();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [router]);

  const profile = useLeadProfileDetailController({
    canUseLeads,
    handleLeadApiError,
    leadId,
    setNotice,
    token,
  });
  const timeline = useLeadTimelineController({ activeTab, handleLeadApiError, leadId, token });
  const contacts = useLeadContactsController({
    activeTab,
    handleLeadApiError,
    lead: profile.lead,
    leadId,
    navigateToTab,
    profileAssignees: profile.assignees,
    refreshLeadProfile: profile.actions.refreshLeadProfile,
    refreshTimeline: timeline.actions.loadTimeline,
    setNotice,
    token,
  });
  const followUps = useLeadFollowUpsController({
    activeTab,
    handleLeadApiError,
    lead: profile.lead,
    leadId,
    navigateToTab,
    profileAssignees: profile.assignees,
    refreshContacts: contacts.actions.loadContacts,
    refreshLeadProfile: profile.actions.refreshLeadProfile,
    refreshTimeline: timeline.actions.loadTimeline,
    setNotice,
    token,
  });
  const visits = useLeadVisitsController({
    activePrograms: profile.activePrograms,
    activeTab,
    handleLeadApiError,
    lead: profile.lead,
    leadId,
    navigateToTab,
    refreshLeadProfile: profile.actions.refreshLeadProfile,
    refreshTimeline: timeline.actions.loadTimeline,
    setNotice,
    token,
  });

  if (user?.role === "LEAD_CALLER") {
    return (
      <AppShell user={user}>
        <Card className="p-[var(--card-padding)]">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 size-[var(--icon-md)] text-[var(--color-danger)]" />
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">
                Lead Management is not available
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Your role can work from assigned calling flows, but does not have access to Lead profiles.
              </p>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="space-y-[var(--space-6)]">
        {notice ? (
          <Alert tone="success" onDismiss={() => setNotice("")}>
            {notice}
          </Alert>
        ) : null}
        {profile.metadataWarning ? (
          <Alert tone="warning" onDismiss={profile.actions.dismissMetadataWarning}>
            {profile.metadataWarning}
          </Alert>
        ) : null}

        <Card className="p-[var(--space-5)]">
          <LeadProfileDialog
            activeGoals={profile.activeGoals}
            activePrograms={profile.activePrograms}
            assigneeError={profile.assigneeError}
            assigneeMeta={profile.assigneeMeta}
            assigneePage={profile.assigneePage}
            assigneeSearch={profile.assigneeSearch}
            assignees={profile.assignees}
            assignmentError={profile.assignmentError}
            assignmentValue={profile.assignmentValue}
            branchBatches={profile.branchBatches}
            contactChannelFilter={contacts.channelFilter}
            contactOutcomeFilter={contacts.outcomeFilter}
            contacts={contacts.contacts}
            contactsError={contacts.error}
            contactsMeta={contacts.meta}
            editConflict={profile.editConflict}
            followUpAssignedFilter={followUps.assignedFilter}
            followUpOverdueOnly={followUps.overdueOnly}
            followUpScheduledFrom={followUps.scheduledFrom}
            followUpScheduledTo={followUps.scheduledTo}
            followUpStatusFilter={followUps.statusFilter}
            followUps={followUps.followUps}
            followUpsError={followUps.error}
            followUpsMeta={followUps.meta}
            form={profile.editForm}
            isAssigneesLoading={profile.isAssigneesLoading}
            isContactsLoading={contacts.isLoading}
            isEditing={profile.isEditingProfile}
            isFollowUpsLoading={followUps.isLoading}
            isLoading={profile.isProfileLoading}
            isSavingAssignment={profile.isUpdatingAssignment}
            isSavingProfile={profile.isUpdatingProfile}
            isTimelineLoading={timeline.isLoading}
            isVisitsLoading={visits.isLoading}
            lead={profile.lead}
            onAssigneePageChange={profile.actions.setAssigneePage}
            onAssigneeSearchChange={profile.actions.setAssigneeSearch}
            onAssignmentChange={profile.actions.setAssignmentValue}
            onCancelEdit={profile.actions.cancelProfileEdit}
            onContactChannelFilterChange={contacts.actions.setChannelFilter}
            onContactOutcomeFilterChange={contacts.actions.setOutcomeFilter}
            onContactPageChange={contacts.actions.setPage}
            onContactsRetry={() => void contacts.actions.loadContacts(leadId)}
            onEdit={() => profile.actions.setIsEditingProfile(true)}
            onFieldChange={profile.actions.setEditForm}
            onFollowUpAction={followUps.actions.openActionDialog}
            onFollowUpAssignedFilterChange={followUps.actions.setAssignedFilter}
            onFollowUpOverdueOnlyChange={followUps.actions.setOverdueOnly}
            onFollowUpPageChange={followUps.actions.setPage}
            onFollowUpScheduledFromChange={followUps.actions.setScheduledFrom}
            onFollowUpScheduledToChange={followUps.actions.setScheduledTo}
            onFollowUpStatusFilterChange={followUps.actions.setStatusFilter}
            onFollowUpsRetry={() => void followUps.actions.loadFollowUps(leadId)}
            onLocateConflict={(conflict) => {
              router.push(leadListSearchPath(
                conflict.existingLead?.primaryPhone || conflict.existingLead?.fullName || profile.editForm.primaryPhone,
              ));
            }}
            onOpenContact={contacts.actions.openDetail}
            onOpenFollowUp={followUps.actions.openDetail}
            onOpenRecordContact={contacts.actions.openRecordDialog}
            onOpenRecordVisit={visits.actions.openRecordDialog}
            onOpenScheduleFollowUp={followUps.actions.openScheduleDialog}
            onOpenVisit={visits.actions.openDetail}
            onRetry={() => void profile.actions.refreshLeadProfile(leadId)}
            onSubmitAssignment={profile.actions.submitAssignmentChange}
            onSubmitProfile={profile.actions.submitProfileUpdate}
            onTabChange={navigateToTab}
            onTimelineEventTypeChange={timeline.actions.setEventType}
            onTimelinePageChange={timeline.actions.setPage}
            onTimelineRetry={() => void timeline.actions.loadTimeline(leadId)}
            onVisitPageChange={visits.actions.setPage}
            onVisitsRetry={() => void visits.actions.loadVisits(leadId)}
            profileError={profile.profileError}
            profileStatus={profile.profileStatus}
            profileTab={activeTab}
            timelineError={timeline.error}
            timelineEventType={timeline.eventType}
            timelineEvents={timeline.events}
            timelineMeta={timeline.meta}
            visits={visits.visits}
            visitsError={visits.error}
            visitsMeta={visits.meta}
          />
        </Card>
      </div>

      <LeadWorkflowDialogs
        actionFollowUp={followUps.actionFollowUp}
        activePrograms={profile.activePrograms}
        cancelFollowUpForm={followUps.cancelForm}
        closeFollowUpActionDialog={followUps.actions.closeActionDialog}
        closeRecordContactDialog={contacts.actions.closeRecordDialog}
        closeRecordVisitDialog={visits.actions.closeRecordDialog}
        closeScheduleFollowUpDialog={followUps.actions.closeScheduleDialog}
        completeFollowUpForm={followUps.completeForm}
        contactDetail={contacts.detail}
        contactDetailError={contacts.detailError}
        contactForm={contacts.form}
        contactFormError={contacts.formError}
        followUpAction={followUps.action}
        followUpActionError={followUps.actionError}
        followUpDetail={followUps.detail}
        followUpDetailError={followUps.detailError}
        isContactDetailLoading={contacts.isDetailLoading}
        isContactDetailOpen={contacts.isDetailOpen}
        isFollowUpDetailLoading={followUps.isDetailLoading}
        isFollowUpDetailOpen={followUps.isDetailOpen}
        isRecordContactOpen={contacts.isRecordOpen}
        isRecordVisitOpen={visits.isRecordOpen}
        isRecordingContact={contacts.isRecording}
        isRecordingVisit={visits.isRecording}
        isScheduleFollowUpOpen={followUps.isScheduleOpen}
        isSchedulingFollowUp={followUps.isScheduling}
        isSubmittingFollowUpAction={followUps.isSubmittingAction}
        isVisitDetailLoading={visits.isDetailLoading}
        isVisitDetailOpen={visits.isDetailOpen}
        profileAssignees={profile.assignees}
        rescheduleFollowUpForm={followUps.rescheduleForm}
        scheduleFollowUpError={followUps.scheduleError}
        scheduleFollowUpForm={followUps.scheduleForm}
        setCancelFollowUpForm={followUps.actions.setCancelForm}
        setCompleteFollowUpForm={followUps.actions.setCompleteForm}
        setContactDetail={contacts.actions.setDetail}
        setContactDetailError={contacts.actions.setDetailError}
        setContactForm={contacts.actions.setForm}
        setContactFormError={contacts.actions.setFormError}
        setFollowUpActionError={followUps.actions.setActionError}
        setFollowUpDetail={followUps.actions.setDetail}
        setFollowUpDetailError={followUps.actions.setDetailError}
        setIsContactDetailOpen={contacts.actions.setIsDetailOpen}
        setIsFollowUpDetailOpen={followUps.actions.setIsDetailOpen}
        setIsVisitDetailOpen={visits.actions.setIsDetailOpen}
        setRescheduleFollowUpForm={followUps.actions.setRescheduleForm}
        setScheduleFollowUpError={followUps.actions.setScheduleError}
        setScheduleFollowUpForm={followUps.actions.setScheduleForm}
        setVisitDetail={visits.actions.setDetail}
        setVisitDetailError={visits.actions.setDetailError}
        setVisitForm={visits.actions.setForm}
        setVisitFormError={visits.actions.setFormError}
        submitContact={contacts.actions.submitContact}
        submitFollowUpAction={followUps.actions.submitFollowUpAction}
        submitScheduleFollowUp={followUps.actions.submitScheduleFollowUp}
        submitVisit={visits.actions.submitVisit}
        user={user}
        visitDetail={visits.detail}
        visitDetailError={visits.detailError}
        visitForm={visits.form}
        visitFormError={visits.formError}
      />
    </AppShell>
  );
}
