"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Dumbbell,
  Funnel,
  Grid2X2,
  Hourglass,
  RefreshCcw,
  Sun,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AuthUser } from "@/lib/api/auth";
import { getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type Tab = "Overview" | "Membership" | "Leads" | "Trials" | "Attendance";

const tabs: Tab[] = ["Overview", "Membership", "Leads", "Trials", "Attendance"];

const membershipBars = [
  { label: "Mar", a: 1, b: 10 },
  { label: "Apr", a: 0, b: 8 },
  { label: "May", a: 1, b: 9 },
  { label: "Jun", a: 0, b: 11 },
  { label: "Jul", a: 1, b: 10 },
  { label: "Aug", a: 0, b: 13 },
];

const leadBars = [
  { label: "27 Jul-2 Aug", a: 3, b: 1, line: 33 },
  { label: "3-9 Aug", a: 4, b: 1, line: 25 },
  { label: "10-16 Aug", a: 5, b: 1, line: 20 },
  { label: "17-23 Aug", a: 6, b: 3, line: 50 },
];

const trialBars = [
  { label: "27 Jul-02 Aug", a: 2, b: 1, c: 0 },
  { label: "03 Aug-09 Aug", a: 4, b: 2, c: 1 },
  { label: "10 Aug-16 Aug", a: 3, b: 1, c: 1 },
  { label: "17 Aug-23 Aug", a: 5, b: 1, c: 3 },
];

const attendanceBars = [
  { label: "17 Aug", present: 86, absent: 24, rate: 71 },
  { label: "18 Aug", present: 92, absent: 18, rate: 72 },
  { label: "19 Aug", present: 88, absent: 22, rate: 71 },
  { label: "20 Aug", present: 90, absent: 20, rate: 75 },
  { label: "21 Aug", present: 81, absent: 29, rate: 74 },
  { label: "22 Aug", present: 76, absent: 30, rate: 72 },
  { label: "23 Aug", present: 79, absent: 21, rate: 73 },
];

const healthItems = [
  { label: "Active", value: 4, color: "bg-[var(--color-success)]" },
  { label: "Pending activation", value: 4, color: "bg-[var(--color-trial)]" },
  { label: "Frozen", value: 1, color: "bg-[var(--color-primary)]" },
  { label: "Inactive", value: 3, color: "bg-[var(--color-danger)]" },
];

export function ReportsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [dateRange, setDateRange] = useState("01 Aug-23 Aug 2026");
  const [program, setProgram] = useState("All programs");
  const [status, setStatus] = useState("All statuses");
  const [compare, setCompare] = useState("Previous period");
  const [range, setRange] = useState("Last 6 months");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <AppShell user={user}>
      <div className="space-y-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{descriptionFor(activeTab)}</p>
          </div>
          <div className="flex flex-wrap gap-[var(--space-3)]">
            <Button className="gap-2" variant="secondary"><CalendarDays className="size-[var(--icon-sm)]" />Schedule Report</Button>
            <Button className="gap-2"><Download className="size-[var(--icon-sm)]" />Export Report</Button>
          </div>
        </div>

        <div className="border-b border-[var(--color-divider)]">
          <div className="flex flex-wrap gap-x-[var(--space-5)]">
            {tabs.map((tab) => <TabButton active={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>{tab}</TabButton>)}
          </div>
        </div>

        <div className="flex flex-col gap-[var(--space-4)] xl:flex-row xl:items-center xl:justify-between">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))] gap-[var(--space-3)] xl:min-w-[64rem]">
            <FilterSelect className="w-full" icon={CalendarDays} label={dateRange} onChange={(event) => setDateRange(event.target.value)} options={[dateRange, "17 Aug-23 Aug 2026"].map((value) => ({ label: value, value }))} value={dateRange} />
            <ReportFilter onChange={setProgram} options={["All programs", "Calisthenics", "MMA", "Upcoming Yoga", "Upcoming Zumba"]} value={program} />
            {activeTab === "Attendance" ? <ReportFilter onChange={setStatus} options={["All batches", "Morning", "Evening"]} value={status === "All statuses" ? "All batches" : status} /> : null}
            {activeTab === "Attendance" ? <ReportFilter onChange={setStatus} options={["All trainers", "Rohit Nair", "Sunita Rao", "Deepak Yadav"]} value="All trainers" /> : null}
            {activeTab === "Membership" ? <ReportFilter onChange={setStatus} options={["All memberships", "Monthly", "Quarterly", "Annual"]} value="All memberships" /> : null}
            {activeTab === "Leads" ? <ReportFilter onChange={setStatus} options={["All sources", "WhatsApp", "Walk-in", "Referral"]} value="All sources" /> : null}
            {activeTab === "Trials" ? <ReportFilter onChange={setStatus} options={["All trainers", "Rohit Nair", "Sunita Rao", "Farah Khan"]} value="All trainers" /> : null}
            <ReportFilter onChange={setStatus} options={["All statuses", "Active", "Pending", "Lost"]} value={status} />
            <ReportFilter onChange={setCompare} options={["Previous period", "Previous month", "Previous year"]} value={compare} />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Last updated 10:42 AM</p>
        </div>

        {activeTab === "Overview" ? <OverviewTab range={range} setRange={setRange} /> : null}
        {activeTab === "Membership" ? <MembershipTab range={range} setRange={setRange} /> : null}
        {activeTab === "Leads" ? <LeadsTab /> : null}
        {activeTab === "Trials" ? <TrialsTab /> : null}
        {activeTab === "Attendance" ? <AttendanceTab /> : null}
      </div>
    </AppShell>
  );
}

