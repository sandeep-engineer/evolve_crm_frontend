"use client";

import { cloneElement, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  BadgeInfo,
  BellDot,
  CircleUserRound,
  Link2,
  Megaphone,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Smile,
  Tag,
  User,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InitialAvatar } from "@/components/ui/initial-avatar";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/lib/api/auth";
import { getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type InboxTab = "ALL" | "MEMBERS" | "LEADS" | "UNCLASSIFIED";
type Channel = "whatsapp" | "instagram" | "facebook";
type ConversationType = "Member" | "Lead" | "Unclassified" | "Former member";
type Tone = "blue" | "green" | "orange" | "purple" | "red" | "teal";

type Conversation = {
  id: string;
  name: string;
  handle: string;
  type: ConversationType;
  channel: Channel;
  time: string;
  preview: string;
  note?: string;
  unread?: number;
  tone: Tone;
};

const conversations: Conversation[] = [
  {
    id: "kavya",
    name: "Kavya Pillai",
    handle: "@kavya_pillai",
    type: "Member",
    channel: "whatsapp",
    time: "10:42 AM",
    preview: "Yes, how can I renew it?",
    unread: 2,
    tone: "green",
  },
  {
    id: "rahul",
    name: "Rahul Sharma",
    handle: "@rahul_fit",
    type: "Unclassified",
    channel: "instagram",
    time: "10:31 AM",
    note: "Instagram Ad",
    preview: "What are the MMA batch timings?",
    tone: "purple",
  },
  {
    id: "neha",
    name: "Neha Joshi",
    handle: "@neha_j",
    type: "Lead",
    channel: "facebook",
    time: "10:18 AM",
    preview: "Can I book a trial for tomorrow?",
    unread: 1,
    tone: "blue",
  },
  {
    id: "pooja",
    name: "Pooja Agarwal",
    handle: "+91 98760 33445",
    type: "Member",
    channel: "whatsapp",
    time: "9:54 AM",
    preview: "I have completed the payment",
    tone: "green",
  },
  {
    id: "arjun",
    name: "Arjun Nair",
    handle: "+91 88990 12345",
    type: "Former member",
    channel: "whatsapp",
    time: "Yesterday",
    preview: "Thank you",
    tone: "orange",
  },
  {
    id: "meera",
    name: "Meera Nair",
    handle: "@meera_n",
    type: "Lead",
    channel: "instagram",
    time: "Yesterday",
    preview: "Is yoga available in the evening?",
    tone: "red",
  },
];

const tabs: { label: string; value: InboxTab; count: number }[] = [
  { label: "All", value: "ALL", count: 12 },
  { label: "Members", value: "MEMBERS", count: 4 },
  { label: "Leads", value: "LEADS", count: 3 },
  { label: "Unclassified", value: "UNCLASSIFIED", count: 2 },
];

const messageThread = [
  {
    id: "m1",
    author: "Rahul Sharma",
    direction: "in",
    text: "Hi, what are the MMA batch timings?",
    time: "10:31 AM",
  },
  {
    id: "m2",
    author: "Anjali Verma",
    direction: "out",
    text: "Hi Rahul! We have morning and evening MMA batches. Which time would you prefer?",
    time: "10:33 AM",
    meta: "Delivered",
  },
  {
    id: "m3",
    author: "Rahul Sharma",
    direction: "in",
    text: "Evening would be better. Can I book a trial?",
    time: "10:35 AM",
  },
];

export function InboxScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<InboxTab>("ALL");
  const [selectedId, setSelectedId] = useState("rahul");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "MEMBERS" &&
          ["Member", "Former member"].includes(conversation.type)) ||
        (activeTab === "LEADS" && conversation.type === "Lead") ||
        (activeTab === "UNCLASSIFIED" && conversation.type === "Unclassified");

      const matchesSearch =
        !query ||
        [conversation.name, conversation.handle, conversation.preview]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ||
    filteredConversations[0] ||
    conversations[0];

  return (
    <AppShell user={user}>
      <div className="space-y-[var(--space-5)]">
        <header className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-[var(--color-text)]">
              Inbox
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Manage customer conversations across every connected channel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-[var(--space-3)]">
            <span className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="size-2.5 rounded-full bg-[var(--color-success)]" />
              3 channels connected
            </span>
            <Button className="gap-2" variant="secondary">
              <Settings className="size-[var(--icon-sm)]" />
              Settings
            </Button>
          </div>
        </header>

        <section className="grid min-h-[46rem] gap-[var(--space-4)] xl:grid-cols-[22rem_minmax(0,1fr)_28rem]">
          <ConversationList
            activeTab={activeTab}
            conversations={filteredConversations}
            search={search}
            selectedId={selected.id}
            setActiveTab={setActiveTab}
            setSearch={setSearch}
            setSelectedId={setSelectedId}
          />
          <ConversationPanel conversation={selected} />
          <ContactDetails conversation={selected} />
        </section>
      </div>
    </AppShell>
  );
}

