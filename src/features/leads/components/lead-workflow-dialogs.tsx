import type React from "react";
import { Dialog } from "@/components/ui/dialog";
import type { AuthUser } from "@/lib/api/auth";
import type {
  LeadAssigneeOption,
  LeadContactDetail,
  LeadFollowUpDetail,
  LeadFollowUpSummary,
  LeadVisitDetail,
} from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import type {
  CancelFollowUpFormState,
  CompleteFollowUpFormState,
  ContactFormState,
  FollowUpAction,
  FollowUpFormState,
  RescheduleFollowUpFormState,
  VisitFormState,
} from "../types";
import { followUpActionTitle } from "../utils/lead-formatters";
import {
  ContactDetailDialog,
  FollowUpDetailDialog,
  VisitDetailDialog,
} from "./lead-detail-dialogs";
import {
  FollowUpActionForm,
  RecordContactForm,
  RecordVisitForm,
  ScheduleFollowUpForm,
} from "./lead-forms";

export function LeadWorkflowDialogs({
  actionFollowUp,
  activePrograms,
  cancelFollowUpForm,
  closeFollowUpActionDialog,
  closeRecordContactDialog,
  closeRecordVisitDialog,
  closeScheduleFollowUpDialog,
  completeFollowUpForm,
  contactDetail,
  contactDetailError,
  contactForm,
  contactFormError,
  followUpAction,
  followUpActionError,
  followUpDetail,
  followUpDetailError,
  isContactDetailLoading,
  isContactDetailOpen,
  isFollowUpDetailLoading,
  isFollowUpDetailOpen,
  isRecordContactOpen,
  isRecordVisitOpen,
  isRecordingContact,
  isRecordingVisit,
  isScheduleFollowUpOpen,
  isSchedulingFollowUp,
  isSubmittingFollowUpAction,
  isVisitDetailLoading,
  isVisitDetailOpen,
  profileAssignees,
  rescheduleFollowUpForm,
  scheduleFollowUpError,
  scheduleFollowUpForm,
  setCancelFollowUpForm,
  setCompleteFollowUpForm,
  setContactDetail,
  setContactDetailError,
  setContactForm,
  setContactFormError,
  setFollowUpDetail,
  setFollowUpDetailError,
  setFollowUpActionError,
  setIsContactDetailOpen,
  setIsFollowUpDetailOpen,
  setIsVisitDetailOpen,
  setRescheduleFollowUpForm,
  setScheduleFollowUpError,
  setScheduleFollowUpForm,
  setVisitDetail,
  setVisitDetailError,
  setVisitForm,
  setVisitFormError,
  submitContact,
  submitFollowUpAction,
  submitScheduleFollowUp,
  submitVisit,
  user,
  visitDetail,
  visitDetailError,
  visitForm,
  visitFormError,
}: {
  actionFollowUp: LeadFollowUpSummary | null;
  activePrograms: Program[];
  cancelFollowUpForm: CancelFollowUpFormState;
  closeFollowUpActionDialog: () => void;
  closeRecordContactDialog: () => void;
  closeRecordVisitDialog: () => void;
  closeScheduleFollowUpDialog: () => void;
  completeFollowUpForm: CompleteFollowUpFormState;
  contactDetail: LeadContactDetail | null;
  contactDetailError: string;
  contactForm: ContactFormState;
  contactFormError: string;
  followUpAction: FollowUpAction | null;
  followUpActionError: string;
  followUpDetail: LeadFollowUpDetail | null;
  followUpDetailError: string;
  isContactDetailLoading: boolean;
  isContactDetailOpen: boolean;
  isFollowUpDetailLoading: boolean;
  isFollowUpDetailOpen: boolean;
  isRecordContactOpen: boolean;
  isRecordVisitOpen: boolean;
  isRecordingContact: boolean;
  isRecordingVisit: boolean;
  isScheduleFollowUpOpen: boolean;
  isSchedulingFollowUp: boolean;
  isSubmittingFollowUpAction: boolean;
  isVisitDetailLoading: boolean;
  isVisitDetailOpen: boolean;
  profileAssignees: LeadAssigneeOption[];
  rescheduleFollowUpForm: RescheduleFollowUpFormState;
  scheduleFollowUpError: string;
  scheduleFollowUpForm: FollowUpFormState;
  setCancelFollowUpForm: React.Dispatch<React.SetStateAction<CancelFollowUpFormState>>;
  setCompleteFollowUpForm: React.Dispatch<React.SetStateAction<CompleteFollowUpFormState>>;
  setContactDetail: React.Dispatch<React.SetStateAction<LeadContactDetail | null>>;
  setContactDetailError: (value: string) => void;
  setContactForm: React.Dispatch<React.SetStateAction<ContactFormState>>;
  setContactFormError: (value: string) => void;
  setFollowUpDetail: React.Dispatch<React.SetStateAction<LeadFollowUpDetail | null>>;
  setFollowUpDetailError: (value: string) => void;
  setFollowUpActionError: (value: string) => void;
  setIsContactDetailOpen: (value: boolean) => void;
  setIsFollowUpDetailOpen: (value: boolean) => void;
  setIsVisitDetailOpen: (value: boolean) => void;
  setRescheduleFollowUpForm: React.Dispatch<React.SetStateAction<RescheduleFollowUpFormState>>;
  setScheduleFollowUpError: (value: string) => void;
  setScheduleFollowUpForm: React.Dispatch<React.SetStateAction<FollowUpFormState>>;
  setVisitDetail: React.Dispatch<React.SetStateAction<LeadVisitDetail | null>>;
  setVisitDetailError: (value: string) => void;
  setVisitForm: React.Dispatch<React.SetStateAction<VisitFormState>>;
  setVisitFormError: (value: string) => void;
  submitContact: (event: React.FormEvent<HTMLFormElement>) => void;
  submitFollowUpAction: (event: React.FormEvent<HTMLFormElement>) => void;
  submitScheduleFollowUp: (event: React.FormEvent<HTMLFormElement>) => void;
  submitVisit: (event: React.FormEvent<HTMLFormElement>) => void;
  user: AuthUser | null;
  visitDetail: LeadVisitDetail | null;
  visitDetailError: string;
  visitForm: VisitFormState;
  visitFormError: string;
}) {
  return (
    <>
      <Dialog
        className="max-w-3xl"
        isOpen={isRecordVisitOpen}
        onClose={closeRecordVisitDialog}
        title="Record Visit"
      >
        <RecordVisitForm
          activePrograms={activePrograms}
          currentUser={user}
          form={visitForm}
          formError={visitFormError}
          isSaving={isRecordingVisit}
          onCancel={closeRecordVisitDialog}
          onChange={setVisitForm}
          onErrorDismiss={() => setVisitFormError("")}
          onSubmit={submitVisit}
        />
      </Dialog>

      <Dialog
        className="max-w-2xl"
        isOpen={isVisitDetailOpen}
        onClose={() => {
          setIsVisitDetailOpen(false);
          setVisitDetail(null);
          setVisitDetailError("");
        }}
        title="Visit detail"
      >
        <VisitDetailDialog
          error={visitDetailError}
          isLoading={isVisitDetailLoading}
          visit={visitDetail}
        />
      </Dialog>

      <Dialog
        className="max-w-3xl"
        isOpen={isScheduleFollowUpOpen}
        onClose={closeScheduleFollowUpDialog}
        title="Schedule Follow-up"
      >
        <ScheduleFollowUpForm
          assignees={profileAssignees}
          form={scheduleFollowUpForm}
          formError={scheduleFollowUpError}
          isSaving={isSchedulingFollowUp}
          onCancel={closeScheduleFollowUpDialog}
          onChange={setScheduleFollowUpForm}
          onErrorDismiss={() => setScheduleFollowUpError("")}
          onSubmit={submitScheduleFollowUp}
        />
      </Dialog>

      <Dialog
        className="max-w-3xl"
        isOpen={Boolean(followUpAction)}
        onClose={closeFollowUpActionDialog}
        title={followUpAction ? followUpActionTitle(followUpAction) : "Follow-up"}
      >
        <FollowUpActionForm
          action={followUpAction}
          assignees={profileAssignees}
          cancelForm={cancelFollowUpForm}
          completeForm={completeFollowUpForm}
          error={followUpActionError}
          followUp={actionFollowUp}
          isSaving={isSubmittingFollowUpAction}
          onCancel={closeFollowUpActionDialog}
          onCancelFormChange={setCancelFollowUpForm}
          onCompleteFormChange={setCompleteFollowUpForm}
          onErrorDismiss={() => setFollowUpActionError("")}
          onRescheduleFormChange={setRescheduleFollowUpForm}
          onSubmit={submitFollowUpAction}
          rescheduleForm={rescheduleFollowUpForm}
        />
      </Dialog>

      <Dialog
        className="max-w-2xl"
        isOpen={isFollowUpDetailOpen}
        onClose={() => {
          setIsFollowUpDetailOpen(false);
          setFollowUpDetail(null);
          setFollowUpDetailError("");
        }}
        title="Follow-up detail"
      >
        <FollowUpDetailDialog
          error={followUpDetailError}
          followUp={followUpDetail}
          isLoading={isFollowUpDetailLoading}
        />
      </Dialog>

      <Dialog
        className="max-w-3xl"
        isOpen={isRecordContactOpen}
        onClose={closeRecordContactDialog}
        title="Record Contact"
      >
        <RecordContactForm
          assignees={profileAssignees}
          currentUser={user}
          form={contactForm}
          formError={contactFormError}
          isSaving={isRecordingContact}
          onCancel={closeRecordContactDialog}
          onChange={setContactForm}
          onErrorDismiss={() => setContactFormError("")}
          onSubmit={submitContact}
        />
      </Dialog>

      <Dialog
        className="max-w-2xl"
        isOpen={isContactDetailOpen}
        onClose={() => {
          setIsContactDetailOpen(false);
          setContactDetail(null);
          setContactDetailError("");
        }}
        title="Contact detail"
      >
        <ContactDetailDialog
          contact={contactDetail}
          error={contactDetailError}
          isLoading={isContactDetailLoading}
        />
      </Dialog>
    </>
  );
}