function OverviewTab({ range, setRange }: { range: string; setRange: (value: string) => void }) {
  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-[var(--space-4)]">
        <StatCard icon={UsersRound} note="+2 vs previous period" title="Active Members" tone="green" value="4" />
        <StatCard icon={RefreshCcw} note="+5 vs previous period" title="Membership Renewals" tone="green" value="13" />
        <StatCard icon={TrendingUp} note="+4.2% vs previous period" title="Average Attendance" tone="blue" value="72%" />
        <StatCard icon={Funnel} note="No conversions this period" title="Trial Conversion" tone="red" value="0%" />
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-[var(--card-padding)]"><PanelHeader title="Membership activity" value={range} onChange={setRange} /><GroupedBarChart data={membershipBars} legends={["New members", "Renewals"]} /></Card>
        <HealthCard />
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1fr_1.25fr_1fr]">
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Lead & trial funnel" /><HorizontalFunnel /></Card>
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Attendance trend" /><LineChart /></Card>
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Needs attention" /><AttentionList /></Card>
      </section>
    </>
  );
}

function MembershipTab({ range, setRange }: { range: string; setRange: (value: string) => void }) {
  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-[var(--space-4)]">
        <StatCard icon={UsersRound} note="+2 vs previous period" title="Total Members" tone="green" value="11" />
        <StatCard icon={UserPlus} note="+2 vs previous period" title="Active Members" tone="blue" value="4" />
        <StatCard icon={UserCheck} note="0 vs previous period" title="New Members" tone="blue" value="0" />
        <StatCard icon={RefreshCcw} note="+5 vs previous period" title="Renewals" tone="green" value="13" />
        <StatCard icon={ShieldIcon} note="+4.2% vs previous period" title="Retention Rate" tone="violet" value="76%" />
        <StatCard icon={Clock} note="0 vs previous period" title="Expiring Soon" tone="amber" value="0" />
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.25fr_1fr]">
        <Card className="p-[var(--card-padding)]"><PanelHeader title="Member growth & renewals" value={range} onChange={setRange} /><GroupedBarChart data={membershipBars} legends={["New members", "Renewals"]} /></Card>
        <HealthCard />
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1fr_1.25fr]">
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Memberships by program" /><ProgressList items={[["Calisthenics", 4, 100], ["MMA", 3, 75], ["Upcoming Yoga", 2, 48], ["Upcoming Zumba", 2, 48]]} /></Card>
        <Card className="p-[var(--card-padding)]"><PanelHeader title="Renewal performance" value={range} onChange={setRange} /><LineChart /></Card>
      </section>
      <SimpleTable title="Membership insights" columns={["Insight", "This month", "vs previous period", "Trend", "View"]} rows={[
        ["New members this month", "0", "0 (0%)", "No change", "View members →"],
        ["Renewed this month", "13", "+5 (+62%)", "Up", "View members →"],
        ["Average membership duration", "4.8 months", "+0.3 months (+6.7%)", "Up", "View members →"],
        ["Average days to renewal", "3.2 days", "-0.4 days (-11.1%)", "Down", "View members →"],
      ]} />
    </>
  );
}