function ConversationList({
  activeTab,
  conversations,
  search,
  selectedId,
  setActiveTab,
  setSearch,
  setSelectedId,
}: {
  activeTab: InboxTab;
  conversations: Conversation[];
  search: string;
  selectedId: string;
  setActiveTab: (tab: InboxTab) => void;
  setSearch: (value: string) => void;
  setSelectedId: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--color-divider)] p-[var(--space-3)]">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              className="w-full pl-10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations..."
              type="search"
              value={search}
            />
          </label>
          <Button
            aria-label="Conversation filters"
            className="w-11 px-0"
            variant="secondary"
          >
            <SlidersHorizontal className="size-[var(--icon-sm)]" />
          </Button>
        </div>

        <div className="mt-[var(--space-3)] flex items-center gap-[var(--space-5)] text-sm">
          <button
            className="font-semibold text-[var(--color-primary)]"
            type="button"
          >
            All{" "}
            <span className="ml-1 rounded-full bg-[var(--blue-100)] px-1.5 py-0.5 text-xs">
              12
            </span>
          </button>
          <ChannelCounter channel="whatsapp" count={7} />
          <ChannelCounter channel="instagram" count={3} />
          <ChannelCounter channel="facebook" count={2} />
        </div>

        <div className="mt-[var(--space-3)] grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
          {tabs.map((tab) => (
            <button
              className={cn(
                "h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-secondary)]",
                activeTab === tab.value &&
                  "border-[var(--blue-200)] bg-[var(--blue-50)] text-[var(--color-primary)]",
              )}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[var(--color-divider)]">
        {conversations.map((conversation) => (
          <button
            className={cn(
              "flex w-full gap-[var(--space-3)] p-[var(--space-3)] text-left transition hover:bg-[var(--color-surface-hover)]",
              selectedId === conversation.id &&
                "bg-[var(--blue-50)] ring-1 ring-inset ring-[var(--blue-200)]",
            )}
            key={conversation.id}
            onClick={() => setSelectedId(conversation.id)}
            type="button"
          >
            <div className="relative shrink-0">
              <InitialAvatar
                className="size-12 text-sm"
                name={conversation.name}
                tone={conversation.tone}
              />
              <ChannelMark
                channel={conversation.channel}
                className="absolute -bottom-1 -right-1"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text)]">
                  {conversation.name}
                </p>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {conversation.time}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <TypePill type={conversation.type} />
                {conversation.note ? (
                  <span className="text-xs font-medium text-[var(--color-primary)]">
                    {conversation.note}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-secondary)]">
                  {conversation.preview}
                </p>
                {conversation.unread ? (
                  <span className="grid size-6 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-text-inverse)]">
                    {conversation.unread}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ConversationPanel({ conversation }: { conversation: Conversation }) {
  return (
    <Card className="flex min-h-[38rem] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-[var(--space-3)] border-b border-[var(--color-divider)] p-[var(--space-4)]">
        <InitialAvatar
          className="size-14 text-lg"
          name={conversation.name}
          tone={conversation.tone}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-[var(--color-text)]">
            {conversation.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <ChannelMark channel={conversation.channel} />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {conversation.handle}
            </span>
            <TypePill type={conversation.type} />
          </div>
        </div>
        <IconButton label="Search conversation">
          <Search className="size-[var(--icon-md)]" />
        </IconButton>
        <IconButton label="Contact profile">
          <User className="size-[var(--icon-md)]" />
        </IconButton>
        <IconButton label="More actions">
          <MoreVertical className="size-[var(--icon-md)]" />
        </IconButton>
      </div>

      <div className="p-[var(--space-4)]">
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--blue-200)] bg-[var(--blue-50)] px-3 py-2 text-sm text-[var(--color-text)]">
          <Megaphone className="size-[var(--icon-sm)] text-[var(--color-primary)]" />
          <span className="min-w-0 flex-1 truncate">
            Started from Instagram Ad - MMA August Campaign
          </span>
          <button
            className="font-semibold text-[var(--color-primary)]"
            type="button"
          >
            View ad
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-[var(--space-4)] overflow-auto px-[var(--space-4)] pb-[var(--space-4)]">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span className="h-px flex-1 bg-[var(--color-divider)]" />
          Today
          <span className="h-px flex-1 bg-[var(--color-divider)]" />
        </div>

        {messageThread.map((message) => (
          <div
            className={cn(
              "flex items-end gap-3",
              message.direction === "out" && "justify-end",
            )}
            key={message.id}
          >
            {message.direction === "in" ? (
              <InitialAvatar name={message.author} tone={conversation.tone} />
            ) : null}
            <div
              className={cn(
                "max-w-[min(28rem,80%)] rounded-[var(--radius-lg)] border px-4 py-3 text-sm leading-6 shadow-[var(--shadow-xs)]",
                message.direction === "out"
                  ? "border-[var(--blue-200)] bg-[var(--blue-50)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]",
              )}
            >
              <p>{message.text}</p>
              <div className="mt-2 flex justify-end gap-2 text-xs text-[var(--color-text-secondary)]">
                <span>{message.time}</span>
                {message.meta ? <span>{message.meta}</span> : null}
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 py-[var(--space-4)] text-sm text-[var(--color-text-secondary)]">
          <span className="h-px flex-1 bg-[var(--color-divider)]" />
          <CircleUserRound className="size-[var(--icon-sm)]" />
          Conversation is unassigned
          <span className="h-px flex-1 bg-[var(--color-divider)]" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            "Share evening batches",
            "Book a trial",
            "Request phone number",
          ].map((label) => (
            <Button className="w-full" key={label} variant="secondary">
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--blue-200)] bg-[var(--blue-50)] px-3 py-3 text-sm text-[var(--color-text-secondary)]">
          <BadgeInfo className="size-[var(--icon-sm)] text-[var(--color-primary)]" />
          Create or link a CRM record before scheduling a trial.
        </div>
      </div>

      <div className="border-t border-[var(--color-divider)] p-[var(--space-3)]">
        <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
          <IconButton label="Attach file">
            <Paperclip className="size-[var(--icon-md)]" />
          </IconButton>
          <Input
            className="min-w-0 flex-1 border-0 shadow-none focus:shadow-none"
            placeholder="Type a reply..."
          />
          <Button className="gap-2" variant="secondary">
            <BellDot className="size-[var(--icon-sm)]" />
            Templates
          </Button>
          <IconButton label="Emoji">
            <Smile className="size-[var(--icon-md)]" />
          </IconButton>
          <Button className="gap-2">
            <Send className="size-[var(--icon-sm)]" />
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ContactDetails({ conversation }: { conversation: Conversation }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--color-divider)] p-[var(--space-4)]">
        <h2 className="text-base font-bold text-[var(--color-text)]">
          Contact details
        </h2>
        <div className="mt-[var(--space-4)] flex items-center gap-[var(--space-3)]">
          <InitialAvatar
            className="size-14 text-lg"
            name={conversation.name}
            tone={conversation.tone}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{conversation.name}</p>
            <div className="flex flex-wrap items-center gap-2">
              <ChannelMark channel={conversation.channel} />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {conversation.handle}
              </span>
              <TypePill type={conversation.type} />
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              First contacted 31 Aug 2026, 10:31 AM
            </p>
          </div>
        </div>

        <div className="mt-[var(--space-4)] flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--blue-200)] bg-[var(--blue-50)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
          <BadgeInfo className="size-[var(--icon-sm)] text-[var(--color-primary)]" />
          This sender is not connected to a CRM record.
        </div>

        <div className="mt-[var(--space-3)] grid gap-2">
          <Button>Create Lead</Button>
          <Button variant="secondary">Link Existing Record</Button>
          <Button className="text-[var(--color-primary)]" variant="ghost">
            Mark as Spam
          </Button>
        </div>
      </div>

      <DetailSection title="Source & attribution">
        <DetailRow icon={<MessageCircle />} label="Channel" value="Instagram" />
        <DetailRow icon={<Megaphone />} label="Source" value="Instagram Ad" />
        <DetailRow
          icon={<Tag />}
          label="Campaign"
          value="MMA August Campaign"
        />
        <DetailRow icon={<BadgeInfo />} label="Ad ID" value="IG-AD-2841" />
        <DetailRow
          icon={<Link2 />}
          label="Preferred branch"
          value="Not confirmed"
        />
      </DetailSection>

      <DetailSection
        action={
          <span className="text-xs font-semibold text-[var(--amber-700)]">
            2 possible matches found
          </span>
        }
        title="Possible CRM matches"
      >
        {["Rahul Sharma", "Rahul S."].map((name, index) => (
          <div className="flex items-center gap-3 py-2" key={name}>
            <InitialAvatar name={name} tone="purple" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">
                {index === 0
                  ? "Lead - Andheri West - +91 91234 56789"
                  : "Former member - Bandra"}
              </p>
            </div>
            <Button className="h-8 px-3" variant="secondary">
              Review
            </Button>
          </div>
        ))}
        <p className="text-xs text-[var(--color-text-secondary)]">
          Review before creating a new lead.
        </p>
      </DetailSection>

      <DetailSection title="Conversation">
        <DetailRow
          icon={<UserPlus />}
          label="Assigned to"
          value="Unassigned"
          action="Assign"
        />
        <DetailRow icon={<BadgeInfo />} label="Status" value="Open" />
        <DetailRow icon={<MessageCircle />} label="Language" value="English" />
        <DetailRow icon={<Tag />} label="Tags" value="New enquiry   MMA" />
      </DetailSection>

      <button
        className="flex w-full items-center gap-2 border-t border-[var(--color-divider)] p-[var(--space-4)] text-sm font-semibold text-[var(--color-primary)]"
        type="button"
      >
        <BadgeInfo className="size-[var(--icon-sm)]" />
        Add internal note
      </button>
    </Card>
  );
}

function ChannelCounter({
  channel,
  count,
}: {
  channel: Channel;
  count: number;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 text-[var(--color-text)]"
      type="button"
    >
      <ChannelMark channel={channel} />
      <span>{count}</span>
    </button>
  );
}

function ChannelMark({
  channel,
  className,
}: {
  channel: Channel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-5 place-items-center rounded-full text-white",
        channel === "whatsapp" && "bg-[var(--color-success)]",
        channel === "instagram" &&
          "bg-[linear-gradient(135deg,#7c3aed_0%,#e11d48_48%,#f97316_100%)]",
        channel === "facebook" && "bg-[var(--color-primary)]",
        className,
      )}
    >
      <ChannelGlyph channel={channel} />
    </span>
  );
}

function ChannelGlyph({ channel }: { channel: Channel }) {
  if (channel === "whatsapp") {
    return (
      <svg
        aria-hidden="true"
        className="size-3.5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M6.7 19.1 4 20l.9-2.6A8 8 0 1 1 6.7 19.1Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <path
          d="M8.8 8.7c.2-.5.4-.6.8-.6h.6c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.5.6c.7 1.3 1.7 2.3 3.1 3l.6-.5c.2-.2.5-.2.7-.1l1.8.8c.3.1.4.3.4.6v.6c0 .4-.1.6-.6.8-.5.2-1.2.3-1.9.2-3.5-.5-6.4-3.4-6.9-6.9-.1-.7 0-1.4.2-1.9Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (channel === "instagram") {
    return (
      <svg
        aria-hidden="true"
        className="size-3.5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <rect
          height="15"
          rx="4"
          stroke="currentColor"
          strokeWidth="2.2"
          width="15"
          x="4.5"
          y="4.5"
        />
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2" />
        <circle cx="16.5" cy="7.6" fill="currentColor" r="1.1" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="size-3.5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M14 8.3V6.8c0-.8.5-1.2 1.3-1.2h1.4V3.1c-.7-.1-1.5-.1-2.2-.1-2.3 0-3.8 1.4-3.8 3.9v1.4H8.2v2.8h2.5V21H14v-9.9h2.4l.4-2.8H14Z" />
    </svg>
  );
}

function TypePill({ type }: { type: ConversationType }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[var(--radius-sm)] px-2 text-xs font-semibold",
        type === "Member" && "bg-[var(--green-100)] text-[var(--green-700)]",
        type === "Lead" && "bg-[var(--violet-100)] text-[var(--violet-700)]",
        type === "Unclassified" &&
          "bg-[var(--blue-100)] text-[var(--color-text-secondary)]",
        type === "Former member" &&
          "bg-[var(--amber-100)] text-[var(--amber-700)]",
      )}
    >
      {type}
    </span>
  );
}

function IconButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="grid size-10 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
      type="button"
    >
      {children}
    </button>
  );
}

function DetailSection({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="border-b border-[var(--color-divider)] p-[var(--space-4)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[var(--color-text)]">{title}</h3>
        {action}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function DetailRow({
  action,
  icon,
  label,
  value,
}: {
  action?: string;
  icon: ReactElement<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-sm">
      <span className="text-[var(--color-text-secondary)]">
        {cloneElement(icon, {
          className: cn("size-[var(--icon-sm)]", icon.props.className),
        })}
      </span>
      <span className="min-w-0 flex-1 text-[var(--color-text-secondary)]">
        {label}
      </span>
      <span className="text-right font-medium text-[var(--color-text)]">
        {value}
      </span>
      {action ? (
        <button
          className="font-semibold text-[var(--color-primary)]"
          type="button"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
