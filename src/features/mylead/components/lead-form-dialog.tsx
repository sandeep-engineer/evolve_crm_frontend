"use client";

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import type { Batch } from "@/lib/api/batches";
import type { Goal } from "@/lib/api/goals";
import type { LeadPhoneConflictError } from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import type { LeadFormState } from "@/features/leads/types";
import { LeadForm } from "./lead-form";

type Props = {
  batches: Batch[];
  conflict: LeadPhoneConflictError | null;
  error: string;
  form: LeadFormState;
  goals: Goal[];
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (form: LeadFormState) => void;
  onLocateConflict: () => void;
  onSubmit: () => void;
  programs: Program[];
};

export function LeadFormDialog(props: Props) {
  return <Dialog open={props.isOpen} onClose={props.isSaving ? undefined : props.onClose} fullWidth maxWidth="md">
    <DialogTitle>New Lead</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        {props.error ? <Alert severity="error">{props.error}</Alert> : null}
        {props.conflict ? <Alert severity="warning" action={<Button color="inherit" onClick={props.onLocateConflict}>View existing</Button>}><Typography sx={{ fontWeight: 700 }}>This phone number already belongs to a Lead.</Typography></Alert> : null}
        <LeadForm form={props.form} onChange={props.onFormChange} programs={props.programs} goals={props.goals} batches={props.batches} />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" onClick={props.onClose} disabled={props.isSaving}>Cancel</Button><Button variant="contained" onClick={props.onSubmit} disabled={props.isSaving}>{props.isSaving ? "Creating..." : "Create Lead"}</Button></DialogActions>
  </Dialog>;
}