function LeadsTab() {
  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-[var(--space-4)]">
        <StatCard icon={UserPlus} note="+4 vs previous period" title="Total Enquiries" tone="blue" value="18" />
        <StatCard icon={UsersRound} note="+2 vs previous period" title="New Leads" tone="violet" value="7" />
        <StatCard icon={CalendarDays} note="+1 vs previous period" title="Follow-ups Due" tone="amber" value="4" />
        <StatCard icon={X} note="-1 vs previous period" title="Lost/Declined" tone="red" value="2" />
        <StatCard icon={UserRoundCheck} note="+1 vs previous period" title="Converted To Members" tone="green" value="3" />
        <StatCard icon={TrendingUp} note="+2.3pp vs previous period" title="Lead Conversion" tone="blue" value="16.7%" />
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.4fr_0.85fr_0.85fr]">
        <Card className="p-[var(--card-padding)]"><PanelHeader title="Lead volume & conversions" value="Weekly" onChange={() => undefined} /><GroupedBarChart data={leadBars} legends={["Enquiries", "Converted"]} /></Card>
        <DonutCard title="Leads by source" total="18" items={[["WhatsApp", "6", "33%"], ["Walk-in", "4", "22%"], ["Referral", "3", "17%"], ["Instagram Ads", "3", "17%"], ["Website", "2", "11%"]]} />
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Conversion funnel" /><FunnelStack /></Card>
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1fr_1fr]">
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Leads by interest" /><ProgressList items={[["Calisthenics", 5, 100], ["MMA", 5, 100], ["Upcoming Yoga", 4, 80], ["Upcoming Zumba", 4, 80]]} /></Card>
        <DonutCard title="Follow-up performance" total="18" items={[["Due", "4", "22%"], ["Completed on time", "9", "50%"], ["Overdue", "4", "22%"], ["No follow-up", "1", "6%"]]} small />
      </section>
      <SimpleTable title="Source performance" columns={["Source", "Leads", "Trials scheduled", "Converted", "Conversion rate", "Avg. response time", "View"]} rows={[
        ["WhatsApp Inquiry", "6", "4", "1", "16.7%", "18m", "View leads →"],
        ["Walk-in", "4", "3", "1", "25.0%", "12m", "View leads →"],
        ["Referral", "3", "2", "1", "33.3%", "25m", "View leads →"],
        ["Instagram Ads", "3", "2", "0", "0%", "1h 5m", "View leads →"],
        ["Website", "2", "1", "0", "0%", "2h 10m", "View leads →"],
      ]} />
    </>
  );
}

