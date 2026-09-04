"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarDays,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Home,
  IndianRupee,
  MoreVertical,
  Percent,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { InitialAvatar } from "@/components/ui/initial-avatar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AuthUser } from "@/lib/api/auth";
import { getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const tabs = ["Overview", "Collections", "Expenses", "Payment Dues"];

const cashFlow = [
  { month: "Mar 2026", collections: 1.2, expenses: 0.48, net: 0.72 },
  { month: "Apr 2026", collections: 1.35, expenses: 0.55, net: 0.8 },
  { month: "May 2026", collections: 1.42, expenses: 0.61, net: 0.81 },
  { month: "Jun 2026", collections: 1.58, expenses: 0.64, net: 0.94 },
  { month: "Jul 2026", collections: 1.72, expenses: 0.68, net: 1.04 },
  { month: "Aug 2026", collections: 1.85, expenses: 0.72, net: 1.13 },
];

const expenseBreakdown = [
  { label: "Rent", amount: "₹28,000", percent: "39%", color: "bg-[var(--color-primary)]" },
  { label: "Staff & Trainer", amount: "₹22,500", percent: "31%", color: "bg-[var(--color-success)]" },
  { label: "Equipment", amount: "₹9,800", percent: "14%", color: "bg-[var(--color-trial)]" },
  { label: "Utilities", amount: "₹7,000", percent: "10%", color: "bg-[var(--color-warning)]" },
  { label: "Other", amount: "₹5,000", percent: "6%", color: "bg-[var(--amber-400)]" },
];

const collectionMethods = [
  { label: "UPI", amount: "₹82,500", percent: 45 },
  { label: "Cash", amount: "₹46,000", percent: 25 },
  { label: "Card", amount: "₹35,000", percent: 19 },
  { label: "Bank transfer", amount: "₹21,000", percent: 11 },
];

const collectionTrend = [
  { date: "10 Aug", collected: 17, transactions: 5 },
  { date: "11 Aug", collected: 11, transactions: 4 },
  { date: "12 Aug", collected: 12, transactions: 4.5 },
  { date: "13 Aug", collected: 19, transactions: 7 },
  { date: "14 Aug", collected: 15, transactions: 5 },
  { date: "15 Aug", collected: 7, transactions: 3 },
  { date: "16 Aug", collected: 10, transactions: 4 },
  { date: "17 Aug", collected: 18, transactions: 6.5 },
  { date: "18 Aug", collected: 12, transactions: 4.5 },
  { date: "19 Aug", collected: 16, transactions: 6 },
  { date: "20 Aug", collected: 26, transactions: 9 },
  { date: "21 Aug", collected: 29, transactions: 12 },
  { date: "22 Aug", collected: 22, transactions: 8.5 },
  { date: "23 Aug", collected: 16, transactions: 6 },
];

const collectionRecords = [
  {
    dateTime: "23 Aug 2026, 10:42 AM",
    receipt: "R-2026-0842",
    member: "Kavya Pillai",
    purpose: "Monthly plan payment",
    method: "UPI",
    reference: "UPI/3289475612",
    amount: "+₹6,000",
    status: "Completed",
  },
  {
    dateTime: "23 Aug 2026, 09:30 AM",
    receipt: "R-2026-0841",
    member: "Rahul Sharma",
    purpose: "Quarterly plan payment",
    method: "Card",
    reference: "CARD/7745128893",
    amount: "+₹15,000",
    status: "Completed",
  },
  {
    dateTime: "22 Aug 2026, 07:15 PM",
    receipt: "R-2026-0840",
    member: "Neha Joshi",
    purpose: "Monthly plan payment",
    method: "UPI",
    reference: "UPI/2198347650",
    amount: "+₹6,000",
    status: "Completed",
  },
  {
    dateTime: "22 Aug 2026, 06:05 PM",
    receipt: "R-2026-0839",
    member: "Pooja Agarwal",
    purpose: "PT session pack (10)",
    method: "UPI",
    reference: "UPI/9938471201",
    amount: "+₹8,000",
    status: "Completed",
  },
  {
    dateTime: "22 Aug 2026, 04:50 PM",
    receipt: "R-2026-0838",
    member: "Arjun Nair",
    purpose: "Monthly plan payment",
    method: "Cash",
    reference: "CASH/0838",
    amount: "+₹6,000",
    status: "Completed",
  },
  {
    dateTime: "22 Aug 2026, 03:20 PM",
    receipt: "R-2026-0837",
    member: "Kavya Pillai",
    purpose: "Locker rent (Aug)",
    method: "Cash",
    reference: "CASH/0837",
    amount: "+₹1,000",
    status: "Completed",
  },
  {
    dateTime: "21 Aug 2026, 08:45 PM",
    receipt: "R-2026-0836",
    member: "Rahul Sharma",
    purpose: "Nutrition plan",
    method: "Card",
    reference: "CARD/5523110099",
    amount: "+₹3,500",
    status: "Completed",
  },
  {
    dateTime: "21 Aug 2026, 07:10 PM",
    receipt: "R-2026-0835",
    member: "Neha Joshi",
    purpose: "PT session pack (10)",
    method: "UPI",
    reference: "UPI/1182736455",
    amount: "+₹7,000",
    status: "Pending",
  },
  {
    dateTime: "20 Aug 2026, 06:30 PM",
    receipt: "R-2026-0834",
    member: "Pooja Agarwal",
    purpose: "Monthly plan payment",
    method: "Bank transfer",
    reference: "UTR/ICIC/423156789012",
    amount: "+₹6,000",
    status: "Completed",
  },
  {
    dateTime: "20 Aug 2026, 05:25 PM",
    receipt: "R-2026-0833",
    member: "Arjun Nair",
    purpose: "Refund - cancelled plan",
    method: "UPI",
    reference: "UPI/REF/88334122",
    amount: "-₹2,500",
    status: "Refunded",
  },
];

const expenseTrend = [
  { date: "25 Jul", amount: 4.2, previous: 4.8 },
  { date: "26 Jul", amount: 2.5, previous: 5.2 },
  { date: "27 Jul", amount: 7.5, previous: 4.1 },
  { date: "28 Jul", amount: 4.8, previous: 4.3 },
  { date: "29 Jul", amount: 2.6, previous: 3.1 },
  { date: "30 Jul", amount: 1.7, previous: 3.4 },
  { date: "31 Jul", amount: 4.2, previous: 2.9 },
  { date: "1 Aug", amount: 1.1, previous: 4.8 },
  { date: "2 Aug", amount: 6.7, previous: 3.2 },
  { date: "3 Aug", amount: 1.3, previous: 6.5 },
  { date: "4 Aug", amount: 3.7, previous: 4.1 },
  { date: "5 Aug", amount: 2.4, previous: 5.5 },
  { date: "6 Aug", amount: 4.3, previous: 3.5 },
  { date: "7 Aug", amount: 2.8, previous: 4.9 },
  { date: "8 Aug", amount: 2.0, previous: 3.6 },
  { date: "9 Aug", amount: 3.6, previous: 4.2 },
  { date: "10 Aug", amount: 2.9, previous: 3.1 },
  { date: "11 Aug", amount: 5.7, previous: 5.0 },
  { date: "12 Aug", amount: 8.2, previous: 3.7 },
  { date: "13 Aug", amount: 4.4, previous: 4.3 },
  { date: "14 Aug", amount: 1.4, previous: 5.4 },
  { date: "15 Aug", amount: 4.0, previous: 6.4 },
  { date: "16 Aug", amount: 3.1, previous: 6.3 },
  { date: "17 Aug", amount: 5.1, previous: 4.8 },
  { date: "18 Aug", amount: 1.4, previous: 3.2 },
  { date: "19 Aug", amount: 1.5, previous: 3.6 },
  { date: "20 Aug", amount: 2.6, previous: 3.5 },
  { date: "21 Aug", amount: 5.2, previous: 4.2 },
  { date: "22 Aug", amount: 7.2, previous: 7.0 },
  { date: "23 Aug", amount: 2.8, previous: 4.3 },
  { date: "24 Aug", amount: 3.5, previous: 6.2 },
  { date: "25 Aug", amount: 1.3, previous: 5.2 },
  { date: "26 Aug", amount: 2.5, previous: 4.5 },
  { date: "27 Aug", amount: 4.9, previous: 4.2 },
];

const expenseRecords = [
  {
    date: "23 Aug 2026",
    id: "EXP-00018",
    vendor: "Andheri Properties",
    description: "August branch rent",
    category: "Rent",
    method: "UPI",
    amount: "₹28,000",
    status: "Paid",
  },
  {
    date: "23 Aug 2026",
    id: "EXP-00017",
    vendor: "PowerFit Services",
    description: "Treadmill belt repair",
    category: "Equipment",
    method: "Bank transfer",
    amount: "₹3,500",
    status: "Pending",
  },
  {
    date: "22 Aug 2026",
    id: "EXP-00016",
    vendor: "Adani Electricity",
    description: "Electricity bill - Aug",
    category: "Utilities",
    method: "UPI",
    amount: "₹7,000",
    status: "Paid",
  },
  {
    date: "22 Aug 2026",
    id: "EXP-00015",
    vendor: "Rohit Nair",
    description: "Trainer payout",
    category: "Staff & Trainer",
    method: "Bank transfer",
    amount: "₹9,000",
    status: "Pending",
  },
  {
    date: "21 Aug 2026",
    id: "EXP-00014",
    vendor: "Metro Fitness Supply",
    description: "Boxing gloves (10 pairs)",
    category: "Equipment",
    method: "Card",
    amount: "₹6,300",
    status: "Paid",
  },
  {
    date: "20 Aug 2026",
    id: "EXP-00013",
    vendor: "AquaPure",
    description: "Water supply",
    category: "Utilities",
    method: "UPI",
    amount: "₹1,200",
    status: "Paid",
  },
  {
    date: "19 Aug 2026",
    id: "EXP-00012",
    vendor: "NetWave",
    description: "Internet broadband",
    category: "Utilities",
    method: "Card",
    amount: "₹899",
    status: "Cancelled",
  },
];

const agingSummary = [
  { label: "Not due yet", amount: "₹8,000", color: "bg-[var(--color-primary)]", width: "17%" },
  { label: "Due today", amount: "₹12,000", color: "bg-[var(--color-warning)]", width: "25%" },
  { label: "1-7 days overdue", amount: "₹16,000", color: "bg-[var(--color-danger)]", width: "28%" },
  { label: "8-30 days overdue", amount: "₹12,000", color: "bg-[var(--color-trial)]", width: "25%" },
  { label: "30+ days", amount: "₹0", color: "bg-[var(--gray-400)]", width: "5%" },
];

const paymentDues = [
  {
    member: "Kavya Pillai",
    phone: "+91 98765 43210",
    plan: "Monthly Calisthenics",
    dueDate: "22 Aug 2026",
    daysOverdue: "1 day",
    amount: "₹6,000",
    lastPayment: "21 Jul 2026\n₹6,000",
    followUp: "Today",
    status: "Overdue",
    tone: "purple",
  },
  {
    member: "Rahul Sharma",
    phone: "+91 91234 56789",
    plan: "Quarterly MMA",
    dueDate: "23 Aug 2026\nToday",
    daysOverdue: "-",
    amount: "₹15,000",
    lastPayment: "23 May 2026\n₹15,000",
    followUp: "Today",
    status: "Due today",
    tone: "green",
  },
  {
    member: "Neha Joshi",
    phone: "+91 99887 66554",
    plan: "Monthly Yoga",
    dueDate: "18 Aug 2026",
    daysOverdue: "5 days",
    amount: "₹6,000",
    lastPayment: "18 Jul 2026\n₹6,000",
    followUp: "Scheduled\n24 Aug 2026",
    status: "Overdue",
    tone: "orange",
  },
  {
    member: "Pooja Agarwal",
    phone: "+91 97654 32109",
    plan: "PT session pack",
    dueDate: "23 Aug 2026\nToday",
    daysOverdue: "-",
    amount: "₹8,000",
    lastPayment: "10 Jun 2026\n₹8,000",
    followUp: "Not contacted",
    status: "Due today",
    tone: "red",
  },
  {
    member: "Arjun Nair",
    phone: "+91 88990 12345",
    plan: "Monthly MMA",
    dueDate: "11 Aug 2026",
    daysOverdue: "12 days",
    amount: "₹7,000",
    lastPayment: "11 Jun 2026\n₹7,000",
    followUp: "Scheduled\n25 Aug 2026",
    status: "Overdue",
    tone: "blue",
  },
  {
    member: "Meera Nair",
    phone: "+91 91555 66778",
    plan: "Monthly Calisthenics\n(Renewal)",
    dueDate: "30 Aug 2026",
    daysOverdue: "-",
    amount: "₹6,000",
    lastPayment: "30 Jul 2026\n₹6,000",
    followUp: "Completed\n01 Aug 2026",
    status: "Upcoming",
    tone: "green",
  },
];

const transactions = [
  {
    date: "23 Aug 2026",
    description: "Membership payment",
    party: "Kavya Pillai",
    type: "Collection",
    method: "UPI",
    amount: "+₹6,000",
    status: "Completed",
  },
  {
    date: "23 Aug 2026",
    description: "Gym equipment repair",
    party: "PowerFit Services",
    type: "Expense",
    method: "Equipment",
    amount: "-₹3,500",
    status: "Paid",
  },
  {
    date: "22 Aug 2026",
    description: "Quarterly plan payment",
    party: "Rahul Sharma",
    type: "Collection",
    method: "Card",
    amount: "+₹15,000",
    status: "Completed",
  },
  {
    date: "22 Aug 2026",
    description: "Electricity bill",
    party: "Adani Electricity",
    type: "Expense",
    method: "Utilities",
    amount: "-₹7,000",
    status: "Paid",
  },
  {
    date: "21 Aug 2026",
    description: "Monthly plan payment",
    party: "Neha Joshi",
    type: "Collection",
    method: "Cash",
    amount: "+₹6,000",
    status: "Completed",
  },
];

export function IncomeExpenseScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [dateRange, setDateRange] = useState("01 Aug-23 Aug 2026");
  const [program, setProgram] = useState("All programs");
  const [method, setMethod] = useState("All methods");
  const [transactionType, setTransactionType] = useState("All transactions");
  const [compare, setCompare] = useState("Compare: Previous period");
  const [chartRange, setChartRange] = useState("Last 6 months");
  const [collectionRange, setCollectionRange] = useState("Last 14 days");
  const [collectionSort, setCollectionSort] = useState("Newest first");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionStatus, setCollectionStatus] = useState("All statuses");
  const [expenseRange, setExpenseRange] = useState("Last 30 days");
  const [expenseSort, setExpenseSort] = useState("10 per page");
  const [expenseCategory, setExpenseCategory] = useState("All categories");
  const [expenseStatus, setExpenseStatus] = useState("All statuses");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("All due dates");
  const [agingFilter, setAgingFilter] = useState("All aging");
  const [duesStatus, setDuesStatus] = useState("Outstanding");
  const [duesSearch, setDuesSearch] = useState("");
  const [duesSort, setDuesSort] = useState("Highest amount");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const isCollectionsTab = activeTab === "Collections";
  const isExpensesTab = activeTab === "Expenses";
  const isPaymentDuesTab = activeTab === "Payment Dues";

  return (
    <AppShell user={user}>
      <div className="space-y-[var(--space-6)]">
        <PageHeader
          title="Income & Expense Reports"
          description={
            isCollectionsTab
              ? "Track and reconcile member payments across every channel."
              : isExpensesTab
                ? "Record, categorize and review operating expenses."
                : isPaymentDuesTab
                  ? "Monitor outstanding member payments and prioritize follow-ups."
              : "Track collections, expenses, cash flow and outstanding dues."
          }
          actions={
            isCollectionsTab ? (
              <>
                <Button className="gap-2" variant="secondary">
                  <Download className="size-[var(--icon-sm)]" />
                  Export Collections
                </Button>
                <Button className="gap-2">
                  <Plus className="size-[var(--icon-sm)]" />
                  Record Payment
                </Button>
              </>
            ) : isExpensesTab ? (
              <>
                <Button className="gap-2" variant="secondary">
                  <Download className="size-[var(--icon-sm)]" />
                  Export Expenses
                </Button>
                <Button className="gap-2">
                  <Plus className="size-[var(--icon-sm)]" />
                  Add Expense
                </Button>
              </>
            ) : isPaymentDuesTab ? (
              <>
                <Button className="gap-2" variant="secondary">
                  <Download className="size-[var(--icon-sm)]" />
                  Export Dues
                </Button>
                <Button className="gap-2">
                  <Plus className="size-[var(--icon-sm)]" />
                  Record Payment
                </Button>
              </>
            ) : (
              <>
                <Button className="gap-2" variant="secondary">
                <Plus className="size-[var(--icon-sm)]" />
                Add Expense
                </Button>
                <Button className="gap-2">
                  <Download className="size-[var(--icon-sm)]" />
                  Export Report
                </Button>
              </>
            )
          }
        />

        <div className="border-b border-[var(--color-divider)]">
          <div className="flex flex-wrap gap-x-[var(--space-5)]">
            {tabs.map((tab) => (
              <TabButton active={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>
                {tab}
              </TabButton>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[var(--space-4)] xl:flex-row xl:items-center xl:justify-between">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-[var(--space-3)] xl:min-w-[70rem]">
            {isPaymentDuesTab ? (
              <>
                <FilterSelect
                  className="w-full"
                  icon={CalendarDays}
                  label={dueDateFilter}
                  onChange={(event) => setDueDateFilter(event.target.value)}
                  options={["All due dates", "Due today", "Overdue", "Upcoming"].map((option) => ({ label: option, value: option }))}
                  value={dueDateFilter}
                />
                <ReportFilter onChange={setAgingFilter} options={["All aging", "Not due yet", "Due today", "1-7 days", "8-30 days", "30+ days"]} value={agingFilter} />
                <ReportFilter onChange={setProgram} options={["All programs", "Calisthenics", "MMA", "Yoga", "Zumba"]} value={program} />
                <ReportFilter onChange={setDuesStatus} options={["Outstanding", "Overdue", "Due today", "Upcoming"]} value={duesStatus} />
                <label className="relative block min-w-0">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input
                    className="w-full pl-11"
                    onChange={(event) => setDuesSearch(event.target.value)}
                    placeholder="Member, phone or membership..."
                    type="search"
                    value={duesSearch}
                  />
                </label>
              </>
            ) : (
              <>
                <FilterSelect
                  className="w-full"
                  icon={CalendarDays}
                  label={dateRange}
                  onChange={(event) => setDateRange(event.target.value)}
                  options={[{ label: "01 Aug-23 Aug 2026", value: "01 Aug-23 Aug 2026" }]}
                  value={dateRange}
                />
                {isExpensesTab ? (
                  <ReportFilter onChange={setExpenseCategory} options={["All categories", "Rent", "Staff & Trainer", "Equipment", "Utilities", "Other"]} value={expenseCategory} />
                ) : (
                  <ReportFilter onChange={setProgram} options={["All programs", "Calisthenics", "MMA", "Yoga", "Zumba"]} value={program} />
                )}
                <ReportFilter onChange={setMethod} options={["All methods", "UPI", "Cash", "Card", "Bank transfer"]} value={method} />
              </>
            )}
            {isCollectionsTab ? (
              <>
                <ReportFilter onChange={setCollectionStatus} options={["All statuses", "Completed", "Pending", "Refunded"]} value={collectionStatus} />
                <label className="relative block min-w-0">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input
                    className="w-full pl-11"
                    onChange={(event) => setCollectionSearch(event.target.value)}
                    placeholder="Member, receipt or reference..."
                    type="search"
                    value={collectionSearch}
                  />
                </label>
              </>
            ) : isExpensesTab ? (
              <>
                <ReportFilter onChange={setExpenseStatus} options={["All statuses", "Paid", "Pending", "Cancelled"]} value={expenseStatus} />
                <label className="relative block min-w-0">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input
                    className="w-full pl-11"
                    onChange={(event) => setExpenseSearch(event.target.value)}
                    placeholder="Vendor, note or reference..."
                    type="search"
                    value={expenseSearch}
                  />
                </label>
              </>
            ) : isPaymentDuesTab ? (
              <Button className="w-full gap-2" variant="secondary">
                <ArrowUpDown className="size-[var(--icon-sm)] rotate-90" />
                More filters
              </Button>
            ) : (
              <>
                <ReportFilter onChange={setTransactionType} options={["All transactions", "Collections", "Expenses", "Dues"]} value={transactionType} />
                <ReportFilter onChange={setCompare} options={["Compare: Previous period", "Compare: Previous month", "Compare: Previous year"]} value={compare} />
              </>
            )}
          </div>
          {isCollectionsTab || isExpensesTab || isPaymentDuesTab ? (
            <button className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]" type="button">
              Clear filters
              {isExpensesTab ? <RefreshCw className="size-[var(--icon-sm)]" /> : null}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              Last updated 10:42 AM
              <RefreshCw className="size-[var(--icon-sm)]" />
            </div>
          )}
        </div>

        {isCollectionsTab ? (
          <CollectionsTab
            collectionRange={collectionRange}
            collectionSort={collectionSort}
            onCollectionRangeChange={setCollectionRange}
            onCollectionSortChange={setCollectionSort}
          />
        ) : isExpensesTab ? (
          <ExpensesTab
            expenseRange={expenseRange}
            expenseSort={expenseSort}
            onExpenseRangeChange={setExpenseRange}
            onExpenseSortChange={setExpenseSort}
          />
        ) : isPaymentDuesTab ? (
          <PaymentDuesTab duesSort={duesSort} onDuesSortChange={setDuesSort} />
        ) : (
          <OverviewTab chartRange={chartRange} onChartRangeChange={setChartRange} />
        )}
      </div>
    </AppShell>
  );
}

function OverviewTab({
  chartRange,
  onChartRangeChange,
}: {
  chartRange: string;
  onChartRangeChange: (value: string) => void;
}) {
  return (
    <>
        <section className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-[var(--space-4)]">
          <StatCard icon={TrendingUp} note="+12.4% vs previous period" title="Total Collections" tone="green" value="₹1,84,500" />
          <StatCard icon={TrendingDown} note="+6.8% vs previous period" title="Total Expenses" tone="red" value="₹72,300" />
          <StatCard icon={IndianRupee} note="+16.3% vs previous period" title="Net Cash Flow" tone="blue" value="₹1,12,200" />
          <StatCard icon={AlertTriangle} note="4 overdue payments" title="Outstanding Dues" tone="red" value="₹48,000" />
          <StatCard icon={Percent} note="+3.1% vs previous period" title="Collection Rate" tone="blue" value="79%" />
        </section>

        <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.2fr_1fr]">
          <Card className="p-[var(--card-padding)]">
            <PanelHeader title="Cash flow trend" value={chartRange} onChange={onChartRangeChange} options={["Last 6 months", "Last 3 months", "This year"]} />
            <CashFlowChart />
          </Card>

          <Card className="p-[var(--card-padding)]">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Expense breakdown</h2>
            <div className="mt-[var(--space-5)] grid gap-[var(--space-6)] md:grid-cols-[15rem_1fr] md:items-center">
              <ExpenseDonut />
              <div className="divide-y divide-[var(--color-divider)]">
                {expenseBreakdown.map((item) => (
                  <div className="grid grid-cols-[1fr_auto_3rem] items-center gap-[var(--space-3)] py-[var(--space-3)] text-sm" key={item.label}>
                    <span className="inline-flex items-center gap-2 text-[var(--color-text)]">
                      <span className={cn("size-2.5 rounded-full", item.color)} />
                      {item.label}
                    </span>
                    <span className="font-semibold text-[var(--color-text)]">{item.amount}</span>
                    <span className="text-right text-[var(--color-text-secondary)]">{item.percent}</span>
                  </div>
                ))}
                <button className="mt-[var(--space-3)] w-full text-right text-sm font-bold text-[var(--color-primary)]" type="button">
                  View expenses →
                </button>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.25fr_0.7fr]">
          <Card className="p-[var(--card-padding)]">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Collections by method</h2>
            <div className="mt-[var(--space-4)] space-y-[var(--space-3)]">
              {collectionMethods.map((item) => (
                <MethodRow key={item.label} {...item} />
              ))}
            </div>
          </Card>

          <Card className="p-[var(--card-padding)]">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Payment dues</h2>
            <div className="mt-[var(--space-3)] divide-y divide-[var(--color-divider)] text-sm">
              <DueRow label="Total payment due" value="₹48,000" />
              <DueRow danger label="Due today" value="₹12,000" />
              <DueRow danger label="Overdue" value="₹36,000" />
              <DueRow danger label="Members with overdue dues" value="4" />
            </div>
            <button className="mt-[var(--space-4)] w-full text-center text-sm font-bold text-[var(--color-primary)]" type="button">
              View payment dues →
            </button>
          </Card>
        </section>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-[var(--space-3)] border-b border-[var(--color-divider)] px-[var(--card-padding)] py-[var(--space-3)]">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Recent transactions</h2>
            <button className="text-sm font-bold text-[var(--color-primary)]" type="button">
              View all transactions →
            </button>
          </div>
          <div className="overflow-x-auto">
            <TransactionsTable />
          </div>
        </Card>
    </>
  );
}

