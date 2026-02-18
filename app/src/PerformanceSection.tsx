import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesMode = "day" | "week" | "month" | "ytd";

type SeriesPoint = { period: string; billed: number; collected: number };

type ChartView = "overview" | "billed" | "collected" | "rate" | "outstanding";

type OverviewPoint = SeriesPoint & { billedGoal: number; collectedGoal: number };

type SinglePoint = { period: string; value: number; goal: number };

type Dir = "up" | "down";

type KpiCardModel = {
  id: Exclude<ChartView, "overview">;
  title: string;
  valueText: string;
  goalLabel: string;
  goalText: string;
  progress: number;
  dir: Dir;
};

const GOALS = {
  collectionRate: 92,
  outstandingMax: 15000,
} as const;

const CHART_GOALS: Record<SeriesMode, { billed: number; collected: number }> = {
  day: { billed: 22000, collected: 20000 },
  week: { billed: 105000, collected: 94000 },
  month: { billed: 130000, collected: 120000 },
  ytd: { billed: 1350000, collected: 1210000 },
};

const SERIES: Record<SeriesMode, SeriesPoint[]> = {
  day: [
    { period: "Nov 10", billed: 45814.16, collected: 33512.4 },
    { period: "Nov 11", billed: 1527.06, collected: 0 },
    { period: "Nov 12", billed: 0, collected: 13765.45 },
    { period: "Nov 13", billed: 27494.02, collected: 0 },
    { period: "Nov 14", billed: 21746.9, collected: 37438.69 },
  ],
  week: [
    { period: "W45", billed: 96582.14, collected: 84716.54 },
    { period: "W46", billed: 32210, collected: 19875 },
    { period: "W47", billed: 28450, collected: 25590 },
  ],
  month: [
    { period: "Sep 2025", billed: 142200, collected: 130100 },
    { period: "Oct 2025", billed: 126500, collected: 119220 },
    { period: "Nov 2025", billed: 96582.14, collected: 84716.54 },
  ],
  ytd: [
    { period: "Jan", billed: 98000, collected: 87000 },
    { period: "Feb", billed: 198000, collected: 174000 },
    { period: "Mar", billed: 310000, collected: 282000 },
    { period: "Apr", billed: 420000, collected: 381000 },
    { period: "May", billed: 550000, collected: 496000 },
    { period: "Jun", billed: 690000, collected: 620000 },
    { period: "Jul", billed: 820000, collected: 739000 },
    { period: "Aug", billed: 955000, collected: 865000 },
    { period: "Sep", billed: 1097200, collected: 995100 },
    { period: "Oct", billed: 1223700, collected: 1114320 },
    { period: "Nov", billed: 1320282.14, collected: 1199036.54 },
  ],
};