function TrialsTab() {
  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-[var(--space-4)]">
        <StatCard icon={CalendarCheck} note="+2 vs previous period" title="Trials Scheduled" tone="blue" value="7" />
        <StatCard icon={Sun} note="No trials today" title="Trials Today" tone="amber" value="0" />
        <StatCard icon={CheckCircle2} note="+1 vs previous period" title="Completed" tone="violet" value="5" />
        <StatCard icon={Hourglass} note="No change" title="Awaiting Decision" tone="amber" value="2" />
        <StatCard icon={UserRoundCheck} note="+1 vs previous period" title="Converted" tone="green" value="3" />
        <StatCard icon={Funnel} note="+6.2% vs previous period" title="Trial Conversion" tone="red" value="42.9%" />
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.25fr_1fr_0.9fr]">
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Trial activity" /><TripleBarChart /></Card>
        <DonutCard title="Trial outcomes" total="7" items={[["Converted", "3", "42.9%"], ["Awaiting decision", "2", "28.6%"], ["Lost after trial", "1", "14.3%"], ["Scheduled/upcoming", "1", "14.3%"]]} />
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Trial conversion funnel" /><FunnelRows /></Card>
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1fr_1.6fr]">
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Trials by program" /><ProgressList items={[["Calisthenics", 3, 100], ["MMA", 2, 74], ["Upcoming Yoga", 1, 40], ["Upcoming Zumba", 1, 40]]} multicolor /></Card>
        <SimpleTable title="Trainer performance" columns={["Trainer", "Trials", "Converted", "Conversion rate"]} rows={[["Rohit Nair", "3", "2", "66.7%"], ["Sunita Rao", "2", "1", "50.0%"], ["Deepak Yadav", "1", "0", "0%"], ["Farah Khan", "1", "0", "0%"]]} compact />
      </section>
      <SimpleTable title="Trial performance" columns={["Date", "Lead", "Program", "Trainer", "Trial status", "Outcome", "Follow-up", "View"]} rows={[
        ["23 Aug 2026", "Arjun Mehta", "MMA", "Rohit Nair", "Completed", "Converted", "23 Aug 2026", "View trial →"],
        ["23 Aug 2026", "Neha Kapoor", "Calisthenics", "Sunita Rao", "Awaiting decision", "-", "26 Aug 2026", "View trial →"],
        ["22 Aug 2026", "Karan Singh", "Calisthenics", "Rohit Nair", "Completed", "Lost after trial", "-", "View trial →"],
      ]} />
    </>
  );
}

function AttendanceTab() {
  return (
    <>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-[var(--space-4)]">
        <StatCard icon={UsersRound} note="+12 vs previous period" title="Expected Check-ins" tone="blue" value="210" />
        <StatCard icon={CheckCircle2} note="+14 vs previous period" title="Present" tone="green" value="152" />
        <StatCard icon={UserRoundX} note="+6 vs previous period" title="Absent" tone="red" value="58" />
        <StatCard icon={TrendingUp} note="+3.2% vs previous period" title="Attendance Rate" tone="blue" value="72%" />
        <StatCard icon={Clock} note="-2 vs previous period" title="Late Check-ins" tone="amber" value="29" />
        <StatCard icon={Grid2X2} note="0 vs previous period" title="Active Batches" tone="violet" value="14" />
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.55fr_0.8fr_0.9fr]">
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Daily attendance trend" /><AttendanceBarChart /></Card>
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Attendance by program" /><ProgressList items={[["Calisthenics", 78, 78], ["MMA", 74, 74], ["Upcoming Yoga", 69, 69], ["Upcoming Zumba", 66, 66]]} percent /></Card>
        <DonutCard title="Check-in method" total="152" items={[["Face Recognition", "64", "42%"], ["QR Code Scan", "48", "32%"], ["RFID Card", "25", "16%"], ["Manual", "15", "10%"]]} />
      </section>
      <section className="grid gap-[var(--space-4)] xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Attendance by time slot" /><Heatmap /></Card>
        <Card className="p-[var(--card-padding)]"><PanelTitle title="Punctuality" /><Punctuality /></Card>
      </section>
      <SimpleTable title="Batch attendance performance" columns={["Program", "Schedule", "Trainer", "Admissions", "Present", "Attendance rate", "Late", "Status", ""]} rows={[
        ["Calisthenics", "6:00 AM - 7:00 AM", "Rohit Nair", "22", "18", "82%", "2 (11%)", "Good", "View batch →"],
        ["Calisthenics", "7:00 AM - 8:00 AM", "Rohit Nair", "24", "17", "71%", "4 (17%)", "Needs attention", "View batch →"],
        ["Calisthenics", "8:00 AM - 9:00 AM", "Sunita Rao", "20", "13", "65%", "5 (25%)", "Needs attention", "View batch →"],
        ["MMA", "7:00 PM - 8:30 PM", "Deepak Yadav", "25", "12", "48%", "8 (33%)", "Low attendance", "View batch →"],
      ]} />
    </>
  );
}

function ReportFilter({ onChange, options, value }: { onChange: (value: string) => void; options: string[]; value: string }) {
  return <FilterSelect className="w-full" label={value} onChange={(event) => onChange(event.target.value)} options={options.map((option) => ({ label: option, value: option }))} value={value} />;
}

