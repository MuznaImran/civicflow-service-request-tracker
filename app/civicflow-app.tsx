"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  Hand,
  LayoutDashboard,
  ListFilter,
  LockKeyhole,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";

type Portal = "choose" | "resident" | "admin";
type RequestStatus = "New" | "Claimed" | "In Progress" | "Resolved";

type ServiceRequest = {
  id: number;
  publicId: string;
  title: string;
  category: string;
  priority: string;
  status: RequestStatus | string;
  location: string;
  description: string;
  assignedTo: string | null;
  adminNote: string | null;
  resolutionNote: string | null;
  createdAt: number | string;
  updatedAt: number | string;
  claimedAt: number | string | null;
  resolvedAt: number | string | null;
};

type AuditEntry = {
  id: number;
  requestRef: string;
  action: string;
  detail: string | null;
  createdAt: number | string;
};

const CATEGORIES = [
  "Roads & sidewalks",
  "Water & drainage",
  "Street lighting",
  "Waste collection",
  "Parks & public spaces",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES: RequestStatus[] = ["New", "Claimed", "In Progress", "Resolved"];

const statusStyle: Record<RequestStatus, string> = {
  New: "border-blue-200 bg-blue-50 text-blue-700",
  Claimed: "border-amber-200 bg-amber-50 text-amber-700",
  "In Progress": "border-violet-200 bg-violet-50 text-violet-700",
  Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function normalizeStatus(value: string): RequestStatus {
  const normalized = value.toLowerCase().replace(/[_-]/g, " ").trim();
  if (normalized === "claimed") return "Claimed";
  if (normalized === "in progress" || normalized === "inprogress") return "In Progress";
  if (normalized === "resolved") return "Resolved";
  return "New";
}

function readableDate(value: number | string | null, includeTime = false) {
  if (!value) return "—";
  const numeric = typeof value === "number" && value < 10_000_000_000 ? value * 1000 : value;
  const date = new Date(numeric);
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid size-10 place-items-center rounded-xl ${
          light ? "bg-white text-[#1261a6]" : "bg-[#1261a6] text-white"
        } shadow-sm`}
      >
        <Activity className="size-5" aria-hidden="true" />
      </div>
      <div>
        <div className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-[#102e4d]"}`}>
          CivicFlow
        </div>
        <div className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
          light ? "text-blue-100" : "text-slate-500"
        }`}>
          Service request hub
        </div>
      </div>
    </div>
  );
}

function PortalHeader({
  label,
  onBack,
  onLogout,
}: {
  label: string;
  onBack: () => void;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={onBack} className="rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Brand />
        </button>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden rounded-full px-3 sm:inline-flex">
            {label}
          </Badge>
          {onLogout ? (
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut /> Sign out
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft /> Switch portal
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function PortalChooser({ onChoose }: { onChoose: (portal: Portal) => void }) {
  return (
    <main className="min-h-screen bg-[#f5f8fb]">
      <section className="hero-glow relative isolate min-h-[70vh] overflow-hidden text-white">
        <div className="absolute inset-0 civic-grid opacity-20" />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-7 sm:px-8">
          <Brand light />
          <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
            <span className="mr-2 size-1.5 rounded-full bg-emerald-300" />
            Operations online
          </Badge>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:pb-28 lg:pt-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-blue-50">
              <Sparkles className="size-3.5 text-amber-300" />
              One clear path from report to resolution
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-6xl">
              Better services begin with a request people can trust.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              CivicFlow gives residents a simple reporting experience and equips
              operations teams with a transparent, accountable resolution workflow.
            </p>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-blue-50">
              {["Accessible by design", "Trackable workflows", "Actionable reporting"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-300" /> {item}
                </span>
              ))}
            </div>
          </div>

          <Card className="border-white/15 bg-white text-[#12233f] shadow-2xl shadow-black/20">
            <CardHeader className="pb-3">
              <div className="mb-3 grid size-11 place-items-center rounded-xl bg-blue-50 text-[#1261a6]">
                <UsersRound className="size-5" />
              </div>
              <CardTitle className="text-2xl">Choose your portal</CardTitle>
              <CardDescription>
                Residents enter immediately. Administrator access is protected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="portal-select">Continue as</Label>
                <NativeSelect
                  id="portal-select"
                  defaultValue=""
                  className="h-12 w-full bg-white text-base"
                  onChange={(event) => {
                    if (event.target.value) onChoose(event.target.value as Portal);
                  }}
                >
                  <NativeSelectOption value="" disabled>
                    Select a portal
                  </NativeSelectOption>
                  <NativeSelectOption value="resident">Resident — submit a request</NativeSelectOption>
                  <NativeSelectOption value="admin">Administrator — manage requests</NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => onChoose("resident")}
                  className="group rounded-xl border bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserRound className="mb-3 size-5 text-[#1261a6]" />
                  <div className="font-semibold">Resident</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">No sign-in required</div>
                  <ArrowRight className="mt-3 size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#1261a6]" />
                </button>
                <button
                  onClick={() => onChoose("admin")}
                  className="group rounded-xl border bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ShieldCheck className="mb-3 size-5 text-[#1261a6]" />
                  <div className="font-semibold">Administrator</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">Credentials required</div>
                  <ArrowRight className="mt-3 size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#1261a6]" />
                </button>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-800">
                This portfolio environment uses synthetic service-request data.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto -mt-9 grid max-w-6xl gap-4 px-5 pb-16 sm:grid-cols-3 sm:px-8">
        {[
          ["01", "Submit clearly", "Guided fields create useful, actionable reports."],
          ["02", "Route responsibly", "Teams claim work and record each status change."],
          ["03", "Resolve transparently", "Resolution notes and audit history preserve context."],
        ].map(([step, title, text]) => (
          <Card key={step} className="border-0 shadow-lg shadow-slate-900/6">
            <CardContent className="p-6">
              <span className="text-xs font-bold tracking-[0.16em] text-[#1261a6]">{step}</span>
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}

type FormState = {
  title: string;
  category: string;
  priority: string;
  location: string;
  description: string;
  website: string;
};

type SubmissionConfirmation = {
  publicId: string;
  status: string;
  createdAt: number | string;
};

const emptyForm: FormState = {
  title: "",
  category: "",
  priority: "Medium",
  location: "",
  description: "",
  website: "",
};

function ResidentPortal({
  onBack,
  confirmation,
  setConfirmation,
}: {
  onBack: () => void;
  confirmation: SubmissionConfirmation | null;
  setConfirmation: (value: SubmissionConfirmation | null) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as {
        error?: string;
        request: SubmissionConfirmation;
      };
      if (!response.ok) throw new Error(data.error || "The request could not be submitted.");
      setConfirmation(data.request);
      setForm(emptyForm);
      toast.success("Service request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="min-h-screen">
        <PortalHeader label="Resident portal" onBack={onBack} />
        <main className="civic-grid mx-auto grid min-h-[calc(100vh-72px)] max-w-5xl place-items-center px-5 py-14">
          <Card className="w-full max-w-2xl overflow-hidden border-0 shadow-xl shadow-slate-900/8">
            <div className="h-2 bg-emerald-500" />
            <CardContent className="p-8 text-center sm:p-12">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-8" />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight">Request received</h1>
              <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
                Your report has entered the operations queue. Save the reference below
                for your records.
              </p>
              <div className="mx-auto mt-7 max-w-sm rounded-xl border border-dashed border-blue-300 bg-blue-50 p-5">
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                  Request reference
                </div>
                <div className="mt-2 text-2xl font-bold tracking-wide text-[#123e68]">
                  {confirmation.publicId}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  Status: {confirmation.status || "New"}
                </div>
              </div>
              <Button className="mt-8" onClick={() => setConfirmation(null)}>
                Submit another request <ArrowRight />
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PortalHeader label="Resident portal" onBack={onBack} />
      <main className="civic-grid">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-14">
          <section>
            <div className="mb-7">
              <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">New service request</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tell us what needs attention.</h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Describe one issue per report. Specific, general location details help
                the operations team route it quickly.
              </p>
            </div>

            <Card className="shadow-lg shadow-slate-900/5">
              <form onSubmit={submit}>
                <CardContent className="grid gap-6 p-6 sm:p-8">
                  <div className="space-y-2">
                    <Label htmlFor="title">Short title</Label>
                    <Input
                      id="title"
                      required
                      minLength={6}
                      maxLength={80}
                      placeholder="e.g. Streetlight not working"
                      value={form.title}
                      onChange={(event) => update("title", event.target.value)}
                    />
                    <p className="text-xs text-slate-500">Use six to eighty characters.</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <NativeSelect
                        id="category"
                        required
                        value={form.category}
                        onChange={(event) => update("category", event.target.value)}
                        className="w-full bg-white"
                      >
                        <NativeSelectOption value="" disabled>Select a service area</NativeSelectOption>
                        {CATEGORIES.map((item) => <NativeSelectOption key={item}>{item}</NativeSelectOption>)}
                      </NativeSelect>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <NativeSelect
                        id="priority"
                        value={form.priority}
                        onChange={(event) => update("priority", event.target.value)}
                        className="w-full bg-white"
                      >
                        {PRIORITIES.map((item) => <NativeSelectOption key={item}>{item}</NativeSelectOption>)}
                      </NativeSelect>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">General location</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                      <Input
                        id="location"
                        required
                        minLength={3}
                        maxLength={100}
                        className="pl-9"
                        placeholder="Area, landmark, or intersection"
                        value={form.location}
                        onChange={(event) => update("location", event.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-500">Avoid names, phone numbers, or exact home addresses.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="description">Description</Label>
                      <span className="text-xs tabular-nums text-slate-500">{form.description.length}/500</span>
                    </div>
                    <Textarea
                      id="description"
                      required
                      minLength={15}
                      maxLength={500}
                      className="min-h-32 resize-y"
                      placeholder="What happened, when did you notice it, and what impact is it having?"
                      value={form.description}
                      onChange={(event) => update("description", event.target.value)}
                    />
                  </div>

                  <div className="absolute -left-[10000px]" aria-hidden="true">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(event) => update("website", event.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-md text-xs leading-5 text-slate-500">
                      Submissions are stored securely for this portfolio workflow and
                      contain synthetic data only.
                    </p>
                    <Button type="submit" size="lg" disabled={submitting}>
                      {submitting ? <RefreshCw className="animate-spin" /> : <Send />}
                      {submitting ? "Submitting…" : "Submit request"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="border-blue-200 bg-[#123e68] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gauge className="size-5 text-amber-300" /> What happens next
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  ["1", "Queued", "Your report receives a reference."],
                  ["2", "Claimed", "An administrator takes ownership."],
                  ["3", "Resolved", "The outcome is recorded."],
                ].map(([number, title, text]) => (
                  <div key={number} className="flex gap-3">
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">{number}</div>
                    <div>
                      <div className="text-sm font-semibold">{title}</div>
                      <div className="mt-0.5 text-xs leading-5 text-blue-100">{text}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <div>
                    <h2 className="text-sm font-semibold">Privacy-aware reporting</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      The form asks only for operational details and does not request
                      personal contact information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function AdminLogin({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (csrfToken: string) => void;
}) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string; csrfToken: string };
      if (!response.ok) throw new Error(data.error || "Invalid administrator credentials.");
      onSuccess(data.csrfToken);
      toast.success("Administrator session started");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8fb]">
      <PortalHeader label="Administrator portal" onBack={onBack} />
      <main className="hero-glow grid min-h-[calc(100vh-72px)] place-items-center px-5 py-12">
        <Card className="w-full max-w-md border-white/15 shadow-2xl">
          <CardHeader>
            <div className="mb-3 grid size-12 place-items-center rounded-xl bg-blue-50 text-[#1261a6]">
              <LockKeyhole className="size-6" />
            </div>
            <CardTitle className="text-2xl">Administrator sign in</CardTitle>
            <CardDescription>Access the service operations workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={login} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <Button className="w-full" size="lg" disabled={working}>
                {working ? <RefreshCw className="animate-spin" /> : <ShieldCheck />}
                {working ? "Signing in…" : "Sign in securely"}
              </Button>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                <strong>Portfolio access:</strong> username <code>admin</code>, password <code>admin</code>. Use synthetic data only.
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);
  return <Badge variant="outline" className={`rounded-full font-semibold ${statusStyle[normalized]}`}>{normalized}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === "Urgent"
      ? "bg-red-100 text-red-700"
      : priority === "High"
        ? "bg-orange-100 text-orange-700"
        : priority === "Low"
          ? "bg-slate-100 text-slate-600"
          : "bg-blue-100 text-blue-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{priority}</span>;
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          <div className="mt-2 text-xs text-slate-500">{helper}</div>
        </div>
        <div className={`grid size-10 place-items-center rounded-xl ${tone}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard({
  csrfToken,
  onBack,
  onSessionExpired,
}: {
  csrfToken: string;
  onBack: () => void;
  onSessionExpired: () => void;
}) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mutating, setMutating] = useState(false);

  const loadRequests = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await fetch("/api/admin/requests", { cache: "no-store" });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const data = (await response.json()) as {
        error?: string;
        requests?: ServiceRequest[];
        auditLogs?: AuditEntry[];
        audit?: AuditEntry[];
      };
      if (!response.ok) throw new Error(data.error || "Could not load requests.");
      setRequests(data.requests || []);
      setAudit(data.auditLogs || data.audit || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadRequests();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadRequests]);

  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    });
    onSessionExpired();
  }

  async function mutateRequest(
    request: ServiceRequest,
    payload: { action: "claim" | "start" | "resolve" | "note"; resolutionNote?: string; adminNote?: string },
  ) {
    setMutating(true);
    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const data = (await response.json()) as { error?: string; request: ServiceRequest };
      if (!response.ok) throw new Error(data.error || "The request could not be updated.");
      setRequests((items) => items.map((item) => item.id === request.id ? data.request : item));
      setSelected(data.request);
      setResolutionNote("");
      toast.success(
        payload.action === "resolve"
          ? "Request resolved"
          : payload.action === "claim"
            ? "Request assigned to you"
            : payload.action === "start"
              ? "Work marked in progress"
              : "Internal note saved",
      );
      await loadRequests(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setMutating(false);
    }
  }

  async function deleteRequest() {
    if (!selected) return;
    setMutating(true);
    try {
      const response = await fetch(`/api/admin/requests/${selected.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
      });
      const data = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok) throw new Error(data.error || "The request could not be deleted.");
      setRequests((items) => items.filter((item) => item.id !== selected.id));
      setSelected(null);
      setDeleteOpen(false);
      toast.success("Request deleted and audit event retained");
      await loadRequests(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setMutating(false);
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesQuery =
        !needle ||
        [request.publicId, request.title, request.location, request.description]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return (
        matchesQuery &&
        (status === "All" || normalizeStatus(request.status) === status) &&
        (category === "All" || request.category === category) &&
        (priority === "All" || request.priority === priority)
      );
    });
  }, [requests, query, status, category, priority]);

  const counts = useMemo(() => {
    const count = (wanted: RequestStatus) => requests.filter((item) => normalizeStatus(item.status) === wanted).length;
    return {
      total: requests.length,
      new: count("New"),
      active: count("Claimed") + count("In Progress"),
      resolved: count("Resolved"),
    };
  }, [requests]);

  const categoryCounts = useMemo(
    () =>
      CATEGORIES.map((name) => ({
        name,
        count: requests.filter((item) => item.category === name).length,
      }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    [requests],
  );

  return (
    <div className="min-h-screen bg-[#f5f8fb]">
      <PortalHeader label="Operations center" onBack={onBack} onLogout={logout} />
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#1261a6]">
              <span className="size-2 rounded-full bg-emerald-500" /> Live operations
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Service request command center</h1>
            <p className="mt-2 text-sm text-slate-600">Prioritize demand, coordinate ownership, and close the loop.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadRequests(true)} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/admin/export" download><Download /> Export CSV</a>
            </Button>
          </div>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Request overview">
          <MetricCard label="Total requests" value={counts.total} helper="All records" icon={<FileText className="size-5" />} tone="bg-blue-50 text-blue-700" />
          <MetricCard label="New queue" value={counts.new} helper="Awaiting ownership" icon={<Clock3 className="size-5" />} tone="bg-amber-50 text-amber-700" />
          <MetricCard label="Active work" value={counts.active} helper="Claimed or in progress" icon={<Wrench className="size-5" />} tone="bg-violet-50 text-violet-700" />
          <MetricCard label="Resolved" value={counts.resolved} helper="Closed with an outcome" icon={<FileCheck2 className="size-5" />} tone="bg-emerald-50 text-emerald-700" />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <Card className="min-w-0">
            <CardHeader className="gap-4 border-b">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><LayoutDashboard className="size-5 text-[#1261a6]" /> Request queue</CardTitle>
                  <CardDescription className="mt-1">{filtered.length} of {requests.length} requests shown</CardDescription>
                </div>
                <Badge variant="outline" className="w-fit"><ListFilter className="mr-1 size-3" /> Operational view</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(180px,1fr)_140px_170px_120px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                  <Input className="pl-9" placeholder="Search requests…" value={query} onChange={(event) => setQuery(event.target.value)} />
                </div>
                <NativeSelect value={status} onChange={(event) => setStatus(event.target.value)} className="w-full bg-white">
                  <NativeSelectOption>All</NativeSelectOption>
                  {STATUSES.map((item) => <NativeSelectOption key={item}>{item}</NativeSelectOption>)}
                </NativeSelect>
                <NativeSelect value={category} onChange={(event) => setCategory(event.target.value)} className="w-full bg-white">
                  <NativeSelectOption>All</NativeSelectOption>
                  {CATEGORIES.map((item) => <NativeSelectOption key={item}>{item}</NativeSelectOption>)}
                </NativeSelect>
                <NativeSelect value={priority} onChange={(event) => setPriority(event.target.value)} className="w-full bg-white">
                  <NativeSelectOption>All</NativeSelectOption>
                  {PRIORITIES.map((item) => <NativeSelectOption key={item}>{item}</NativeSelectOption>)}
                </NativeSelect>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-6">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="grid min-h-72 place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500"><Search className="size-5" /></div>
                    <h2 className="mt-4 font-semibold">No matching requests</h2>
                    <p className="mt-1 text-sm text-slate-500">Adjust the filters or submit a resident request.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((request) => (
                          <TableRow key={request.id} className="cursor-pointer" onClick={() => { setSelected(request); setAdminNote(request.adminNote || ""); }}>
                            <TableCell>
                              <div className="font-semibold">{request.title}</div>
                              <div className="mt-1 text-xs text-slate-500">{request.publicId} · {request.category}</div>
                            </TableCell>
                            <TableCell><StatusBadge status={request.status} /></TableCell>
                            <TableCell><PriorityBadge priority={request.priority} /></TableCell>
                            <TableCell className="text-sm">{request.assignedTo || "Unassigned"}</TableCell>
                            <TableCell className="text-sm text-slate-500">{readableDate(request.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="divide-y md:hidden">
                    {filtered.map((request) => (
                      <button key={request.id} onClick={() => { setSelected(request); setAdminNote(request.adminNote || ""); }} className="w-full p-5 text-left hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-semibold">{request.title}</div>
                          <PriorityBadge priority={request.priority} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{request.publicId}</span><StatusBadge status={request.status} />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="size-5 text-[#1261a6]" /> Demand by service</CardTitle>
                <CardDescription>Current request distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryCounts.map((item, index) => {
                  const max = Math.max(1, categoryCounts[0]?.count || 1);
                  return (
                    <div key={item.name}>
                      <div className="mb-1.5 flex justify-between text-xs"><span className="truncate pr-2 text-slate-600">{item.name}</span><strong>{item.count}</strong></div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#1261a6]" style={{ width: `${Math.max(5, (item.count / max) * 100)}%`, opacity: 1 - index * 0.12 }} />
                      </div>
                    </div>
                  );
                })}
                {!categoryCounts.length && <p className="text-sm text-slate-500">Data appears after the first request.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent activity</CardTitle>
                <CardDescription>Latest accountable workflow events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {audit.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="relative border-l-2 border-blue-100 pl-4">
                    <span className="absolute -left-[5px] top-1 size-2 rounded-full bg-[#1261a6]" />
                    <div className="text-xs font-semibold">{entry.action}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{entry.requestRef} · {readableDate(entry.createdAt, true)}</div>
                  </div>
                ))}
                {!audit.length && <p className="text-sm text-slate-500">Workflow activity will appear here.</p>}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <PriorityBadge priority={selected.priority} />
                  <span className="text-xs text-slate-500">{selected.publicId}</span>
                </div>
                <DialogTitle className="text-2xl">{selected.title}</DialogTitle>
                <DialogDescription>{selected.category} · submitted {readableDate(selected.createdAt, true)}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-2">
                <div className="grid gap-4 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
                  <div><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Location</div><div className="mt-1 text-sm">{selected.location}</div></div>
                  <div><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Assigned to</div><div className="mt-1 text-sm">{selected.assignedTo || "Unassigned"}</div></div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Resident description</h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl border p-4 text-sm leading-6 text-slate-600">{selected.description}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-note">Internal operations note</Label>
                  <Textarea id="admin-note" maxLength={500} placeholder="Add context for the operations team…" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
                  <Button variant="outline" size="sm" disabled={mutating} onClick={() => mutateRequest(selected, { action: "note", adminNote })}>Save internal note</Button>
                </div>

                {normalizeStatus(selected.status) === "In Progress" && (
                  <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <Label htmlFor="resolution-note">Resolution note</Label>
                    <Textarea id="resolution-note" required minLength={10} placeholder="Record what was completed and the final outcome…" value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} className="bg-white" />
                    <p className="text-xs text-emerald-800">A meaningful resolution note is required to close the request.</p>
                  </div>
                )}

                {selected.resolutionNote && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Resolution</div>
                    <p className="mt-2 text-sm leading-6 text-emerald-950">{selected.resolutionNote}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
                <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={mutating}><Trash2 /> Delete</Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {normalizeStatus(selected.status) === "New" && (
                    <Button disabled={mutating} onClick={() => mutateRequest(selected, { action: "claim" })}><Hand /> Assign to me</Button>
                  )}
                  {normalizeStatus(selected.status) === "Claimed" && (
                    <Button disabled={mutating} onClick={() => mutateRequest(selected, { action: "start" })}><Wrench /> Start work</Button>
                  )}
                  {normalizeStatus(selected.status) === "In Progress" && (
                    <Button disabled={mutating || resolutionNote.trim().length < 10} className="bg-emerald-600 hover:bg-emerald-700" onClick={() => mutateRequest(selected, { action: "resolve", resolutionNote })}><CheckCircle2 /> Resolve request</Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this request?</AlertDialogTitle>
            <AlertDialogDescription>
              The service request will be permanently removed. A minimal audit event
              will remain to record that an administrator deleted it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteRequest} className="bg-red-600 text-white hover:bg-red-700">
              {mutating ? "Deleting…" : "Delete request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminPortal({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<"checking" | "login" | "ready">("checking");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as {
          authenticated?: boolean;
          csrfToken?: string;
        };
        if (!active) return;
        if (response.ok && data.authenticated && data.csrfToken) {
          setCsrfToken(data.csrfToken);
          setState("ready");
        } else {
          setState("login");
        }
      })
      .catch(() => active && setState("login"));
    return () => { active = false; };
  }, []);

  if (state === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f8fb]">
        <div className="text-center"><RefreshCw className="mx-auto size-7 animate-spin text-[#1261a6]" /><p className="mt-3 text-sm text-slate-500">Checking secure session…</p></div>
      </div>
    );
  }
  if (state === "login") {
    return <AdminLogin onBack={onBack} onSuccess={(token) => { setCsrfToken(token); setState("ready"); }} />;
  }
  return <AdminDashboard csrfToken={csrfToken} onBack={onBack} onSessionExpired={() => { setCsrfToken(""); setState("login"); }} />;
}

export default function CivicFlowApp() {
  const [portal, setPortal] = useState<Portal>("choose");
  const [confirmation, setConfirmation] = useState<SubmissionConfirmation | null>(null);

  useEffect(() => {
    type ModelContext = {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => Promise<unknown>;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };

    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    const register = async () => {
      await context.registerTool(
        {
          name: "submit_community_service_request",
          title: "Submit community service request",
          description:
            "Submit one synthetic community service issue to CivicFlow and show its confirmation in the resident portal.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", minLength: 6, maxLength: 80 },
              category: { type: "string", enum: CATEGORIES },
              priority: { type: "string", enum: PRIORITIES },
              location: { type: "string", minLength: 3, maxLength: 100 },
              description: { type: "string", minLength: 15, maxLength: 500 },
            },
            required: ["title", "category", "priority", "location", "description"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input) {
            if (!input || typeof input !== "object" || Array.isArray(input)) {
              throw new Error("A service request object is required.");
            }
            const values = input as Partial<FormState>;
            if (
              typeof values.title !== "string" ||
              values.title.trim().length < 6 ||
              !CATEGORIES.includes(values.category || "") ||
              !PRIORITIES.includes(values.priority || "") ||
              typeof values.location !== "string" ||
              values.location.trim().length < 3 ||
              typeof values.description !== "string" ||
              values.description.trim().length < 15
            ) {
              throw new Error("The service request fields are incomplete or invalid.");
            }

            const response = await fetch("/api/requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...values, website: "" }),
            });
            const result = (await response.json()) as {
              error?: string;
              request: SubmissionConfirmation;
            };
            if (!response.ok) throw new Error(result.error || "The service request could not be submitted.");
            setConfirmation(result.request);
            setPortal("resident");
            return {
              publicId: result.request.publicId,
              status: result.request.status,
              submitted: true,
            };
          },
        },
        { signal: lifecycle.signal },
      );
    };

    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <>
      {portal === "choose" && <PortalChooser onChoose={setPortal} />}
      {portal === "resident" && (
        <ResidentPortal
          onBack={() => setPortal("choose")}
          confirmation={confirmation}
          setConfirmation={setConfirmation}
        />
      )}
      {portal === "admin" && <AdminPortal onBack={() => setPortal("choose")} />}
      <Toaster richColors position="top-right" />
    </>
  );
}
