"use client";

import { Plus, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LeadCreateDialog } from "./components/lead-create-dialog";
import { LeadListCard } from "./components/lead-list-card";
import { LeadListFilters } from "./components/lead-list-filters";
import { ScopePanel } from "./components/scope-panel";
import { Alert } from "./components/shared";
import { useLeadListController } from "./hooks/use-lead-list-controller";

export function LeadsScreen() {
  const leads = useLeadListController();
  const actions = leads.actions;

  if (leads.user?.role === "LEAD_CALLER") {
    return (
      <AppShell user={leads.user}>
        <Card className="p-[var(--card-padding)]">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 size-[var(--icon-md)] text-[var(--color-danger)]" />
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">
                Lead Management is not available
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Your role can work from assigned calling flows, but does not have access to the Lead list.
              </p>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell user={leads.user}>
      <div className="space-y-[var(--space-6)]">
        <PageHeader
          title="Leads"
          description="Review scoped Lead records and create new Branch Leads."
          actions={
            <Button
              className="gap-2"
              disabled={!leads.canRequestLeads}
              onClick={actions.openCreateDialog}
            >
              <Plus className="size-[var(--icon-sm)]" />
              New Lead
            </Button>
          }
        />

        <ScopePanel
          branches={leads.branches}
          effectiveBranchId={leads.effectiveBranchId}
          isLoading={leads.isScopeLoading}
          organizations={leads.organizations}
          selectedBranch={leads.selectedBranch}
          selectedBranchId={leads.selectedBranchId}
          selectedOrganization={leads.selectedOrganization}
          selectedOrganizationId={leads.selectedOrganizationId}
          setSelectedBranchId={actions.setSelectedBranchId}
          setSelectedOrganizationId={actions.setSelectedOrganizationId}
          user={leads.user}
        />

        {leads.notice ? (
          <Alert tone="success" onDismiss={actions.dismissNotice}>
            {leads.notice}
          </Alert>
        ) : null}
        {leads.error ? (
          <Alert tone="danger" onDismiss={actions.dismissError}>
            {leads.error}
          </Alert>
        ) : null}
        {leads.metadataWarning ? (
          <Alert tone="warning" onDismiss={actions.dismissMetadataWarning}>
            {leads.metadataWarning}
          </Alert>
        ) : null}

        <LeadListFilters
          activePrograms={leads.activePrograms}
          assignees={leads.assignees}
          filters={leads.filters}
          onReset={actions.resetFilters}
          search={leads.search}
          setFilters={actions.setFilters}
          setSearch={actions.setSearch}
        />

        <LeadListCard
          canRequestLeads={leads.canRequestLeads}
          isListLoading={leads.isListLoading}
          isMetadataLoading={leads.isMetadataLoading}
          leads={leads.leads}
          meta={leads.meta}
          onOpenLead={actions.openLeadProfile}
          onPageChange={actions.setPage}
          onRefresh={() => void actions.refreshList()}
        />
      </div>

      <LeadCreateDialog
        activeGoals={leads.activeGoals}
        activePrograms={leads.activePrograms}
        assignees={leads.assignees}
        branchBatches={leads.branchBatches}
        canRequestLeads={leads.canRequestLeads}
        form={leads.form}
        formError={leads.formError}
        isOpen={leads.isCreateOpen}
        isSaving={leads.isSaving}
        onClose={() => actions.setIsCreateOpen(false)}
        onErrorDismiss={actions.dismissFormError}
        onFormChange={actions.setForm}
        onLocateConflict={actions.locateConflict}
        onSubmit={actions.submitLead}
        phoneConflict={leads.phoneConflict}
      />
    </AppShell>
  );
}