function CollectionsTab({
  collectionRange,
  collectionSort,
  onCollectionRangeChange,
  onCollectionSortChange,
}: {
  collectionRange: string;
  collectionSort: string;
  onCollectionRangeChange: (value: string) => void;
  onCollectionSortChange: (value: string) => void;
}) {
  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-[var(--space-4)]">
        <StatCard icon={TrendingUp} note="+12.4% vs previous period" title="Total Collected" tone="green" value="₹1,84,500" />
        <StatCard icon={CreditCard} note="+16.3% vs previous period" title="Transactions" tone="blue" value="42" />
        <StatCard icon={IndianRupee} note="+8.7% vs previous period" title="Average Payment" tone="violet" value="₹4,393" />
        <StatCard icon={Clock} note="-25.0% vs previous period" title="Pending Reconciliation" tone="amber" value="3" />
        <StatCard icon={RefreshCw} note="-15.6% vs previous period" title="Refunded" tone="red" value="₹2,500" />
      </section>

      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-[var(--card-padding)]">
          <PanelHeader title="Collection trend" value={collectionRange} onChange={onCollectionRangeChange} options={["Last 14 days", "Last 7 days", "This month"]} />
          <CollectionTrendChart />
        </Card>

        <Card className="p-[var(--card-padding)]">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Collections by method</h2>
          <div className="mt-[var(--space-5)] space-y-[var(--space-5)]">
            {collectionMethods.map((item) => (
              <MethodRow key={item.label} {...item} />
            ))}
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-b border-[var(--color-divider)] px-[var(--card-padding)] py-[var(--space-3)]">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Collection records <span className="ml-2 text-sm font-medium text-[var(--color-text-secondary)]">42</span>
          </h2>
          <FilterSelect
            label={collectionSort}
            onChange={(event) => onCollectionSortChange(event.target.value)}
            options={["Newest first", "Oldest first", "Highest amount"].map((option) => ({ label: option, value: option }))}
            value={collectionSort}
          />
        </div>
        <div className="overflow-x-auto">
          <CollectionsTable />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-t border-[var(--color-divider)] px-[var(--card-padding)] py-[var(--space-4)]">
          <p className="text-sm font-semibold text-[var(--color-text)]">1-10 of 42</p>
          <div className="flex items-center gap-2">
            {["|‹", "‹", "1", "2", "3", "5", "›", "›|"].map((item) => (
              <button
                className={cn(
                  "grid size-9 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)]",
                  item === "1" && "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
                )}
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

function ExpensesTab({
  expenseRange,
  expenseSort,
  onExpenseRangeChange,
  onExpenseSortChange,
}: {
  expenseRange: string;
  expenseSort: string;
  onExpenseRangeChange: (value: string) => void;
  onExpenseSortChange: (value: string) => void;
}) {
  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-[var(--space-4)]">
        <StatCard icon={TrendingDown} note="+6.8% vs previous period" title="Total Expenses" tone="red" value="₹72,300" />
        <StatCard icon={FileText} note="Recorded this period" title="Transactions" tone="blue" value="18" />
        <StatCard icon={Home} note="Rent" title="Largest Category" tone="violet" value="₹28,000" />
        <StatCard icon={Clock} note="Awaiting settlement" title="Pending Payments" tone="amber" value="₹8,500" />
        <StatCard icon={TrendingUp} note="Per expense record" title="Average Expense" tone="green" value="₹4,017" />
      </section>

      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.15fr_1fr]">
        <Card className="p-[var(--card-padding)]">
          <PanelHeader title="Expense trend" value={expenseRange} onChange={onExpenseRangeChange} options={["Last 30 days", "Last 14 days", "This month"]} />
          <ExpenseTrendChart />
        </Card>

        <Card className="p-[var(--card-padding)]">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Expense breakdown</h2>
          <div className="mt-[var(--space-5)] grid gap-[var(--space-6)] md:grid-cols-[15rem_1fr] md:items-center">
            <ExpenseDonut />
            <div className="divide-y divide-[var(--color-divider)]">
              {expenseBreakdown.map((item) => (
                <div className="grid grid-cols-[1fr_auto_3rem] items-center gap-[var(--space-3)] py-[var(--space-3)] text-sm" key={item.label}>
                  <span className="inline-flex items-center gap-2 text-[var(--color-text)]">
                    <span className={cn("size-2.5 rounded-full", item.color)} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-[var(--color-text)]">{item.amount}</span>
                  <span className="text-right text-[var(--color-text-secondary)]">{item.percent}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-b border-[var(--color-divider)] px-[var(--card-padding)] py-[var(--space-3)]">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Expense records <span className="ml-2 text-sm font-medium text-[var(--color-text-secondary)]">18 records</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <ExpensesTable />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-t border-[var(--color-divider)] px-[var(--card-padding)] py-[var(--space-4)]">
          <FilterSelect
            label={expenseSort}
            onChange={(event) => onExpenseSortChange(event.target.value)}
            options={["10 per page", "25 per page", "50 per page"].map((option) => ({ label: option, value: option }))}
            value={expenseSort}
          />
          <div className="flex items-center gap-[var(--space-4)]">
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">1-10 of 18</p>
            <div className="flex items-center gap-2">
              {["‹", "1", "2", "›"].map((item) => (
                <button
                  className={cn(
                    "grid size-9 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)]",
                    item === "1" && "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
                  )}
                  key={item}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

function PaymentDuesTab({
  duesSort,
  onDuesSortChange,
}: {
  duesSort: string;
  onDuesSortChange: (value: string) => void;
}) {
  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-[var(--space-4)]">
        <StatCard icon={WalletCards} note="Open invoices" title="Total Payment Due" tone="blue" value="₹48,000" />
        <StatCard icon={CalendarDays} note="Collect today" title="Due Today" tone="amber" value="₹12,000" />
        <StatCard icon={AlertTriangle} note="Needs follow-up" title="Overdue" tone="red" value="₹36,000" />
        <StatCard icon={UsersRound} note="Outstanding members" title="Members With Dues" tone="blue" value="4" />
        <StatCard icon={Percent} note="+3.1% vs previous period" title="Collection Rate" tone="blue" value="79%" />
      </section>

      <Card className="p-[var(--card-padding)]">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Aging summary</h2>
        <div className="mt-[var(--space-4)] flex h-3 overflow-hidden rounded-full bg-[var(--gray-200)]">
          {agingSummary.map((item) => (
            <span className={cn("h-full", item.color)} key={item.label} style={{ width: item.width }} />
          ))}
        </div>
        <div className="mt-[var(--space-4)] grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-[var(--space-4)]">
          {agingSummary.map((item) => (
            <div key={item.label}>
              <p className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                <span className={cn("size-2.5 rounded-full", item.color)} />
                {item.label}
              </p>
              <p className="mt-2 text-lg font-bold text-[var(--color-text)]">{item.amount}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] px-[var(--space-4)] py-[var(--space-3)]">
        <p className="inline-flex items-center gap-3 text-sm font-bold text-[var(--color-text)]">
          <AlertTriangle className="size-[var(--icon-md)] text-[var(--color-danger)]" />
          4 overdue payments need follow-up
        </p>
        <button className="shrink-0 text-sm font-bold text-[var(--color-primary)]" type="button">
          View overdue only →
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-b border-[var(--color-divider)] px-[var(--card-padding)] py-[var(--space-3)]">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Payment dues <span className="ml-2 text-sm font-medium text-[var(--color-text-secondary)]">8 records</span>
          </h2>
          <FilterSelect
            icon={ArrowUpDown}
            label={duesSort}
            onChange={(event) => onDuesSortChange(event.target.value)}
            options={["Highest amount", "Oldest overdue", "Newest due"].map((option) => ({ label: option, value: option }))}
            value={duesSort}
          />
        </div>
        <div className="overflow-x-auto">
          <PaymentDuesTable />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-t border-[var(--color-divider)] px-[var(--card-padding)] py-[var(--space-4)]">
          <p className="text-sm text-[var(--color-text-secondary)]">Showing 1 to 8 of 8 entries</p>
          <div className="flex items-center gap-2">
            {["‹", "1", "2", "3", "4", "5", "...", "8", "›"].map((item) => (
              <button
                className={cn(
                  "grid size-9 place-items-center rounded-[var(--radius-md)] border border-transparent text-sm font-semibold text-[var(--color-text)]",
                  item === "1" && "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
                  ["‹", "›"].includes(item) && "border-[var(--color-border)] bg-[var(--color-surface)]",
                )}
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

function ReportFilter({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <FilterSelect
      className="w-full"
      label={value}
      onChange={(event) => onChange(event.target.value)}
      options={options.map((option) => ({ label: option, value: option }))}
      value={value}
    />
  );
}

function PanelHeader({
  onChange,
  options,
  title,
  value,
}: {
  onChange: (value: string) => void;
  options: string[];
  title: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
      <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
      <FilterSelect label={value} onChange={(event) => onChange(event.target.value)} options={options.map((option) => ({ label: option, value: option }))} value={value} />
    </div>
  );
}

function CashFlowChart() {
  const maxValue = 2;
  const linePoints = cashFlow.map((item, index) => `${8 + index * 17},${100 - (item.net / maxValue) * 88}`);

  return (
    <div className="mt-[var(--space-5)]">
      <div className="grid grid-cols-[2.75rem_1fr] gap-[var(--space-3)]">
        <div className="grid h-48 text-right text-xs text-[var(--color-text-secondary)]">
          {["₹2.0L", "₹1.5L", "₹1.0L", "₹0.5L", "₹0"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="relative h-48 border-b border-[var(--color-divider)]">
          <div className="absolute inset-0 grid grid-rows-4">
            {[1, 2, 3, 4].map((line) => (
              <span className="border-t border-[var(--color-divider)]" key={line} />
            ))}
          </div>
          <svg className="absolute inset-0 z-20 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Net cash flow line">
            <polyline fill="none" points={linePoints.join(" ")} stroke="var(--color-primary)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            {cashFlow.map((item, index) => (
              <circle cx={8 + index * 17} cy={100 - (item.net / maxValue) * 88} fill="var(--color-surface)" key={item.month} r="1.2" stroke="var(--color-primary)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          <div className="relative z-10 grid h-full grid-cols-6 items-end gap-[var(--space-5)] px-[var(--space-3)]">
            {cashFlow.map((item) => (
              <div className="grid justify-items-center gap-2" key={item.month}>
                <div className="flex h-40 items-end gap-2">
                  <FinanceBar color="bg-[var(--color-success)]" maxValue={maxValue} value={item.collections} />
                  <FinanceBar color="bg-[var(--color-danger)]" maxValue={maxValue} value={item.expenses} />
                </div>
                <span className="text-xs text-[var(--color-text-secondary)]">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[var(--space-4)] flex flex-wrap justify-center gap-[var(--space-6)] text-sm text-[var(--color-text-secondary)]">
        <Legend color="bg-[var(--color-success)]" label="Collections" />
        <Legend color="bg-[var(--color-danger)]" label="Expenses" />
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-8 bg-[var(--color-primary)]" />
          Net cash flow
        </span>
      </div>
    </div>
  );
}

function CollectionTrendChart() {
  const maxCollected = 40;
  const maxTransactions = 12;
  const points = collectionTrend.map((item, index) => {
    const x = 3 + index * 7.2;
    const y = 100 - (item.transactions / maxTransactions) * 82;
    return `${x},${y}`;
  });

  return (
    <div className="mt-[var(--space-4)]">
      <div className="mb-[var(--space-3)] flex flex-wrap gap-[var(--space-6)] text-sm text-[var(--color-text-secondary)]">
        <Legend color="bg-[var(--color-success)]" label="Collected (₹)" />
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-8 rounded-full bg-[var(--color-primary)]" />
          Transactions
        </span>
      </div>
      <div className="grid grid-cols-[2.75rem_1fr_2rem] gap-[var(--space-3)]">
        <div className="grid h-40 text-right text-xs text-[var(--color-text-secondary)]">
          {["₹40K", "₹30K", "₹20K", "₹10K", "₹0"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="relative h-40 border-b border-[var(--color-divider)]">
          <div className="absolute inset-0 grid grid-rows-4">
            {[1, 2, 3, 4].map((line) => (
              <span className="border-t border-[var(--color-divider)]" key={line} />
            ))}
          </div>
          <svg className="absolute inset-0 z-20 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Collection trend transactions">
            <polyline fill="none" points={points.join(" ")} stroke="var(--color-primary)" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
            {collectionTrend.map((item, index) => {
              const x = 3 + index * 7.2;
              const y = 100 - (item.transactions / maxTransactions) * 82;
              return <circle cx={x} cy={y} fill="var(--color-surface)" key={item.date} r="1.3" stroke="var(--color-primary)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
          <div className="relative z-10 grid h-full items-end gap-2 px-2" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
            {collectionTrend.map((item) => (
              <div className="grid justify-items-center gap-1" key={item.date}>
                <div className="flex h-32 items-end">
                  <div className="w-5 rounded-t-[var(--radius-sm)] bg-[var(--color-success)]" style={{ height: `${(item.collected / maxCollected) * 100}%` }} />
                </div>
                <span className="whitespace-nowrap text-[10px] text-[var(--color-text-secondary)]">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid h-40 text-xs text-[var(--color-text-secondary)]">
          {["12", "9", "6", "3", "0"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpenseTrendChart() {
  const maxValue = 10;
  const linePoints = expenseTrend.map((item, index) => {
    const x = 2 + index * 2.9;
    const y = 100 - (item.previous / maxValue) * 88;
    return `${x},${y}`;
  });

  return (
    <div className="mt-[var(--space-5)]">
      <div className="grid grid-cols-[2.75rem_1fr] gap-[var(--space-3)]">
        <div className="grid h-48 text-right text-xs text-[var(--color-text-secondary)]">
          {["₹10K", "₹8K", "₹6K", "₹4K", "₹2K", "₹0"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="relative h-48 border-b border-[var(--color-divider)]">
          <div className="absolute inset-0 grid grid-rows-5">
            {[1, 2, 3, 4, 5].map((line) => (
              <span className="border-t border-[var(--color-divider)]" key={line} />
            ))}
          </div>
          <svg className="absolute inset-0 z-20 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Previous period expense trend">
            <polyline fill="none" points={linePoints.join(" ")} stroke="var(--color-text-muted)" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="relative z-10 grid h-full items-end gap-1.5 px-2" style={{ gridTemplateColumns: "repeat(34, minmax(0, 1fr))" }}>
            {expenseTrend.map((item) => (
              <div className="grid justify-items-center gap-1" key={item.date}>
                <div className="flex h-40 items-end">
                  <div className="w-3.5 rounded-t-[var(--radius-sm)] bg-[var(--color-danger)]" style={{ height: `${(item.amount / maxValue) * 100}%` }} />
                </div>
                {["25 Jul", "28 Jul", "31 Jul", "3 Aug", "6 Aug", "9 Aug", "12 Aug", "15 Aug", "18 Aug", "21 Aug", "23 Aug"].includes(item.date) ? (
                  <span className="whitespace-nowrap text-[10px] text-[var(--color-text-secondary)]">{item.date}</span>
                ) : (
                  <span className="h-3" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[var(--space-4)] flex flex-wrap justify-center gap-[var(--space-6)] text-sm text-[var(--color-text-secondary)]">
        <Legend color="bg-[var(--color-danger)]" label="Expenses" />
        <span className="inline-flex items-center gap-2">
          <span className="h-px w-8 border-t border-dashed border-[var(--color-text-muted)]" />
          Previous period
        </span>
      </div>
    </div>
  );
}

function CollectionsTable() {
  return (
    <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-semibold text-[var(--color-text-secondary)]">
          <th className="px-[var(--space-4)] py-3">Date & time</th>
          <th className="px-[var(--space-4)] py-3">Receipt</th>
          <th className="px-[var(--space-4)] py-3">Member</th>
          <th className="px-[var(--space-4)] py-3">Membership / purpose</th>
          <th className="px-[var(--space-4)] py-3">Method</th>
          <th className="px-[var(--space-4)] py-3">Reference</th>
          <th className="px-[var(--space-4)] py-3">Amount</th>
          <th className="px-[var(--space-4)] py-3">Status</th>
          <th className="px-[var(--space-4)] py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {collectionRecords.map((record) => (
          <tr className="border-b border-[var(--color-divider)] last:border-0" key={record.receipt}>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.dateTime}</td>
            <td className="px-[var(--space-4)] py-3 font-semibold text-[var(--color-text)]">{record.receipt}</td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.member}</td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.purpose}</td>
            <td className="px-[var(--space-4)] py-3">
              <MethodBadge method={record.method} />
            </td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.reference}</td>
            <td className={cn("px-[var(--space-4)] py-3 font-bold", record.amount.startsWith("+") ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")}>{record.amount}</td>
            <td className="px-[var(--space-4)] py-3">
              <CollectionStatusBadge status={record.status} />
            </td>
            <td className="px-[var(--space-4)] py-3 text-right">
              <div className="inline-flex items-center gap-2">
                <button className="grid size-8 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label={`View ${record.receipt}`}>
                  <Eye className="size-[var(--icon-sm)]" />
                </button>
                <button className="grid size-8 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label={`Open ${record.receipt}`}>
                  <MoreVertical className="size-[var(--icon-sm)]" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExpensesTable() {
  return (
    <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-semibold text-[var(--color-text-secondary)]">
          <th className="px-[var(--space-4)] py-3">Date ↕</th>
          <th className="px-[var(--space-4)] py-3">Expense ID</th>
          <th className="px-[var(--space-4)] py-3">Vendor / payee</th>
          <th className="px-[var(--space-4)] py-3">Description</th>
          <th className="px-[var(--space-4)] py-3">Category</th>
          <th className="px-[var(--space-4)] py-3">Method</th>
          <th className="px-[var(--space-4)] py-3">Amount ↑</th>
          <th className="px-[var(--space-4)] py-3">Status</th>
          <th className="px-[var(--space-4)] py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {expenseRecords.map((record) => (
          <tr className="border-b border-[var(--color-divider)] last:border-0" key={record.id}>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.date}</td>
            <td className="px-[var(--space-4)] py-3 font-semibold text-[var(--color-text)]">{record.id}</td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.vendor}</td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.description}</td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.category}</td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{record.method}</td>
            <td className="px-[var(--space-4)] py-3 font-bold text-[var(--color-text)]">{record.amount}</td>
            <td className="px-[var(--space-4)] py-3">
              <ExpenseStatusBadge status={record.status} />
            </td>
            <td className="px-[var(--space-4)] py-3 text-right">
              <div className="inline-flex items-center gap-2">
                <button className="grid size-8 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label={`View ${record.id}`}>
                  <Eye className="size-[var(--icon-sm)]" />
                </button>
                <button className="grid size-8 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label={`Edit ${record.id}`}>
                  <Pencil className="size-[var(--icon-sm)]" />
                </button>
                <button className="grid size-8 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label={`Open ${record.id}`}>
                  <MoreVertical className="size-[var(--icon-sm)]" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PaymentDuesTable() {
  return (
    <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-semibold text-[var(--color-text-secondary)]">
          <th className="px-[var(--space-4)] py-3">Member</th>
          <th className="px-[var(--space-4)] py-3">Phone</th>
          <th className="px-[var(--space-4)] py-3">Membership / plan</th>
          <th className="px-[var(--space-4)] py-3">Due date</th>
          <th className="px-[var(--space-4)] py-3">Days overdue</th>
          <th className="px-[var(--space-4)] py-3">Amount due</th>
          <th className="px-[var(--space-4)] py-3">Last payment</th>
          <th className="px-[var(--space-4)] py-3">Follow-up</th>
          <th className="px-[var(--space-4)] py-3">Status</th>
          <th className="px-[var(--space-4)] py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {paymentDues.map((due) => (
          <tr className="border-b border-[var(--color-divider)] last:border-0" key={`${due.member}-${due.plan}`}>
            <td className="px-[var(--space-4)] py-3">
              <div className="flex items-center gap-[var(--space-3)]">
                <InitialAvatar name={due.member} tone={due.tone as "blue" | "green" | "orange" | "purple" | "red" | "teal"} />
                <span className="font-semibold text-[var(--color-text)]">{due.member}</span>
              </div>
            </td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{due.phone}</td>
            <td className="whitespace-pre-line px-[var(--space-4)] py-3 text-[var(--color-text)]">{due.plan}</td>
            <td className="whitespace-pre-line px-[var(--space-4)] py-3 text-[var(--color-text)]">
              {due.dueDate}
            </td>
            <td className={cn("px-[var(--space-4)] py-3 font-semibold text-[var(--color-text)]", due.daysOverdue !== "-" && "text-[var(--color-danger)]")}>
              {due.daysOverdue}
            </td>
            <td className="px-[var(--space-4)] py-3 text-base font-bold text-[var(--color-text)]">{due.amount}</td>
            <td className="whitespace-pre-line px-[var(--space-4)] py-3 text-[var(--color-text)]">{due.lastPayment}</td>
            <td className="whitespace-pre-line px-[var(--space-4)] py-3">
              <FollowUpBadge value={due.followUp} />
            </td>
            <td className="px-[var(--space-4)] py-3">
              <DueStatusBadge status={due.status} />
            </td>
            <td className="px-[var(--space-4)] py-3 text-right">
              <div className="inline-flex items-center gap-2">
                <button className="grid size-8 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]" type="button" aria-label={`Message ${due.member}`}>
                  <Send className="size-[var(--icon-sm)]" />
                </button>
                <button className="grid size-8 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]" type="button" aria-label={`Call ${due.member}`}>
                  <Phone className="size-[var(--icon-sm)]" />
                </button>
                <Button className="h-8 px-3 text-xs" variant="secondary">
                  Record payment
                </Button>
                <button className="grid size-8 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label={`Open ${due.member}`}>
                  <MoreVertical className="size-[var(--icon-sm)]" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MethodBadge({ method }: { method: string }) {
  const className =
    method === "Cash"
      ? "bg-[var(--color-success-surface)] text-[var(--color-success)]"
      : method === "Card"
        ? "bg-[var(--blue-100)] text-[var(--color-primary)]"
        : method === "Bank transfer"
          ? "bg-[var(--color-warning-surface)] text-[var(--color-warning)]"
          : "bg-[var(--color-trial-surface)] text-[var(--color-trial)]";

  return (
    <span className={cn("inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] text-xs font-semibold", className)}>
      {method}
    </span>
  );
}

function FollowUpBadge({ value }: { value: string }) {
  const firstLine = value.split("\n")[0];
  const className =
    firstLine === "Today"
      ? "bg-[var(--color-success-surface)] text-[var(--color-success)]"
      : firstLine === "Scheduled"
        ? "bg-[var(--blue-100)] text-[var(--color-primary)]"
        : firstLine === "Completed"
          ? "bg-[var(--color-success-surface)] text-[var(--color-success)]"
          : "bg-[var(--gray-100)] text-[var(--color-text-secondary)]";

  return (
    <span className={cn("inline-flex rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] py-1 text-xs font-semibold", className)}>
      {value}
    </span>
  );
}

function DueStatusBadge({ status }: { status: string }) {
  if (status === "Overdue") return <StatusBadge status="lost">Overdue</StatusBadge>;
  if (status === "Upcoming") {
    return (
      <span className="inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] bg-[var(--blue-100)] px-[var(--badge-padding-x)] text-xs font-semibold text-[var(--color-primary)]">
        Upcoming
      </span>
    );
  }

  return (
    <span className="inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] bg-[var(--color-warning-surface)] px-[var(--badge-padding-x)] text-xs font-semibold text-[var(--color-warning)]">
      Due today
    </span>
  );
}

function ExpenseStatusBadge({ status }: { status: string }) {
  if (status === "Paid") return <StatusBadge status="active">Paid</StatusBadge>;
  if (status === "Cancelled") return <StatusBadge status="lost">Cancelled</StatusBadge>;

  return (
    <span className="inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] bg-[var(--color-warning-surface)] px-[var(--badge-padding-x)] text-xs font-semibold text-[var(--color-warning)]">
      Pending
    </span>
  );
}

function CollectionStatusBadge({ status }: { status: string }) {
  if (status === "Completed") return <StatusBadge status="active">Completed</StatusBadge>;
  if (status === "Refunded") return <StatusBadge status="lost">Refunded</StatusBadge>;

  return (
    <span className="inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] bg-[var(--color-warning-surface)] px-[var(--badge-padding-x)] text-xs font-semibold text-[var(--color-warning)]">
      Pending
    </span>
  );
}

function FinanceBar({ color, maxValue, value }: { color: string; maxValue: number; value: number }) {
  return (
    <div className="flex h-full w-6 items-end">
      <div className={cn("relative w-full rounded-t-[var(--radius-sm)]", color)} style={{ height: `${(value / maxValue) * 100}%` }}>
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-[var(--color-text)]">₹{value.toFixed(2)}L</span>
      </div>
    </div>
  );
}

function ExpenseDonut() {
  return (
    <div className="relative mx-auto grid size-52 place-items-center rounded-full bg-[conic-gradient(var(--color-primary)_0_39%,var(--color-success)_39%_70%,var(--color-trial)_70%_84%,var(--color-warning)_84%_94%,var(--amber-400)_94%_100%)]">
      <div className="grid size-28 place-items-center rounded-full bg-[var(--color-surface)] text-center">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">Total</p>
          <p className="text-xl font-bold text-[var(--color-text)]">₹72,300</p>
        </div>
      </div>
    </div>
  );
}

function MethodRow({ amount, label, percent }: { amount: string; label: string; percent: number }) {
  return (
    <div className="grid grid-cols-[6rem_1fr_5rem_3rem] items-center gap-[var(--space-3)] text-sm">
      <span className="font-medium text-[var(--color-text)]">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--blue-100)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-right text-[var(--color-text)]">{amount}</span>
      <span className="text-right text-[var(--color-text-secondary)]">{percent}%</span>
    </div>
  );
}

function DueRow({ danger, label, value }: { danger?: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-medium text-[var(--color-text)]">{label}</span>
      <strong className={cn("text-[var(--color-text)]", danger && "text-[var(--color-danger)]")}>{value}</strong>
    </div>
  );
}

function TransactionsTable() {
  return (
    <table className="w-full min-w-[980px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-semibold text-[var(--color-text-secondary)]">
          <th className="px-[var(--space-4)] py-3">Date</th>
          <th className="px-[var(--space-4)] py-3">Description</th>
          <th className="px-[var(--space-4)] py-3">Member / Vendor</th>
          <th className="px-[var(--space-4)] py-3">Type</th>
          <th className="px-[var(--space-4)] py-3">Method / Category</th>
          <th className="px-[var(--space-4)] py-3">Amount</th>
          <th className="px-[var(--space-4)] py-3">Status</th>
          <th className="px-[var(--space-4)] py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr className="border-b border-[var(--color-divider)] last:border-0" key={`${transaction.date}-${transaction.description}`}>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{transaction.date}</td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{transaction.description}</td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{transaction.party}</td>
            <td className="px-[var(--space-4)] py-3">
              {transaction.type === "Collection" ? <StatusBadge status="active">Collection</StatusBadge> : <StatusBadge status="lost">Expense</StatusBadge>}
            </td>
            <td className="px-[var(--space-4)] py-3 text-[var(--color-text)]">{transaction.method}</td>
            <td className={cn("px-[var(--space-4)] py-3 font-bold", transaction.amount.startsWith("+") ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")}>
              {transaction.amount}
            </td>
            <td className="px-[var(--space-4)] py-3">
              {transaction.status === "Completed" ? (
                <StatusBadge status="active">Completed</StatusBadge>
              ) : (
                <span className="inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] bg-[var(--blue-100)] px-[var(--badge-padding-x)] text-xs font-semibold text-[var(--color-primary)]">
                  Paid
                </span>
              )}
            </td>
            <td className="px-[var(--space-4)] py-3 text-right">
              <button className="inline-grid size-8 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label={`Open ${transaction.description}`}>
                <MoreVertical className="size-[var(--icon-sm)]" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-3 rounded-[var(--radius-sm)]", color)} />
      {label}
    </span>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center border-b-2 px-[var(--space-3)] text-sm font-bold transition",
        active
          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