function PanelHeader({ onChange, title, value }: { onChange: (value: string) => void; title: string; value: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
      <PanelTitle title={title} />
      <FilterSelect label={value} onChange={(event) => onChange(event.target.value)} options={["Last 6 months", "Weekly", "Last 30 days"].map((option) => ({ label: option, value: option }))} value={value} />
    </div>
  );
}

function PanelTitle({ title }: { title: string }) {
  return <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>;
}

function GroupedBarChart({ data, legends }: { data: Array<{ label: string; a: number; b: number; line?: number }>; legends: string[] }) {
  const max = Math.max(...data.flatMap((item) => [item.a, item.b]), 1);
  return (
    <div className="mt-[var(--space-5)]">
      <div className="grid h-48 grid-cols-[repeat(var(--cols),minmax(0,1fr))] items-end gap-[var(--space-5)] border-b border-[var(--color-divider)] px-[var(--space-4)]" style={{ "--cols": data.length } as React.CSSProperties}>
        {data.map((item) => (
          <div className="grid justify-items-center gap-2" key={item.label}>
            <div className="flex h-36 items-end gap-2">
              <Bar color="bg-[var(--color-primary)]" max={max} value={item.a} />
              <Bar color="bg-[var(--color-success)]" max={max} value={item.b} />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
          </div>
        ))}
      </div>
      <LegendRow labels={legends} />
    </div>
  );
}

