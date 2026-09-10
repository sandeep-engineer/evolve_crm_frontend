"use client";

import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { ShieldX } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useMyleadProfile } from "./hooks/use-mylead-profile";
import { useMyleadWorkspace } from "./hooks/use-mylead-workspace";
import { FilterToolbar } from "./components/filter-toolbar";
import { LeadFormDialog } from "./components/lead-form-dialog";
import { LeadList } from "./components/lead-list";
import { LeadProfileDrawer } from "./components/lead-profile-drawer";
import { WorkspaceHeader } from "./components/workspace-header";

export function MyleadScreen() {
  const workspace = useMyleadWorkspace();
  const profile = useMyleadProfile({
    activeGoals: workspace.activeGoals,
    activePrograms: workspace.activePrograms,
    batches: workspace.branchBatches,
    handleError: workspace.handleError,
    leadId: workspace.selectedLeadId,
    onChanged: workspace.actions.loadLeads,
    token: workspace.token,
  });

  if (!workspace.user) {
    return <Stack sx={{ minHeight: "100vh", alignItems: "center", justifyContent: "center" }}><CircularProgress size={30} /></Stack>;
  }

  return <AppShell user={workspace.user}>
    {!workspace.canUseLeads ? <Blocked /> : <Box sx={{ minHeight: "calc(100vh - 72px)", bgcolor: "background.default" }}>
      <WorkspaceHeader
        user={workspace.user}
        organizations={workspace.organizations}
        organizationId={workspace.organizationId}
        branches={workspace.branches}
        branchId={workspace.branchId}
        canRequest={workspace.canRequest}
        isScopeLoading={workspace.isScopeLoading}
        search={workspace.search}
        onOrganizationChange={workspace.actions.setOrganizationId}
        onBranchChange={workspace.actions.setBranchId}
        onSearchChange={workspace.actions.setSearch}
        onCreate={workspace.actions.openCreate}
      />
      <FilterToolbar filters={workspace.filters} programs={workspace.activePrograms} onChange={workspace.actions.setFilters} onReset={workspace.actions.resetFilters} />
      {workspace.error ? <Alert severity="error" action={<Button color="inherit" onClick={workspace.actions.loadLeads}>Retry</Button>} sx={{ mx: { xs: 2, md: 3 }, mt: 2 }}>{workspace.error}</Alert> : null}
      {workspace.notice ? <Alert severity="success" onClose={() => workspace.actions.setNotice("")} sx={{ mx: { xs: 2, md: 3 }, mt: 2 }}>{workspace.notice}</Alert> : null}
      {!workspace.canRequest && !workspace.isScopeLoading ? <Stack sx={{ py: 8, px: 2, alignItems: "center" }}><Typography variant="h6">Choose a Lead scope</Typography><Typography color="text.secondary" variant="body2">Select an organization and Branch to view its Leads.</Typography></Stack> : <LeadList leads={workspace.leads} meta={workspace.meta} isLoading={workspace.isLoading} onOpen={workspace.actions.setSelectedLeadId} onPageChange={workspace.actions.setPage} />}
    </Box>}

    <LeadFormDialog
      isOpen={workspace.isCreateOpen}
      form={workspace.form}
      programs={workspace.activePrograms}
      goals={workspace.activeGoals}
      batches={workspace.branchBatches}
      conflict={workspace.conflict}
      error={workspace.formError}
      isSaving={workspace.isSaving}
      onClose={() => workspace.actions.setIsCreateOpen(false)}
      onFormChange={workspace.actions.setForm}
      onLocateConflict={workspace.actions.locateConflict}
      onSubmit={workspace.actions.createLead}
    />
    <LeadProfileDrawer
      open={Boolean(workspace.selectedLeadId)}
      lead={profile.lead}
      timeline={profile.timeline}
      isLoading={profile.isLoading}
      isTimelineLoading={profile.isTimelineLoading}
      error={profile.error}
      notice={profile.notice}
      isEditing={profile.isEditing}
      editForm={profile.editForm}
      taskKind={profile.taskKind}
      task={profile.task}
      taskError={profile.taskError}
      isSaving={profile.isSaving}
      programs={workspace.activePrograms}
      goals={workspace.activeGoals}
      batches={workspace.branchBatches}
      userRole={workspace.user.role}
      onClose={() => workspace.actions.setSelectedLeadId(null)}
      onEditOpen={() => profile.actions.setIsEditing(true)}
      onEditCancel={profile.actions.cancelEdit}
      onEditChange={profile.actions.setEditForm}
      onEditSave={profile.actions.saveProfile}
      onTaskOpen={profile.actions.openTask}
      onTaskClose={profile.actions.closeTask}
      onTaskChange={profile.actions.setTask}
      onTaskSubmit={profile.actions.submitTask}
    />
  </AppShell>;
}

function Blocked() {
  return <Stack spacing={1} sx={{ minHeight: "calc(100vh - 72px)", px: 3, textAlign: "center", alignItems: "center", justifyContent: "center" }}><ShieldX size={34} /><Typography variant="h5">Lead Management is unavailable</Typography><Typography color="text.secondary">Lead Callers do not have access to this workspace.</Typography></Stack>;
}
