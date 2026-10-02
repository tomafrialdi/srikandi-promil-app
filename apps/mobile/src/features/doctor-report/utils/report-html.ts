import type { ReportDetails, ReportPreview, ReportSection } from "../types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "2026-05-23" -> "23 May 2026". */
function day(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const label = (value: string) => esc(value.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()));

const table = (head: string[], rows: string[][]) =>
  `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

const section = (title: string, body: string) => `<section><h2>${title}</h2>${body}</section>`;
const none = (text: string) => `<p class="muted">${text}</p>`;

/** BBT as bars, like the in-app preview: before ovulation tinted, ovulation day amber, after solid. */
function bbtChart(bbt: NonNullable<ReportPreview["bbt"]>): string {
  const W = 640;
  const H = 120;
  const MIN = 36;
  const MAX = 37;
  const slot = W / bbt.temps.length;
  const bars = bbt.temps
    .map((t, i) => {
      if (t === null) return "";
      const d = i + 1;
      const h = Math.round(Math.min(1, Math.max(0.1, (t - MIN) / (MAX - MIN))) * H);
      const color = d === bbt.ovulationDay ? "#E0A030" : d > bbt.ovulationDay ? "#C13D68" : "#E8B6C8";
      return `<rect x="${(i * slot + 1).toFixed(1)}" y="${H - h}" width="${Math.max(1, slot - 2).toFixed(1)}" height="${h}" fill="${color}" rx="2"/>`;
    })
    .join("");
  return `<p><strong>${esc(bbt.title)}</strong>${bbt.biphasic ? ' · <span class="ok">Biphasic pattern ✓</span>' : ""} · ovulation about CD${bbt.ovulationDay}</p>
<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${bars}</svg>
<p class="muted small">Bars show 36.0–37.0 °C, one per cycle day (CD1–CD${bbt.temps.length}).</p>`;
}

interface BuildInput {
  preview: ReportPreview;
  details: ReportDetails;
  include: Record<ReportSection, boolean>;
  medications: { title: string; description: string }[];
}

/** The printable report: header, key figures, points to discuss, then only the sections the user switched on. */
export function buildReportHtml({ preview, details, include, medications }: BuildInput): string {
  const parts: string[] = [];

  if (include.cycleHistory) {
    parts.push(
      section(
        "Cycle &amp; period history",
        details.cycles.length === 0
          ? none("No cycles recorded in this period.")
          : table(
              ["Cycle", "Started", "Length", "Ovulation", "Luteal phase"],
              details.cycles.map((c) => [
                String(c.cycle_no),
                day(c.start_date),
                c.length_days ? `${c.length_days} days` : "in progress",
                c.ovulation_day ? `CD${c.ovulation_day}` : "not confirmed",
                c.luteal_days ? `${c.luteal_days} days` : "—",
              ]),
            ),
      ),
    );
  }

  if (include.bbt) {
    parts.push(section("Basal body temperature", preview.bbt ? bbtChart(preview.bbt) : none("No temperature readings recorded.")));
  }

  if (include.tests) {
    const lh = details.tests.lh.length
      ? table(["Date", "LH result"], details.tests.lh.map((t) => [day(t.date), label(t.result)]))
      : none("No LH tests recorded.");
    const preg = details.tests.pregnancy.length
      ? table(
          ["Date", "Result", "Type"],
          details.tests.pregnancy.map((t) => [day(t.date), label(t.result), t.type ? label(t.type) : "—"]),
        )
      : none("No pregnancy tests recorded.");
    parts.push(section("LH &amp; pregnancy tests", `<h3>LH tests</h3>${lh}<h3>Pregnancy tests</h3>${preg}`));
  }

  if (include.fluidSymptoms) {
    const fluid = details.fluid.length
      ? table(["Date", "Cervical fluid"], details.fluid.map((f) => [day(f.date), label(f.type)]))
      : none("No cervical fluid recorded.");
    const symptoms = details.symptoms.length
      ? table(["Symptom", "Days logged"], details.symptoms.map((s) => [esc(s.label), String(s.days)]))
      : none("No symptoms recorded.");
    parts.push(section("Cervical fluid &amp; symptoms", `<h3>Symptoms</h3>${symptoms}<h3>Cervical fluid</h3>${fluid}`));
  }

  if (include.medications) {
    parts.push(
      section(
        "Medications &amp; supplements",
        medications.length
          ? `<ul>${medications.map((m) => `<li><strong>${esc(m.title)}</strong>${m.description ? ` — ${esc(m.description)}` : ""}</li>`).join("")}</ul>`
          : none("No medications recorded."),
      ),
    );
  }

  if (include.intimacy) {
    parts.push(
      section(
        "Intimacy log",
        details.intimacy.length
          ? `<p>${details.intimacy.length} ${details.intimacy.length === 1 ? "entry" : "entries"}: ${details.intimacy.map(day).join(", ")}</p>`
          : none("No entries recorded."),
      ),
    );
  }

  if (include.notes) {
    parts.push(
      section(
        "Personal notes",
        details.notes.length
          ? `<ul>${details.notes.map((n) => `<li><strong>${day(n.date)}</strong> — ${esc(n.text)}</li>`).join("")}</ul>`
          : none("No notes recorded."),
      ),
    );
  }

  const stats = preview.stats
    .map((s) => `<div class="stat"><div class="muted small">${esc(s.label)}</div><div class="value">${esc(s.value)}</div></div>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#2b2330;font-size:12px;line-height:1.45;padding:24px}
h1{font-size:20px;margin:0}h2{font-size:14px;margin:22px 0 8px;color:#C13D68}h3{font-size:12px;margin:12px 0 4px}
.muted{color:#7d7585}.small{font-size:10px}.ok{color:#3f9950;font-weight:700}
.head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #C13D68;padding-bottom:10px}
.stats{display:flex;gap:12px;margin:14px 0}.stat{flex:1;border:1px solid #e6e1ea;border-radius:8px;padding:8px 10px}
.value{font-size:15px;font-weight:700}.flag{background:#f6f1e6;border-radius:8px;padding:8px 10px;margin:8px 0}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:5px 8px;border-bottom:1px solid #eee}th{font-size:10px;color:#7d7585;text-transform:uppercase}
ul{margin:4px 0;padding-left:18px}section{page-break-inside:avoid}.foot{margin-top:28px;font-size:10px;color:#7d7585;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
<div class="head"><div><h1>Fertility cycle report</h1><div>${esc(preview.name)}${preview.ageYears != null ? `, ${preview.ageYears}` : ""}</div></div>
<div class="muted">${esc(preview.rangeLabel)}</div></div>
<div class="stats">${stats}</div>
${preview.flag ? `<div class="flag">${esc(preview.flag)}</div>` : ""}
${parts.join("")}
<div class="foot">Generated by Srikandi Promil from the user's own logs. It is a summary to support a conversation with a doctor, not a diagnosis.</div>
</body></html>`;
}
