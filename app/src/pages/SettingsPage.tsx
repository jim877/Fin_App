import { useEffect, useMemo, useState } from "react";
import { Lock, Settings2, ShieldCheck, User, Users } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { APP_USERS, useCurrentUser } from "@/contexts/CurrentUserContext";

/**
 * Financial Permissions (session-only)
 * Preferences = what is visible to the user. Access rules = what is allowed. Only admins can edit access.
 */

type RoleId = "admin" | "finance" | "collections" | "ops" | "readonly";

type PageId =
  | "review"
  | "estimates"
  | "services"
  | "billingPrep"
  | "billing"
  | "collections"
  | "storage"
  | "referralFees"
  | "commissions"
  | "payables";

type PermissionId =
  | "view_perf_kpis"
  | "view_perf_chart"
  | "view_dashboard_followups"
  | "edit_followups"
  | "view_financial_amounts"
  | "view_sidebar_chips"
  | "access_review"
  | "access_estimates"
  | "access_services"
  | "access_billingPrep"
  | "access_billing"
  | "access_collections"
  | "access_storage"
  | "access_referralFees"
  | "access_commissions"
  | "access_payables"
  | "manage_permissions";

type PermMap = Record<PermissionId, boolean>;
type RolePerms = Record<RoleId, PermMap>;
type UserRecord = { id: string; name: string; role: RoleId };
type UserOverrides = Record<string, Partial<PermMap>>;
type UserUseDefaults = Record<string, boolean>;
type WidgetPrefId =
  | "show_perf_kpis"
  | "show_perf_chart"
  | "show_followups"
  | "show_amounts"
  | "show_sidebar_chips";
type WidgetPrefs = Record<string, Partial<Record<WidgetPrefId, boolean>>>;
type PagePrefs = Record<string, Partial<Record<PageId, boolean>>>;
type State = {
  users: UserRecord[];
  rolePerms: RolePerms;
  overrides: UserOverrides;
  useDefaults: UserUseDefaults;
  widgetPrefs: WidgetPrefs;
  pagePrefs: PagePrefs;
};

const ROLE_LABEL: Record<RoleId, string> = {
  admin: "Admin",
  finance: "Finance",
  collections: "Collections",
  ops: "Ops",
  readonly: "Read-only",
};

const DEFAULT_USERS: UserRecord[] = [
  { id: "jim", name: "Jim Fen", role: "admin" },
  { id: "jc", name: "JC", role: "finance" },
  { id: "df", name: "DF", role: "collections" },
  { id: "rh", name: "RH", role: "ops" },
  { id: "ma", name: "MA", role: "readonly" },
];

const PERMISSIONS: Array<{ id: PermissionId; group: string; label: string; desc: string }> = [
  { id: "view_perf_kpis", group: "Performance", label: "KPI cards", desc: "Show KPI cards (billed/collected/rate/outstanding)" },
  { id: "view_perf_chart", group: "Performance", label: "Chart", desc: "Show billed vs collected chart" },
  { id: "view_dashboard_followups", group: "Reminders", label: "Reminders widget", desc: "Show cross-section reminders list" },
  { id: "edit_followups", group: "Reminders", label: "Mark reminders done", desc: "Allow toggling reminders complete" },
  { id: "view_financial_amounts", group: "Visibility", label: "Financial amounts", desc: "Show $ values across the app" },
  { id: "view_sidebar_chips", group: "Visibility", label: "Sidebar chips", desc: "Show orange attention chips" },
  { id: "access_review", group: "Pages", label: "Review", desc: "Access the Review page" },
  { id: "access_estimates", group: "Pages", label: "Estimates", desc: "Access the Estimates page" },
  { id: "access_services", group: "Pages", label: "Services", desc: "Access the Services page" },
  { id: "access_billingPrep", group: "Pages", label: "Billing Prep", desc: "Access the Billing Prep page" },
  { id: "access_billing", group: "Pages", label: "Billing", desc: "Access the Billing page" },
  { id: "access_collections", group: "Pages", label: "Collections", desc: "Access the Collections page" },
  { id: "access_storage", group: "Pages", label: "Storage", desc: "Access the Storage page" },
  { id: "access_referralFees", group: "Pages", label: "Referral Fees", desc: "Access the Referral Fees page" },
  { id: "access_commissions", group: "Pages", label: "Commissions", desc: "Access the Commissions page" },
  { id: "access_payables", group: "Pages", label: "Payables", desc: "Access the Payables page" },
  { id: "manage_permissions", group: "Admin", label: "Manage permissions", desc: "Access the Settings / permissions controls" },
];

