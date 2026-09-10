"use client";

import { Button, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Plus, Search } from "lucide-react";
import type { Branch } from "@/lib/api/branches";
import type { Organization } from "@/lib/api/organizations";
import type { AuthUser } from "@/lib/api/auth";

type Props = {
  branchId: string;
  branches: Branch[];
  canRequest: boolean;
  isScopeLoading: boolean;
  onBranchChange: (value: string) => void;
  onCreate: () => void;
  onOrganizationChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  organizationId: string;
  organizations: Organization[];
  search: string;
  user: AuthUser;
};

export function WorkspaceHeader(props: Props) {
  return (
    <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: 2.5, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
        <div>
          <Typography variant="h4">Lead Management</Typography>
          <Typography color="text.secondary" variant="body2">Track enquiries, conversations, visits and follow-ups.</Typography>
        </div>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={props.onCreate} disabled={!props.canRequest}>
          New Lead
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25}>
        {props.user.role === "CRM_OWNER" ? (
          <TextField select size="small" label="Organization" value={props.organizationId} onChange={(event) => props.onOrganizationChange(event.target.value)} sx={{ minWidth: 210 }}>
            <MenuItem value="">Select organization</MenuItem>
            {props.organizations.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
          </TextField>
        ) : null}
        {props.user.role === "CRM_OWNER" || props.user.role === "ORGANIZATION_OWNER" ? (
          <TextField select size="small" label="Branch" value={props.branchId} onChange={(event) => props.onBranchChange(event.target.value)} disabled={props.isScopeLoading || (props.user.role === "CRM_OWNER" && !props.organizationId)} sx={{ minWidth: 210 }}>
            <MenuItem value="">Select branch</MenuItem>
            {props.branches.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
          </TextField>
        ) : null}
        <TextField
          size="small"
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="Search by name, phone, email or Lead ID"
          sx={{ flex: 1, minWidth: { lg: 320 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> } }}
        />
      </Stack>
    </Stack>
  );
}