function TripleBarChart() {
  return (
    <div className="mt-[var(--space-5)] grid h-48 grid-cols-4 items-end gap-[var(--space-5)] border-b border-[var(--color-divider)] px-[var(--space-4)]">
      {trialBars.map((item) => (
        <div className="grid justify-items-center gap-2" key={item.label}>
          <div className="flex h-36 items-end gap-2">
            <Bar color="bg-[var(--color-primary)]" max={5} value={item.a} />
            <Bar color="bg-[var(--color-trial)]" max={5} value={item.b} />
            <Bar color="bg-[var(--color-success)]" max={5} value={item.c} />
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function AttendanceBarChart() {
  return (
    <div className="mt-[var(--space-5)] grid h-52 grid-cols-7 items-end gap-[var(--space-5)] border-b border-[var(--color-divider)] px-[var(--space-4)]">
      {attendanceBars.map((item) => (
        <div className="grid justify-items-center gap-2" key={item.label}>
          <div className="flex h-36 items-end gap-2">
            <Bar color="bg-[var(--color-success)]" max={100} value={item.present} />
            <Bar color="bg-[var(--color-danger)]" max={100} value={item.absent} />
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function Bar({ color, max, value }: { color: string; max: number; value: number }) {
  return <div className={cn("w-6 rounded-t-[var(--radius-sm)]", color)} style={{ height: `${(value / max) * 100}%` }} />;
}

function HealthCard() {
  return (
    <Card className="p-[var(--card-padding)]">
      <PanelTitle title="Membership health" />
      <div className="mt-[var(--space-5)] grid gap-[var(--space-6)] md:grid-cols-[15rem_1fr] md:items-center">
        <Donut total="12" />
        <div className="space-y-[var(--space-4)]">{healthItems.map((item) => <LegendLine key={item.label} {...item} />)}<button className="text-sm font-bold text-[var(--color-primary)]" type="button">View members →</button></div>
      </div>
    </Card>
  );
}

function DonutCard({ items, small, title, total }: { items: Array<[string, string, string]>; small?: boolean; title: string; total: string }) {
  return (
    <Card className="p-[var(--card-padding)]">
      <PanelTitle title={title} />
      <div className={cn("mt-[var(--space-5)] grid gap-[var(--space-5)] md:grid-cols-[13rem_1fr] md:items-center", small && "md:grid-cols-[10rem_1fr]")}>
        <Donut total={total} small={small} />
        <div className="space-y-3">{items.map(([label, value, percent], index) => <LegendLine color={donutColors[index]} key={label} label={label} value={`${value} (${percent})`} />)}</div>
      </div>
    </Card>
  );
}

function Donut({ small, total }: { small?: boolean; total: string }) {
  return (
    <div className={cn("relative mx-auto grid place-items-center rounded-full bg-[conic-gradient(var(--color-success)_0_34%,var(--color-primary)_34%_58%,var(--color-trial)_58%_80%,var(--color-danger)_80%_92%,var(--gray-300)_92%_100%)]", small ? "size-32" : "size-48")}>
      <div className={cn("grid place-items-center rounded-full bg-[var(--color-surface)] text-center", small ? "size-20" : "size-28")}>
        <div><p className="text-xl font-bold text-[var(--color-text)]">{total}</p><p className="text-sm text-[var(--color-text-secondary)]">Total</p></div>
      </div>
    </div>
  );
}

function ProgressList({ items, multicolor, percent }: { items: Array<[string, number, number]>; multicolor?: boolean; percent?: boolean }) {
  return (
    <div className="mt-[var(--space-4)] space-y-[var(--space-4)]">
      {items.map(([label, value, width], index) => (
        <div className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm" key={label}>
          <span className="font-medium text-[var(--color-text)]">{label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--gray-200)]"><div className={cn("h-full rounded-full", multicolor ? donutColors[index] : "bg-[var(--color-primary)]")} style={{ width: `${width}%` }} /></div>
          <strong className="text-[var(--color-text)]">{percent ? `${value}%` : value}</strong>
        </div>
      ))}
    </div>
  );
}

function HorizontalFunnel() {
  return <div className="mt-[var(--space-8)] grid grid-cols-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">{["Enquiries 18", "Trials scheduled 7", "Awaiting decision 2", "Converted 0"].map((item) => <div className="bg-[var(--color-primary-subtle)] p-5 text-center text-sm font-semibold text-[var(--color-text)]" key={item}>{item}</div>)}</div>;
}

function FunnelStack() {
  return <div className="mt-[var(--space-5)] space-y-3">{[["Enquiries", "18", "100%"], ["Contacted", "14", "77.8%"], ["Trial scheduled", "7", "38.9%"], ["Converted", "3", "16.7%"]].map(([a, b, c], i) => <div className="mx-auto grid h-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-sm font-semibold text-[var(--color-text)]" key={a} style={{ width: `${100 - i * 16}%` }}>{a} <strong>{b}</strong><span className="absolute right-8">{c}</span></div>)}</div>;
}

function FunnelRows() {
  return <div className="mt-[var(--space-5)] space-y-3">{[["Scheduled", "7", "100%"], ["Attended", "5", "71.4%"], ["Decision received", "4", "57.1%"], ["Converted", "3", "42.9%"]].map(([a, b, c]) => <div className="grid grid-cols-[1fr_3rem_4rem] rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] px-4 py-3 text-sm" key={a}><span>{a}</span><strong>{b}</strong><span>{c}</span></div>)}</div>;
}

function Heatmap() {
  const rows = [["Morning", 74, 76, 78, 75, 73, 71, 70], ["Afternoon", 66, 68, 67, 69, 65, 63, 62], ["Evening", 81, 83, 82, 84, 80, 79, 78]];
  return <div className="mt-[var(--space-4)] overflow-x-auto"><div className="grid min-w-[620px] grid-cols-[6rem_repeat(7,1fr)] gap-1 text-center text-xs">{["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}{rows.flatMap(([label, ...vals]) => [<span className="text-left" key={label}>{label}</span>, ...vals.map((v, i) => <span className="rounded bg-[var(--color-success-surface)] py-2" key={`${label}-${i}`}>{v}%</span>)])}</div></div>;
}

function Punctuality() {
  return <div className="mt-[var(--space-4)] grid gap-[var(--space-4)] md:grid-cols-2"><SummaryStat icon={Clock} label="On time" value="123" note="81%" /><SummaryStat icon={Clock} label="Late" value="29" note="19%" tone="amber" /><div className="md:col-span-2"><SummaryStat icon={Clock} label="Average late arrival" value="8 min" note="" /></div></div>;
}

function SummaryStat({ icon: Icon, label, note, tone = "green", value }: { icon: React.ComponentType<{ className?: string }>; label: string; note: string; tone?: "green" | "amber"; value: string }) {
  return <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"><div className={cn("grid size-12 place-items-center rounded-full", tone === "green" ? "bg-[var(--color-success-surface)] text-[var(--color-success)]" : "bg-[var(--color-warning-surface)] text-[var(--color-warning)]")}><Icon className="size-[var(--icon-md)]" /></div><div><p className="text-xs uppercase text-[var(--color-text-muted)]">{label}</p><p className="text-2xl font-bold">{value} <span className="text-base font-medium">{note}</span></p></div></div>;
}

function SimpleTable({ columns, compact, rows, title }: { columns: string[]; compact?: boolean; rows: string[][]; title: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--color-divider)] px-[var(--card-padding)] py-3"><PanelTitle title={title} /></div>
      <div className="overflow-x-auto"><table className={cn("w-full min-w-[900px] border-collapse text-left text-sm", compact && "min-w-[720px]")}><thead><tr className="bg-[var(--color-surface-subtle)] text-xs text-[var(--color-text-secondary)]">{columns.map((c) => <th className="px-4 py-3" key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr className="border-t border-[var(--color-divider)]" key={i}>{row.map((cell, j) => <td className={cn("px-4 py-3", j === row.length - 1 && "font-bold text-[var(--color-primary)]")} key={`${i}-${j}`}>{badgeCell(cell)}</td>)}</tr>)}</tbody></table></div>
    </Card>
  );
}

function badgeCell(cell: string) {
  if (["Completed", "Converted", "Good", "Active"].includes(cell)) return <StatusBadge status="active">{cell}</StatusBadge>;
  if (["Awaiting decision", "Needs attention"].includes(cell)) return <StatusBadge status="trial">{cell}</StatusBadge>;
  if (["Lost after trial", "Low attendance"].includes(cell)) return <StatusBadge status="lost">{cell}</StatusBadge>;
  return cell;
}

function LineChart() {
  const points = [68, 72, 75, 71, 76].map((v, i) => `${8 + i * 21},${100 - v}`);
  return <div className="mt-5"><svg className="h-44 w-full" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline fill="none" points={points.join(" ")} stroke="var(--color-primary)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg><LegendRow labels={["Renewal rate", "Average (72%)"]} /></div>;
}

function AttentionList() {
  return <div className="mt-3 divide-y divide-[var(--color-divider)]">{["4 overdue lead follow-ups", "3 members needing attendance follow-up", "4 full batches", "0 memberships expiring soon"].map((item) => <div className="flex items-center justify-between py-3 text-sm" key={item}><span>{item}</span><button className="font-bold text-[var(--color-primary)]" type="button">View →</button></div>)}</div>;
}

function LegendLine({ color, label, value }: { color: string; label: string; value: React.ReactNode }) {
  return <div className="flex items-center gap-3 text-sm"><span className={cn("size-2.5 rounded-full", color)} /><span className="flex-1">{label}</span><strong>{value}</strong></div>;
}

function LegendRow({ labels }: { labels: string[] }) {
  return <div className="mt-4 flex justify-center gap-6 text-sm text-[var(--color-text-secondary)]">{labels.map((label, i) => <span className="inline-flex items-center gap-2" key={label}><span className={cn("size-3 rounded-sm", i === 0 ? "bg-[var(--color-primary)]" : "bg-[var(--color-success)]")} />{label}</span>)}</div>;
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button className={cn("inline-flex h-10 items-center border-b-2 px-[var(--space-3)] text-sm font-bold transition", active ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]")} onClick={onClick} type="button">{children}</button>;
}

function descriptionFor(tab: Tab) {
  return {
    Overview: "Track membership, lead conversion and attendance performance.",
    Membership: "Analyze member growth, renewals, retention and membership health.",
    Leads: "Measure enquiry volume, follow-up performance and member conversion.",
    Trials: "Track trial scheduling, attendance, outcomes and conversion.",
    Attendance: "Analyze member attendance, punctuality and batch utilization.",
  }[tab];
}

function ShieldIcon(props: { className?: string }) {
  return <CheckCircle2 {...props} />;
}

const donutColors = [
  "bg-[var(--color-success)]",
  "bg-[var(--color-primary)]",
  "bg-[var(--color-trial)]",
  "bg-[var(--color-danger)]",
  "bg-[var(--gray-300)]",
];