const ROLE_DEFAULTS: RolePerms = {
  admin: {
    view_perf_kpis: true, view_perf_chart: true, view_dashboard_followups: true, edit_followups: true,
    view_financial_amounts: true, view_sidebar_chips: true,
    access_review: true, access_estimates: true, access_services: true, access_billingPrep: true,
    access_billing: true, access_collections: true, access_storage: true, access_referralFees: true,
    access_commissions: true, access_payables: true, manage_permissions: true,
  },
  finance: {
    view_perf_kpis: true, view_perf_chart: true, view_dashboard_followups: true, edit_followups: true,
    view_financial_amounts: true, view_sidebar_chips: true,
    access_review: true, access_estimates: true, access_services: true, access_billingPrep: true,
    access_billing: true, access_collections: true, access_storage: true, access_referralFees: true,
    access_commissions: true, access_payables: true, manage_permissions: false,
  },
  collections: {
    view_perf_kpis: false, view_perf_chart: false, view_dashboard_followups: true, edit_followups: true,
    view_financial_amounts: true, view_sidebar_chips: true,
    access_review: true, access_estimates: false, access_services: false, access_billingPrep: true,
    access_billing: true, access_collections: true, access_storage: false, access_referralFees: false,
    access_commissions: false, access_payables: false, manage_permissions: false,
  },
  ops: {
    view_perf_kpis: false, view_perf_chart: false, view_dashboard_followups: true, edit_followups: true,
    view_financial_amounts: false, view_sidebar_chips: true,
    access_review: true, access_estimates: false, access_services: true, access_billingPrep: true,
    access_billing: false, access_collections: false, access_storage: true, access_referralFees: false,
    access_commissions: false, access_payables: true, manage_permissions: false,
  },
  readonly: {
    view_perf_kpis: true, view_perf_chart: false, view_dashboard_followups: true, edit_followups: false,
    view_financial_amounts: false, view_sidebar_chips: true,
    access_review: true, access_estimates: true, access_services: true, access_billingPrep: true,
    access_billing: true, access_collections: true, access_storage: true, access_referralFees: true,
    access_commissions: true, access_payables: true, manage_permissions: false,
  },
};

const WIDGET_PREFS: Array<{ id: WidgetPrefId; label: string; desc: string; requires: PermissionId }> = [
  { id: "show_perf_kpis", label: "KPI cards", desc: "Show KPI cards in the dashboard", requires: "view_perf_kpis" },
  { id: "show_perf_chart", label: "Performance chart", desc: "Show billed vs collected chart", requires: "view_perf_chart" },
  { id: "show_followups", label: "Reminders widget", desc: "Show the cross-section reminders widget", requires: "view_dashboard_followups" },
  { id: "show_amounts", label: "Show amounts", desc: "Display $ values", requires: "view_financial_amounts" },
  { id: "show_sidebar_chips", label: "Sidebar chips", desc: "Show orange attention chips", requires: "view_sidebar_chips" },
];

const PAGE_PREFS: Array<{ id: PageId; label: string; perm: PermissionId }> = [
  { id: "review", label: "Review", perm: "access_review" },
  { id: "estimates", label: "Estimates", perm: "access_estimates" },
  { id: "services", label: "Services", perm: "access_services" },
  { id: "billingPrep", label: "Billing Prep", perm: "access_billingPrep" },
  { id: "billing", label: "Billing", perm: "access_billing" },
  { id: "collections", label: "Collections", perm: "access_collections" },
  { id: "storage", label: "Storage", perm: "access_storage" },
  { id: "referralFees", label: "Referral Fees", perm: "access_referralFees" },
  { id: "commissions", label: "Commissions", perm: "access_commissions" },
  { id: "payables", label: "Payables", perm: "access_payables" },
];

function computePerms(state: State, userId: string): PermMap {
  const u = state.users.find((x) => x.id === userId) || state.users[0];
  const base = state.rolePerms[u!.role];
  const useRoleDefaults = state.useDefaults[u!.id] ?? true;
  if (useRoleDefaults) return { ...base! };
  return { ...base!, ...(state.overrides[u!.id] || {}) };
}

function groupPermissions() {
  const map = new Map<string, typeof PERMISSIONS>();
  for (const p of PERMISSIONS) {
    const arr = map.get(p.group) || [];
    arr.push(p);
    map.set(p.group, arr);
  }
  return Array.from(map.entries());
}