const ui = {
  card: "border-slate-200 bg-white",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundToNearest(n: number, step: number) {
  if (!step) return n;
  return Math.round(n / step) * step;
}

function stripTrailingZero(s: string) {
  return s.replace(/\.0$/, "");
}

function formatNumberCompact(abs: number) {
  const a = Math.abs(abs);
  if (a >= 1_000_000) return `${stripTrailingZero((a / 1_000_000).toFixed(1))}M`;
  if (a >= 1_000)
    return `${stripTrailingZero((a / 1_000).toFixed(a >= 100_000 ? 0 : 1))}K`;
  return `${Math.round(a)}`;
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrency0(value?: number) {
  if (value === undefined || value === null) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatGoalMoney(value: number) {
  const rounded = roundToNearest(value, 1000);
  return `$${formatNumberCompact(rounded)}`;
}

function formatPercent(value?: number) {
  if (value === undefined || value === null) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return `${n.toFixed(0)}%`;
}

function formatAxisCurrency(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value.toFixed(0)}`;
}

function formatAxisPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function goalProgress(args: { value: number; goal: number; higherIsBetter: boolean }) {
  const { value, goal, higherIsBetter } = args;
  if (goal <= 0) return 1;
  if (higherIsBetter) return clamp(value / goal, 0, 1);
  if (value <= 0) return 1;
  return clamp(goal / value, 0, 1);
}

type Tone = "good" | "warn" | "bad";

function toneFromProgress(progress: number): Tone {
  if (progress >= 1) return "good";
  if (progress >= 0.9) return "warn";
  return "bad";
}

function statusTextClassFromTone(tone: Tone) {
  if (tone === "good") return "text-emerald-700";
  if (tone === "warn") return "text-orange-700";
  return "text-rose-700";
}

function toneLabel(tone: Tone) {
  if (tone === "good") return "On track";
  if (tone === "warn") return "Near goal";
  return "Off track";
}

function dirFor(args: { value: number; goal: number; higherIsBetter: boolean }): Dir {
  const { value, goal, higherIsBetter } = args;
  if (higherIsBetter) return value >= goal ? "up" : "down";
  return value <= goal ? "down" : "up";
}

function KpiCard({
  model,
  active,
  onClick,
}: {
  model: KpiCardModel;
  active?: boolean;
  onClick?: () => void;
}) {
  const tone = toneFromProgress(model.progress);
  const statusCls = statusTextClassFromTone(tone);
  const Icon = model.dir === "up" ? ArrowUp : ArrowDown;

  return (
    <Card className={`${ui.card} ${active ? "ring-2 ring-sky-400" : ""}`}>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-sky-300"
      >
        <CardHeader className="px-4 pt-3 pb-2">
          <CardTitle className="text-xs font-medium text-slate-500">{model.title}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="text-xl font-semibold text-slate-900">{model.valueText}</div>
            <div
              className={`shrink-0 inline-flex items-center ${statusCls}`}
              title={toneLabel(tone)}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">{toneLabel(tone)}</span>
            </div>
          </div>

          <div className="mt-2 text-xs">
            <span className="text-slate-500">{model.goalLabel} </span>
            <span className="font-semibold text-slate-700">{model.goalText}</span>
          </div>
        </CardContent>
      </button>
    </Card>
  );
}

function ChartLegend({
  payload,
}: {
  payload?: Array<{ value?: string; dataKey?: string; color?: string }>;
}) {
  const items = payload || [];
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 px-2 text-[11px] text-slate-600">
      {items.map((entry, idx) => {
        const key = String(entry.dataKey || idx);
        const label = String(entry.value || "");
        const isGoal = key.toLowerCase().includes("goal");
        const color = entry.color || "#64748b";
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className="inline-block w-7 border-t-2"
              style={{
                borderTopColor: color,
                borderTopStyle: isGoal ? "dashed" : "solid",
              }}
            />
            <span className="whitespace-nowrap">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function chartHeader(view: ChartView, mode: SeriesMode) {
  const g = CHART_GOALS[mode];
  switch (view) {
    case "billed":
      return {
        title: "Total billed",
        subtitle: `Goal shown as dashed line (${formatGoalMoney(g.billed)}).`,
      };
    case "collected":
      return {
        title: "Total collected",
        subtitle: `Goal shown as dashed line (${formatGoalMoney(g.collected)}).`,
      };
    case "rate":
      return {
        title: "Collection rate",
        subtitle: `Goal shown as dashed line (${formatPercent(GOALS.collectionRate)}).`,
      };
    case "outstanding":
      return {
        title: "Outstanding",
        subtitle: `Max shown as dashed line (${formatGoalMoney(GOALS.outstandingMax)}).`,
      };
    default:
      return {
        title: "Billed vs collected",
        subtitle: `Goals shown as dashed lines (${formatGoalMoney(g.billed)} / ${formatGoalMoney(
          g.collected
        )}).`,
      };
  }
}

function buildOverview(mode: SeriesMode): OverviewPoint[] {
  const goal = CHART_GOALS[mode];
  return SERIES[mode].map((p) => ({
    ...p,
    billedGoal: goal.billed,
    collectedGoal: goal.collected,
  }));
}

function buildSingle(
  mode: SeriesMode,
  mapper: (p: SeriesPoint) => number,
  goalValue: number
): SinglePoint[] {
  return SERIES[mode].map((p) => ({
    period: p.period,
    value: mapper(p),
    goal: goalValue,
  }));
}

export default function PerformanceSection() {
  const [pulse, setPulse] = useState(0);
  const pulseChart = () => setPulse((p) => p + 1);

  const [mode, setMode] = useState<SeriesMode>("week");
  const [view, setView] = useState<ChartView>("overview");

  const points = SERIES[mode];
  const latest = points[points.length - 1];
  const billed = latest?.billed ?? 0;
  const collected = latest?.collected ?? 0;
  const collectionRate = billed > 0 ? (collected / billed) * 100 : 0;
  const outstanding = Math.max(0, billed - collected);

  const kpis = useMemo<KpiCardModel[]>(() => {
    const g = CHART_GOALS[mode];

    const billedProgress = goalProgress({ value: billed, goal: g.billed, higherIsBetter: true });
    const collectedProgress = goalProgress({
      value: collected,
      goal: g.collected,
      higherIsBetter: true,
    });
    const rateProgress = goalProgress({
      value: collectionRate,
      goal: GOALS.collectionRate,
      higherIsBetter: true,
    });
    const outstandingProgress = goalProgress({
      value: outstanding,
      goal: GOALS.outstandingMax,
      higherIsBetter: false,
    });

    return [
      {
        id: "billed",
        title: "Total billed",
        valueText: formatCurrency0(billed),
        goalLabel: "Goal",
        goalText: formatGoalMoney(g.billed),
        progress: billedProgress,
        dir: dirFor({ value: billed, goal: g.billed, higherIsBetter: true }),
      },
      {
        id: "collected",
        title: "Total collected",
        valueText: formatCurrency0(collected),
        goalLabel: "Goal",
        goalText: formatGoalMoney(g.collected),
        progress: collectedProgress,
        dir: dirFor({ value: collected, goal: g.collected, higherIsBetter: true }),
      },
      {
        id: "rate",
        title: "Collection rate",
        valueText: formatPercent(collectionRate),
        goalLabel: "Goal",
        goalText: formatPercent(GOALS.collectionRate),
        progress: rateProgress,
        dir: dirFor({ value: collectionRate, goal: GOALS.collectionRate, higherIsBetter: true }),
      },
      {
        id: "outstanding",
        title: "Outstanding",
        valueText: formatCurrency0(outstanding),
        goalLabel: "Max",
        goalText: formatGoalMoney(GOALS.outstandingMax),
        progress: outstandingProgress,
        dir: dirFor({ value: outstanding, goal: GOALS.outstandingMax, higherIsBetter: false }),
      },
    ];
  }, [mode, billed, collected, collectionRate, outstanding]);

  const header = chartHeader(view, mode);

  const overviewData = useMemo(() => buildOverview(mode), [mode]);
  const billedData = useMemo(
    () => buildSingle(mode, (p) => p.billed, CHART_GOALS[mode].billed),
    [mode]
  );
  const collectedData = useMemo(
    () => buildSingle(mode, (p) => p.collected, CHART_GOALS[mode].collected),
    [mode]
  );
  const rateData = useMemo(
    () =>
      buildSingle(
        mode,
        (p) => (p.billed > 0 ? (p.collected / p.billed) * 100 : 0),
        GOALS.collectionRate
      ),
    [mode]
  );
  const outstandingData = useMemo(
    () =>
      buildSingle(mode, (p) => Math.max(0, p.billed - p.collected), GOALS.outstandingMax),
    [mode]
  );

  const data =
    view === "overview"
      ? overviewData
      : view === "billed"
      ? billedData
      : view === "collected"
      ? collectedData
      : view === "rate"
      ? rateData
      : outstandingData;

  const isPercent = view === "rate";

  return (
    <>
      <style>{`
        @keyframes chartpulse {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-chartpulse { animation: chartpulse 650ms ease-out forwards; }
      `}</style>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Performance</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Day/Week/Month/YTD applies to KPIs and chart. Click a KPI to focus the chart.
            </p>
          </div>

          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as SeriesMode);
              pulseChart();
            }}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-4 gap-1">
              <TabsTrigger value="day" className="text-[11px] px-3 py-1.5">
                Day
              </TabsTrigger>
              <TabsTrigger value="week" className="text-[11px] px-3 py-1.5">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="text-[11px] px-3 py-1.5">
                Month
              </TabsTrigger>
              <TabsTrigger value="ytd" className="text-[11px] px-3 py-1.5">
                YTD
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {kpis.map((k) => (
            <KpiCard
              key={k.id}
              model={k}
              active={view === k.id}
              onClick={() => {
                setView((v) => (v === k.id ? "overview" : k.id));
                pulseChart();
              }}
            />
          ))}
        </div>

        <Card className={`${ui.card} relative`}>
          {pulse > 0 && (
            <div
              key={pulse}
              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-sky-400 animate-chartpulse"
            />
          )}

          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-3 pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold">{header.title}</CardTitle>
              <p className="text-xs text-slate-500">{header.subtitle}</p>
            </div>
          </CardHeader>

          <CardContent className="px-0 pb-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data as OverviewPoint[] & SinglePoint[]}
                  margin={{ left: 16, right: 24, top: 16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={isPercent ? formatAxisPercent : formatAxisCurrency}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => {
                      const key = String(name);
                      const n = Number(value);

                      if (view === "overview") {
                        const label =
                          key === "billed"
                            ? "Billed"
                            : key === "collected"
                            ? "Collected"
                            : key === "billedGoal"
                            ? "Billed goal"
                            : key === "collectedGoal"
                            ? "Collected goal"
                            : key;
                        return [formatCurrency(n), label];
                      }

                      if (view === "rate") return [formatPercent(n), key.toLowerCase().includes("goal") ? "Goal" : "Rate"];
                      if (view === "outstanding")
                        return [formatCurrency(n), key.toLowerCase().includes("goal") ? "Max" : "Outstanding"];
                      return [formatCurrency(n), key.toLowerCase().includes("goal") ? "Goal" : header.title];
                    }}
                    labelFormatter={(label: unknown) => String(label)}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 8 }}
                    content={(props) => (
                      <ChartLegend
                        payload={
                          props.payload as
                            | Array<{ value?: string; dataKey?: string; color?: string }>
                            | undefined
                        }
                      />
                    )}
                  />

                  {view === "overview" ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="billed"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                        name="Billed"
                      />
                      <Line
                        type="monotone"
                        dataKey="billedGoal"
                        stroke="#f97316"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="6 4"
                        name="Billed goal"
                      />
                      <Line
                        type="monotone"
                        dataKey="collected"
                        stroke="#0f766e"
                        strokeWidth={2}
                        dot={false}
                        name="Collected"
                      />
                      <Line
                        type="monotone"
                        dataKey="collectedGoal"
                        stroke="#0f766e"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="6 4"
                        name="Collected goal"
                      />
                    </>
                  ) : (
                    <>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={
                          view === "collected"
                            ? "#0f766e"
                            : view === "rate"
                            ? "#0ea5e9"
                            : view === "outstanding"
                            ? "#334155"
                            : "#f97316"
                        }
                        strokeWidth={2}
                        dot={false}
                        name={view === "rate" ? "Rate" : header.title}
                      />
                      <Line
                        type="monotone"
                        dataKey="goal"
                        stroke={
                          view === "collected"
                            ? "#0f766e"
                            : view === "rate"
                            ? "#0ea5e9"
                            : view === "outstanding"
                            ? "#334155"
                            : "#f97316"
                        }
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="6 4"
                        name={view === "outstanding" ? "Max" : "Goal"}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
