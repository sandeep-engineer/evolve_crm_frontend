import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AuthUser } from "@/lib/api/auth";
import type { Branch } from "@/lib/api/branches";
import type { Organization } from "@/lib/api/organizations";
import { scopeDescription, shortId } from "../utils/lead-formatters";
import { SelectField } from "./form-controls";
import { ScopeValue } from "./shared";

export function ScopePanel({
  branches,
  effectiveBranchId,
  isLoading,
  organizations,
  selectedBranch,
  selectedBranchId,
  selectedOrganization,
  selectedOrganizationId,
  setSelectedBranchId,
  setSelectedOrganizationId,
  user,
}: {
  branches: Branch[];
  effectiveBranchId: string;
  isLoading: boolean;
  organizations: Organization[];
  selectedBranch: Branch | undefined;
  selectedBranchId: string;
  selectedOrganization: Organization | undefined;
  selectedOrganizationId: string;
  setSelectedBranchId: (branchId: string) => void;
  setSelectedOrganizationId: (organizationId: string) => void;
  user: AuthUser | null;
}) {
  const role = user?.role;

  return (
    <Card className="p-[var(--card-padding)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">
            Lead scope
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {scopeDescription(role)}
          </p>
        </div>
        {isLoading ? (
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            <Loader2 className="size-[var(--icon-sm)] animate-spin" />
            Loading scope
          </div>
        ) : null}
        <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2 lg:max-w-3xl">
          {role === "CRM_OWNER" ? (
            <SelectField
              label="Organization"
              onChange={(value) => {
                setSelectedOrganizationId(value);
                setSelectedBranchId("");
              }}
              options={[
                { label: "Select organization", value: "" },
                ...organizations.map((organization) => ({
                  label: organization.name,
                  value: organization.id,
                })),
              ]}
              value={selectedOrganizationId}
            />
          ) : (
            <ScopeValue
              label="Organization"
              value={selectedOrganization?.name || user?.organizationId || "Assigned organization"}
            />
          )}

          {role === "CRM_OWNER" || role === "ORGANIZATION_OWNER" ? (
            <SelectField
              disabled={role === "CRM_OWNER" && !selectedOrganizationId}
              label="Branch"
              onChange={setSelectedBranchId}
              options={[
                { label: "Select branch", value: "" },
                ...branches.map((branch) => ({
                  label: branch.name,
                  value: branch.id,
                })),
              ]}
              value={selectedBranchId}
            />
          ) : (
            <ScopeValue
              label="Branch"
              value={selectedBranch?.name || shortId(effectiveBranchId) || "Assigned branch"}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