const ui = {
  page: "min-h-screen bg-slate-100 text-slate-900",
  wrap: "mx-auto max-w-6xl px-4 pb-10",
  title: "text-xl font-semibold tracking-tight",
  sub: "text-sm text-slate-600",
  btn: "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow disabled:opacity-40",
  btnPrimary: "inline-flex items-center justify-center rounded-xl bg-sky-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:opacity-40 disabled:hover:bg-sky-700",
  select: "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800",
  pill: "inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white",
};

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

function getWidgetPref(state: State, userId: string, id: WidgetPrefId) {
  return state.widgetPrefs[userId]?.[id] ?? true;
}

function getPagePref(state: State, userId: string, id: PageId) {
  return state.pagePrefs[userId]?.[id] ?? true;
}

function canManageAccess(state: State, operatorId: string) {
  return computePerms(state, operatorId).manage_permissions === true;
}

function canEditPreferences(state: State, operatorId: string, targetId: string) {
  return operatorId === targetId || canManageAccess(state, operatorId);
}

function PrefRow({
  label,
  desc,
  allowed,
  enabled,
  onToggle,
  disabled,
}: {
  label: string;
  desc: string;
  allowed: boolean;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
}) {
  const locked = !allowed;
  const effectiveDisabled = Boolean(disabled) || locked;
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 ${locked ? "opacity-50" : ""} ${disabled ? "opacity-60" : ""}`}
    >
      <Checkbox
        checked={enabled}
        disabled={effectiveDisabled}
        onCheckedChange={(v) => onToggle(Boolean(v))}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          {locked ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <Lock className="h-3.5 w-3.5" /> Locked
            </span>
          ) : enabled ? (
            <span className="text-[11px] font-semibold text-emerald-700">Shown</span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-500">Hidden</span>
          )}
        </div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { currentUser, setCurrentUser } = useCurrentUser();

  const initial: State = useMemo(
    () => ({
      users: DEFAULT_USERS,
      rolePerms: ROLE_DEFAULTS,
      overrides: {},
      useDefaults: Object.fromEntries(DEFAULT_USERS.map((u) => [u.id, true])) as UserUseDefaults,
      widgetPrefs: {},
      pagePrefs: {},
    }),
    []
  );

  const [saved, setSaved] = useState<State>(() => deepClone(initial));
  const [draft, setDraft] = useState<State>(() => deepClone(initial));
  const [operatorId, setOperatorIdState] = useState<string>(() => currentUser.id);
  const [targetId, setTargetId] = useState<string>(currentUser.id);
  const [showAccessEditor, setShowAccessEditor] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleId>("admin");

  useEffect(() => {
    setOperatorIdState(currentUser.id);
    setTargetId((t) => (t === currentUser.id ? t : currentUser.id));
  }, [currentUser.id]);

  const setOperatorId = (next: string) => {
    setOperatorIdState(next);
    const u = DEFAULT_USERS.find((x) => x.id === next) || APP_USERS.find((x) => x.id === next);
    if (u) setCurrentUser(u.id, u.name);
    setShowAccessEditor(false);
    if (!canManageAccess(draft, next)) setTargetId(next);
  };

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  const operator = useMemo(() => draft.users.find((u) => u.id === operatorId) || draft.users[0], [draft.users, operatorId]);
  const operatorIsAdmin = useMemo(() => canManageAccess(draft, operator!.id), [draft, operator]);
  const effectiveTargetId = operatorIsAdmin ? targetId : operator!.id;
  const targetUser = useMemo(() => draft.users.find((u) => u.id === effectiveTargetId) || draft.users[0], [draft.users, effectiveTargetId]);
  const permsForTarget = useMemo(() => computePerms(draft, targetUser!.id), [draft, targetUser]);
  const canEditTargetPrefs = useMemo(() => canEditPreferences(draft, operator!.id, targetUser!.id), [draft, operator, targetUser]);
  const groups = useMemo(() => groupPermissions(), []);
  const userUsesDefaults = (draft.useDefaults[targetUser!.id] ?? true) === true;

  const onCancel = () => {
    setDraft(deepClone(saved));
    setShowAccessEditor(false);
  };

  const onUpdate = () => {
    setSaved(deepClone(draft));
  };

  const setRolePerm = (role: RoleId, perm: PermissionId, val: boolean) => {
    setDraft((prev) => ({
      ...prev,
      rolePerms: { ...prev.rolePerms, [role]: { ...prev.rolePerms[role], [perm]: val } },
    }));
  };

  const setUserRole = (userId: string, role: RoleId) => {
    setDraft((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
    }));
  };

  const toggleUseDefaults = (userId: string, on: boolean) => {
    setDraft((prev) => {
      const next: State = { ...prev, useDefaults: { ...prev.useDefaults, [userId]: on } };
      if (on) {
        const o = { ...next.overrides };
        delete o[userId];
        next.overrides = o;
      }
      return next;
    });
  };

  const setUserOverride = (userId: string, perm: PermissionId, val: boolean) => {
    setDraft((prev) => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [userId]: { ...(prev.overrides[userId] || {}), [perm]: val },
      },
    }));
  };

  const clearOverrides = (userId: string) => {
    setDraft((prev) => {
      const next = { ...prev.overrides };
      delete next[userId];
      return { ...prev, overrides: next };
    });
  };

  const setWidgetPrefForUser = (userId: string, id: WidgetPrefId, val: boolean) => {
    setDraft((prev) => ({
      ...prev,
      widgetPrefs: {
        ...prev.widgetPrefs,
        [userId]: { ...(prev.widgetPrefs[userId] || {}), [id]: val },
      },
    }));
  };

  const setPagePrefForUser = (userId: string, id: PageId, val: boolean) => {
    setDraft((prev) => ({
      ...prev,
      pagePrefs: {
        ...prev.pagePrefs,
        [userId]: { ...(prev.pagePrefs[userId] || {}), [id]: val },
      },
    }));
  };

  const resetPrefs = (userId: string) => {
    setDraft((prev) => {
      const w = { ...prev.widgetPrefs };
      const p = { ...prev.pagePrefs };
      delete w[userId];
      delete p[userId];
      return { ...prev, widgetPrefs: w, pagePrefs: p };
    });
  };

  const previewRows = useMemo(() => {
    const rows: Array<{ label: string; state: "shown" | "hidden" | "locked" }> = [];
    for (const w of WIDGET_PREFS) {
      const allowed = permsForTarget[w.requires];
      const enabled = getWidgetPref(draft, targetUser!.id, w.id);
      rows.push({ label: w.label, state: !allowed ? "locked" : enabled ? "shown" : "hidden" });
    }
    for (const pg of PAGE_PREFS) {
      const allowed = permsForTarget[pg.perm];
      const enabled = getPagePref(draft, targetUser!.id, pg.id);
      rows.push({ label: `Page: ${pg.label}`, state: !allowed ? "locked" : enabled ? "shown" : "hidden" });
    }
    rows.push({ label: "Settings / permissions", state: permsForTarget.manage_permissions ? "shown" : "locked" });
    return rows;
  }, [permsForTarget, draft, targetUser]);

  const effectivePermsForTarget = useMemo(() => computePerms(draft, targetUser!.id), [draft, targetUser]);

  return (
    <AppPageLayout icon={Settings2} title="Settings">
      <div className={ui.wrap}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-600">
            Preferences = hide/show. Access rules = allowed/locked. Only admins can edit access.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Signed in</span>
              <select
                className="h-7 rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
              >
                {draft.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({ROLE_LABEL[u.role]})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Editing</span>
              <select
                className="h-7 rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
                value={effectiveTargetId}
                disabled={!operatorIsAdmin}
                onChange={(e) => setTargetId(e.target.value)}
                title={operatorIsAdmin ? "Select a user" : "Only admins can edit other users"}
              >
                {draft.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({ROLE_LABEL[u.role]})
                  </option>
                ))}
              </select>
              {!operatorIsAdmin && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <Lock className="h-3.5 w-3.5" /> self only
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {dirty ? <span className={ui.pill}>Unsaved</span> : <span className="text-xs font-semibold text-emerald-700">Saved</span>}
              <button className={ui.btn} onClick={onCancel} disabled={!dirty} type="button">Cancel</button>
              <button className={ui.btnPrimary} onClick={onUpdate} disabled={!dirty || !canEditTargetPrefs} type="button" title={!canEditTargetPrefs ? "You can only update your own preferences" : ""}>Update</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!operatorIsAdmin && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                You can customize what’s visible to you. Access rules are admin-only.
              </div>
            )}

            <Card className="border-slate-200 bg-white">
              <CardHeader className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">Dashboard widgets</CardTitle>
                  <button className={ui.btn} type="button" onClick={() => resetPrefs(targetUser!.id)} disabled={!canEditTargetPrefs}>Reset</button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xs text-slate-500">If an item is locked, the user doesn’t have access to it.</p>
                <div className="mt-3 space-y-2">
                  {WIDGET_PREFS.map((w) => (
                    <PrefRow
                      key={w.id}
                      label={w.label}
                      desc={w.desc}
                      allowed={permsForTarget[w.requires]}
                      enabled={getWidgetPref(draft, targetUser!.id, w.id)}
                      disabled={!canEditTargetPrefs}
                      onToggle={(next) => setWidgetPrefForUser(targetUser!.id, w.id, next)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader className="px-4 pt-3 pb-2">
                <CardTitle className="text-sm font-semibold">Sidebar sections</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xs text-slate-500">Hide sections you don’t use. Locked = no access.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {PAGE_PREFS.map((pg) => (
                    <PrefRow
                      key={pg.id}
                      label={pg.label}
                      desc="Show this section in the sidebar"
                      allowed={permsForTarget[pg.perm]}
                      enabled={getPagePref(draft, targetUser!.id, pg.id)}
                      disabled={!canEditTargetPrefs}
                      onToggle={(next) => setPagePrefForUser(targetUser!.id, pg.id, next)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 ${operatorIsAdmin ? "" : "opacity-60"}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">Access rules</p>
                  {!operatorIsAdmin && <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Lock className="h-3.5 w-3.5" /> admin only</span>}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">Controls what roles/users are allowed to see.</p>
              </div>
              <button type="button" className={ui.btn} disabled={!operatorIsAdmin} onClick={() => setShowAccessEditor((v) => !v)}>
                {showAccessEditor ? "Hide" : "Edit"}
              </button>
            </div>

            {operatorIsAdmin && showAccessEditor && (
              <>
                <Card className="border-slate-200 bg-white">
                  <CardHeader className="px-4 pt-3 pb-2">
                    <CardTitle className="text-sm font-semibold">Role access defaults</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role</label>
                    <select className={`${ui.select} mt-1`} value={roleToEdit} onChange={(e) => setRoleToEdit(e.target.value as RoleId)}>
                      {(Object.keys(draft.rolePerms) as RoleId[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                    <div className="mt-3 space-y-3">
                      {groups.map(([group, items]) => (
                        <div key={group}>
                          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{group}</div>
                          <div className="space-y-2">
                            {items.map((p) => (
                              <div key={p.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                <Checkbox checked={draft.rolePerms[roleToEdit][p.id]} onCheckedChange={(v) => setRolePerm(roleToEdit, p.id, Boolean(v))} />
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900">{p.label}</div>
                                  <div className="text-xs text-slate-500">{p.desc}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white">
                  <CardHeader className="px-4 pt-3 pb-2">
                    <CardTitle className="text-sm font-semibold">Per-user access overrides</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-600">Editing: {targetUser!.name}</span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role</label>
                        <select className={`${ui.select} mt-1`} value={targetUser!.role} onChange={(e) => setUserRole(targetUser!.id, e.target.value as RoleId)}>
                          {(Object.keys(draft.rolePerms) as RoleId[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <Checkbox checked={userUsesDefaults} onCheckedChange={(v) => toggleUseDefaults(targetUser!.id, Boolean(v))} />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">Use role defaults</div>
                            <div className="text-xs text-slate-500">Turn off to set per-user overrides.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!userUsesDefaults ? (
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-slate-500">Overrides apply on top of role defaults.</p>
                        <button type="button" className="text-xs font-semibold text-sky-700 hover:text-sky-900" onClick={() => clearOverrides(targetUser!.id)}>Clear overrides</button>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">Overrides disabled while using role defaults.</p>
                    )}
                    <div className="mt-3 space-y-3">
                      {groups.map(([group, items]) => (
                        <div key={group}>
                          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{group}</div>
                          <div className="space-y-2">
                            {items.map((p) => (
                              <div key={p.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                <Checkbox checked={effectivePermsForTarget[p.id]} disabled={userUsesDefaults} onCheckedChange={(v) => setUserOverride(targetUser!.id, p.id, Boolean(v))} />
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900">{p.label}</div>
                                  <div className="text-xs text-slate-500">{p.desc}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-xs font-semibold text-slate-700">Session-only</p>
                      <p className="mt-1 text-xs text-slate-500">Update applies while this shell is open.</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card className="border-slate-200 bg-white lg:col-span-1">
            <CardHeader className="px-4 pt-3 pb-2">
              <CardTitle className="text-sm font-semibold">Effective preview</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="h-4 w-4" />
                  <p className="text-sm font-semibold">What this user will see</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">Based on access + preferences.</p>
              </div>
              <div className="mt-3 space-y-2">
                {previewRows.map((r) => (
                  <div key={r.label} className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 ${r.state === "locked" ? "opacity-50" : ""}`}>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-900">{r.label}</div>
                    </div>
                    {r.state === "shown" ? (
                      <span className="text-xs font-semibold text-emerald-700">Shown</span>
                    ) : r.state === "hidden" ? (
                      <span className="text-xs font-semibold text-slate-500">Hidden</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppPageLayout>
  );
}
