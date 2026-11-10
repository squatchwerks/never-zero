// features/backup.js — Export and Import.
//
// Check-ins live only in this browser on this device, so this card is the
// safety net: Export saves everything as one .json file (on iPhone, through
// the Share sheet → "Save to Files"), and Import loads a file back in.

import { el, append } from "../dom.js";
import * as storage from "../storage.js";
import { todayKey } from "../dates.js";
import { setStatus } from "../status.js";

const ui = {};

export default {
  id: "backup",
  tab: "rules",

  init(root) {
    ui.count = el("p", "small muted");

    const exportBtn = el("button", "btn", "Export backup");
    exportBtn.type = "button";
    exportBtn.addEventListener("click", exportBackup);

    // A hidden file picker; the visible Import button opens it.
    ui.file = el("input");
    ui.file.type = "file";
    ui.file.accept = "application/json,.json";
    ui.file.multiple = true;
    ui.file.hidden = true;
    ui.file.addEventListener("change", importFiles);

    const importBtn = el("button", "btn ghost", "Import");
    importBtn.type = "button";
    importBtn.addEventListener("click", () => ui.file.click());

    ui.msg = el("p", "small");
    ui.msg.setAttribute("role", "status");

    root.appendChild(
      append(
        el("div", "card"),
        el("p", "label", "Backup"),
        el("h2", null, "Keep a copy of your check-ins"),
        el("p", "small muted",
          "Check-ins are saved on this phone only. Export a backup now and then and keep it in Files or iCloud Drive. " +
          "Import loads a backup: days in the file replace the same days here, and other days are kept."),
        append(el("div", "row"), exportBtn, importBtn),
        ui.count,
        ui.msg,
        ui.file,
      ),
    );
  },

  render() {
    const n = Object.keys(storage.getDays()).length;
    ui.count.textContent = `${n} day${n === 1 ? "" : "s"} saved on this device.`;
  },
};

async function exportBackup() {
  const json = JSON.stringify(storage.exportData(), null, 2);
  const name = `never-zero-backup-${todayKey()}.json`;
  const file = new File([json], name, { type: "application/json" });

  // On a phone, the Share sheet is the reliable way to save a file
  // ("Save to Files", AirDrop, Mail…). On a computer, a normal download.
  const isTouch = navigator.maxTouchPoints > 0;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Never Zero backup" });
      ui.msg.textContent = "Backup shared. Save it somewhere safe, like iCloud Drive.";
    } catch (err) {
      if (err.name !== "AbortError") ui.msg.textContent = "Couldn't share the backup. Try again.";
    }
    return;
  }

  const url = URL.createObjectURL(file);
  const a = el("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  ui.msg.textContent = `Downloaded ${name}.`;
}

async function importFiles() {
  const files = [...ui.file.files];
  ui.file.value = ""; // so picking the same file again still triggers
  if (!files.length) return;

  // Read and parse every picked file; one bad file doesn't stop the rest.
  const parsed = [];
  let unreadable = 0;
  for (const f of files) {
    try {
      parsed.push(JSON.parse(await f.text()));
    } catch {
      unreadable++;
    }
  }

  const preview = storage.importData(parsed, { dryRun: true });
  if (!preview.ok) {
    ui.msg.textContent = "Nothing to import: that file doesn't look like a Never Zero backup.";
    return;
  }

  const parts = [`${preview.days} day${preview.days === 1 ? "" : "s"}`];
  if (preview.settings) parts.push("your targets and lifts");
  let question = `Import ${parts.join(" and ")}?`;
  if (preview.replaces) question += `\n\n${preview.replaces} of those days already have check-ins here and will be replaced.`;
  if (!confirm(question)) return;

  const result = storage.importData(parsed);
  if (!result.ok) {
    ui.msg.textContent = "Couldn't save the import on this device. Storage may be full.";
    return;
  }
  const skipped = result.skipped + unreadable;
  ui.msg.textContent =
    `Imported ${parts.join(" and ")}.` + (skipped ? ` Skipped ${skipped} item${skipped === 1 ? "" : "s"} that weren't check-ins.` : "");
  setStatus("Backup imported");
}
