/* =========================================================
   SHARED SAVE STATUS
   Works on the main database and Brain Aquarium.
   ========================================================= */
const saveStatus = document.getElementById("saveStatus");
let saveTimer;

function showSaved() {
    if (!saveStatus) return;

    clearTimeout(saveTimer);

    if (document.body.dataset.cloudSync === "connected") {
        saveStatus.textContent = "☁ saving…";
        saveStatus.classList.add("saved");
        return;
    }

    saveStatus.textContent = "saved locally ✓";
    saveStatus.classList.add("saved");
    saveTimer = setTimeout(() => {
        saveStatus.textContent = "saved locally";
        saveStatus.classList.remove("saved");
    }, 900);
}

/* =========================================================
   SHARED THEME SWITCHER
   Same storage key on every page, so the wardrobe carries
   across pages when they are served from the same origin.
   ========================================================= */
const themeSelect = document.getElementById("themeSelect");
const THEME_STORAGE_KEY = "pigeonhole-database-theme";

/* One shared catalog keeps every page's theme menu identical. */
const THEME_OPTIONS = [
    { value: "dark", label: "🌙 Dark Original", group: "Dark themes" },
    { value: "aquarium", label: "🐠 Dark Teal Celestial Aquarium", group: "Dark themes" },
    { value: "observatory", label: "🔭 Midnight Observatory", group: "Dark themes" },
    { value: "nightgarden", label: "🪻 Night Garden", group: "Dark themes" },
    { value: "fieldnotes", label: "📓 Universal Field Notes", group: "Dark themes" },
    { value: "y2k", label: "🖥️ Y2K Web Portal", group: "Retro themes" },
    { value: "cozy", label: "💿 Cozy 2000s", group: "Light themes" },
    { value: "green", label: "🌿 Full Green", group: "Light themes" },
    { value: "fall", label: "🍂 Fall", group: "Light themes" },
    { value: "fall2", label: "🍁 Fall 2", group: "Dark themes" },
    { value: "study", label: "📜 Study", group: "Light themes" }
];

const validThemes = new Set(THEME_OPTIONS.map(theme => theme.value));

function populateThemeSelect() {
    if (!themeSelect) return;
    const currentValue = themeSelect.value;
    themeSelect.innerHTML = "";

    const groups = new Map();

    THEME_OPTIONS.forEach(theme => {
        let parent = themeSelect;

        if (theme.group) {
            if (!groups.has(theme.group)) {
                const optgroup = document.createElement("optgroup");
                optgroup.label = theme.group;
                groups.set(theme.group, optgroup);
                themeSelect.appendChild(optgroup);
            }
            parent = groups.get(theme.group);
        }

        const option = document.createElement("option");
        option.value = theme.value;
        option.textContent = theme.label;
        parent.appendChild(option);
    });

    if (validThemes.has(currentValue)) themeSelect.value = currentValue;
}

populateThemeSelect();

function applyTheme(theme, save = false) {
    const pageDefault = document.body.dataset.defaultTheme || "dark";
    const fallback = validThemes.has(pageDefault) ? pageDefault : "dark";
    const nextTheme = validThemes.has(theme) ? theme : fallback;

    document.body.dataset.theme = nextTheme;
    if (themeSelect) themeSelect.value = nextTheme;

    if (save) {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        showSaved();
    }
}

const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
applyTheme(storedTheme || document.body.dataset.defaultTheme || "dark");

if (themeSelect) {
    themeSelect.addEventListener("change", () => {
        applyTheme(themeSelect.value, true);
    });
}

window.addEventListener("storage", event => {
    if (event.key === THEME_STORAGE_KEY && event.newValue) {
        applyTheme(event.newValue, false);
    }
});

/* =========================================================
   SHARED EDITABLE UI LABELS
   Page titles and visible section labels can opt in with data-pi-ui.
   Values stay single-line plain text and sync through pigeonhole-* keys.
   ========================================================= */
function bindPiUiLabel(element) {
    if (!element || element.dataset.piUiBound === "true") return;
    element.dataset.piUiBound = "true";
    element.contentEditable = "true";
    element.spellcheck = false;
    element.classList.add("editable-ui");

    const key = `pigeonhole-ui-global-${element.dataset.piUi}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) element.textContent = saved;

    const clean = value => String(value || "").replace(/\s+/g, " ").trim();
    const persist = () => {
        const value = clean(element.innerText);
        if (value) element.textContent = value;
        localStorage.setItem(key, value || element.dataset.piUiFallback || "Untitled");
        showSaved();
    };

    element.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            element.blur();
        }
    });
    element.addEventListener("paste", event => {
        event.preventDefault();
        const value = clean(event.clipboardData?.getData("text/plain") || "");
        document.execCommand("insertText", false, value);
    });
    element.addEventListener("blur", persist);
}

document.querySelectorAll("[data-pi-ui]").forEach(bindPiUiLabel);

/* =========================================================
   SHARED ECOSYSTEM NAVIGATION
   The page menu is intentionally native HTML (<details> + links),
   so cross-page navigation still works before JavaScript loads and
   cannot be stranded by a stale cached Script.js file.
   ========================================================= */

/* =========================================================
   SHARED AUTO-GROW TEXT ENTRY HELPER
   Compact textareas start at one line and grow to four visible
   lines by default. The Aquarium capture box is intentionally
   uncapped so a long thought can keep expanding.
   ========================================================= */
function resizeSharedAutoGrowTextarea(field) {
    if (!field) return;
    field.style.height = "auto";
    const styles = getComputedStyle(field);
    const lineHeight = parseFloat(styles.lineHeight) || 19;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const borderTop = parseFloat(styles.borderTopWidth) || 0;
    const borderBottom = parseFloat(styles.borderBottomWidth) || 0;
    const chrome = paddingTop + paddingBottom + borderTop + borderBottom;
    const requestedMinLines = Math.max(1, parseInt(field.dataset.autogrowMinLines || "1", 10) || 1);
    const minHeight = (lineHeight * requestedMinLines) + chrome;
    const unlimited = field.classList.contains("aq-capture-input") || field.dataset.autogrowUnlimited === "true";
    const maxHeight = unlimited ? Number.POSITIVE_INFINITY : (lineHeight * 4) + chrome;
    const nextHeight = unlimited
        ? Math.max(field.scrollHeight, minHeight)
        : Math.min(Math.max(field.scrollHeight, minHeight), maxHeight);
    field.style.height = `${nextHeight}px`;
    field.style.overflowY = unlimited ? "hidden" : (field.scrollHeight > maxHeight ? "auto" : "hidden");
}

function bindSharedAutoGrowTextarea(field) {
    if (!field || field.dataset.sharedAutogrowBound === "true") return;
    field.dataset.sharedAutogrowBound = "true";
    field.rows = Math.max(1, parseInt(field.dataset.autogrowMinLines || field.getAttribute("rows") || "1", 10) || 1);
    field.addEventListener("input", () => resizeSharedAutoGrowTextarea(field));
    resizeSharedAutoGrowTextarea(field);
}

document.querySelectorAll(
    "textarea[data-autogrow], textarea.auto-grow-textarea, textarea.aq-capture-input"
).forEach(bindSharedAutoGrowTextarea);

/* =========================================================
   MOBILE COMPOSER KEYBOARD BEHAVIOR
   On touch/mobile layouts, Enter belongs to the text itself.
   The visible Add / Submit button is the only way to submit.
   Desktop keeps the faster Enter-to-submit shortcut.
   ========================================================= */
function mobileComposerUsesNewlines() {
    return (
        window.matchMedia("(max-width: 760px)").matches ||
        window.matchMedia("(pointer: coarse)").matches
    );
}

/* =========================================================
   SHARED COPY PRESERVATION
   Browser selections inside rich/contenteditable surfaces can lose
   visual paragraph breaks or carry theme paint into the destination.
   Build two deliberate clipboard payloads:
   - plain text with stable paragraph/newline spacing
   - semantic HTML with formatting/links but no PI paint, color, ids,
     classes, inline styles, or layout attributes
   ========================================================= */
const CLIPBOARD_BLOCK_TAGS = new Set([
    "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DIV", "DL", "FIELDSET",
    "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4",
    "H5", "H6", "HEADER", "HR", "LI", "MAIN", "NAV", "OL", "P", "PRE",
    "SECTION", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL"
]);

function selectionFragmentToPlainText(fragment) {
    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
        if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return "";

        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") return "\n";

        const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName : "";
        const isBlock = CLIPBOARD_BLOCK_TAGS.has(tag);
        const isListItem = tag === "LI";
        let text = "";

        node.childNodes.forEach(child => {
            text += walk(child);
        });

        if (isListItem) {
            text = text.replace(/^\s+|\s+$/g, "");
            return text ? `${text}\n` : "";
        }

        if (isBlock && text && !text.endsWith("\n\n")) {
            text = text.replace(/\n+$/g, "") + "\n\n";
        }

        return text;
    }

    return walk(fragment)
        .replace(/\u00a0/g, " ")
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\n+|\n+$/g, "");
}

function sanitizeClipboardHtml(fragment) {
    const container = document.createElement("div");
    container.appendChild(fragment.cloneNode(true));

    const allowedTags = new Set([
        "A", "B", "BLOCKQUOTE", "BR", "CODE", "DIV", "EM", "H1", "H2", "H3",
        "H4", "H5", "H6", "I", "LI", "OL", "P", "PRE", "S", "STRIKE", "STRONG",
        "U", "UL"
    ]);

    [...container.querySelectorAll("*")].reverse().forEach(element => {
        if (!allowedTags.has(element.tagName)) {
            const fragment = document.createDocumentFragment();
            while (element.firstChild) fragment.appendChild(element.firstChild);
            element.replaceWith(fragment);
            return;
        }

        const href = element.tagName === "A" ? element.getAttribute("href") : null;
        [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
        if (element.tagName === "A" && href) element.setAttribute("href", href);
    });

    return container.innerHTML;
}

document.addEventListener("copy", event => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount || !event.clipboardData) return;

    const node = selection.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? selection.anchorNode
        : selection.anchorNode?.parentElement;
    if (!node?.closest?.(".database-page, .aq-page, .patterns-page, .longform-page, .neo-page, .almanac-page")) return;

    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const plainText = selectionFragmentToPlainText(fragment);
    if (!plainText) return;

    event.clipboardData.setData("text/plain", plainText);
    event.clipboardData.setData("text/html", sanitizeClipboardHtml(fragment));
    event.preventDefault();
});

/* =========================================================
   SHARED DELETE CONFIRMATION
   Every visible destructive delete/remove control asks once before
   its existing handler is allowed to mutate saved data. Bulk delete
   keeps its own count-aware confirmation below.
   ========================================================= */
document.addEventListener("click", event => {
    const button = event.target?.closest?.("button");
    if (!button || button.id === "selectionActionButton") return;

    const title = String(button.title || "").trim();
    const text = String(button.textContent || "").trim();
    const destructive = /^(delete|remove)\b/i.test(title) || /^×?\s*delete\b/i.test(text);
    if (!destructive) return;

    const action = /^remove\b/i.test(title) ? "Remove" : "Delete";
    const noun = title.replace(/^(delete|remove)\s+/i, "").replace(/\s+permanently$/i, "").trim();
    const prompt = noun ? `${action} ${noun}?` : `${action} this item?`;

    if (!window.confirm(prompt)) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}, true);

/* =========================================================
   SHARED COLLAPSIBLE PANELS
   Opt-in sections can fold to a header-only state. Collapse
   choices use a synced pigeonhole-* key so the quieter view
   follows the user between devices.
   ========================================================= */
const PANEL_COLLAPSE_KEY = "pigeonhole-ui-panel-collapse-v1";

function readPanelCollapseState() {
    try {
        const saved = JSON.parse(localStorage.getItem(PANEL_COLLAPSE_KEY) || "{}");
        return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
        return {};
    }
}

function writePanelCollapseState(state) {
    localStorage.setItem(PANEL_COLLAPSE_KEY, JSON.stringify(state));
    if (typeof showSaved === "function") showSaved();
}

function bindCollapsiblePanels(root = document) {
    const state = readPanelCollapseState();
    root.querySelectorAll?.("[data-collapsible-panel]").forEach(panel => {
        if (panel.dataset.collapseBound === "true") return;
        const id = panel.dataset.collapsiblePanel;
        if (!id) return;

        const header = panel.querySelector(
            ":scope > .panel-header, :scope > .aq-panel-head, :scope > .longform-library-head, :scope > .longform-composer-head, :scope > .neo-panel-heading, :scope > .neo-dailies-head, :scope > .almanac-panel-head, :scope > .archive-v2-panel-head"
        );
        const bodies = [...panel.querySelectorAll(":scope > [data-collapse-body]")];
        if (!header || !bodies.length) return;

        panel.dataset.collapseBound = "true";
        let toggle = header.querySelector(":scope > .panel-collapse-toggle");
        if (!toggle) {
            toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "panel-collapse-toggle";
            toggle.setAttribute("aria-label", "Collapse section");
            toggle.title = "Collapse / expand";
            header.appendChild(toggle);
        }

        const apply = collapsed => {
            panel.classList.toggle("is-collapsed", collapsed);
            bodies.forEach(body => { body.hidden = collapsed; });
            toggle.textContent = collapsed ? "▸" : "▾";
            toggle.setAttribute("aria-expanded", String(!collapsed));
            toggle.setAttribute("aria-label", collapsed ? "Expand section" : "Collapse section");
        };

        apply(Boolean(state[id]));
        toggle.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            state[id] = !panel.classList.contains("is-collapsed");
            apply(Boolean(state[id]));
            writePanelCollapseState(state);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => bindCollapsiblePanels());
window.PigeonholeBindCollapsiblePanels = bindCollapsiblePanels;

/* =========================================================
   SHARED RICH-TEXT KEYBOARD SHORTCUTS
   Ctrl/Cmd+B, I and U work on contenteditable writing surfaces.
   Ctrl/Cmd+Shift+X adds/removes strikethrough. Plain text inputs
   remain plain text by design.
   ========================================================= */
document.addEventListener("keydown", event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

    const editable = event.target?.closest?.('[contenteditable="true"]');
    if (!editable) return;

    const key = String(event.key || "").toLowerCase();
    let command = null;

    if (key === "b" && !event.shiftKey) command = "bold";
    else if (key === "i" && !event.shiftKey) command = "italic";
    else if (key === "u" && !event.shiftKey) command = "underline";
    else if (key === "x" && event.shiftKey) command = "strikeThrough";

    if (!command) return;

    event.preventDefault();
    editable.focus();
    document.execCommand(command, false, null);

    /* Most browsers fire input for execCommand, but this makes persistence
       deterministic for our local/cloud save listeners. */
    editable.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: `format${command.charAt(0).toUpperCase()}${command.slice(1)}`
    }));
});

/* =========================================================
   SHARED ARCHIVE SYSTEM
   Past day lists roll into a historical archive automatically.
   Active items can also be intentionally archived from Database
   or Aquarium without deleting the record of what they were.
   ========================================================= */
const ARCHIVE_STORAGE_KEY = "pigeonhole-v10-archive";
const PATTERN_NOTES_KEY = "pigeonhole-v10-pattern-notes";
const TIMELINE_MARKERS_KEY = "pigeonhole-v15-timeline-markers";
const STRAIN_JOURNAL_KEY = "pigeonhole-v15-strain-journal";

function makeLocalIsoDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function archiveId(prefix = "archive") {
    if (globalThis.crypto && typeof crypto.randomUUID === "function") {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readArchiveRecords() {
    try {
        const saved = JSON.parse(localStorage.getItem(ARCHIVE_STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveArchiveRecords(records, show = true) {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(records));
    if (show) showSaved();
}

function archiveManualItem({
    text,
    source,
    context = "",
    kind = "",
    originalDate = null,
    createdAt = null,
    metadata = null
}) {
    const cleaned = String(text || "").trim();
    if (!cleaned) return false;

    const records = readArchiveRecords();
    records.unshift({
        id: archiveId("item"),
        recordType: "item",
        text: cleaned,
        source: source || "Unknown source",
        context,
        kind,
        originalDate,
        createdAt,
        archivedAt: new Date().toISOString(),
        metadata
    });
    saveArchiveRecords(records, true);
    return true;
}

function archiveDaySnapshot(dateKey, items, displayLabel = "") {
    if (!dateKey || !Array.isArray(items) || !items.length) return false;

    const normalizedItems = items
        .filter(item => item && String(item.text || "").trim())
        .map(item => ({ text: String(item.text).trim(), done: Boolean(item.done) }));

    if (!normalizedItems.length) return false;

    const records = readArchiveRecords();
    const existing = records.find(record => record.recordType === "day" && record.originalDate === dateKey);

    if (existing) {
        existing.items = [...(Array.isArray(existing.items) ? existing.items : []), ...normalizedItems];
        existing.lastArchivedAt = new Date().toISOString();
        if (displayLabel) existing.displayLabel = displayLabel;
    } else {
        records.unshift({
            id: `day-${dateKey}`,
            recordType: "day",
            originalDate: dateKey,
            displayLabel,
            items: normalizedItems,
            archivedAt: new Date().toISOString()
        });
    }

    saveArchiveRecords(records, false);
    return true;
}

function archiveExpiredDayLists() {
    const today = makeLocalIsoDate();
    const prefix = "pigeonhole-day-list-";
    const keys = [];

    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (key && key.startsWith(prefix)) keys.push(key);
    }

    keys.forEach(key => {
        const dateKey = key.slice(prefix.length);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || dateKey >= today) return;

        try {
            const items = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(items) && items.length) archiveDaySnapshot(dateKey, items);
        } catch {
            /* Leave malformed data alone rather than silently destroying it. */
            return;
        }

        localStorage.removeItem(key);
    });
}

archiveExpiredDayLists();

/* =========================================================
   SHARED SELECT MODE
   Keeps normal item icons meaningful while exposing a separate
   selector only when the user intentionally enters select mode.
   Each page supplies its own bulk action.
   ========================================================= */
const selectModeButton = document.getElementById("selectModeButton");
const selectionActionButton = document.getElementById("selectionActionButton");
const selectedItemKeys = new Set();
let selectionMode = false;
let selectionActionHandler = null;
let selectionActionLabel = selectionActionButton?.textContent?.trim() || "act on selected";

function selectionKey(scope, ...parts) {
    return [scope, ...parts].map(part => String(part ?? "")).join("::");
}

function updateSelectionUi() {
    document.body.classList.toggle("selection-mode", selectionMode);

    if (selectModeButton) {
        selectModeButton.textContent = selectionMode ? "done" : "select";
        selectModeButton.classList.toggle("active", selectionMode);
        selectModeButton.setAttribute("aria-pressed", String(selectionMode));
    }

    document.querySelectorAll(".selection-check").forEach(input => {
        input.checked = selectedItemKeys.has(input.dataset.selectionKey);
    });

    if (selectionActionButton) {
        selectionActionButton.hidden = !selectionMode || selectedItemKeys.size === 0;
        selectionActionButton.textContent = selectedItemKeys.size
            ? `${selectionActionLabel} (${selectedItemKeys.size})`
            : selectionActionLabel;
    }
}

function clearSelection() {
    selectedItemKeys.clear();
    updateSelectionUi();
}

function exitSelectionMode() {
    selectionMode = false;
    selectedItemKeys.clear();
    updateSelectionUi();
}

function makeSelectionControl(key, title = "Select item") {
    const label = document.createElement("label");
    label.className = "selection-control";
    label.title = title;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "selection-check";
    input.dataset.selectionKey = key;
    input.checked = selectedItemKeys.has(key);
    input.setAttribute("aria-label", title);

    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("change", () => {
        if (input.checked) selectedItemKeys.add(key);
        else selectedItemKeys.delete(key);
        updateSelectionUi();
    });

    label.appendChild(input);
    return label;
}

function configureSelectionAction(label, handler) {
    selectionActionLabel = label;
    selectionActionHandler = handler;
    updateSelectionUi();
}

if (selectModeButton) {
    selectModeButton.addEventListener("click", () => {
        selectionMode = !selectionMode;
        if (!selectionMode) selectedItemKeys.clear();
        updateSelectionUi();
    });
}

if (selectionActionButton) {
    selectionActionButton.addEventListener("click", () => {
        if (!selectionActionHandler || !selectedItemKeys.size) return;
        const result = selectionActionHandler(new Set(selectedItemKeys));
        if (result === false) return;
        exitSelectionMode();
    });
}

updateSelectionUi();


/* =========================================================
   MAIN DATABASE MODULE — THREE-COLUMN / FOUR-WEEK VERSION
   ========================================================= */
if (document.getElementById("tileGrid")) {
    /* Reuse the shared auto-grow helper inside the Database module. */
    const resizeAutoGrowTextarea = resizeSharedAutoGrowTextarea;
    const bindAutoGrowTextarea = bindSharedAutoGrowTextarea;


    /* =========================================================
       DATE HELPERS + 28-DAY RAIL
       Each day keeps the same date-based storage system as before,
       so existing saved items for matching dates are preserved.
       ========================================================= */
    function isoDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    const labelOptions = {
        weekday: "long",
        month: "short",
        day: "numeric"
    };

    const DAY_COUNT = 28;
    const dayKeys = [];
    const dayDateStrings = [];
    const dayAccentClasses = ["scroll-plum", "scroll-teal", "scroll-blue", "scroll-rose", "scroll-green", "scroll-orange"];
    const dayRail = document.getElementById("dayRail");

    for (let offset = 0; offset < DAY_COUNT; offset++) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + offset);

        const accentClass = dayAccentClasses[offset % dayAccentClasses.length];
        const cell = document.createElement("section");
        cell.className = `day-card ${accentClass}` + (offset === 0 ? " today-card" : "");

        const top = document.createElement("div");
        top.className = "day-card-top";

        const label = document.createElement("div");
        label.className = "date-label";
        label.textContent = date.toLocaleDateString("en-US", labelOptions);

        top.appendChild(label);

        const dayTopActions = document.createElement("div");
        dayTopActions.className = "day-card-actions";

        if (offset === 0) {
            const today = document.createElement("span");
            today.className = "today-badge";
            today.textContent = "today";
            dayTopActions.appendChild(today);
        }

        const archiveDayButton = document.createElement("button");
        archiveDayButton.id = `dayArchive${offset}`;
        archiveDayButton.className = "archive-icon-button day-archive-button";
        archiveDayButton.type = "button";
        archiveDayButton.textContent = "↘";
        archiveDayButton.title = "Archive this whole day snapshot";
        dayTopActions.appendChild(archiveDayButton);
        top.appendChild(dayTopActions);

        const list = document.createElement("div");
        list.id = `dayList${offset}`;
        list.className = `day-list ${accentClass}`;

        const entry = document.createElement("div");
        entry.className = "day-entry-row";

        const input = document.createElement("textarea");
        input.id = `dayInput${offset}`;
        input.className = "day-input auto-grow-textarea";
        input.rows = 2;
        input.dataset.autogrow = "true";
        input.dataset.autogrowMinLines = "2";
        input.placeholder = "Add for this day...";
        bindAutoGrowTextarea(input);

        const button = document.createElement("button");
        button.id = `dayAdd${offset}`;
        button.className = "mini-add";
        button.title = "Add item";
        button.textContent = "+";

        entry.append(input, button);
        cell.append(top, list, entry);
        dayRail.appendChild(cell);

        dayDateStrings[offset] = isoDate(date);
        dayKeys[offset] = `pigeonhole-day-list-${dayDateStrings[offset]}`;
    }

    /* =========================================================
       EDITABLE UI LABELS / HEADERS
       ========================================================= */
    document.querySelectorAll("[data-ui-save]").forEach(element => {
        const key = "pigeonhole-ui-" + element.dataset.uiSave;
        const saved = localStorage.getItem(key);
        if (saved !== null) element.innerHTML = saved;

        element.addEventListener("input", () => {
            localStorage.setItem(key, element.innerHTML);
            showSaved();
        });
    });

    /* =========================================================
       MAIN BOARD + ITEM-LEVEL PRIORITY SHELF
       Main Board tiles stay on the board. Individual lines from
       tiles, Radar, and calendar days can move into the top shelf.
       Existing tile text/title storage keys are unchanged.
       ========================================================= */
    const defaultTiles = [
        {
            id: "work",
            accent: "blue",
            title: "Work & Becoming",
            text: "Ignite / Process Improvement\n\nLearning queue: Yellow Belt, root cause analysis, process mapping, project structure.\n\nCareer bridge: keep collecting evidence of where research, systems thinking, analysis, and operations fit."
        },
        {
            id: "life-admin",
            accent: "teal",
            title: "Life Admin",
            text: "Bills and recurring expenses\n\nStudent loan logistics\n\nAppointments, forms, calls, errands, renewals\n\nAnything administrative currently trying to haunt me from another room"
        },
        {
            id: "home",
            accent: "plum",
            title: "Home Base",
            text: "Current apartment / building-sale updates\n\nKiara logistics 🐈‍⬛\n\nRepairs, supplies, routines\n\nFuture nest: office, outdoor space, greenery, quiet"
        },
        {
            id: "projects",
            accent: "rose",
            title: "Projects & Play",
            text: "Pigeonhole\n\nPondering Pigeon / Scholarly Pigeon\n\nNeopets tinkering\n\nHTML / CSS / JavaScript experiments"
        },
        {
            id: "wellbeing",
            accent: "green",
            title: "Regulation & Wellbeing",
            text: "Things that help: white noise, chai, slow mornings, early errands, little pockets of solitude.\n\nRemember: you do not get a medal for suffering more by the end of the day."
        },
        {
            id: "someday",
            accent: "orange",
            title: "Someday / Seeds",
            text: "Future-home wishes\n\nWriting ideas\n\nScience + history communicator dreams\n\nAnything worth keeping alive without forcing it to perform right now"
        }
    ];

    const tileGrid = document.getElementById("tileGrid");
    const priorityShelf = document.getElementById("priorityShelf");
    const addTileButton = document.getElementById("addTileButton");
    const BOARD_ORDER_KEY = "pigeonhole-v2-board-order";
    const LEGACY_FOCUS_ORDER_KEY = "pigeonhole-v2-focus-order";
    const LEGACY_ORDER_KEY = "pigeonhole-tight-tile-order";
    const CUSTOM_TILES_KEY = "pigeonhole-v4-custom-tiles";
    const PRIORITY_ITEMS_KEY = "pigeonhole-v16-priority-items";
    const TILE_ACCENTS = ["teal", "blue", "plum", "rose", "green", "orange"];

    function readCustomTiles() {
        try {
            const saved = JSON.parse(localStorage.getItem(CUSTOM_TILES_KEY));
            if (!Array.isArray(saved)) return [];
            return saved
                .filter(tile => tile && typeof tile.id === "string")
                .map(tile => ({
                    id: tile.id,
                    accent: TILE_ACCENTS.includes(tile.accent) ? tile.accent : "teal",
                    title: typeof tile.title === "string" ? tile.title : "New Tile",
                    text: "",
                    custom: true
                }));
        } catch {
            return [];
        }
    }

    let customTiles = readCustomTiles();
    let tiles = [...defaultTiles, ...customTiles];
    let allTileIds = tiles.map(tile => tile.id);

    function saveCustomTiles() {
        localStorage.setItem(CUSTOM_TILES_KEY, JSON.stringify(customTiles.map(tile => ({
            id: tile.id,
            accent: tile.accent,
            title: tile.title
        }))));
    }

    function readSavedArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : null;
        } catch {
            return null;
        }
    }

    const legacyOrder = readSavedArray(LEGACY_ORDER_KEY) || allTileIds;
    const legacyFocusOrder = readSavedArray(LEGACY_FOCUS_ORDER_KEY) || [];
    const savedBoardOrder = readSavedArray(BOARD_ORDER_KEY) || legacyOrder;
    /* V16 migration: tiles that used to live on the old whole-tile Priority Shelf
       return to the front of the Main Board rather than disappearing. */
    let boardOrder = [...legacyFocusOrder, ...savedBoardOrder];

    function normalizeTileOrders() {
        boardOrder = boardOrder.filter((id, index, arr) => allTileIds.includes(id) && arr.indexOf(id) === index);
        allTileIds.forEach(id => {
            if (!boardOrder.includes(id)) boardOrder.push(id);
        });
    }

    normalizeTileOrders();

    function tileById(id) {
        return tiles.find(tile => tile.id === id);
    }

    function saveTileLayout(show = true) {
        localStorage.setItem(BOARD_ORDER_KEY, JSON.stringify(boardOrder));
        localStorage.removeItem(LEGACY_FOCUS_ORDER_KEY);
        if (show) showSaved();
    }

    if (legacyFocusOrder.length) saveTileLayout(false);

    /* =========================================================
       MOVEABLE LINE ITEMS INSIDE EACH MAIN BOARD TILE
       Existing freeform tile text is migrated once into draggable
       rows. The legacy text key is left intact as a safety net.
       ========================================================= */
    const tileItemState = new Map();
    let activeTileItemDrag = null;
    /* One cross-surface drag state lets Radar, calendar days, and
       Main Board line-items exchange items without changing the
       whole-tile drag behavior. */
    let activeDatabaseItemDrag = null;

    function tileItemsKey(tileId) {
        return `pigeonhole-v3-tile-items-${tileId}`;
    }

    function makeTileItem(text) {
        return {
            id: (globalThis.crypto && typeof crypto.randomUUID === "function")
                ? crypto.randomUUID()
                : `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text
        };
    }

    function legacyHtmlToTileLines(html) {
        if (!html) return [];

        const normalized = String(html)
            .replace(/<br\s*\/?\s*>/gi, "\n")
            .replace(/<\/(div|p|li)>/gi, "\n");
        const temp = document.createElement("div");
        temp.innerHTML = normalized;

        return temp.textContent
            .split(/\n\s*\n+|\n/)
            .map(line => line.replace(/\u00a0/g, " ").trim())
            .filter(Boolean);
    }

    function defaultTileLines(tile) {
        return tile.text
            .split(/\n\s*\n+/)
            .map(line => line.trim())
            .filter(Boolean);
    }

    function loadTileItems(tile) {
        if (tileItemState.has(tile.id)) return tileItemState.get(tile.id);

        const key = tileItemsKey(tile.id);
        let items = null;

        try {
            const saved = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(saved)) {
                items = saved
                    .map(item => typeof item === "string" ? makeTileItem(item) : item)
                    .filter(item => item && typeof item.text === "string");
            }
        } catch {
            items = null;
        }

        if (!items) {
            const legacyHtml = localStorage.getItem(`pigeonhole-tile-text-${tile.id}`);
            const lines = legacyHtml !== null
                ? legacyHtmlToTileLines(legacyHtml)
                : defaultTileLines(tile);
            items = lines.map(makeTileItem);
            localStorage.setItem(key, JSON.stringify(items));
        }

        tileItemState.set(tile.id, items);
        return items;
    }

    function saveTileItems(tileId, show = true) {
        const items = tileItemState.get(tileId) || [];
        localStorage.setItem(tileItemsKey(tileId), JSON.stringify(items));
        if (show) showSaved();
    }

    /* =========================================================
       ITEM-LEVEL PRIORITY SHELF
       The shelf stores individual lines, not whole tiles. Each item
       carries a lightweight source label + accent so it remains
       visually connected to the place it came from.
       ========================================================= */
    function readPriorityItems() {
        try {
            const saved = JSON.parse(localStorage.getItem(PRIORITY_ITEMS_KEY));
            if (!Array.isArray(saved)) return [];
            return saved
                .filter(item => item && typeof item.id === "string" && typeof item.text === "string")
                .map(item => ({
                    id: item.id,
                    text: item.text,
                    sourceLabel: typeof item.sourceLabel === "string" ? item.sourceLabel : "Database",
                    sourceType: item.sourceType === "checklist" ? "checklist" : "tile",
                    accent: TILE_ACCENTS.includes(item.accent) ? item.accent : "plum",
                    done: Boolean(item.done),
                    movedAt: typeof item.movedAt === "string" ? item.movedAt : null
                }));
        } catch {
            return [];
        }
    }

    let priorityItems = readPriorityItems();

    function savePriorityItems(show = true) {
        localStorage.setItem(PRIORITY_ITEMS_KEY, JSON.stringify(priorityItems));
        if (show) showSaved();
    }

    function plainTileTitle(tile) {
        if (!tile) return "Main Board";
        const savedTitle = localStorage.getItem(`pigeonhole-tile-title-${tile.id}`);
        if (!savedTitle) return tile.title || "Main Board";
        const temp = document.createElement("div");
        temp.innerHTML = savedTitle;
        return temp.textContent.trim() || tile.title || "Main Board";
    }

    function priorityInsert(item, targetIndex = null) {
        if (targetIndex === null) targetIndex = priorityItems.length;
        targetIndex = Math.max(0, Math.min(targetIndex, priorityItems.length));
        priorityItems.splice(targetIndex, 0, item);
        savePriorityItems(false);
    }

    function moveTileItemToPriority(sourceTileId, sourceItemId, targetIndex = null) {
        const tile = tileById(sourceTileId);
        if (!tile) return;
        const sourceItems = loadTileItems(tile);
        const sourceIndex = sourceItems.findIndex(item => item.id === sourceItemId);
        if (sourceIndex < 0) return;

        const [moved] = sourceItems.splice(sourceIndex, 1);
        priorityInsert({
            id: moved.id || archiveId("priority"),
            text: String(moved.text || ""),
            sourceLabel: plainTileTitle(tile),
            sourceType: "tile",
            accent: tile.accent || "plum",
            done: false,
            movedAt: new Date().toISOString()
        }, targetIndex);

        saveTileItems(sourceTileId, false);
        renderTileZones();
        renderPriorityShelf();
        showSaved();
    }

    function moveChecklistItemToPriority(sourceKey, sourceItemId, targetIndex = null) {
        const source = checklistManagers.get(sourceKey);
        if (!source) return;
        const sourceIndex = source.items.findIndex(item => item.id === sourceItemId);
        if (sourceIndex < 0) return;

        const [moved] = source.items.splice(sourceIndex, 1);
        priorityInsert({
            id: moved.id || archiveId("priority"),
            text: String(moved.text || ""),
            sourceLabel: source.archiveContext || source.archiveSource || "Checklist",
            sourceType: "checklist",
            accent: source.accent || "teal",
            done: Boolean(moved.done),
            movedAt: new Date().toISOString()
        }, targetIndex);

        source.save(false);
        source.render();
        renderPriorityShelf();
        showSaved();
    }

    function movePriorityItemToTile(priorityItemId, targetTileId, targetIndex = null) {
        const priorityIndex = priorityItems.findIndex(item => item.id === priorityItemId);
        const targetTile = tileById(targetTileId);
        if (priorityIndex < 0 || !targetTile) return;

        const [moved] = priorityItems.splice(priorityIndex, 1);
        const targetItems = loadTileItems(targetTile);
        const tileItem = { id: moved.id || archiveId("line"), text: String(moved.text || "") };
        if (targetIndex === null) targetIndex = targetItems.length;
        targetIndex = Math.max(0, Math.min(targetIndex, targetItems.length));
        targetItems.splice(targetIndex, 0, tileItem);

        savePriorityItems(false);
        saveTileItems(targetTileId, false);
        renderPriorityShelf();
        renderTileZones();
        showSaved();
    }

    function movePriorityItemToChecklist(priorityItemId, targetKey, targetIndex = null) {
        const priorityIndex = priorityItems.findIndex(item => item.id === priorityItemId);
        const target = checklistManagers.get(targetKey);
        if (priorityIndex < 0 || !target) return;

        const [moved] = priorityItems.splice(priorityIndex, 1);
        const checklistItem = {
            id: moved.id || archiveId("task"),
            text: String(moved.text || ""),
            done: Boolean(moved.done)
        };
        if (targetIndex === null) targetIndex = target.items.length;
        targetIndex = Math.max(0, Math.min(targetIndex, target.items.length));
        target.items.splice(targetIndex, 0, checklistItem);

        savePriorityItems(false);
        target.save(false);
        renderPriorityShelf();
        target.render();
        showSaved();
    }

    function reorderPriorityItem(priorityItemId, targetIndex) {
        const sourceIndex = priorityItems.findIndex(item => item.id === priorityItemId);
        if (sourceIndex < 0) return;
        const [moved] = priorityItems.splice(sourceIndex, 1);
        if (sourceIndex < targetIndex) targetIndex -= 1;
        targetIndex = Math.max(0, Math.min(targetIndex, priorityItems.length));
        priorityItems.splice(targetIndex, 0, moved);
        savePriorityItems(false);
        renderPriorityShelf();
        showSaved();
    }

    function dropDatabaseItemIntoPriority(targetIndex = null) {
        const dragData = activeDatabaseItemDrag;
        if (!dragData) return;

        if (dragData.type === "tile") {
            activeTileItemDrag = null;
            activeDatabaseItemDrag = null;
            moveTileItemToPriority(dragData.sourceTileId, dragData.sourceItemId, targetIndex);
            return;
        }
        if (dragData.type === "checklist") {
            activeTaskDrag = null;
            activeDatabaseItemDrag = null;
            moveChecklistItemToPriority(dragData.sourceKey, dragData.sourceItemId, targetIndex);
            return;
        }
        if (dragData.type === "priority") {
            activeDatabaseItemDrag = null;
            reorderPriorityItem(dragData.priorityItemId, targetIndex ?? priorityItems.length);
        }
    }

    function renderPriorityShelf() {
        if (!priorityShelf) return;
        priorityShelf.innerHTML = "";

        if (!priorityItems.length) {
            const empty = document.createElement("div");
            empty.className = "priority-shelf-empty";
            empty.innerHTML = '<strong>Nothing is shouting right now.</strong><span>Drag any individual line from Radar, a calendar day, or a Main Board tile up here.</span>';
            priorityShelf.appendChild(empty);
        }

        priorityItems.forEach((item, index) => {
            const card = document.createElement("article");
            card.className = "priority-item" + (item.done ? " priority-item-done" : "");
            card.dataset.priorityId = item.id;
            card.dataset.accent = item.accent;

            const spark = document.createElement("span");
            spark.className = "priority-item-spark";
            spark.textContent = "✦";
            spark.setAttribute("aria-hidden", "true");

            const drag = document.createElement("span");
            drag.className = "priority-item-drag";
            drag.textContent = "⋮⋮";
            drag.draggable = true;
            drag.title = "Drag to another Database section";

            const body = document.createElement("div");
            body.className = "priority-item-body";

            const source = document.createElement("div");
            source.className = "priority-item-source";
            source.textContent = item.sourceLabel || "Database";

            const text = document.createElement("div");
            text.className = "priority-item-text";
            text.contentEditable = "true";
            text.spellcheck = true;
            text.textContent = item.text;
            text.addEventListener("input", () => {
                item.text = text.innerText;
                savePriorityItems();
            });

            const archive = document.createElement("button");
            archive.className = "archive-icon-button priority-item-archive";
            archive.type = "button";
            archive.textContent = "↘";
            archive.title = "Archive priority item";
            archive.addEventListener("click", () => {
                const archived = archiveManualItem({
                    text: item.text,
                    source: "Priority Shelf",
                    context: item.sourceLabel || "Database",
                    metadata: { accent: item.accent, movedAt: item.movedAt }
                });
                if (!archived) return;
                priorityItems.splice(index, 1);
                savePriorityItems(false);
                renderPriorityShelf();
                showSaved();
            });

            const remove = document.createElement("button");
            remove.className = "priority-item-delete";
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Delete priority item";
            remove.addEventListener("click", () => {
                priorityItems.splice(index, 1);
                savePriorityItems(false);
                renderPriorityShelf();
                showSaved();
            });

            const selector = makeSelectionControl(
                selectionKey("db-priority", item.id),
                "Select this Priority Shelf item"
            );

            const actions = document.createElement("div");
            actions.className = "priority-item-actions";
            actions.append(selector, archive, remove);

            body.append(source, text);
            card.append(spark, drag, body, actions);

            drag.addEventListener("dragstart", event => {
                activeDatabaseItemDrag = { type: "priority", priorityItemId: item.id };
                card.classList.add("dragging");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/x-pigeon-priority", item.id);
            });

            drag.addEventListener("dragend", () => {
                activeDatabaseItemDrag = null;
                card.classList.remove("dragging");
                priorityShelf.classList.remove("priority-drop-target");
            });

            card.addEventListener("dragover", event => {
                if (!activeDatabaseItemDrag) return;
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                card.classList.add("priority-drop-before");
            });

            card.addEventListener("dragleave", event => {
                if (!card.contains(event.relatedTarget)) card.classList.remove("priority-drop-before");
            });

            card.addEventListener("drop", event => {
                if (!activeDatabaseItemDrag) return;
                event.preventDefault();
                event.stopPropagation();
                card.classList.remove("priority-drop-before");
                dropDatabaseItemIntoPriority(index);
            });

            priorityShelf.appendChild(card);
        });

        if (priorityShelf.dataset.priorityBound !== "true") {
            priorityShelf.dataset.priorityBound = "true";
            priorityShelf.addEventListener("dragover", event => {
                if (!activeDatabaseItemDrag) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                priorityShelf.classList.add("priority-drop-target");
            });
            priorityShelf.addEventListener("dragleave", event => {
                if (!priorityShelf.contains(event.relatedTarget)) priorityShelf.classList.remove("priority-drop-target");
            });
            priorityShelf.addEventListener("drop", event => {
                if (!activeDatabaseItemDrag || event.target.closest(".priority-item")) return;
                event.preventDefault();
                priorityShelf.classList.remove("priority-drop-target");
                dropDatabaseItemIntoPriority(priorityItems.length);
            });
        }
    }

    function moveTileItem(sourceTileId, sourceItemId, targetTileId, targetIndex = null) {
        const sourceItems = tileItemState.get(sourceTileId);
        const targetItems = tileItemState.get(targetTileId);
        if (!sourceItems || !targetItems) return;

        const sourceIndex = sourceItems.findIndex(item => item.id === sourceItemId);
        if (sourceIndex < 0) return;

        const [moved] = sourceItems.splice(sourceIndex, 1);
        if (targetIndex === null) targetIndex = targetItems.length;
        if (sourceTileId === targetTileId && sourceIndex < targetIndex) targetIndex -= 1;
        targetIndex = Math.max(0, Math.min(targetIndex, targetItems.length));
        targetItems.splice(targetIndex, 0, moved);

        saveTileItems(sourceTileId, false);
        if (sourceTileId !== targetTileId) saveTileItems(targetTileId, false);
        renderTileZones();
        showSaved();
    }

    let activeTileDrag = null;

    function moveTile(tileId, targetIndex = null) {
        if (!allTileIds.includes(tileId)) return;
        const sourceIndex = boardOrder.indexOf(tileId);
        if (sourceIndex < 0) return;

        boardOrder.splice(sourceIndex, 1);
        if (targetIndex === null) targetIndex = boardOrder.length;
        if (sourceIndex < targetIndex) targetIndex -= 1;
        targetIndex = Math.max(0, Math.min(targetIndex, boardOrder.length));
        boardOrder.splice(targetIndex, 0, tileId);

        saveTileLayout(false);
        renderTileZones();
        showSaved();
    }

    function makeBoardTile(tile, zone, index) {
        const card = document.createElement("article");
        card.className = "board-tile";
        card.dataset.id = tile.id;
        card.dataset.accent = tile.accent;
        card.dataset.zone = zone;

        const head = document.createElement("div");
        head.className = "tile-head";

        const handle = document.createElement("span");
        handle.className = "drag-handle";
        handle.textContent = "⋮⋮";
        handle.title = "Drag to rearrange this Main Board tile";
        handle.draggable = true;

        const title = document.createElement("div");
        title.className = "tile-title";
        title.contentEditable = "true";
        title.spellcheck = false;
        title.innerHTML = localStorage.getItem(`pigeonhole-tile-title-${tile.id}`) || tile.title;

        const addLineTop = document.createElement("button");
        addLineTop.className = "tile-line-add-top";
        addLineTop.type = "button";
        addLineTop.textContent = "+";
        addLineTop.title = "Add a line to this tile";

        let deleteTile = null;
        if (tile.custom) {
            deleteTile = document.createElement("button");
            deleteTile.className = "tile-delete";
            deleteTile.type = "button";
            deleteTile.textContent = "×";
            deleteTile.title = "Delete this custom tile";
            deleteTile.addEventListener("click", () => {
                customTiles = customTiles.filter(item => item.id !== tile.id);
                tiles = tiles.filter(item => item.id !== tile.id);
                allTileIds = allTileIds.filter(id => id !== tile.id);
                boardOrder = boardOrder.filter(id => id !== tile.id);
                tileItemState.delete(tile.id);

                localStorage.removeItem(tileItemsKey(tile.id));
                localStorage.removeItem(`pigeonhole-tile-title-${tile.id}`);
                localStorage.removeItem(`pigeonhole-tile-text-${tile.id}`);
                saveCustomTiles();
                saveTileLayout(false);
                renderTileZones();
                showSaved();
            });
        }

        const body = document.createElement("div");
        body.className = "tile-body tile-lines-body";

        const itemList = document.createElement("div");
        itemList.className = "tile-item-list";
        itemList.dataset.tileId = tile.id;

        const entry = document.createElement("div");
        entry.className = "tile-item-entry";

        const input = document.createElement("textarea");
        input.className = "tile-item-input auto-grow-textarea";
        input.rows = 1;
        input.dataset.autogrow = "true";
        input.placeholder = "Add a line...";
        bindAutoGrowTextarea(input);

        const add = document.createElement("button");
        add.className = "tile-item-add";
        add.type = "button";
        add.textContent = "+";
        add.title = "Add line";

        entry.append(input, add);
        body.append(itemList, entry);

        title.addEventListener("input", () => {
            localStorage.setItem(`pigeonhole-tile-title-${tile.id}`, title.innerHTML);
            if (tile.custom) {
                tile.title = title.innerText.trim() || "New Tile";
                saveCustomTiles();
            }
            showSaved();
        });

        function addTileLine() {
            const value = input.value.trim();
            if (!value) {
                input.focus();
                return;
            }
            const items = loadTileItems(tile);
            items.push(makeTileItem(value));
            input.value = "";
            resizeAutoGrowTextarea(input);
            saveTileItems(tile.id, false);
            renderTileZones();
            showSaved();
        }

        add.addEventListener("click", addTileLine);
        addLineTop.addEventListener("click", () => input.focus());
        input.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            if (mobileComposerUsesNewlines() || event.shiftKey) return;

            event.preventDefault();
            addTileLine();
        });

        function renderTileLines() {
            itemList.innerHTML = "";
            const items = loadTileItems(tile);

            if (!items.length) {
                const empty = document.createElement("div");
                empty.className = "tile-items-empty";
                empty.textContent = "Drop a line here or add one below.";
                itemList.appendChild(empty);
            }

            items.forEach((item, itemIndex) => {
                const row = document.createElement("div");
                row.className = "tile-item-row";
                row.dataset.itemId = item.id;

                const drag = document.createElement("span");
                drag.className = "tile-item-drag";
                drag.textContent = "⋮⋮";
                drag.draggable = true;
                drag.title = "Drag between Main Board tiles, Radar, Near My Radar, or calendar days";

                const text = document.createElement("div");
                text.className = "tile-item-text";
                text.contentEditable = "true";
                text.spellcheck = true;
                text.textContent = item.text;
                text.addEventListener("input", () => {
                    item.text = text.innerText;
                    saveTileItems(tile.id);
                });

                const archive = document.createElement("button");
                archive.className = "tile-item-archive archive-icon-button";
                archive.type = "button";
                archive.textContent = "↘";
                archive.title = "Archive line";
                archive.addEventListener("click", () => {
                    const archived = archiveManualItem({
                        text: item.text,
                        source: "Main Board",
                        context: title.innerText.trim() || tile.title,
                        metadata: { tileId: tile.id, zone }
                    });
                    if (!archived) return;
                    items.splice(itemIndex, 1);
                    saveTileItems(tile.id, false);
                    renderTileZones();
                    showSaved();
                });

                const remove = document.createElement("button");
                remove.className = "tile-item-delete";
                remove.type = "button";
                remove.textContent = "×";
                remove.title = "Delete line";
                remove.addEventListener("click", () => {
                    items.splice(itemIndex, 1);
                    saveTileItems(tile.id, false);
                    renderTileZones();
                    showSaved();
                });

                drag.addEventListener("dragstart", event => {
                    event.stopPropagation();
                    activeTileItemDrag = {
                        sourceTileId: tile.id,
                        sourceItemId: item.id
                    };
                    activeDatabaseItemDrag = {
                        type: "tile",
                        sourceTileId: tile.id,
                        sourceItemId: item.id
                    };
                    row.classList.add("dragging");
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/x-pigeon-tile-line", item.id);
                });

                drag.addEventListener("dragend", event => {
                    event.stopPropagation();
                    activeTileItemDrag = null;
                    activeDatabaseItemDrag = null;
                    row.classList.remove("dragging");
                    document.querySelectorAll(".tile-item-list").forEach(list => list.classList.remove("tile-item-drop-target"));
                    document.querySelectorAll(".checklist-list, .day-list").forEach(list => list.classList.remove("task-drop-target"));
                    priorityShelf?.classList.remove("priority-drop-target");
                });

                row.addEventListener("dragover", event => {
                    if (!activeTileItemDrag && !["checklist", "priority"].includes(activeDatabaseItemDrag?.type)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = "move";
                });

                row.addEventListener("drop", event => {
                    if (!activeTileItemDrag && !["checklist", "priority"].includes(activeDatabaseItemDrag?.type)) return;
                    event.preventDefault();
                    event.stopPropagation();

                    if (activeDatabaseItemDrag?.type === "checklist") {
                        const dragData = activeDatabaseItemDrag;
                        activeTaskDrag = null;
                        activeDatabaseItemDrag = null;
                        moveChecklistItemToTile(
                            dragData.sourceKey,
                            dragData.sourceItemId,
                            tile.id,
                            itemIndex
                        );
                        return;
                    }

                    if (activeDatabaseItemDrag?.type === "priority") {
                        const dragData = activeDatabaseItemDrag;
                        activeDatabaseItemDrag = null;
                        movePriorityItemToTile(dragData.priorityItemId, tile.id, itemIndex);
                        return;
                    }

                    const dragData = activeTileItemDrag;
                    activeTileItemDrag = null;
                    activeDatabaseItemDrag = null;
                    moveTileItem(dragData.sourceTileId, dragData.sourceItemId, tile.id, itemIndex);
                });

                const selector = makeSelectionControl(
                    selectionKey("db-tile", tile.id, item.id),
                    "Select this Main Board line"
                );

                const rowActions = document.createElement("div");
                rowActions.className = "item-row-actions";
                rowActions.append(selector, archive, remove);

                row.append(drag, text, rowActions);
                itemList.appendChild(row);
            });
        }

        itemList.addEventListener("dragover", event => {
            if (!activeTileItemDrag && !["checklist", "priority"].includes(activeDatabaseItemDrag?.type)) return;
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "move";
            itemList.classList.add("tile-item-drop-target");
        });

        itemList.addEventListener("dragleave", event => {
            if (!itemList.contains(event.relatedTarget)) itemList.classList.remove("tile-item-drop-target");
        });

        itemList.addEventListener("drop", event => {
            if (!activeTileItemDrag && !["checklist", "priority"].includes(activeDatabaseItemDrag?.type)) return;
            event.preventDefault();
            event.stopPropagation();
            itemList.classList.remove("tile-item-drop-target");

            if (activeDatabaseItemDrag?.type === "checklist") {
                const dragData = activeDatabaseItemDrag;
                activeTaskDrag = null;
                activeDatabaseItemDrag = null;
                moveChecklistItemToTile(
                    dragData.sourceKey,
                    dragData.sourceItemId,
                    tile.id,
                    loadTileItems(tile).length
                );
                return;
            }

            if (activeDatabaseItemDrag?.type === "priority") {
                const dragData = activeDatabaseItemDrag;
                activeDatabaseItemDrag = null;
                movePriorityItemToTile(dragData.priorityItemId, tile.id, loadTileItems(tile).length);
                return;
            }

            const dragData = activeTileItemDrag;
            activeTileItemDrag = null;
            activeDatabaseItemDrag = null;
            moveTileItem(dragData.sourceTileId, dragData.sourceItemId, tile.id, loadTileItems(tile).length);
        });

        handle.addEventListener("dragstart", event => {
            if (activeTileItemDrag) {
                event.preventDefault();
                return;
            }
            activeTileDrag = { id: tile.id };
            card.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", tile.id);
        });

        handle.addEventListener("dragend", () => {
            activeTileDrag = null;
            card.classList.remove("dragging");
            document.querySelectorAll(".tile-dropzone").forEach(dropzone => dropzone.classList.remove("tile-drop-active"));
        });

        card.addEventListener("dragover", event => {
            if (!activeTileDrag || activeTileItemDrag) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });

        card.addEventListener("drop", event => {
            if (!activeTileDrag || activeTileItemDrag) return;
            event.preventDefault();
            event.stopPropagation();
            moveTile(activeTileDrag.id, index);
            activeTileDrag = null;
        });

        head.append(handle, title, addLineTop);
        if (deleteTile) head.appendChild(deleteTile);
        card.append(head, body);
        renderTileLines();
        return card;
    }

    function renderTileZones() {
        tileGrid.innerHTML = "";

        if (!boardOrder.length) {
            const empty = document.createElement("div");
            empty.className = "tile-zone-empty";
            empty.textContent = "Add a Main Board tile when you want a new home for lines.";
            tileGrid.appendChild(empty);
            return;
        }

        boardOrder.forEach((id, index) => {
            const tile = tileById(id);
            if (tile) tileGrid.appendChild(makeBoardTile(tile, "board", index));
        });
    }

    function bindTileDropzone(container) {
        container.addEventListener("dragover", event => {
            if (!activeTileDrag) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            container.classList.add("tile-drop-active");
        });

        container.addEventListener("dragleave", event => {
            if (!container.contains(event.relatedTarget)) container.classList.remove("tile-drop-active");
        });

        container.addEventListener("drop", event => {
            if (!activeTileDrag || event.target.closest(".board-tile")) return;
            event.preventDefault();
            container.classList.remove("tile-drop-active");
            moveTile(activeTileDrag.id, boardOrder.length);
            activeTileDrag = null;
        });
    }

    bindTileDropzone(tileGrid);
    renderTileZones();

    if (addTileButton) {
        addTileButton.addEventListener("click", () => {
            const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const accent = TILE_ACCENTS[customTiles.length % TILE_ACCENTS.length];
            const tile = {
                id,
                accent,
                title: "New Tile",
                text: "",
                custom: true
            };

            customTiles.push(tile);
            tiles.push(tile);
            allTileIds.push(id);
            boardOrder.push(id);
            tileItemState.set(id, []);
            saveTileItems(id, false);
            saveCustomTiles();
            saveTileLayout(false);
            renderTileZones();
            showSaved();

            requestAnimationFrame(() => {
                const newTile = tileGrid.querySelector(`.board-tile[data-id="${id}"]`);
                if (!newTile) return;
                newTile.scrollIntoView({ block: "nearest", behavior: "smooth" });
                const titleField = newTile.querySelector(".tile-title");
                if (!titleField) return;
                titleField.focus();
                const range = document.createRange();
                range.selectNodeContents(titleField);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            });
        });
    }

    document.getElementById("resetLayout")?.addEventListener("click", () => {
        boardOrder = [...allTileIds];
        saveTileLayout(false);
        renderTileZones();
        showSaved();
    });

    /* =========================================================
       EDITABLE / MOVEABLE LINKS
       ========================================================= */
    const defaultLinks = [
        { id: "notion", label: "Notion", url: "#" },
        { id: "calendar", label: "Calendar", url: "#" },
        { id: "neopets", label: "Neopets", url: "neopets.html" },
        { id: "banking", label: "Banking", url: "#" },
        { id: "work", label: "Work", url: "#" }
    ];

    const linksContainer = document.getElementById("linksContainer");
    let links = defaultLinks;
    try {
        const savedLinks = JSON.parse(localStorage.getItem("pigeonhole-tight-links") || "null");
        if (Array.isArray(savedLinks)) links = savedLinks;
    } catch (error) {
        console.warn("Could not read saved Database links; leaving the stored value untouched and using defaults for this load.", error);
    }
    let draggedLinkId = null;
    let editingLinkId = null;

    const linkEditorBackdrop = document.getElementById("linkEditorBackdrop");
    const linkEditorTitle = document.getElementById("linkEditorTitle");
    const linkLabelInput = document.getElementById("linkLabelInput");
    const linkUrlInput = document.getElementById("linkUrlInput");
    const saveLinkEdit = document.getElementById("saveLinkEdit");
    const cancelLinkEdit = document.getElementById("cancelLinkEdit");
    const addLinkButton = document.getElementById("addLinkButton");
    let creatingLink = false;

    const savedNeopets = links.find(item => item.id === "neopets");
    if (savedNeopets && savedNeopets.url === "https://www.neopets.com/") {
        savedNeopets.url = "neopets.html";
        localStorage.setItem("pigeonhole-tight-links", JSON.stringify(links));
    }

    function openLinkEditor(link) {
        creatingLink = false;
        editingLinkId = link.id;
        linkEditorTitle.textContent = "Edit Link";
        linkLabelInput.value = link.label;
        linkUrlInput.value = link.url === "#" ? "" : link.url;
        linkEditorBackdrop.classList.add("open");
        linkEditorBackdrop.setAttribute("aria-hidden", "false");
        setTimeout(() => linkLabelInput.focus(), 0);
    }

    function openNewLinkEditor() {
        creatingLink = true;
        editingLinkId = null;
        linkEditorTitle.textContent = "Add Link";
        linkLabelInput.value = "";
        linkUrlInput.value = "";
        linkEditorBackdrop.classList.add("open");
        linkEditorBackdrop.setAttribute("aria-hidden", "false");
        setTimeout(() => linkLabelInput.focus(), 0);
    }

    function closeLinkEditor() {
        editingLinkId = null;
        creatingLink = false;
        linkEditorBackdrop.classList.remove("open");
        linkEditorBackdrop.setAttribute("aria-hidden", "true");
    }

    addLinkButton.addEventListener("click", openNewLinkEditor);

    saveLinkEdit.addEventListener("click", () => {
        const label = linkLabelInput.value.trim();
        const url = linkUrlInput.value.trim() || "#";

        if (creatingLink) {
            if (!label) return;
            links.push({
                id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                label,
                url
            });
        } else {
            const link = links.find(item => item.id === editingLinkId);
            if (!link) return closeLinkEditor();
            link.label = label || link.label;
            link.url = url;
        }

        saveLinks();
        renderLinks();
        closeLinkEditor();
    });

    [linkLabelInput, linkUrlInput].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                saveLinkEdit.click();
            }
        });
    });

    cancelLinkEdit.addEventListener("click", closeLinkEditor);
    linkEditorBackdrop.addEventListener("click", event => {
        if (event.target === linkEditorBackdrop) closeLinkEditor();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && linkEditorBackdrop.classList.contains("open")) {
            closeLinkEditor();
        }
    });

    function saveLinks() {
        localStorage.setItem("pigeonhole-tight-links", JSON.stringify(links));
        showSaved();
    }

    function renderLinks() {
        linksContainer.innerHTML = "";

        links.forEach(link => {
            const chip = document.createElement("div");
            chip.className = "link-chip";
            chip.dataset.id = link.id;

            const drag = document.createElement("span");
            drag.className = "link-drag";
            drag.textContent = "⋮⋮";
            drag.draggable = true;
            drag.title = "Drag to rearrange";

            const anchor = document.createElement("a");
            anchor.textContent = link.label;
            anchor.href = link.url || "#";
            if (!link.url || link.url === "#") {
                anchor.addEventListener("click", event => event.preventDefault());
            }

            const edit = document.createElement("button");
            edit.className = "link-edit";
            edit.textContent = "✎";
            edit.title = "Edit link";
            edit.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                openLinkEditor(link);
            });

            const remove = document.createElement("button");
            remove.className = "link-remove";
            remove.textContent = "×";
            remove.title = "Remove link";
            remove.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                links = links.filter(item => item.id !== link.id);
                saveLinks();
                renderLinks();
            });

            drag.addEventListener("dragstart", event => {
                draggedLinkId = link.id;
                chip.classList.add("dragging");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", link.id);
            });

            drag.addEventListener("dragend", () => {
                draggedLinkId = null;
                chip.classList.remove("dragging");
            });

            chip.addEventListener("dragover", event => event.preventDefault());
            chip.addEventListener("drop", event => {
                event.preventDefault();
                const sourceId = draggedLinkId || event.dataTransfer.getData("text/plain");
                if (!sourceId || sourceId === link.id) return;
                const from = links.findIndex(item => item.id === sourceId);
                const to = links.findIndex(item => item.id === link.id);
                if (from < 0 || to < 0) return;
                const [moved] = links.splice(from, 1);
                links.splice(to, 0, moved);
                saveLinks();
                renderLinks();
            });

            chip.append(drag, anchor, edit, remove);
            linksContainer.appendChild(chip);
        });
    }

    renderLinks();

    /* =========================================================
       SHARED CHECKLIST SYSTEM
       Radar and all 14 dates can exchange items by drag.
       ========================================================= */
    const checklistManagers = new Map();
    let activeTaskDrag = null;

    function moveChecklistItemToTile(sourceKey, sourceItemId, targetTileId, targetIndex = null) {
        const source = checklistManagers.get(sourceKey);
        const targetTile = tileById(targetTileId);
        if (!source || !targetTile) return;

        const sourceIndex = source.items.findIndex(item => item.id === sourceItemId);
        if (sourceIndex < 0) return;

        const [moved] = source.items.splice(sourceIndex, 1);
        const targetItems = loadTileItems(targetTile);
        const tileItem = {
            id: moved.id || archiveId("line"),
            text: String(moved.text || "")
        };

        if (targetIndex === null) targetIndex = targetItems.length;
        targetIndex = Math.max(0, Math.min(targetIndex, targetItems.length));
        targetItems.splice(targetIndex, 0, tileItem);

        source.save(false);
        saveTileItems(targetTileId, false);
        source.render();
        renderTileZones();
        showSaved();
    }

    function moveTileItemToChecklist(sourceTileId, sourceItemId, targetKey, targetIndex = null) {
        const sourceTile = tileById(sourceTileId);
        const target = checklistManagers.get(targetKey);
        if (!sourceTile || !target) return;

        const sourceItems = loadTileItems(sourceTile);
        const sourceIndex = sourceItems.findIndex(item => item.id === sourceItemId);
        if (sourceIndex < 0) return;

        const [moved] = sourceItems.splice(sourceIndex, 1);
        const checklistItem = {
            id: moved.id || archiveId("task"),
            text: String(moved.text || ""),
            done: false
        };

        if (targetIndex === null) targetIndex = target.items.length;
        targetIndex = Math.max(0, Math.min(targetIndex, target.items.length));
        target.items.splice(targetIndex, 0, checklistItem);

        saveTileItems(sourceTileId, false);
        target.save(false);
        renderTileZones();
        target.render();
        showSaved();
    }

    function moveChecklistItem(sourceKey, sourceIndex, targetKey, targetIndex) {
        const source = checklistManagers.get(sourceKey);
        const target = checklistManagers.get(targetKey);
        if (!source || !target) return;
        if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= source.items.length) return;

        const [moved] = source.items.splice(sourceIndex, 1);
        if (!target.checkable) moved.done = false;
        if (sourceKey === targetKey && sourceIndex < targetIndex) targetIndex -= 1;

        targetIndex = Math.max(0, Math.min(targetIndex, target.items.length));
        target.items.splice(targetIndex, 0, moved);

        source.save(false);
        if (sourceKey !== targetKey) target.save(false);

        source.render();
        if (sourceKey !== targetKey) target.render();
        showSaved();
    }

    function createChecklistManager({
        storageKey,
        listId,
        inputId,
        buttonId,
        defaults,
        accentClass = "",
        archiveSource = "Checklist",
        archiveContext = "",
        archiveOriginalDate = null,
        doneToBottom = false,
        checkable = true,
        newItemsToTop = false
    }) {
        const listElement = document.getElementById(listId);
        const inputElement = document.getElementById(inputId);
        const buttonElement = document.getElementById(buttonId);
        if (!listElement || !inputElement || !buttonElement) return null;

        if (inputElement.matches("textarea[data-autogrow], textarea.auto-grow-textarea")) {
            bindAutoGrowTextarea(inputElement);
        }

        let items = Array.isArray(defaults) ? defaults.map(item => ({ ...item })) : [];
        const rawSavedItems = localStorage.getItem(storageKey);
        if (rawSavedItems !== null) {
            try {
                const parsedItems = JSON.parse(rawSavedItems);
                if (Array.isArray(parsedItems)) items = parsedItems;
            } catch (error) {
                console.warn(`Could not read ${storageKey}; preserving the stored value and continuing with an empty/default view instead of stopping the whole Database.`, error);
            }
        }
        let addedStableIds = false;
        items = items.map(item => {
            if (item && item.id) return item;
            addedStableIds = true;
            return { ...item, id: archiveId("task") };
        });
        if (addedStableIds) localStorage.setItem(storageKey, JSON.stringify(items));

        const manager = {
            storageKey,
            listElement,
            archiveSource,
            archiveContext,
            archiveOriginalDate,
            accent: String(accentClass || "").replace(/^scroll-/, "") || "teal",
            checkable: Boolean(checkable),
            get items() { return items; },
            save(show = true) {
                localStorage.setItem(storageKey, JSON.stringify(items));
                if (show) showSaved();
            },
            clear(show = true) {
                items = [];
                localStorage.setItem(storageKey, JSON.stringify(items));
                if (manager.render) manager.render();
                if (show) showSaved();
            },
            render: null
        };

        checklistManagers.set(storageKey, manager);
        listElement.dataset.storageKey = storageKey;

        function renderItems() {
            listElement.innerHTML = "";

            items.forEach((item, index) => {
                const row = document.createElement("div");
                row.className = "checklist-item" + (checkable && item.done ? " done" : "") + (!checkable ? " checklist-item-no-check" : "");
                row.dataset.itemId = item.id;
                if (accentClass) row.classList.add(accentClass);

                const drag = document.createElement("span");
                drag.className = "check-drag";
                drag.textContent = "⋮⋮";
                drag.draggable = true;
                drag.title = "Drag between Notes, Radar, Near My Radar, or calendar days";

                let wrap = null;
                if (checkable) {
                    wrap = document.createElement("label");
                    wrap.className = "check-wrap";
                    if (accentClass) wrap.classList.add(accentClass);

                    const check = document.createElement("input");
                    check.type = "checkbox";
                    check.checked = item.done;
                    check.addEventListener("change", () => {
                        const [changedItem] = items.splice(index, 1);
                        changedItem.done = check.checked;

                        if (doneToBottom) {
                            if (changedItem.done) {
                                items.push(changedItem);
                            } else {
                                const firstDoneIndex = items.findIndex(candidate => candidate.done);
                                items.splice(firstDoneIndex < 0 ? items.length : firstDoneIndex, 0, changedItem);
                            }
                        } else {
                            items.splice(index, 0, changedItem);
                        }

                        manager.save();
                        renderItems();
                    });
                    wrap.appendChild(check);
                }

                const taskText = document.createElement("div");
                taskText.className = "task-text";
                taskText.contentEditable = "true";
                taskText.spellcheck = true;
                taskText.textContent = item.text;
                taskText.addEventListener("input", () => {
                    items[index].text = taskText.textContent;
                    manager.save();
                });

                const archive = document.createElement("button");
                archive.className = "check-archive archive-icon-button";
                archive.type = "button";
                archive.textContent = "↘";
                archive.title = "Archive item";
                archive.addEventListener("click", () => {
                    const archived = archiveManualItem({
                        text: item.text,
                        source: archiveSource,
                        context: archiveContext,
                        originalDate: archiveOriginalDate,
                        metadata: { done: Boolean(item.done), storageKey }
                    });
                    if (!archived) return;
                    items.splice(index, 1);
                    manager.save(false);
                    renderItems();
                    showSaved();
                });

                const del = document.createElement("button");
                del.className = "check-delete";
                del.textContent = "×";
                del.title = "Delete item";
                del.addEventListener("click", () => {
                    items.splice(index, 1);
                    manager.save();
                    renderItems();
                });

                drag.addEventListener("dragstart", event => {
                    activeTaskDrag = { sourceKey: storageKey, sourceIndex: index, sourceItemId: item.id };
                    activeDatabaseItemDrag = {
                        type: "checklist",
                        sourceKey: storageKey,
                        sourceItemId: item.id
                    };
                    row.classList.add("dragging");
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", JSON.stringify(activeTaskDrag));
                });

                drag.addEventListener("dragend", () => {
                    activeTaskDrag = null;
                    activeDatabaseItemDrag = null;
                    row.classList.remove("dragging");
                    document.querySelectorAll(".checklist-list, .day-list").forEach(list => list.classList.remove("task-drop-target"));
                    document.querySelectorAll(".tile-item-list").forEach(list => list.classList.remove("tile-item-drop-target"));
                    priorityShelf?.classList.remove("priority-drop-target");
                });

                row.addEventListener("dragover", event => {
                    if (!activeTaskDrag && !["tile", "priority"].includes(activeDatabaseItemDrag?.type)) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                });

                row.addEventListener("drop", event => {
                    if (!activeTaskDrag && !["tile", "priority"].includes(activeDatabaseItemDrag?.type)) return;
                    event.preventDefault();
                    event.stopPropagation();

                    if (activeDatabaseItemDrag?.type === "tile") {
                        const dragData = activeDatabaseItemDrag;
                        activeTileItemDrag = null;
                        activeDatabaseItemDrag = null;
                        moveTileItemToChecklist(
                            dragData.sourceTileId,
                            dragData.sourceItemId,
                            storageKey,
                            index
                        );
                        return;
                    }

                    if (activeDatabaseItemDrag?.type === "priority") {
                        const dragData = activeDatabaseItemDrag;
                        activeDatabaseItemDrag = null;
                        movePriorityItemToChecklist(dragData.priorityItemId, storageKey, index);
                        return;
                    }

                    moveChecklistItem(
                        activeTaskDrag.sourceKey,
                        activeTaskDrag.sourceIndex,
                        storageKey,
                        index
                    );
                    activeTaskDrag = null;
                    activeDatabaseItemDrag = null;
                });

                const selector = makeSelectionControl(
                    selectionKey("db-check", storageKey, item.id),
                    "Select this item"
                );

                const rowActions = document.createElement("div");
                rowActions.className = "item-row-actions";
                rowActions.append(selector, archive, del);

                if (wrap) row.append(drag, wrap, taskText, rowActions);
                else row.append(drag, taskText, rowActions);
                listElement.appendChild(row);
            });
        }

        manager.render = renderItems;

        listElement.addEventListener("dragover", event => {
            if (!activeTaskDrag && !["tile", "priority"].includes(activeDatabaseItemDrag?.type)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            listElement.classList.add("task-drop-target");
        });

        listElement.addEventListener("dragleave", event => {
            if (!listElement.contains(event.relatedTarget)) {
                listElement.classList.remove("task-drop-target");
            }
        });

        listElement.addEventListener("drop", event => {
            if (!activeTaskDrag && !["tile", "priority"].includes(activeDatabaseItemDrag?.type)) return;
            event.preventDefault();
            listElement.classList.remove("task-drop-target");

            if (activeDatabaseItemDrag?.type === "tile") {
                const dragData = activeDatabaseItemDrag;
                activeTileItemDrag = null;
                activeDatabaseItemDrag = null;
                moveTileItemToChecklist(
                    dragData.sourceTileId,
                    dragData.sourceItemId,
                    storageKey,
                    items.length
                );
                return;
            }

            if (activeDatabaseItemDrag?.type === "priority") {
                const dragData = activeDatabaseItemDrag;
                activeDatabaseItemDrag = null;
                movePriorityItemToChecklist(dragData.priorityItemId, storageKey, items.length);
                return;
            }

            moveChecklistItem(
                activeTaskDrag.sourceKey,
                activeTaskDrag.sourceIndex,
                storageKey,
                items.length
            );
            activeTaskDrag = null;
            activeDatabaseItemDrag = null;
        });

        function addItem() {
            const value = inputElement.value.trim();
            if (!value) return;
            const nextItem = { id: archiveId("task"), text: value, done: false };
            if (newItemsToTop) items.unshift(nextItem);
            else items.push(nextItem);
            inputElement.value = "";
            if (inputElement.matches("textarea[data-autogrow], textarea.auto-grow-textarea")) {
                resizeAutoGrowTextarea(inputElement);
            }
            manager.save();
            renderItems();
        }

        buttonElement.addEventListener("click", addItem);
        inputElement.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            if (mobileComposerUsesNewlines() || event.shiftKey) return;

            event.preventDefault();
            addItem();
        });

        renderItems();
        return manager;
    }

    for (let offset = 0; offset < DAY_COUNT; offset++) {
        const manager = createChecklistManager({
            storageKey: dayKeys[offset],
            listId: `dayList${offset}`,
            inputId: `dayInput${offset}`,
            buttonId: `dayAdd${offset}`,
            defaults: [],
            accentClass: dayAccentClasses[offset % dayAccentClasses.length],
            archiveSource: "Calendar",
            archiveContext: document.getElementById(`dayList${offset}`)?.closest(".day-card")?.querySelector(".date-label")?.textContent || "",
            archiveOriginalDate: dayDateStrings[offset],
            doneToBottom: true
        });

        const archiveButton = document.getElementById(`dayArchive${offset}`);
        if (archiveButton && manager) {
            archiveButton.addEventListener("click", () => {
                if (!manager.items.length) return;
                const label = archiveButton.closest(".day-card")?.querySelector(".date-label")?.textContent || "";
                if (!window.confirm(`Archive all items for ${label}?`)) return;
                if (archiveDaySnapshot(dayDateStrings[offset], manager.items, label)) {
                    manager.clear(false);
                    showSaved();
                }
            });
        }
    }

    const radarManager = createChecklistManager({
        storageKey: "pigeonhole-tight-radar",
        listId: "radarList",
        inputId: "radarInput",
        buttonId: "addRadar",
        defaults: [
            { text: "Confirm housing / showing status", done: false },
            { text: "Capture Ignite questions as they come up", done: false },
            { text: "Review upcoming bills", done: false }
        ],
        accentClass: "scroll-teal",
        archiveSource: "Database",
        archiveContext: "On My Radar"
    });

    createChecklistManager({
        storageKey: "pigeonhole-near-radar",
        listId: "nearRadarList",
        inputId: "nearRadarInput",
        buttonId: "addNearRadar",
        defaults: [],
        accentClass: "scroll-plum",
        archiveSource: "Database",
        archiveContext: "Near My Radar"
    });

    const databaseNotesManager = createChecklistManager({
        storageKey: "pigeonhole-database-notes-v1",
        listId: "databaseNotesList",
        inputId: "databaseNotesInput",
        buttonId: "addDatabaseNote",
        defaults: [],
        accentClass: "scroll-teal",
        archiveSource: "Database",
        archiveContext: "Notes",
        checkable: false,
        newItemsToTop: true
    });

    /* V18 recovery migration: v7 retired the visible Main Board but left its
       saved line-item keys intact. Bring those lines into the new Notes desk
       exactly once so the information is visible again. The original tile
       storage is deliberately NOT removed, leaving a safety copy behind. */
    const LEGACY_BOARD_TO_NOTES_MIGRATION_KEY = "pigeonhole-v18-board-to-notes-migrated";
    if (databaseNotesManager && localStorage.getItem(LEGACY_BOARD_TO_NOTES_MIGRATION_KEY) !== "true") {
        const existingIds = new Set(databaseNotesManager.items.map(item => item?.id).filter(Boolean));
        let recoveredCount = 0;

        tiles.forEach(tile => {
            const tileItems = loadTileItems(tile);
            const sourceTitle = plainTileTitle(tile);
            const defaultTexts = new Set(tile.custom ? [] : defaultTileLines(tile));

            tileItems.forEach(item => {
                const recoveredText = String(item?.text || "").trim();
                if (!recoveredText || existingIds.has(item.id)) return;

                /* The old Main Board shipped with starter/example lines. Those
                   are not personal data, so don't flood the new Notes desk with
                   untouched defaults. Any edited/new line differs and is kept. */
                if (!tile.custom && defaultTexts.has(recoveredText)) return;

                databaseNotesManager.items.push({
                    id: item.id || archiveId("task"),
                    text: recoveredText,
                    done: false,
                    recoveredFromTile: tile.id,
                    recoveredFromTitle: sourceTitle
                });
                existingIds.add(item.id);
                recoveredCount += 1;
            });
        });

        if (recoveredCount) {
            databaseNotesManager.save(false);
            databaseNotesManager.render();
            showSaved();
        }
        localStorage.setItem(LEGACY_BOARD_TO_NOTES_MIGRATION_KEY, "true");
    }

    /* V17 migration: the visible Priority Shelf was retired in favor of Radar.
       Preserve any items that were still sitting there by moving them into
       On My Radar once, then clear the old shelf storage. */
    if (!priorityShelf && radarManager && priorityItems.length) {
        const existingIds = new Set(radarManager.items.map(item => item.id));
        priorityItems.forEach(item => {
            if (existingIds.has(item.id)) return;
            radarManager.items.push({
                id: item.id || archiveId("task"),
                text: String(item.text || ""),
                done: Boolean(item.done)
            });
        });
        radarManager.save(false);
        radarManager.render();
        priorityItems = [];
        savePriorityItems(false);
        showSaved();
    }

    renderPriorityShelf();

    configureSelectionAction("archive selected", selected => {
        let changed = false;

        /* Main Board lines */
        tiles.forEach(tile => {
            const items = loadTileItems(tile);
            const kept = [];
            items.forEach(item => {
                if (!selected.has(selectionKey("db-tile", tile.id, item.id))) {
                    kept.push(item);
                    return;
                }

                const title = localStorage.getItem(`pigeonhole-tile-title-${tile.id}`) || tile.title;
                archiveManualItem({
                    text: item.text,
                    source: "Main Board",
                    context: String(title).replace(/<[^>]*>/g, "").trim() || tile.title,
                    metadata: { tileId: tile.id }
                });
                changed = true;
            });

            if (kept.length !== items.length) {
                tileItemState.set(tile.id, kept);
                saveTileItems(tile.id, false);
            }
        });

        /* Priority Shelf items */
        const keptPriority = [];
        priorityItems.forEach(item => {
            if (!selected.has(selectionKey("db-priority", item.id))) {
                keptPriority.push(item);
                return;
            }

            archiveManualItem({
                text: item.text,
                source: "Priority Shelf",
                context: item.sourceLabel || "Database",
                metadata: { accent: item.accent, movedAt: item.movedAt }
            });
            changed = true;
        });

        if (keptPriority.length !== priorityItems.length) {
            priorityItems = keptPriority;
            savePriorityItems(false);
            renderPriorityShelf();
        }

        /* Radar + calendar checklist items */
        checklistManagers.forEach(manager => {
            const kept = [];
            manager.items.forEach(item => {
                if (!selected.has(selectionKey("db-check", manager.storageKey, item.id))) {
                    kept.push(item);
                    return;
                }

                archiveManualItem({
                    text: item.text,
                    source: manager.archiveSource,
                    context: manager.archiveContext,
                    originalDate: manager.archiveOriginalDate,
                    metadata: { done: Boolean(item.done), storageKey: manager.storageKey }
                });
                changed = true;
            });

            if (kept.length !== manager.items.length) {
                manager.items.splice(0, manager.items.length, ...kept);
                manager.save(false);
                manager.render();
            }
        });

        if (changed) {
            renderTileZones();
            renderPriorityShelf();
            showSaved();
        }
        return changed;
    });

    /* =========================================================
       MOBILE TAP-TO-MOVE
       Native HTML drag/drop is inconsistent on touch browsers. On
       phones/tablets, tapping a ⋮⋮ move handle selects an item; the
       next tap on a compatible row/tile/list moves it there. Desktop
       drag-and-drop remains unchanged.
       ========================================================= */
    let mobileMoveState = null;
    let mobileMoveBanner = null;

    function mobileMoveEnabled() {
        return mobileComposerUsesNewlines();
    }

    function ensureMobileMoveBanner() {
        if (mobileMoveBanner) return mobileMoveBanner;
        mobileMoveBanner = document.createElement("div");
        mobileMoveBanner.className = "mobile-move-banner";
        mobileMoveBanner.innerHTML = '<span>move mode: tap the destination</span><button type="button">cancel</button>';
        mobileMoveBanner.querySelector("button").addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            clearMobileMoveState();
        });
        document.body.appendChild(mobileMoveBanner);
        return mobileMoveBanner;
    }

    function clearMobileMoveState() {
        mobileMoveState = null;
        document.body.classList.remove("mobile-move-mode");
        document.querySelectorAll(".mobile-move-source").forEach(node => node.classList.remove("mobile-move-source"));
        if (mobileMoveBanner) mobileMoveBanner.hidden = true;
    }

    function beginMobileMove(state, sourceNode) {
        mobileMoveState = state;
        document.body.classList.add("mobile-move-mode");
        document.querySelectorAll(".mobile-move-source").forEach(node => node.classList.remove("mobile-move-source"));
        sourceNode?.classList.add("mobile-move-source");
        const banner = ensureMobileMoveBanner();
        banner.hidden = false;
    }

    function moveSourceIntoTile(targetTileId, targetIndex = null) {
        const state = mobileMoveState;
        if (!state) return false;
        if (state.type === "tile-line") {
            moveTileItem(state.sourceTileId, state.sourceItemId, targetTileId, targetIndex);
            return true;
        }
        if (state.type === "checklist") {
            moveChecklistItemToTile(state.sourceKey, state.sourceItemId, targetTileId, targetIndex);
            return true;
        }
        if (state.type === "priority") {
            movePriorityItemToTile(state.priorityItemId, targetTileId, targetIndex);
            return true;
        }
        return false;
    }

    function moveSourceIntoChecklist(targetKey, targetIndex = null) {
        const state = mobileMoveState;
        const target = checklistManagers.get(targetKey);
        if (!state || !target) return false;
        if (targetIndex === null) targetIndex = target.items.length;

        if (state.type === "tile-line") {
            moveTileItemToChecklist(state.sourceTileId, state.sourceItemId, targetKey, targetIndex);
            return true;
        }
        if (state.type === "priority") {
            movePriorityItemToChecklist(state.priorityItemId, targetKey, targetIndex);
            return true;
        }
        if (state.type === "checklist") {
            const source = checklistManagers.get(state.sourceKey);
            const sourceIndex = source?.items.findIndex(item => item.id === state.sourceItemId) ?? -1;
            if (sourceIndex < 0) return false;
            moveChecklistItem(state.sourceKey, sourceIndex, targetKey, targetIndex);
            return true;
        }
        return false;
    }

    function moveSourceIntoPriority(targetIndex = null) {
        const state = mobileMoveState;
        if (!state) return false;
        if (state.type === "tile-line") {
            moveTileItemToPriority(state.sourceTileId, state.sourceItemId, targetIndex);
            return true;
        }
        if (state.type === "checklist") {
            moveChecklistItemToPriority(state.sourceKey, state.sourceItemId, targetIndex);
            return true;
        }
        if (state.type === "priority") {
            reorderPriorityItem(state.priorityItemId, targetIndex ?? priorityItems.length);
            return true;
        }
        return false;
    }

    document.addEventListener("click", event => {
        if (!mobileMoveEnabled()) return;

        const handle = event.target.closest(".drag-handle, .tile-item-drag, .check-drag, .priority-item-drag");
        if (handle) {
            event.preventDefault();
            event.stopPropagation();

            if (handle.matches(".drag-handle")) {
                const card = handle.closest(".board-tile");
                if (card?.dataset.id) beginMobileMove({ type: "board-tile", tileId: card.dataset.id }, card);
                return;
            }
            if (handle.matches(".tile-item-drag")) {
                const row = handle.closest(".tile-item-row");
                const list = handle.closest(".tile-item-list");
                if (row?.dataset.itemId && list?.dataset.tileId) beginMobileMove({ type: "tile-line", sourceTileId: list.dataset.tileId, sourceItemId: row.dataset.itemId }, row);
                return;
            }
            if (handle.matches(".check-drag")) {
                const row = handle.closest(".checklist-item");
                const list = handle.closest(".checklist-list, .day-list");
                if (row?.dataset.itemId && list?.dataset.storageKey) beginMobileMove({ type: "checklist", sourceKey: list.dataset.storageKey, sourceItemId: row.dataset.itemId }, row);
                return;
            }
            if (handle.matches(".priority-item-drag")) {
                const card = handle.closest(".priority-item");
                if (card?.dataset.priorityId) beginMobileMove({ type: "priority", priorityItemId: card.dataset.priorityId }, card);
                return;
            }
        }

        if (!mobileMoveState) return;

        /* Move mode should never hijack a checkbox, delete button, link,
           text editor, or other control. Tap the surrounding row/card to
           choose it as the destination. */
        if (event.target.closest('button, input, textarea, select, a')) return;

        if (mobileMoveState.type === "board-tile") {
            const targetCard = event.target.closest(".board-tile");
            if (targetCard?.dataset.id) {
                event.preventDefault();
                event.stopPropagation();
                const targetIndex = boardOrder.indexOf(targetCard.dataset.id);
                moveTile(mobileMoveState.tileId, targetIndex < 0 ? boardOrder.length : targetIndex);
                clearMobileMoveState();
                return;
            }
            if (event.target.closest("#tileGrid")) {
                event.preventDefault();
                event.stopPropagation();
                moveTile(mobileMoveState.tileId, boardOrder.length);
                clearMobileMoveState();
            }
            return;
        }

        const tileRow = event.target.closest(".tile-item-row");
        if (tileRow) {
            const list = tileRow.closest(".tile-item-list");
            const targetTileId = list?.dataset.tileId;
            if (targetTileId) {
                const rows = [...list.querySelectorAll(":scope > .tile-item-row")];
                const targetIndex = Math.max(0, rows.indexOf(tileRow));
                event.preventDefault();
                event.stopPropagation();
                if (moveSourceIntoTile(targetTileId, targetIndex)) clearMobileMoveState();
                return;
            }
        }

        const tileList = event.target.closest(".tile-item-list");
        if (tileList?.dataset.tileId) {
            event.preventDefault();
            event.stopPropagation();
            const targetTile = tileById(tileList.dataset.tileId);
            const targetIndex = targetTile ? loadTileItems(targetTile).length : null;
            if (moveSourceIntoTile(tileList.dataset.tileId, targetIndex)) clearMobileMoveState();
            return;
        }

        const checklistRow = event.target.closest(".checklist-item");
        if (checklistRow) {
            const list = checklistRow.closest(".checklist-list, .day-list");
            const targetKey = list?.dataset.storageKey;
            const manager = targetKey ? checklistManagers.get(targetKey) : null;
            if (targetKey && manager) {
                const targetIndex = manager.items.findIndex(item => item.id === checklistRow.dataset.itemId);
                event.preventDefault();
                event.stopPropagation();
                if (moveSourceIntoChecklist(targetKey, targetIndex < 0 ? manager.items.length : targetIndex)) clearMobileMoveState();
                return;
            }
        }

        const checklistList = event.target.closest(".checklist-list, .day-list");
        if (checklistList?.dataset.storageKey) {
            event.preventDefault();
            event.stopPropagation();
            if (moveSourceIntoChecklist(checklistList.dataset.storageKey, null)) clearMobileMoveState();
            return;
        }

        const priorityCard = event.target.closest(".priority-item");
        if (priorityCard?.dataset.priorityId) {
            const targetIndex = priorityItems.findIndex(item => item.id === priorityCard.dataset.priorityId);
            event.preventDefault();
            event.stopPropagation();
            if (moveSourceIntoPriority(targetIndex < 0 ? priorityItems.length : targetIndex)) clearMobileMoveState();
            return;
        }

        if (event.target.closest("#priorityShelf")) {
            event.preventDefault();
            event.stopPropagation();
            if (moveSourceIntoPriority(priorityItems.length)) clearMobileMoveState();
        }
    }, true);
}

/* =========================================================
   BRAIN AQUARIUM MODULE
   Runs only on Aquarium.html.
   Cards keep manual order, categories own persistent accents,
   and Thought / Action / Ask are three distinct card types.
   ========================================================= */
if (document.getElementById("aquariumApp")) {
    const AQUARIUM_STORAGE_KEY = "brain-aquarium-celestial-color-v3";
    const AQUARIUM_KIND_DEFAULTS = [
        { id: "thought", name: "Thought", accent: "teal" },
        { id: "action", name: "Action", accent: "blue" },
        { id: "ask", name: "Ask", accent: "plum" }
    ];
    const AQUARIUM_KIND_ACCENTS = ["teal", "blue", "plum", "rose", "green", "orange"];
    const CATEGORY_ACCENT_SEQUENCE = ["teal", "plum", "rose", "blue", "green", "orange", "blue", "plum"];
    const AQUARIUM_SECTION_DEFAULTS = [
        { id: "surface", name: "Surface" },
        { id: "midwater", name: "Midwater" },
        { id: "deep", name: "Deep Water" }
    ];
    const nowStamp = () => new Date().toISOString();

    const aquariumDefaults = {
        nextAccentIndex: 8,
        kinds: AQUARIUM_KIND_DEFAULTS.map(kind => ({ ...kind })),
        sections: AQUARIUM_SECTION_DEFAULTS.map(section => ({ ...section })),
        categories: [
            { id: "todo", name: "To Do", accent: "teal", section: "surface" },
            { id: "home", name: "Home", accent: "plum", section: "surface" },
            { id: "family", name: "Family", accent: "rose", section: "surface" },
            { id: "work", name: "Work", accent: "blue", section: "midwater" },
            { id: "create", name: "Create / Play", accent: "green", section: "midwater" },
            { id: "learn", name: "Learn", accent: "orange", section: "midwater" },
            { id: "admin", name: "Life / Admin", accent: "blue", section: "deep" },
            { id: "someday", name: "Someday / Parking Lot", accent: "plum", section: "deep" }
        ],
        cards: [
            {
                id: crypto.randomUUID(),
                text: "An idea I want to remember without turning it into homework",
                zone: "inbox",
                kind: "thought",
                done: false,
                createdAt: nowStamp()
            },
            {
                id: crypto.randomUUID(),
                text: "Choose the few things that genuinely deserve attention today",
                zone: "inbox",
                kind: "action",
                done: false,
                createdAt: nowStamp()
            },
            {
                id: crypto.randomUUID(),
                text: "Something about this project I want to think through later",
                zone: "work",
                kind: "thought",
                done: false,
                createdAt: nowStamp()
            },
            {
                id: crypto.randomUUID(),
                text: "Tiny household thing that actually needs doing",
                zone: "home",
                kind: "action",
                done: false,
                createdAt: nowStamp()
            }
        ]
    };

    function cloneDefaults() {
        if (typeof structuredClone === "function") return structuredClone(aquariumDefaults);
        return JSON.parse(JSON.stringify(aquariumDefaults));
    }

    function normalizeAquariumState(state) {
        if (!state || typeof state !== "object") state = cloneDefaults();
        if (!Array.isArray(state.categories)) state.categories = [];
        if (!Array.isArray(state.cards)) state.cards = [];

        const suppliedKinds = Array.isArray(state.kinds) ? state.kinds : [];
        state.kinds = suppliedKinds
            .filter(kind => kind && typeof kind.id === "string" && kind.id.trim())
            .map((kind, index) => ({
                id: kind.id.trim(),
                name: typeof kind.name === "string" && kind.name.trim() ? kind.name.trim() : `Type ${index + 1}`,
                accent: AQUARIUM_KIND_ACCENTS.includes(kind.accent)
                    ? kind.accent
                    : AQUARIUM_KIND_ACCENTS[index % AQUARIUM_KIND_ACCENTS.length]
            }));
        if (!state.kinds.length) state.kinds = AQUARIUM_KIND_DEFAULTS.map(kind => ({ ...kind }));
        const validKindIds = new Set(state.kinds.map(kind => kind.id));

        /* V15 migration: the board now has three lightweight section bands.
           Existing categories are distributed without touching any card data. */
        const suppliedSections = Array.isArray(state.sections) ? state.sections : [];
        state.sections = AQUARIUM_SECTION_DEFAULTS.map(defaultSection => {
            const saved = suppliedSections.find(section => section && section.id === defaultSection.id);
            return {
                id: defaultSection.id,
                name: saved && typeof saved.name === "string" && saved.name.trim()
                    ? saved.name
                    : defaultSection.name
            };
        });
        const validSectionIds = new Set(state.sections.map(section => section.id));

        state.categories = state.categories
            .filter(category => category && typeof category.id === "string")
            .map((category, index) => {
                let section = validSectionIds.has(category.section) ? category.section : null;
                if (!section) {
                    if (index < 3) section = "surface";
                    else if (index < 6) section = "midwater";
                    else section = "deep";
                }
                return {
                    ...category,
                    name: typeof category.name === "string" && category.name.trim() ? category.name : "Untitled",
                    accent: CATEGORY_ACCENT_SEQUENCE.includes(category.accent)
                        ? category.accent
                        : CATEGORY_ACCENT_SEQUENCE[index % CATEGORY_ACCENT_SEQUENCE.length],
                    section
                };
            });

        if (!Number.isInteger(state.nextAccentIndex) || state.nextAccentIndex < 0) {
            state.nextAccentIndex = state.categories.length;
        }

        state.cards = state.cards
            .filter(card => card && typeof card.id === "string")
            .map(card => {
                const kind = validKindIds.has(card.kind) ? card.kind : state.kinds[0].id;
                const plain = typeof card.text === "string" ? card.text : "";
                const fallbackTitle = plain
                    .split(/\n+/)
                    .map(line => line.trim())
                    .find(Boolean) || "Untitled note";
                const title = typeof card.title === "string" && card.title.trim()
                    ? card.title.trim().replace(/\s+/g, " ").slice(0, 180)
                    : fallbackTitle.slice(0, 180);
                const html = typeof card.html === "string"
                    ? card.html
                    : plain
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/\n/g, "<br>");
                return {
                    ...card,
                    title,
                    text: plain,
                    html,
                    collapsed: card.collapsed !== false,
                    zone: card.zone === "priority"
                        ? "inbox"
                        : (typeof card.zone === "string" ? card.zone : "inbox"),
                    kind,
                    done: Boolean(card.done),
                    createdAt: typeof card.createdAt === "string" ? card.createdAt : null
                };
            });

        return state;
    }

    function loadAquariumState() {
        try {
            const saved = localStorage.getItem(AQUARIUM_STORAGE_KEY);
            if (saved) return normalizeAquariumState(JSON.parse(saved));
        } catch (error) {
            console.warn("Could not read Brain Aquarium data:", error);
        }
        return normalizeAquariumState(cloneDefaults());
    }

    let aquariumState = loadAquariumState();
    let captureKind = aquariumState.kinds.find(kind => kind.id === "thought")?.id || aquariumState.kinds[0]?.id || "thought";
    let activeFilter = "all";
    let draggedCategoryId = null;
    let draggedAquariumCardId = null;
    let tapMoveAquariumCardId = null;

    function setAquariumTapMove(cardId = null) {
        tapMoveAquariumCardId = cardId;
        document.body.classList.toggle("aq-card-move-mode", Boolean(cardId));
        document.querySelectorAll(".aq-card").forEach(card => {
            card.classList.toggle("move-source", card.dataset.cardId === cardId);
        });
    }

    /* Persist migration additions such as category accents without flashing save status. */
    localStorage.setItem(AQUARIUM_STORAGE_KEY, JSON.stringify(aquariumState));

    function saveAquariumState(show = true) {
        localStorage.setItem(AQUARIUM_STORAGE_KEY, JSON.stringify(aquariumState));
        if (show) showSaved();
    }

    function aquariumKindById(id) {
        return aquariumState.kinds.find(kind => kind.id === id) || aquariumState.kinds[0];
    }

    function aquariumKindName(id) {
        return aquariumKindById(id)?.name || "Type";
    }

    function aquariumKindSymbol(id) {
        if (id === "ask") return "?";
        if (id === "action") return "○";
        if (id === "thought") return "✦";
        const name = aquariumKindName(id).trim();
        return name ? name.charAt(0).toUpperCase() : "✦";
    }

    function aquariumPlainTextFromHtml(html) {
        const temp = document.createElement("div");
        temp.innerHTML = String(html || "");
        return temp.innerText.replace(/\u00a0/g, " ").trim();
    }

    function cleanAquariumTitle(value) {
        return String(value || "").replace(/\s+/g, " ").trim().slice(0, 180);
    }

    function populateAquariumKindUi() {
        const captureSelect = document.getElementById("aqCaptureKind");
        const filterSelect = document.getElementById("aqFilterSelect");
        const kindIds = new Set(aquariumState.kinds.map(kind => kind.id));
        if (!kindIds.has(captureKind)) captureKind = aquariumState.kinds[0]?.id || "thought";
        if (activeFilter !== "all" && !kindIds.has(activeFilter)) activeFilter = "all";

        if (captureSelect) {
            captureSelect.innerHTML = "";
            aquariumState.kinds.forEach(kind => {
                const option = document.createElement("option");
                option.value = kind.id;
                option.textContent = kind.name;
                captureSelect.appendChild(option);
            });
            captureSelect.value = captureKind;
        }

        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">All types</option>';
            aquariumState.kinds.forEach(kind => {
                const option = document.createElement("option");
                option.value = kind.id;
                option.textContent = kind.name;
                filterSelect.appendChild(option);
            });
            filterSelect.value = activeFilter;
        }
    }

    function cardMatchesFilter(card) {
        return activeFilter === "all" || card.kind === activeFilter;
    }

    function cardsForZone(zoneName) {
        return aquariumState.cards.filter(card => card.zone === zoneName && cardMatchesFilter(card));
    }

    function aquariumZoneLabel(zoneName) {
        if (zoneName === "inbox") return "Brain Dump Inbox";
        return aquariumState.categories.find(category => category.id === zoneName)?.name || zoneName || "Aquarium";
    }

    function makeEmptyMessage(text) {
        const element = document.createElement("div");
        element.className = "aq-empty";
        element.textContent = text;
        return element;
    }

    function formatAquariumDate(value) {
        if (!value) return "date unrecorded";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "date unrecorded";
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }


    function clearAquariumCardDropIndicators() {
        document.querySelectorAll(".aq-card-drop-before, .aq-card-drop-after")
            .forEach(card => card.classList.remove("aq-card-drop-before", "aq-card-drop-after"));
    }

    function moveAquariumCard(cardId, targetZone, targetCardId = null, placeAfter = false) {
        const sourceIndex = aquariumState.cards.findIndex(card => card.id === cardId);
        if (sourceIndex < 0) return;

        const [moved] = aquariumState.cards.splice(sourceIndex, 1);
        moved.zone = targetZone;

        if (targetCardId && targetCardId !== cardId) {
            let targetIndex = aquariumState.cards.findIndex(card => card.id === targetCardId);
            if (targetIndex >= 0) {
                if (placeAfter) targetIndex += 1;
                aquariumState.cards.splice(targetIndex, 0, moved);
            } else {
                aquariumState.cards.push(moved);
            }
        } else {
            let lastIndexInZone = -1;
            aquariumState.cards.forEach((card, index) => {
                if (card.zone === targetZone) lastIndexInZone = index;
            });

            if (lastIndexInZone >= 0) {
                aquariumState.cards.splice(lastIndexInZone + 1, 0, moved);
            } else {
                aquariumState.cards.push(moved);
            }
        }

        saveAquariumState();
        renderAquarium();
    }

    function makeAquariumCard(card) {
        const element = document.createElement("article");
        element.className = "aq-card" + (card.done ? " completed" : "") + (card.collapsed ? " collapsed" : "");
        element.dataset.cardId = card.id;
        element.dataset.kind = card.kind;
        element.dataset.kindAccent = aquariumKindById(card.kind)?.accent || "teal";

        const leading = document.createElement("div");
        leading.className = "aq-card-leading";

        const complete = document.createElement("input");
        complete.type = "checkbox";
        complete.className = "aq-type-complete";
        complete.checked = Boolean(card.done);
        complete.title = `Mark ${aquariumKindName(card.kind)} complete`;
        complete.setAttribute("aria-label", complete.title);
        complete.dataset.accent = aquariumKindById(card.kind)?.accent || "teal";
        complete.addEventListener("change", () => {
            card.done = complete.checked;
            saveAquariumState();
            renderAquarium();
        });
        leading.appendChild(complete);

        const main = document.createElement("div");
        main.className = "aq-card-main";
        const header = document.createElement("div");
        header.className = "aq-card-header";

        const drag = document.createElement("span");
        drag.className = "aq-card-drag";
        drag.textContent = "⋮⋮";
        drag.title = "Drag this card anywhere in the Aquarium";
        drag.draggable = true;

        const title = document.createElement("div");
        title.className = "aq-card-title";
        title.contentEditable = "true";
        title.spellcheck = true;
        title.textContent = cleanAquariumTitle(card.title) || "Untitled note";
        title.setAttribute("role", "textbox");
        title.setAttribute("aria-label", "Aquarium note title");
        title.addEventListener("keydown", event => {
            if (event.key === "Enter") { event.preventDefault(); title.blur(); }
        });
        title.addEventListener("input", () => {
            card.title = cleanAquariumTitle(title.innerText) || "Untitled note";
            saveAquariumState();
        });
        title.addEventListener("paste", event => {
            event.preventDefault();
            const value = cleanAquariumTitle(event.clipboardData?.getData("text/plain") || "");
            document.execCommand("insertText", false, value);
        });

        const kindSelect = document.createElement("select");
        kindSelect.className = "aq-kind-select";
        kindSelect.title = "Change card type";
        aquariumState.kinds.forEach(kind => {
            const option = document.createElement("option");
            option.value = kind.id;
            option.textContent = kind.name;
            kindSelect.appendChild(option);
        });
        kindSelect.value = card.kind;
        kindSelect.dataset.accent = aquariumKindById(card.kind)?.accent || "teal";
        kindSelect.addEventListener("click", event => event.stopPropagation());
        kindSelect.addEventListener("change", event => {
            event.stopPropagation();
            card.kind = kindSelect.value;
            card.done = false;
            saveAquariumState();
            renderAquarium();
        });

        const created = document.createElement("span");
        created.className = "aq-card-date";
        created.textContent = formatAquariumDate(card.createdAt);

        const archive = document.createElement("button");
        archive.className = "aq-card-archive archive-icon-button";
        archive.type = "button";
        archive.textContent = "↘";
        archive.title = "Archive card";
        archive.addEventListener("click", event => {
            event.stopPropagation();
            const archived = archiveManualItem({
                text: [card.title, card.text].filter(Boolean).join("\n\n"),
                source: "Brain Aquarium",
                context: aquariumZoneLabel(card.zone),
                kind: card.kind,
                createdAt: card.createdAt,
                metadata: { zone: card.zone, done: Boolean(card.done), bodyHtml: card.html || "" }
            });
            if (!archived) return;
            aquariumState.cards = aquariumState.cards.filter(item => item.id !== card.id);
            saveAquariumState(false);
            renderAquarium();
            showSaved();
        });

        const remove = document.createElement("button");
        remove.className = "aq-card-delete";
        remove.type = "button";
        remove.textContent = "×";
        remove.title = "Delete";
        remove.addEventListener("click", event => {
            event.stopPropagation();
            aquariumState.cards = aquariumState.cards.filter(item => item.id !== card.id);
            saveAquariumState();
            renderAquarium();
        });

        const collapse = document.createElement("button");
        collapse.className = "aq-card-collapse";
        collapse.type = "button";
        collapse.textContent = card.collapsed ? "▸" : "▾";
        collapse.title = card.collapsed ? "Expand note" : "Collapse note";
        collapse.setAttribute("aria-expanded", String(!card.collapsed));
        collapse.addEventListener("click", event => {
            event.stopPropagation();
            card.collapsed = !card.collapsed;
            saveAquariumState(false);
            renderAquarium();
            showSaved();
        });

        const selector = makeSelectionControl(selectionKey("aq-card", card.id), `Select this ${aquariumKindName(card.kind)}`);
        const meta = document.createElement("div");
        meta.className = "aq-card-meta";
        meta.append(kindSelect, created);
        const actions = document.createElement("div");
        actions.className = "aq-card-actions";
        actions.append(selector, archive, remove, collapse);
        header.append(drag, title, actions);

        const body = document.createElement("div");
        body.className = "aq-card-body";
        body.hidden = Boolean(card.collapsed);
        const text = document.createElement("div");
        text.className = "aq-card-text aq-card-rich-text";
        text.contentEditable = "true";
        text.spellcheck = true;
        text.innerHTML = card.html || "";
        text.dataset.placeholder = "Write the thought here…";
        text.addEventListener("input", () => {
            card.html = text.innerHTML;
            card.text = text.innerText.replace(/\u00a0/g, " ").trim();
            saveAquariumState();
        });
        body.appendChild(text);
        main.append(meta, header, body);

        drag.addEventListener("click", event => {
            if (!mobileComposerUsesNewlines()) return;
            event.preventDefault();
            event.stopPropagation();
            setAquariumTapMove(tapMoveAquariumCardId === card.id ? null : card.id);
        });

        drag.addEventListener("dragstart", event => {
            draggedAquariumCardId = card.id;
            event.dataTransfer.setData("text/plain", card.id);
            event.dataTransfer.setData("application/x-aquarium-card", card.id);
            event.dataTransfer.effectAllowed = "move";
            requestAnimationFrame(() => element.classList.add("dragging"));
        });
        drag.addEventListener("dragend", () => {
            draggedAquariumCardId = null;
            element.classList.remove("dragging");
            clearAquariumCardDropIndicators();
            document.querySelectorAll(".aq-drag-over").forEach(zone => zone.classList.remove("aq-drag-over"));
        });
        element.addEventListener("dragover", event => {
            if (!draggedAquariumCardId || draggedAquariumCardId === card.id || draggedCategoryId) return;
            event.preventDefault(); event.stopPropagation();
            const rect = element.getBoundingClientRect();
            const after = event.clientY > rect.top + (rect.height / 2);
            clearAquariumCardDropIndicators();
            element.classList.add(after ? "aq-card-drop-after" : "aq-card-drop-before");
        });
        element.addEventListener("dragleave", event => {
            if (!element.contains(event.relatedTarget)) element.classList.remove("aq-card-drop-before", "aq-card-drop-after");
        });
        element.addEventListener("drop", event => {
            if (!draggedAquariumCardId || draggedAquariumCardId === card.id || draggedCategoryId) return;
            event.preventDefault(); event.stopPropagation();
            const rect = element.getBoundingClientRect();
            const after = event.clientY > rect.top + (rect.height / 2);
            const sourceId = draggedAquariumCardId;
            clearAquariumCardDropIndicators();
            draggedAquariumCardId = null;
            moveAquariumCard(sourceId, card.zone, card.id, after);
        });

        element.addEventListener("click", event => {
            if (!tapMoveAquariumCardId || tapMoveAquariumCardId === card.id) return;
            if (event.target.closest("button, input, select, [contenteditable=\"true\"], .aq-card-drag")) return;
            event.preventDefault();
            event.stopPropagation();
            const sourceId = tapMoveAquariumCardId;
            setAquariumTapMove(null);
            moveAquariumCard(sourceId, card.zone, card.id, false);
        }, true);

        element.append(leading, main);
        return element;
    }

    function bindAquariumDropzone(zone) {
        if (!zone || zone.dataset.aqDropBound === "true") return;
        zone.dataset.aqDropBound = "true";

        zone.addEventListener("dragover", event => {
            if (draggedCategoryId || !draggedAquariumCardId) return;
            event.preventDefault();
            zone.classList.add("aq-drag-over");
            event.dataTransfer.dropEffect = "move";
        });

        zone.addEventListener("dragleave", event => {
            if (!zone.contains(event.relatedTarget)) {
                zone.classList.remove("aq-drag-over");
            }
        });

        zone.addEventListener("drop", event => {
            if (draggedCategoryId || !draggedAquariumCardId) return;
            if (event.target.closest(".aq-card")) return;

            event.preventDefault();
            zone.classList.remove("aq-drag-over");
            const sourceId = draggedAquariumCardId;
            draggedAquariumCardId = null;
            moveAquariumCard(sourceId, zone.dataset.zone);
        });

        zone.addEventListener("click", event => {
            if (!tapMoveAquariumCardId || event.target.closest(".aq-card, button, input, select, [contenteditable=\"true\"]")) return;
            event.preventDefault();
            event.stopPropagation();
            const sourceId = tapMoveAquariumCardId;
            setAquariumTapMove(null);
            moveAquariumCard(sourceId, zone.dataset.zone);
        }, true);
    }

    function renderAquariumZone(zone, zoneName, emptyText) {
        zone.innerHTML = "";
        const cards = cardsForZone(zoneName);

        if (!cards.length) {
            zone.appendChild(makeEmptyMessage(emptyText));
        } else {
            cards.forEach(card => zone.appendChild(makeAquariumCard(card)));
        }

        bindAquariumDropzone(zone);
    }

    function renderFixedAquariumZones() {
        renderAquariumZone(
            document.getElementById("inboxZone"),
            "inbox",
            activeFilter === "all"
                ? "Unsorted thoughts, actions, and asks land here."
                : "No matching items in the inbox."
        );
    }

    function moveAquariumCategory(categoryId, targetSectionId, targetCategoryId = null) {
        const sourceIndex = aquariumState.categories.findIndex(item => item.id === categoryId);
        if (sourceIndex < 0) return;
        if (!aquariumState.sections.some(section => section.id === targetSectionId)) return;

        const [moved] = aquariumState.categories.splice(sourceIndex, 1);
        moved.section = targetSectionId;

        if (targetCategoryId && targetCategoryId !== categoryId) {
            const targetIndex = aquariumState.categories.findIndex(item => item.id === targetCategoryId);
            if (targetIndex >= 0) aquariumState.categories.splice(targetIndex, 0, moved);
            else aquariumState.categories.push(moved);
        } else {
            let insertAt = aquariumState.categories.length;
            aquariumState.categories.forEach((item, index) => {
                if (item.section === targetSectionId) insertAt = index + 1;
            });
            aquariumState.categories.splice(insertAt, 0, moved);
        }

        saveAquariumState();
        renderAquarium();
    }

    function makeAquariumCategoryShell(category) {
        const shell = document.createElement("section");
        shell.className = "aq-category";
        shell.dataset.categoryId = category.id;
        shell.dataset.accent = category.accent;

        const head = document.createElement("div");
        head.className = "aq-category-head";

        const handle = document.createElement("span");
        handle.className = "aq-category-handle";
        handle.textContent = "⋮⋮";
        handle.title = "Drag category within or between sections";
        handle.draggable = true;

        handle.addEventListener("dragstart", event => {
            draggedCategoryId = category.id;
            shell.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/category", category.id);
        });

        handle.addEventListener("dragend", () => {
            draggedCategoryId = null;
            shell.classList.remove("dragging");
            document.querySelectorAll(".aq-category-grid").forEach(zone => zone.classList.remove("aq-category-drop-target"));
        });

        shell.addEventListener("dragover", event => {
            if (!draggedCategoryId) return;
            event.preventDefault();
            event.stopPropagation();
        });

        shell.addEventListener("drop", event => {
            if (!draggedCategoryId) return;
            event.preventDefault();
            event.stopPropagation();
            const sourceId = draggedCategoryId;
            draggedCategoryId = null;
            if (!sourceId || sourceId === category.id) return;
            moveAquariumCategory(sourceId, category.section, category.id);
        });

        const name = document.createElement("div");
        name.className = "aq-category-name";
        name.contentEditable = "true";
        name.spellcheck = false;
        name.textContent = category.name;
        name.addEventListener("input", () => {
            category.name = name.innerText.trim() || "Untitled";
            saveAquariumState();
        });

        const actions = document.createElement("div");
        actions.className = "aq-category-actions";

        const add = document.createElement("button");
        add.className = "aq-mini-button";
        add.textContent = "+";
        add.title = "Add blank thought";
        add.addEventListener("click", () => addBlankAquariumCard(category.id, aquariumState.kinds[0]?.id || "thought"));

        const remove = document.createElement("button");
        remove.className = "aq-mini-button";
        remove.textContent = "×";
        remove.title = "Delete category";
        remove.addEventListener("click", () => {
            aquariumState.cards.forEach(card => {
                if (card.zone === category.id) card.zone = "inbox";
            });
            aquariumState.categories = aquariumState.categories.filter(item => item.id !== category.id);
            saveAquariumState();
            renderAquarium();
        });

        actions.append(add, remove);
        head.append(handle, name, actions);

        const zone = document.createElement("div");
        zone.className = "aq-category-zone aq-dropzone";
        zone.dataset.zone = category.id;

        const cards = cardsForZone(category.id);
        if (!cards.length) {
            zone.appendChild(makeEmptyMessage(
                activeFilter === "all" ? "Drop something here." : "No matching items here."
            ));
        } else {
            cards.forEach(card => zone.appendChild(makeAquariumCard(card)));
        }

        bindAquariumDropzone(zone);
        shell.append(head, zone);
        return shell;
    }

    const AQUARIUM_COLLAPSED_SECTIONS_KEY = "brain-aquarium-collapsed-sections-v1";

    function readCollapsedAquariumSections() {
        try {
            const saved = JSON.parse(localStorage.getItem(AQUARIUM_COLLAPSED_SECTIONS_KEY) || "[]");
            return new Set(Array.isArray(saved) ? saved : []);
        } catch {
            return new Set();
        }
    }

    let collapsedAquariumSections = readCollapsedAquariumSections();

    function saveCollapsedAquariumSections() {
        localStorage.setItem(AQUARIUM_COLLAPSED_SECTIONS_KEY, JSON.stringify([...collapsedAquariumSections]));
        showSaved();
    }

    function renderAquariumCategories() {
        const board = document.getElementById("categoryGrid");
        board.innerHTML = "";

        aquariumState.sections.forEach(section => {
            const band = document.createElement("section");
            band.className = "aq-board-section";
            band.dataset.sectionId = section.id;

            const divider = document.createElement("div");
            divider.className = "aq-section-divider aq-section-collapse-bar";
            divider.tabIndex = 0;
            divider.setAttribute("role", "button");

            const collapsed = collapsedAquariumSections.has(section.id);
            band.classList.toggle("collapsed", collapsed);
            divider.setAttribute("aria-expanded", String(!collapsed));
            divider.title = collapsed ? "Expand this section" : "Collapse this section";

            const toggle = document.createElement("span");
            toggle.className = "aq-section-toggle";
            toggle.textContent = collapsed ? "▸" : "▾";
            toggle.setAttribute("aria-hidden", "true");

            const lineLeft = document.createElement("span");
            lineLeft.className = "aq-section-line";

            const label = document.createElement("div");
            label.className = "aq-section-label";
            label.contentEditable = "true";
            label.spellcheck = false;
            label.textContent = section.name;
            label.title = "Click to rename this section";
            label.addEventListener("click", event => event.stopPropagation());
            label.addEventListener("keydown", event => event.stopPropagation());
            label.addEventListener("input", () => {
                section.name = label.innerText.trim() || "Section";
                saveAquariumState();
            });

            const lineRight = document.createElement("span");
            lineRight.className = "aq-section-line";
            divider.append(toggle, lineLeft, label, lineRight);

            function toggleSection() {
                if (collapsedAquariumSections.has(section.id)) collapsedAquariumSections.delete(section.id);
                else collapsedAquariumSections.add(section.id);
                saveCollapsedAquariumSections();
                renderAquariumCategories();
            }

            divider.addEventListener("click", event => {
                if (event.target.closest(".aq-section-label")) return;
                toggleSection();
            });
            divider.addEventListener("keydown", event => {
                if (event.key !== "Enter" && event.key !== " ") return;
                if (event.target.closest(".aq-section-label")) return;
                event.preventDefault();
                toggleSection();
            });

            const grid = document.createElement("div");
            grid.className = "aq-category-grid";
            grid.dataset.sectionId = section.id;
            grid.hidden = collapsed;
            grid.setAttribute("aria-hidden", String(collapsed));

            grid.addEventListener("dragover", event => {
                if (!draggedCategoryId) return;
                event.preventDefault();
                grid.classList.add("aq-category-drop-target");
            });

            grid.addEventListener("dragleave", event => {
                if (!grid.contains(event.relatedTarget)) grid.classList.remove("aq-category-drop-target");
            });

            grid.addEventListener("drop", event => {
                if (!draggedCategoryId) return;
                if (event.target.closest(".aq-category") && !event.target.closest(".aq-new-category")) return;
                event.preventDefault();
                grid.classList.remove("aq-category-drop-target");
                const sourceId = draggedCategoryId;
                draggedCategoryId = null;
                moveAquariumCategory(sourceId, section.id);
            });

            const categories = aquariumState.categories.filter(category => category.section === section.id);
            categories.forEach(category => grid.appendChild(makeAquariumCategoryShell(category)));

            const addCategoryCard = document.createElement("section");
            addCategoryCard.className = "aq-category aq-new-category";
            addCategoryCard.textContent = "＋ New category";
            addCategoryCard.addEventListener("click", () => addAquariumCategory(section.id));
            grid.appendChild(addCategoryCard);

            band.append(divider, grid);
            board.appendChild(band);
        });
    }

    function renderAquarium() {
        renderFixedAquariumZones();
        renderAquariumCategories();
    }

    function addBlankAquariumCard(zone, kind = "thought") {
        const id = crypto.randomUUID();
        aquariumState.cards.push({
            id,
            title: "Untitled note",
            text: "",
            html: "",
            collapsed: false,
            zone,
            kind: aquariumState.kinds.some(item => item.id === kind) ? kind : (aquariumState.kinds[0]?.id || "thought"),
            done: false,
            createdAt: nowStamp()
        });
        saveAquariumState();
        renderAquarium();
        requestAnimationFrame(() => {
            const field = document.querySelector(`.aq-card[data-card-id="${id}"] .aq-card-title`);
            if (!field) return;
            field.focus();
            const range = document.createRange();
            range.selectNodeContents(field);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
    }

    function addAquariumCard(zone, titleValue, htmlValue, kind) {
        const html = String(htmlValue || "").trim();
        const plain = aquariumPlainTextFromHtml(html);
        const title = cleanAquariumTitle(titleValue) || cleanAquariumTitle(plain.split(/\n+/).find(Boolean)) || "Untitled note";
        if (!plain && !cleanAquariumTitle(titleValue)) return;
        aquariumState.cards.unshift({
            id: crypto.randomUUID(),
            title,
            text: plain,
            html,
            collapsed: true,
            zone,
            kind: aquariumState.kinds.some(item => item.id === kind) ? kind : (aquariumState.kinds[0]?.id || "thought"),
            done: false,
            createdAt: nowStamp()
        });
        saveAquariumState();
        renderAquarium();
    }

    function nextCategoryAccent() {
        const accent = CATEGORY_ACCENT_SEQUENCE[aquariumState.nextAccentIndex % CATEGORY_ACCENT_SEQUENCE.length];
        aquariumState.nextAccentIndex += 1;
        return accent;
    }

    function addAquariumCategory(sectionId = aquariumState.sections[0]?.id || "surface") {
        const id = "cat-" + crypto.randomUUID();
        aquariumState.categories.push({
            id,
            name: "New Category",
            accent: nextCategoryAccent(),
            section: aquariumState.sections.some(section => section.id === sectionId)
                ? sectionId
                : (aquariumState.sections[0]?.id || "surface")
        });
        saveAquariumState();
        renderAquarium();

        requestAnimationFrame(() => {
            const newCategory = document.querySelector(`.aq-category[data-category-id="${id}"] .aq-category-name`);
            if (!newCategory) return;

            newCategory.focus();
            const range = document.createRange();
            range.selectNodeContents(newCategory);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
    }

    function openAquariumCategoryManager() {
        const backdrop = document.createElement("div");
        backdrop.className = "category-manager-backdrop open";
        const card = document.createElement("div");
        card.className = "category-manager-card category-manager-aquarium";
        card.innerHTML = `
            <div class="category-manager-head"><div><strong>Aquarium categories</strong><span>Rename, recolor, move between depths, add, or remove.</span></div><button type="button" class="category-manager-close">×</button></div>
            <div class="category-manager-list"></div>
            <div class="category-manager-footer"><button type="button" class="small-button category-manager-add">+ category</button><button type="button" class="small-button category-manager-done">done</button></div>
        `;
        backdrop.appendChild(card);
        document.body.appendChild(backdrop);
        const list = card.querySelector(".category-manager-list");

        const repaint = () => {
            list.innerHTML = "";
            aquariumState.categories.forEach((category, index) => {
                const row = document.createElement("div");
                row.className = "category-manager-row aquarium-category-manager-row";

                const name = document.createElement("input");
                name.type = "text";
                name.value = category.name;
                name.setAttribute("aria-label", "Category name");
                name.addEventListener("change", () => {
                    category.name = name.value.trim() || "Untitled";
                    saveAquariumState(false);
                    renderAquarium();
                    showSaved();
                });

                const section = document.createElement("select");
                section.setAttribute("aria-label", "Aquarium section");
                aquariumState.sections.forEach(item => {
                    const option = document.createElement("option");
                    option.value = item.id;
                    option.textContent = item.name;
                    section.appendChild(option);
                });
                section.value = category.section;
                section.addEventListener("change", () => {
                    category.section = section.value;
                    saveAquariumState(false);
                    renderAquarium();
                    showSaved();
                });

                const accent = document.createElement("select");
                accent.setAttribute("aria-label", "Category color");
                [...new Set(CATEGORY_ACCENT_SEQUENCE)].forEach(value => {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = value;
                    accent.appendChild(option);
                });
                accent.value = category.accent;
                accent.addEventListener("change", () => {
                    category.accent = accent.value;
                    saveAquariumState(false);
                    renderAquarium();
                    showSaved();
                });

                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "category-manager-remove";
                remove.textContent = "×";
                remove.title = "Delete category";
                remove.addEventListener("click", () => {
                    aquariumState.cards.forEach(aquariumCard => {
                        if (aquariumCard.zone === category.id) aquariumCard.zone = "inbox";
                    });
                    aquariumState.categories.splice(index, 1);
                    saveAquariumState(false);
                    renderAquarium();
                    repaint();
                    showSaved();
                });

                row.append(name, section, accent, remove);
                list.appendChild(row);
            });
        };

        const close = () => backdrop.remove();
        card.querySelector(".category-manager-close").addEventListener("click", close);
        card.querySelector(".category-manager-done").addEventListener("click", close);
        backdrop.addEventListener("click", event => { if (event.target === backdrop) close(); });
        card.querySelector(".category-manager-add").addEventListener("click", () => {
            addAquariumCategory(aquariumState.sections[0]?.id || "surface");
            repaint();
        });
        repaint();
    }

    const captureSelect = document.getElementById("aqCaptureKind");
    const filterSelect = document.getElementById("aqFilterSelect");
    const captureTitle = document.getElementById("aqCaptureTitle");
    const captureInput = document.getElementById("captureInput");
    populateAquariumKindUi();

    captureSelect?.addEventListener("change", () => {
        captureKind = captureSelect.value;
        captureInput?.focus();
    });

    function saveAquariumComposer() {
        if (!captureInput) return;
        const title = captureTitle?.value || "";
        const html = captureInput.innerHTML;
        const plain = aquariumPlainTextFromHtml(html);
        if (!plain && !title.trim()) return;
        addAquariumCard("inbox", title, html, captureKind);
        if (captureTitle) captureTitle.value = "";
        captureInput.innerHTML = "";
        captureTitle?.focus();
    }

    document.getElementById("captureBtn")?.addEventListener("click", saveAquariumComposer);
    captureInput?.addEventListener("keydown", event => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            saveAquariumComposer();
        }
    });
    captureTitle?.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        captureInput?.focus();
    });
    filterSelect?.addEventListener("change", () => {
        activeFilter = filterSelect.value;
        renderAquarium();
    });

    function openAquariumKindManager() {
        const backdrop = document.createElement("div");
        backdrop.className = "category-manager-backdrop open";
        const card = document.createElement("div");
        card.className = "category-manager-card";
        card.innerHTML = `
            <div class="category-manager-head"><div><strong>Aquarium types</strong><span>Rename, recolor, add, or remove card types.</span></div><button type="button" class="category-manager-close">×</button></div>
            <div class="category-manager-list"></div>
            <div class="category-manager-footer"><button type="button" class="small-button category-manager-add">+ type</button><button type="button" class="small-button category-manager-done">done</button></div>
        `;
        backdrop.appendChild(card);
        document.body.appendChild(backdrop);
        const list = card.querySelector(".category-manager-list");

        const repaint = () => {
            list.innerHTML = "";
            aquariumState.kinds.forEach((kind, index) => {
                const row = document.createElement("div");
                row.className = "category-manager-row aquarium-kind-manager-row";
                const name = document.createElement("input");
                name.type = "text";
                name.value = kind.name;
                name.setAttribute("aria-label", "Type name");
                name.addEventListener("change", () => {
                    kind.name = name.value.trim() || "Untitled";
                    saveAquariumState(false);
                    populateAquariumKindUi(); renderAquarium(); showSaved();
                });
                const accent = document.createElement("select");
                accent.setAttribute("aria-label", "Type color");
                AQUARIUM_KIND_ACCENTS.forEach(value => {
                    const option = document.createElement("option");
                    option.value = value; option.textContent = value; accent.appendChild(option);
                });
                accent.value = kind.accent;
                accent.addEventListener("change", () => {
                    kind.accent = accent.value;
                    saveAquariumState(false); renderAquarium(); showSaved();
                });
                const remove = document.createElement("button");
                remove.type = "button"; remove.className = "category-manager-remove"; remove.textContent = "×";
                remove.disabled = aquariumState.kinds.length <= 1;
                remove.addEventListener("click", () => {
                    if (aquariumState.kinds.length <= 1) return;
                    const fallback = aquariumState.kinds.find(item => item.id !== kind.id)?.id;
                    aquariumState.cards.forEach(item => { if (item.kind === kind.id) item.kind = fallback; });
                    aquariumState.kinds.splice(index, 1);
                    saveAquariumState(false); populateAquariumKindUi(); renderAquarium(); repaint(); showSaved();
                });
                row.append(name, accent, remove);
                list.appendChild(row);
            });
        };
        const close = () => backdrop.remove();
        card.querySelector(".category-manager-close").addEventListener("click", close);
        card.querySelector(".category-manager-done").addEventListener("click", close);
        backdrop.addEventListener("click", event => { if (event.target === backdrop) close(); });
        card.querySelector(".category-manager-add").addEventListener("click", () => {
            const id = `kind-${crypto.randomUUID()}`;
            aquariumState.kinds.push({ id, name: "New Type", accent: AQUARIUM_KIND_ACCENTS[aquariumState.kinds.length % AQUARIUM_KIND_ACCENTS.length] });
            saveAquariumState(false); populateAquariumKindUi(); repaint(); showSaved();
        });
        repaint();
    }

    document.getElementById("manageAquariumKinds")?.addEventListener("click", openAquariumKindManager);

    document.getElementById("manageAquariumCategories")?.addEventListener("click", openAquariumCategoryManager);

    document.getElementById("archiveDone").addEventListener("click", () => {
        const completed = aquariumState.cards.filter(card => card.done);
        if (!completed.length) return;

        const records = readArchiveRecords();
        const archivedAt = new Date().toISOString();

        completed.forEach(card => {
            const cleaned = [card.title, card.text].filter(Boolean).join("\n\n").trim();
            if (!cleaned) return;
            records.unshift({
                id: archiveId("item"),
                recordType: "item",
                text: cleaned,
                source: "Brain Aquarium",
                context: aquariumZoneLabel(card.zone),
                kind: card.kind,
                originalDate: null,
                createdAt: card.createdAt || null,
                archivedAt,
                metadata: { zone: card.zone, done: true }
            });
        });

        saveArchiveRecords(records, false);
        aquariumState.cards = aquariumState.cards.filter(card => !card.done);
        saveAquariumState(false);
        renderAquarium();
        showSaved();
    });

    configureSelectionAction("archive selected", selected => {
        const chosen = aquariumState.cards.filter(card =>
            selected.has(selectionKey("aq-card", card.id))
        );
        if (!chosen.length) return false;

        const records = readArchiveRecords();
        const archivedAt = new Date().toISOString();
        const chosenIds = new Set(chosen.map(card => card.id));

        chosen.forEach(card => {
            const cleaned = [card.title, card.text].filter(Boolean).join("\n\n").trim();
            if (!cleaned) return;
            records.unshift({
                id: archiveId("item"),
                recordType: "item",
                text: cleaned,
                source: "Brain Aquarium",
                context: aquariumZoneLabel(card.zone),
                kind: card.kind,
                originalDate: null,
                createdAt: card.createdAt || null,
                archivedAt,
                metadata: { zone: card.zone, done: Boolean(card.done) }
            });
        });

        saveArchiveRecords(records, false);
        aquariumState.cards = aquariumState.cards.filter(card => !chosenIds.has(card.id));
        saveAquariumState(false);
        renderAquarium();
        showSaved();
        return true;
    });

    renderAquarium();
}

/* =========================================================
   ARCHIVE & PATTERNS PAGE
   Historical records live beside synthesis notes, timeline
   markers, and a lightweight strain journal.
   ========================================================= */
if (document.getElementById("patternsApp")) {
    const dayArchiveList = document.getElementById("dayArchiveList");
    const itemArchiveList = document.getElementById("itemArchiveList");
    const archiveSummary = document.getElementById("archiveSummary");
    const patternNotesList = document.getElementById("patternNotesList");
    const patternInput = document.getElementById("patternInput");
    const addPattern = document.getElementById("addPattern");
    const timelineMarkersList = document.getElementById("timelineMarkersList");
    const timelineMarkerInput = document.getElementById("timelineMarkerInput");
    const addTimelineMarker = document.getElementById("addTimelineMarker");
    const strainJournalList = document.getElementById("strainJournalList");
    const strainNameInput = document.getElementById("strainNameInput");
    const strainNotesInput = document.getElementById("strainNotesInput");
    const addStrainEntry = document.getElementById("addStrainEntry");

    [patternInput, timelineMarkerInput, strainNotesInput].forEach(bindSharedAutoGrowTextarea);

    function formatArchiveDate(value, includeYear = true) {
        if (!value) return "date unknown";
        const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? new Date(`${value}T12:00:00`)
            : new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en-US", {
            weekday: /^\d{4}-\d{2}-\d{2}$/.test(value) ? "short" : undefined,
            month: "short",
            day: "numeric",
            year: includeYear ? "numeric" : undefined
        });
    }

    function removeArchiveRecord(id) {
        const records = readArchiveRecords().filter(record => record.id !== id);
        saveArchiveRecords(records, false);
        renderArchivePage();
        showSaved();
    }

    function emptyArchiveMessage(text) {
        const empty = document.createElement("div");
        empty.className = "archive-empty";
        empty.textContent = text;
        return empty;
    }

    function renderArchivePage() {
        const records = readArchiveRecords();
        const days = records
            .filter(record => record.recordType === "day")
            .sort((a, b) => String(b.originalDate || "").localeCompare(String(a.originalDate || "")));
        const items = records
            .filter(record => record.recordType === "item")
            .sort((a, b) => String(b.archivedAt || "").localeCompare(String(a.archivedAt || "")));

        archiveSummary.textContent = `${days.length} day snapshot${days.length === 1 ? "" : "s"} · ${items.length} archived item${items.length === 1 ? "" : "s"}`;
        dayArchiveList.innerHTML = "";
        itemArchiveList.innerHTML = "";

        if (!days.length) {
            dayArchiveList.appendChild(emptyArchiveMessage("Past days will collect here as they fall off the four-week rail."));
        }

        days.forEach(record => {
            const card = document.createElement("article");
            card.className = "archive-card day-archive-card";

            const head = document.createElement("div");
            head.className = "archive-card-head";

            const title = document.createElement("div");
            title.className = "archive-card-title";
            title.textContent = record.displayLabel || formatArchiveDate(record.originalDate);

            const remove = document.createElement("button");
            remove.className = "archive-remove";
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Delete this archived day permanently";
            remove.addEventListener("click", () => {
                removeArchiveRecord(record.id);
            });

            const selector = makeSelectionControl(
                selectionKey("archive-day", record.id),
                "Select this archived day"
            );
            const headActions = document.createElement("div");
            headActions.className = "archive-head-actions";
            headActions.append(selector, remove);

            head.append(title, headActions);

            const list = document.createElement("div");
            list.className = "archived-day-items";
            (Array.isArray(record.items) ? record.items : []).forEach((item, itemIndex) => {
                const row = document.createElement("div");
                row.className = "archived-day-item" + (item.done ? " was-done" : "");

                const wrap = document.createElement("label");
                wrap.className = "check-wrap archive-day-check";
                const check = document.createElement("input");
                check.type = "checkbox";
                check.checked = Boolean(item.done);
                check.setAttribute("aria-label", `Mark archived item ${item.done ? "not done" : "done"}`);
                check.addEventListener("change", () => {
                    const recordsNow = readArchiveRecords();
                    const liveRecord = recordsNow.find(candidate => candidate.id === record.id);
                    if (!liveRecord || !Array.isArray(liveRecord.items) || !liveRecord.items[itemIndex]) return;
                    liveRecord.items[itemIndex].done = check.checked;
                    saveArchiveRecords(recordsNow, true);
                    row.classList.toggle("was-done", check.checked);
                });
                wrap.appendChild(check);

                const text = document.createElement("span");
                text.className = "archived-day-item-text";
                text.textContent = item.text;

                row.append(wrap, text);
                list.appendChild(row);
            });

            const foot = document.createElement("div");
            foot.className = "archive-card-meta";
            foot.textContent = `${(record.items || []).length} item${(record.items || []).length === 1 ? "" : "s"}`;

            card.append(head, list, foot);
            dayArchiveList.appendChild(card);
        });

        if (!items.length) {
            itemArchiveList.appendChild(emptyArchiveMessage("Use the ↘ archive control on Database Notes, Radar, calendar items, Aquarium cards, or Almanac entries."));
        }

        items.forEach(record => {
            const card = document.createElement("article");
            card.className = "archive-card item-archive-card";

            const head = document.createElement("div");
            head.className = "archive-card-head";

            const source = document.createElement("div");
            source.className = "archive-source";
            source.textContent = [record.source, record.context].filter(Boolean).join(" · ");

            const remove = document.createElement("button");
            remove.className = "archive-remove";
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Delete this archived item permanently";
            remove.addEventListener("click", () => {
                removeArchiveRecord(record.id);
            });

            const selector = makeSelectionControl(
                selectionKey("archive-item", record.id),
                "Select this archived item"
            );
            const headActions = document.createElement("div");
            headActions.className = "archive-head-actions";
            headActions.append(selector, remove);

            head.append(source, headActions);

            const text = document.createElement("div");
            text.className = "archive-item-text";
            text.textContent = record.text;

            const meta = document.createElement("div");
            meta.className = "archive-card-meta";
            const metaBits = [];
            if (record.kind) metaBits.push(record.kind);
            if (record.originalDate) metaBits.push(`from ${formatArchiveDate(record.originalDate)}`);
            metaBits.push(`archived ${formatArchiveDate(record.archivedAt)}`);
            meta.textContent = metaBits.join(" · ");

            card.append(head, text, meta);
            itemArchiveList.appendChild(card);
        });
    }

    function readStoredArray(key) {
        try {
            const saved = JSON.parse(localStorage.getItem(key));
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }

    function readPatternNotes() {
        return readStoredArray(PATTERN_NOTES_KEY);
    }

    let patternNotes = readPatternNotes();
    let draggedPatternId = null;

    function savePatternNotes(show = true) {
        localStorage.setItem(PATTERN_NOTES_KEY, JSON.stringify(patternNotes));
        if (show) showSaved();
    }

    function renderPatternNotes() {
        patternNotesList.innerHTML = "";

        if (!patternNotes.length) {
            patternNotesList.appendChild(emptyArchiveMessage("This column is intentionally yours to interpret. Add a theme when you start seeing one."));
        }

        patternNotes.forEach((note, index) => {
            const row = document.createElement("article");
            row.className = "pattern-note";
            row.dataset.id = note.id;

            const drag = document.createElement("span");
            drag.className = "pattern-drag";
            drag.textContent = "⋮⋮";
            drag.draggable = true;
            drag.title = "Drag to reorder";

            const text = document.createElement("div");
            text.className = "pattern-note-text";
            text.contentEditable = "true";
            text.spellcheck = true;
            text.textContent = note.text;
            text.addEventListener("input", () => {
                note.text = text.innerText;
                savePatternNotes();
            });

            const remove = document.createElement("button");
            remove.className = "archive-remove";
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Delete pattern note";
            remove.addEventListener("click", () => {
                patternNotes.splice(index, 1);
                savePatternNotes(false);
                renderPatternNotes();
                showSaved();
            });

            drag.addEventListener("dragstart", event => {
                draggedPatternId = note.id;
                row.classList.add("dragging");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", note.id);
            });

            drag.addEventListener("dragend", () => {
                draggedPatternId = null;
                row.classList.remove("dragging");
            });

            row.addEventListener("dragover", event => {
                if (!draggedPatternId) return;
                event.preventDefault();
            });

            row.addEventListener("drop", event => {
                if (!draggedPatternId || draggedPatternId === note.id) return;
                event.preventDefault();
                const from = patternNotes.findIndex(item => item.id === draggedPatternId);
                const to = patternNotes.findIndex(item => item.id === note.id);
                if (from < 0 || to < 0) return;
                const [moved] = patternNotes.splice(from, 1);
                patternNotes.splice(to, 0, moved);
                draggedPatternId = null;
                savePatternNotes(false);
                renderPatternNotes();
                showSaved();
            });

            const selector = makeSelectionControl(
                selectionKey("pattern-note", note.id),
                "Select this pattern note"
            );
            const noteActions = document.createElement("div");
            noteActions.className = "pattern-note-actions";
            noteActions.append(selector, remove);

            row.append(drag, text, noteActions);
            patternNotesList.appendChild(row);
        });
    }

    function addPatternNote() {
        const value = patternInput.value.trim();
        if (!value) return;
        patternNotes.push({ id: archiveId("pattern"), text: value, createdAt: new Date().toISOString() });
        patternInput.value = "";
        resizeSharedAutoGrowTextarea(patternInput);
        savePatternNotes(false);
        renderPatternNotes();
        showSaved();
    }

    addPattern.addEventListener("click", addPatternNote);
    patternInput.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        if (mobileComposerUsesNewlines() || event.shiftKey) return;

        event.preventDefault();
        addPatternNote();
    });

    /* ---------- TIMELINE MARKERS ---------- */
    function markerLocalDate(marker) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(marker?.date || "")) return marker.date;
        const created = marker?.createdAt ? new Date(marker.createdAt) : new Date();
        return Number.isNaN(created.getTime()) ? makeLocalIsoDate() : makeLocalIsoDate(created);
    }

    function normalizeTimelineMarkers(items) {
        return (Array.isArray(items) ? items : [])
            .filter(marker => marker && typeof marker.id === "string")
            .map(marker => ({
                ...marker,
                text: typeof marker.text === "string" ? marker.text : "",
                createdAt: typeof marker.createdAt === "string" ? marker.createdAt : new Date().toISOString(),
                date: markerLocalDate(marker)
            }));
    }

    let timelineMarkers = normalizeTimelineMarkers(readStoredArray(TIMELINE_MARKERS_KEY));

    function saveTimelineMarkers(show = true) {
        localStorage.setItem(TIMELINE_MARKERS_KEY, JSON.stringify(timelineMarkers));
        if (show) showSaved();
    }

    function renderTimelineMarkers() {
        timelineMarkersList.innerHTML = "";
        if (!timelineMarkers.length) {
            timelineMarkersList.appendChild(emptyArchiveMessage("Use this for the moments that make the timeline make sense later."));
            return;
        }

        const orderedMarkers = [...timelineMarkers].sort((a, b) => {
            const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
            if (dateCompare) return dateCompare;
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        });

        orderedMarkers.forEach(marker => {
            const index = timelineMarkers.findIndex(item => item.id === marker.id);
            const card = document.createElement("article");
            card.className = "tracker-card timeline-marker";

            const head = document.createElement("div");
            head.className = "tracker-card-head";
            const date = document.createElement("input");
            date.type = "date";
            date.className = "tracker-date tracker-date-input";
            date.value = marker.date || markerLocalDate(marker);
            date.title = "Timeline date";
            date.setAttribute("aria-label", "Timeline date");
            date.addEventListener("change", () => {
                if (!date.value) return;
                marker.date = date.value;
                saveTimelineMarkers(false);
                renderTimelineMarkers();
                showSaved();
            });

            const remove = document.createElement("button");
            remove.className = "archive-remove";
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Delete timeline marker";
            remove.addEventListener("click", () => {
                timelineMarkers.splice(index, 1);
                saveTimelineMarkers(false);
                renderTimelineMarkers();
                showSaved();
            });

            const selector = makeSelectionControl(
                selectionKey("timeline-marker", marker.id),
                "Select this timeline marker"
            );
            const actions = document.createElement("div");
            actions.className = "tracker-card-actions";
            actions.append(selector, remove);
            head.append(date, actions);

            const text = document.createElement("div");
            text.className = "tracker-card-text";
            text.contentEditable = "true";
            text.spellcheck = true;
            text.textContent = marker.text || "";
            text.addEventListener("input", () => {
                marker.text = text.innerText;
                saveTimelineMarkers();
            });

            card.append(head, text);
            timelineMarkersList.appendChild(card);
        });
    }

    function addTimelineMarkerEntry() {
        const value = timelineMarkerInput.value.trim();
        if (!value) return;
        timelineMarkers.unshift({
            id: archiveId("timeline"),
            text: value,
            createdAt: new Date().toISOString(),
            date: makeLocalIsoDate()
        });
        timelineMarkerInput.value = "";
        resizeSharedAutoGrowTextarea(timelineMarkerInput);
        saveTimelineMarkers(false);
        renderTimelineMarkers();
        showSaved();
    }

    addTimelineMarker.addEventListener("click", addTimelineMarkerEntry);
    timelineMarkerInput.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        if (mobileComposerUsesNewlines() || event.shiftKey) return;

        event.preventDefault();
        addTimelineMarkerEntry();
    });

    /* ---------- STRAIN JOURNAL ---------- */
    let strainJournal = readStoredArray(STRAIN_JOURNAL_KEY);

    function saveStrainJournal(show = true) {
        localStorage.setItem(STRAIN_JOURNAL_KEY, JSON.stringify(strainJournal));
        if (show) showSaved();
    }

    function renderStrainJournal() {
        strainJournalList.innerHTML = "";
        if (!strainJournal.length) {
            strainJournalList.appendChild(emptyArchiveMessage("A tiny breadcrumb trail is enough. Name it, note what it felt like, move on."));
            return;
        }

        strainJournal.forEach((entry, index) => {
            entry.expanded = Boolean(entry.expanded);
            const card = document.createElement("article");
            card.className = "tracker-card strain-entry-card" + (entry.expanded ? " expanded" : "");

            const head = document.createElement("div");
            head.className = "tracker-card-head";

            const titleWrap = document.createElement("div");
            titleWrap.className = "strain-title-wrap";
            const name = document.createElement("div");
            name.className = "strain-entry-name";
            name.contentEditable = "true";
            name.spellcheck = true;
            name.textContent = entry.name || "Unnamed strain";
            name.addEventListener("input", () => {
                entry.name = name.innerText.trim() || "Unnamed strain";
                saveStrainJournal();
            });

            const date = document.createElement("span");
            date.className = "tracker-date";
            date.textContent = formatArchiveDate(entry.createdAt);
            titleWrap.append(name, date);

            const remove = document.createElement("button");
            remove.className = "archive-remove";
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Delete strain entry";
            remove.addEventListener("click", () => {
                strainJournal.splice(index, 1);
                saveStrainJournal(false);
                renderStrainJournal();
                showSaved();
            });

            const collapse = document.createElement("button");
            collapse.className = "strain-collapse-toggle";
            collapse.type = "button";
            collapse.textContent = entry.expanded ? "▾" : "▸";
            collapse.title = entry.expanded ? "Collapse strain notes" : "Reveal strain notes";
            collapse.setAttribute("aria-expanded", String(entry.expanded));
            collapse.addEventListener("click", () => {
                entry.expanded = !entry.expanded;
                saveStrainJournal(false);
                renderStrainJournal();
                showSaved();
            });

            const selector = makeSelectionControl(
                selectionKey("strain-entry", entry.id),
                "Select this strain journal entry"
            );
            const actions = document.createElement("div");
            actions.className = "tracker-card-actions";
            actions.append(collapse, selector, remove);
            head.append(titleWrap, actions);

            const notes = document.createElement("div");
            notes.className = "tracker-card-text strain-entry-notes";
            notes.contentEditable = "true";
            notes.spellcheck = true;
            notes.textContent = entry.notes || "";
            notes.dataset.placeholder = "Add effects or context...";
            notes.hidden = !entry.expanded;
            notes.addEventListener("input", () => {
                entry.notes = notes.innerText;
                saveStrainJournal();
            });

            card.append(head, notes);
            strainJournalList.appendChild(card);
        });
    }

    function addStrainJournalEntry() {
        const name = strainNameInput.value.trim();
        const notes = strainNotesInput.value.trim();
        if (!name && !notes) return;

        strainJournal.unshift({
            id: archiveId("strain"),
            name: name || "Unnamed strain",
            notes,
            createdAt: new Date().toISOString()
        });
        strainNameInput.value = "";
        strainNotesInput.value = "";
        resizeSharedAutoGrowTextarea(strainNotesInput);
        saveStrainJournal(false);
        renderStrainJournal();
        showSaved();
        strainNameInput.focus();
    }

    addStrainEntry.addEventListener("click", addStrainJournalEntry);
    strainNameInput.addEventListener("keydown", event => {
        if (event.key !== "Enter" || mobileComposerUsesNewlines()) return;
        event.preventDefault();
        addStrainJournalEntry();
    });
    strainNotesInput.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        if (mobileComposerUsesNewlines() || event.shiftKey) return;

        event.preventDefault();
        addStrainJournalEntry();
    });

    window.addEventListener("storage", event => {
        if (event.key === ARCHIVE_STORAGE_KEY) renderArchivePage();
        if (event.key === PATTERN_NOTES_KEY) {
            patternNotes = readPatternNotes();
            renderPatternNotes();
        }
        if (event.key === TIMELINE_MARKERS_KEY) {
            timelineMarkers = normalizeTimelineMarkers(readStoredArray(TIMELINE_MARKERS_KEY));
            renderTimelineMarkers();
        }
        if (event.key === STRAIN_JOURNAL_KEY) {
            strainJournal = readStoredArray(STRAIN_JOURNAL_KEY);
            renderStrainJournal();
        }
    });

    configureSelectionAction("delete selected", selected => {
        const archiveIds = new Set();
        const patternIds = new Set();
        const timelineIds = new Set();
        const strainIds = new Set();

        selected.forEach(key => {
            const parts = String(key).split("::");
            if ((parts[0] === "archive-day" || parts[0] === "archive-item") && parts[1]) {
                archiveIds.add(parts[1]);
            } else if (parts[0] === "pattern-note" && parts[1]) {
                patternIds.add(parts[1]);
            } else if (parts[0] === "timeline-marker" && parts[1]) {
                timelineIds.add(parts[1]);
            } else if (parts[0] === "strain-entry" && parts[1]) {
                strainIds.add(parts[1]);
            }
        });

        const count = archiveIds.size + patternIds.size + timelineIds.size + strainIds.size;
        if (!count) return false;
        if (!window.confirm(`Permanently delete ${count} selected item${count === 1 ? "" : "s"}?`)) return false;

        if (archiveIds.size) {
            saveArchiveRecords(
                readArchiveRecords().filter(record => !archiveIds.has(record.id)),
                false
            );
        }

        if (patternIds.size) {
            patternNotes = patternNotes.filter(note => !patternIds.has(note.id));
            savePatternNotes(false);
        }

        if (timelineIds.size) {
            timelineMarkers = timelineMarkers.filter(marker => !timelineIds.has(marker.id));
            saveTimelineMarkers(false);
        }

        if (strainIds.size) {
            strainJournal = strainJournal.filter(entry => !strainIds.has(entry.id));
            saveStrainJournal(false);
        }

        renderArchivePage();
        renderPatternNotes();
        renderTimelineMarkers();
        renderStrainJournal();
        showSaved();
        return true;
    });

    renderArchivePage();
    renderPatternNotes();
    renderTimelineMarkers();
    renderStrainJournal();
}


/* =========================================================
   LONGFORM NOTES MODULE
   Clean writing-first page for larger blocks of text. Entries
   collapse to a three-line preview, expand for reading/editing,
   and can archive into the shared Archive & Patterns history.
   ========================================================= */
if (document.getElementById("longformApp")) {
    const LONGFORM_STORAGE_KEY = "pigeonhole-longform-v1";
    const LONGFORM_CATEGORY_KEY = "pigeonhole-longform-categories-v1";
    const LONGFORM_CATEGORY_DEFAULTS = [
        { id: "important", label: "Important", accent: "rose" },
        { id: "database", label: "Database", accent: "teal" },
        { id: "misc", label: "Misc.", accent: "plum" }
    ];
    const LONGFORM_CATEGORY_ACCENTS = ["rose", "teal", "plum", "blue", "green", "orange"];

    function readLongformCategories() {
        try {
            const saved = JSON.parse(localStorage.getItem(LONGFORM_CATEGORY_KEY) || "null");
            if (!Array.isArray(saved) || !saved.length) return LONGFORM_CATEGORY_DEFAULTS.map(item => ({ ...item }));
            const cleaned = saved
                .filter(item => item && typeof item.id === "string" && typeof item.label === "string")
                .map((item, index) => ({
                    id: item.id,
                    label: item.label.trim() || "Category",
                    accent: LONGFORM_CATEGORY_ACCENTS.includes(item.accent)
                        ? item.accent
                        : LONGFORM_CATEGORY_ACCENTS[index % LONGFORM_CATEGORY_ACCENTS.length]
                }));
            return cleaned.length ? cleaned : LONGFORM_CATEGORY_DEFAULTS.map(item => ({ ...item }));
        } catch {
            return LONGFORM_CATEGORY_DEFAULTS.map(item => ({ ...item }));
        }
    }

    let longformCategories = readLongformCategories();

    const longformList = document.getElementById("longformList");
    const longformInput = document.getElementById("longformInput");
    const longformCategory = document.getElementById("longformCategory");
    const longformDate = document.getElementById("longformDate");
    const longformImageUrl = document.getElementById("longformImageUrl");
    const longformLinkUrl = document.getElementById("longformLinkUrl");
    const saveLongformEntry = document.getElementById("saveLongformEntry");
    const longformFilters = document.getElementById("longformFilters");
    const manageLongformCategories = document.getElementById("manageLongformCategories");

    let activeLongformFilter = "all";
    const expandedLongformIds = new Set();


    function longformPlainTextToHtml(value) {
        const temp = document.createElement("div");
        temp.textContent = String(value || "");
        return temp.innerHTML.replace(/\n/g, "<br>");
    }

    function longformHtmlToPlain(value) {
        const temp = document.createElement("div");
        temp.innerHTML = String(value || "");
        return temp.innerText || temp.textContent || "";
    }

    /* Longform page/section labels are intentionally editable too.
       They use their own synced pigeonhole-* keys so personal wording
       follows the rest of the ecosystem between devices. */
    document.querySelectorAll("[data-longform-ui]").forEach(element => {
        const key = `pigeonhole-longform-ui-${element.dataset.longformUi}`;
        const saved = localStorage.getItem(key);
        if (saved !== null) element.innerHTML = saved;

        element.addEventListener("input", () => {
            localStorage.setItem(key, element.innerHTML);
            showSaved();
        });

        element.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            element.blur();
        });
    });

    function focusLongformEntry(entryId) {
        requestAnimationFrame(() => {
            const card = longformList.querySelector(`[data-entry-id="${entryId}"]`);
            const field = card?.querySelector(".longform-entry-text");
            if (!field) return;
            field.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(field);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        });
    }

    function longformId() {
        return (globalThis.crypto && typeof crypto.randomUUID === "function")
            ? `longform-${crypto.randomUUID()}`
            : `longform-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizeLongformState(value) {
        const state = value && typeof value === "object" ? value : {};
        const entries = Array.isArray(state.entries) ? state.entries : [];
        return {
            entries: entries
                .filter(entry => entry && typeof entry.id === "string")
                .map(entry => ({
                    id: entry.id,
                    text: typeof entry.text === "string"
                        ? entry.text
                        : longformHtmlToPlain(entry.html || ""),
                    html: typeof entry.html === "string"
                        ? entry.html
                        : longformPlainTextToHtml(typeof entry.text === "string" ? entry.text : ""),
                    category: longformCategories.some(item => item.id === entry.category) ? entry.category : (longformCategories[0]?.id || "misc"),
                    date: /^\d{4}-\d{2}-\d{2}$/.test(entry.date || "") ? entry.date : makeLocalIsoDate(),
                    done: Boolean(entry.done),
                    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
                    imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : "",
                    linkUrl: typeof entry.linkUrl === "string" ? entry.linkUrl : "",
                    pinned: Boolean(entry.pinned)
                }))
        };
    }

    function readLongformState() {
        try {
            const saved = JSON.parse(localStorage.getItem(LONGFORM_STORAGE_KEY));
            return normalizeLongformState(saved);
        } catch {
            return normalizeLongformState(null);
        }
    }

    let longformState = readLongformState();

    function saveLongformState(show = true) {
        localStorage.setItem(LONGFORM_STORAGE_KEY, JSON.stringify(longformState));
        if (show) showSaved();
    }

    function categoryLabel(categoryId) {
        return longformCategories.find(item => item.id === categoryId)?.label || "Category";
    }

    function makeCategorySelect(entry) {
        const select = document.createElement("select");
        select.className = "longform-card-category";
        longformCategories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.label;
            select.appendChild(option);
        });
        select.value = entry.category;
        select.addEventListener("change", () => {
            entry.category = select.value;
            saveLongformState(false);
            renderLongformEntries();
            showSaved();
        });
        return select;
    }

    function longformCategoryAccent(categoryId) {
        return longformCategories.find(item => item.id === categoryId)?.accent || "plum";
    }

    function saveLongformCategories(show = true) {
        localStorage.setItem(LONGFORM_CATEGORY_KEY, JSON.stringify(longformCategories));
        if (show) showSaved();
    }

    function populateLongformCategoryUi() {
        const selected = longformCategory.value;
        longformCategory.innerHTML = "";
        longformCategories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.label;
            longformCategory.appendChild(option);
        });
        longformCategory.value = longformCategories.some(item => item.id === selected)
            ? selected
            : (longformCategories[0]?.id || "");

        longformFilters.innerHTML = "";
        const all = document.createElement("option");
        all.value = "all";
        all.textContent = "All categories";
        longformFilters.appendChild(all);
        longformCategories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.label;
            longformFilters.appendChild(option);
        });
        longformFilters.value = longformCategories.some(item => item.id === activeLongformFilter)
            ? activeLongformFilter
            : "all";
    }

    function openLongformCategoryManager() {
        const backdrop = document.createElement("div");
        backdrop.className = "category-manager-backdrop open";
        const card = document.createElement("div");
        card.className = "category-manager-card";
        card.innerHTML = `
            <div class="category-manager-head"><div><strong>Longform categories</strong><span>Add, rename, recolor, or remove categories.</span></div><button type="button" class="category-manager-close">×</button></div>
            <div class="category-manager-list"></div>
            <div class="category-manager-footer"><button type="button" class="small-button category-manager-add">+ category</button><button type="button" class="small-button category-manager-done">done</button></div>
        `;
        backdrop.appendChild(card);
        document.body.appendChild(backdrop);
        const list = card.querySelector(".category-manager-list");

        const repaint = () => {
            list.innerHTML = "";
            longformCategories.forEach((category, index) => {
                const row = document.createElement("div");
                row.className = "category-manager-row";
                const name = document.createElement("input");
                name.type = "text";
                name.value = category.label;
                name.setAttribute("aria-label", "Category name");
                name.addEventListener("change", () => {
                    category.label = name.value.trim() || "Category";
                    saveLongformCategories(false);
                    populateLongformCategoryUi();
                    renderLongformEntries();
                    showSaved();
                });
                const accent = document.createElement("select");
                accent.setAttribute("aria-label", "Category color");
                LONGFORM_CATEGORY_ACCENTS.forEach(value => {
                    const option = document.createElement("option");
                    option.value = value; option.textContent = value; accent.appendChild(option);
                });
                accent.value = category.accent;
                accent.addEventListener("change", () => {
                    category.accent = accent.value;
                    saveLongformCategories(false);
                    renderLongformEntries();
                    showSaved();
                });
                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "category-manager-remove";
                remove.textContent = "×";
                remove.title = "Delete category";
                remove.disabled = longformCategories.length <= 1;
                remove.addEventListener("click", () => {
                    if (longformCategories.length <= 1) return;
                    const fallback = longformCategories.find(item => item.id !== category.id);
                    longformState.entries.forEach(entry => {
                        if (entry.category === category.id) entry.category = fallback.id;
                    });
                    if (activeLongformFilter === category.id) activeLongformFilter = "all";
                    longformCategories.splice(index, 1);
                    saveLongformCategories(false);
                    saveLongformState(false);
                    populateLongformCategoryUi();
                    renderLongformEntries();
                    repaint();
                    showSaved();
                });
                row.append(name, accent, remove);
                list.appendChild(row);
            });
        };

        const close = () => backdrop.remove();
        card.querySelector(".category-manager-close").addEventListener("click", close);
        card.querySelector(".category-manager-done").addEventListener("click", close);
        backdrop.addEventListener("click", event => { if (event.target === backdrop) close(); });
        card.querySelector(".category-manager-add").addEventListener("click", () => {
            const id = `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            longformCategories.push({
                id,
                label: "New category",
                accent: LONGFORM_CATEGORY_ACCENTS[longformCategories.length % LONGFORM_CATEGORY_ACCENTS.length]
            });
            saveLongformCategories(false);
            populateLongformCategoryUi();
            repaint();
            showSaved();
        });
        repaint();
    }

    function editLongformMedia(entry) {
        const image = window.prompt("Image URL (leave blank to clear):", entry.imageUrl || "");
        if (image === null) return;
        const link = window.prompt("Where should the image open when clicked? Leave blank for no click-through link:", entry.linkUrl || "");
        if (link === null) return;
        entry.imageUrl = image.trim();
        entry.linkUrl = link.trim();
        saveLongformState(false);
        renderLongformEntries();
        showSaved();
    }

    function renderLongformEntries() {
        longformList.innerHTML = "";
        const visible = longformState.entries
            .filter(entry => (
                activeLongformFilter === "all" || entry.category === activeLongformFilter
            ))
            .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

        if (!visible.length) {
            const empty = document.createElement("div");
            empty.className = "longform-empty";
            empty.innerHTML = activeLongformFilter === "all"
                ? "<strong>No saved thoughts yet.</strong><span>The first one will land here by title, ready to unfold when needed.</span>"
                : `<strong>No ${categoryLabel(activeLongformFilter).toLowerCase()} thoughts here.</strong><span>Nothing is being hidden except by your current filter.</span>`;
            longformList.appendChild(empty);
            return;
        }

        visible.forEach(entry => {
            const card = document.createElement("article");
            const expanded = expandedLongformIds.has(entry.id);
            card.className = `longform-entry${entry.done ? " done" : ""}${expanded ? " expanded" : ""}`;
            card.dataset.category = entry.category;
            card.dataset.accent = longformCategoryAccent(entry.category);
            card.dataset.entryId = entry.id;
            card.classList.toggle("pinned", Boolean(entry.pinned));

            const top = document.createElement("div");
            top.className = "longform-entry-top";

            const meta = document.createElement("div");
            meta.className = "longform-entry-meta";
            const category = makeCategorySelect(entry);

            const date = document.createElement("input");
            date.type = "date";
            date.className = "longform-card-date";
            date.value = entry.date;
            date.title = "Entry date";
            date.addEventListener("change", () => {
                if (!date.value) return;
                entry.date = date.value;
                saveLongformState();
            });
            meta.append(category, date);

            const actions = document.createElement("div");
            actions.className = "longform-entry-actions";

            const tools = document.createElement("details");
            tools.className = "longform-card-tools";

            const toolsSummary = document.createElement("summary");
            toolsSummary.textContent = "tools";
            toolsSummary.title = "Entry tools";
            toolsSummary.setAttribute("aria-label", "Open entry tools");

            const toolsPanel = document.createElement("div");
            toolsPanel.className = "longform-card-tool-panel";

            const pinButton = document.createElement("button");
            pinButton.type = "button";
            pinButton.className = "longform-tool-button longform-pin-button";
            pinButton.textContent = entry.pinned ? "📌 pinned to top" : "📌 pin to top";
            pinButton.title = entry.pinned ? "Unpin this thought" : "Pin this thought above unpinned notes";
            pinButton.setAttribute("aria-pressed", String(Boolean(entry.pinned)));
            pinButton.addEventListener("click", () => {
                entry.pinned = !entry.pinned;
                saveLongformState(false);
                renderLongformEntries();
                showSaved();
            });

            const doneButton = document.createElement("button");
            doneButton.type = "button";
            doneButton.className = "longform-tool-button";
            doneButton.textContent = entry.done ? "✓ strikethrough on" : "✓ strikethrough";
            doneButton.title = "Toggle strikethrough";
            doneButton.setAttribute("aria-pressed", String(entry.done));
            doneButton.addEventListener("click", () => {
                entry.done = !entry.done;
                saveLongformState(false);
                renderLongformEntries();
                showSaved();
            });

            const mediaEdit = document.createElement("button");
            mediaEdit.type = "button";
            mediaEdit.className = "longform-tool-button";
            mediaEdit.textContent = entry.imageUrl || entry.linkUrl ? "◎ edit image / link" : "◎ add image / link";
            mediaEdit.title = "Set image / clickable link";
            mediaEdit.addEventListener("click", () => editLongformMedia(entry));

            const archive = document.createElement("button");
            archive.type = "button";
            archive.className = "longform-tool-button";
            archive.textContent = "↘ archive";
            archive.title = "Archive into Archive & Patterns";
            archive.addEventListener("click", () => {
                const archived = archiveManualItem({
                    text: entry.text,
                    source: "Longform",
                    context: categoryLabel(entry.category),
                    originalDate: entry.date,
                    createdAt: entry.createdAt,
                    metadata: {
                        done: entry.done,
                        imageUrl: entry.imageUrl,
                        linkUrl: entry.linkUrl
                    }
                });
                if (!archived) return;
                longformState.entries = longformState.entries.filter(item => item.id !== entry.id);
                expandedLongformIds.delete(entry.id);
                saveLongformState(false);
                renderLongformEntries();
                showSaved();
            });

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "longform-tool-button longform-tool-delete";
            remove.textContent = "× delete";
            remove.title = "Delete entry";
            remove.addEventListener("click", () => {
                longformState.entries = longformState.entries.filter(item => item.id !== entry.id);
                expandedLongformIds.delete(entry.id);
                saveLongformState(false);
                renderLongformEntries();
                showSaved();
            });

            toolsPanel.append(pinButton, doneButton, mediaEdit, archive, remove);
            tools.append(toolsSummary, toolsPanel);

            const expand = document.createElement("button");
            expand.type = "button";
            expand.className = "longform-expand-button longform-collapse-toggle";
            expand.textContent = expanded ? "▴" : "▾";
            expand.title = expanded ? "Collapse this thought" : "Open full thought";
            expand.setAttribute("aria-expanded", String(expanded));
            expand.addEventListener("click", () => {
                if (expandedLongformIds.has(entry.id)) expandedLongformIds.delete(entry.id);
                else expandedLongformIds.add(entry.id);
                renderLongformEntries();
            });

            actions.append(tools, expand);
            top.append(meta, actions);

            const summary = document.createElement("button");
            summary.type = "button";
            summary.className = "longform-entry-summary";
            summary.textContent = String(entry.text || "").replace(/\s+/g, " ").trim() || "Untitled thought";
            summary.title = expanded
                ? "Click to place your cursor in this thought"
                : "Open and edit this thought";
            summary.addEventListener("click", () => {
                if (!expandedLongformIds.has(entry.id)) {
                    expandedLongformIds.add(entry.id);
                    renderLongformEntries();
                }
                focusLongformEntry(entry.id);
            });

            const body = document.createElement("div");
            body.className = `longform-entry-body${entry.imageUrl ? " has-media" : ""}`;

            if (entry.imageUrl) {
                const media = document.createElement(entry.linkUrl ? "a" : "div");
                media.className = "longform-entry-media";
                if (entry.linkUrl) {
                    media.href = entry.linkUrl;
                    media.target = "_blank";
                    media.rel = "noopener noreferrer";
                    media.title = "Open linked page";
                }
                const img = document.createElement("img");
                img.src = entry.imageUrl;
                img.alt = "Linked note image";
                img.loading = "lazy";
                img.addEventListener("error", () => {
                    media.classList.add("image-error");
                    img.remove();
                    media.textContent = "image unavailable";
                });
                media.appendChild(img);
                body.appendChild(media);
            }

            const text = document.createElement("div");
            text.className = "longform-entry-text expanded";
            text.contentEditable = "true";
            text.spellcheck = true;
            text.innerHTML = entry.html || longformPlainTextToHtml(entry.text);
            text.addEventListener("input", () => {
                entry.html = text.innerHTML;
                entry.text = text.innerText;
                summary.textContent = String(entry.text || "").replace(/\s+/g, " ").trim() || "Untitled thought";
                saveLongformState();
            });
            body.appendChild(text);

            if (entry.linkUrl && !entry.imageUrl) {
                const link = document.createElement("a");
                link.className = "longform-link-chip";
                link.href = entry.linkUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "↗ linked reference";
                body.appendChild(link);
            }

            card.append(top, summary, body);
            longformList.appendChild(card);
        });
    }

    function submitLongformEntry() {
        const text = longformInput.innerText.trim();
        const html = longformInput.innerHTML.trim();
        if (!text) {
            longformInput.focus();
            return;
        }

        longformState.entries.unshift({
            id: longformId(),
            text,
            html,
            category: longformCategories.some(item => item.id === longformCategory.value)
                ? longformCategory.value
                : (longformCategories[0]?.id || "misc"),
            date: longformDate.value || makeLocalIsoDate(),
            done: false,
            createdAt: new Date().toISOString(),
            imageUrl: longformImageUrl.value.trim(),
            linkUrl: longformLinkUrl.value.trim(),
            pinned: false
        });

        longformInput.innerHTML = "";
        longformImageUrl.value = "";
        longformLinkUrl.value = "";
        longformDate.value = makeLocalIsoDate();
        saveLongformState(false);
        renderLongformEntries();
        showSaved();
        longformInput.focus();
    }

    populateLongformCategoryUi();
    if (manageLongformCategories) manageLongformCategories.addEventListener("click", openLongformCategoryManager);
    longformDate.value = makeLocalIsoDate();
    saveLongformEntry.addEventListener("click", submitLongformEntry);
    longformInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            submitLongformEntry();
        }
    });

    longformFilters.addEventListener("change", () => {
        activeLongformFilter = longformFilters.value || "all";
        renderLongformEntries();
    });

    window.addEventListener("storage", event => {
        if (event.key === LONGFORM_CATEGORY_KEY) {
            longformCategories = readLongformCategories();
            if (!longformCategories.some(item => item.id === activeLongformFilter)) activeLongformFilter = "all";
            populateLongformCategoryUi();
            renderLongformEntries();
        }
    });

    saveLongformCategories(false);
    saveLongformState(false);
    renderLongformEntries();
}

/* =========================================================
   NEOPIAN FIELD NOTES MODULE — CANONICAL LAYOUT
   Uses Paige's latest three-column Field Notes page as the
   source of truth while layering in local editing + dragging.
   ========================================================= */
if (document.getElementById("neopetsApp")) {
    const NEO_STATE_KEY = "pigeonhole-neopets-field-notes-v3";
    const NEO_UI_PREFIX = "pigeonhole-neopets-ui-v3-";
    const NEO_ACCENTS = ["plum", "teal", "blue", "berry"];

    const neoId = prefix => {
        if (globalThis.crypto && typeof crypto.randomUUID === "function") return `${prefix}-${crypto.randomUUID()}`;
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    };

    const neoDefaults = {
        sections: [
            { id: "quick", name: "Quick Stops" },
            { id: "wandering", name: "Daily Wandering" },
            { id: "adventure", name: "Errands & Adventure" }
        ],
        links: [
            { id: "questlog", sectionId: "quick", label: "Quest Log", description: "check today's quests", icon: "✓", url: "https://www.neopets.com/questlog/", accent: "plum" },
            { id: "inventory", sectionId: "quick", label: "Inventory", description: "check your items", icon: "▦", url: "https://www.neopets.com/inventory.phtml", accent: "teal" },
            { id: "quickstock", sectionId: "quick", label: "Quick Stock", description: "sort your items", icon: "⇄", url: "https://www.neopets.com/quickstock.phtml", accent: "blue" },

            { id: "bank", sectionId: "wandering", label: "Bank", description: "collect interest", icon: "♜", url: "https://www.neopets.com/bank.phtml", accent: "blue" },
            { id: "trudy", sectionId: "wandering", label: "Trudy's Surprise", description: "spin for neopoints", icon: "✧", url: "https://www.neopets.com/trudys_surprise.phtml", accent: "berry" },
            { id: "shore", sectionId: "wandering", label: "Forgotten Shore", description: "check the shoreline", icon: "⚓", url: "https://www.neopets.com/pirates/forgottenshore.phtml", accent: "teal" },
            { id: "springs", sectionId: "wandering", label: "Healing Springs", description: "magical healthcare", icon: "❀", url: "https://www.neopets.com/faerieland/springs.phtml", accent: "plum" },

            { id: "stocks", sectionId: "adventure", label: "Stock Market", description: "bargain hunting", icon: "♦", url: "https://www.neopets.com/stockmarket.phtml?type=list&search=%&bargain=true", accent: "teal" },
            { id: "wizard", sectionId: "adventure", label: "Shop Wizard", description: "price the goods", icon: "✦", url: "https://www.neopets.com/shops/wizard.phtml", accent: "plum" },
            { id: "lab", sectionId: "adventure", label: "Secret Laboratory", description: "let science decide", icon: "⚡", url: "https://www.neopets.com/lab2.phtml", accent: "berry" },
            { id: "dome", sectionId: "adventure", label: "Battledome", description: "violence, but profitable", icon: "⚔", url: "https://www.neopets.com/dome/", accent: "blue" },
            { id: "training", sectionId: "adventure", label: "Training School", description: "check training", icon: "◈", url: "https://www.neopets.com/island/training.phtml?type=status", accent: "teal" },
            { id: "freebies", sectionId: "adventure", label: "Monthly Freebies", description: "collect the treats", icon: "♡", url: "https://www.neopets.com/freebies/index.phtml", accent: "plum" }
        ],
        dreamies: [
            { id: "dream-1", name: "Dream Pet", type: "species • color", image: "" },
            { id: "dream-2", name: "Dream Pet", type: "species • color", image: "" },
            { id: "dream-3", name: "Dream Pet", type: "species • color", image: "" }
        ],
        streaks: [
            { id: "streak-1", text: "Complete standard dailies.", done: false },
            { id: "streak-2", text: "Complete daily quests (20k per day).", done: false },
            { id: "streak-3", text: "Earn all 20 Battledome prizes to get Nerkmids.", done: false },
            { id: "streak-4", text: "Sell Nerkmids (~100k per day).", done: false }
        ],
        treasures: [
            { id: "treasure-1", text: "Item I'm hunting" },
            { id: "treasure-2", text: "Paint brush" },
            { id: "treasure-3", text: "Customization piece" },
            { id: "treasure-4", text: "Extremely unnecessary treasure" }
        ],
        references: [
            { id: "ref-dailies", label: "Full Dailies Index", detail: "thedailyneopets.com", icon: "☼", url: "https://thedailyneopets.com/dailies", accent: "teal" },
            { id: "ref-items", label: "Item Database", detail: "items.jellyneo.net", icon: "◇", url: "https://items.jellyneo.net/", accent: "blue" }
        ]
    };

    function cloneNeo(value) {
        return typeof structuredClone === "function"
            ? structuredClone(value)
            : JSON.parse(JSON.stringify(value));
    }

    function normalizeNeoState(saved) {
        if (!saved || typeof saved !== "object") return cloneNeo(neoDefaults);
        return {
            sections: Array.isArray(saved.sections) && saved.sections.length ? saved.sections : cloneNeo(neoDefaults.sections),
            links: Array.isArray(saved.links) ? saved.links.map((link, index) => ({
                ...link,
                icon: typeof link.icon === "string" ? link.icon : "✦",
                accent: NEO_ACCENTS.includes(link.accent) ? link.accent : NEO_ACCENTS[index % NEO_ACCENTS.length]
            })) : cloneNeo(neoDefaults.links),
            dreamies: Array.isArray(saved.dreamies) ? saved.dreamies.map(item => ({ ...item, image: item.image || "" })) : cloneNeo(neoDefaults.dreamies),
            streaks: Array.isArray(saved.streaks) ? saved.streaks : cloneNeo(neoDefaults.streaks),
            treasures: Array.isArray(saved.treasures) ? saved.treasures : cloneNeo(neoDefaults.treasures),
            references: Array.isArray(saved.references) ? saved.references.map((item, index) => ({
                ...item,
                label: typeof item.label === "string" ? item.label : "Reference",
                detail: typeof item.detail === "string" ? item.detail : "",
                icon: typeof item.icon === "string" ? item.icon : "◇",
                url: typeof item.url === "string" ? item.url : "#",
                accent: NEO_ACCENTS.includes(item.accent) ? item.accent : NEO_ACCENTS[index % NEO_ACCENTS.length]
            })) : cloneNeo(neoDefaults.references)
        };
    }

    function readNeoState() {
        try {
            const saved = JSON.parse(localStorage.getItem(NEO_STATE_KEY));
            if (saved) return normalizeNeoState(saved);
        } catch (error) {
            console.warn("Could not read Neopian Field Notes data:", error);
        }
        return cloneNeo(neoDefaults);
    }

    let neoState = readNeoState();
    let draggedNeoSectionId = null;
    let draggedNeoLinkId = null;
    let draggedNeoSide = null;
    let editingNeoLinkId = null;
    let creatingNeoLinkSectionId = null;
    let editingNeoReferenceId = null;

    function saveNeoState(show = true) {
        localStorage.setItem(NEO_STATE_KEY, JSON.stringify(neoState));
        if (show) showSaved();
    }

    document.querySelectorAll("[data-neo-ui]").forEach(element => {
        const key = NEO_UI_PREFIX + element.dataset.neoUi;
        const saved = localStorage.getItem(key);
        if (saved !== null) element.innerHTML = saved;
        element.addEventListener("input", () => {
            localStorage.setItem(key, element.innerHTML);
            showSaved();
        });
    });

    const neoLinkSections = document.getElementById("neoLinkSections");
    const dreamieList = document.getElementById("dreamieList");
    const streakList = document.getElementById("neoStreakList");
    const treasureList = document.getElementById("treasureList");
    const neoReferenceLinks = document.getElementById("neoReferenceLinks");
    const addNeoReference = document.getElementById("addNeoReference");

    const neoLinkEditorBackdrop = document.getElementById("neoLinkEditorBackdrop");
    const neoLinkEditorTitle = document.getElementById("neoLinkEditorTitle");
    const neoLinkLabelInput = document.getElementById("neoLinkLabelInput");
    const neoLinkDescriptionInput = document.getElementById("neoLinkDescriptionInput");
    const neoLinkIconInput = document.getElementById("neoLinkIconInput");
    const neoLinkUrlInput = document.getElementById("neoLinkUrlInput");
    const neoLinkSectionSelect = document.getElementById("neoLinkSectionSelect");
    const saveNeoLinkEdit = document.getElementById("saveNeoLinkEdit");
    const cancelNeoLinkEdit = document.getElementById("cancelNeoLinkEdit");

    const neoReferenceEditorBackdrop = document.getElementById("neoReferenceEditorBackdrop");
    const neoReferenceEditorTitle = document.getElementById("neoReferenceEditorTitle");
    const neoReferenceLabelInput = document.getElementById("neoReferenceLabelInput");
    const neoReferenceDetailInput = document.getElementById("neoReferenceDetailInput");
    const neoReferenceIconInput = document.getElementById("neoReferenceIconInput");
    const neoReferenceUrlInput = document.getElementById("neoReferenceUrlInput");
    const saveNeoReferenceEdit = document.getElementById("saveNeoReferenceEdit");
    const cancelNeoReferenceEdit = document.getElementById("cancelNeoReferenceEdit");

    function populateNeoSectionSelect(selectedId = null) {
        neoLinkSectionSelect.innerHTML = "";
        neoState.sections.forEach(section => {
            const option = document.createElement("option");
            option.value = section.id;
            option.textContent = section.name || "Untitled section";
            neoLinkSectionSelect.appendChild(option);
        });
        if (selectedId && neoState.sections.some(section => section.id === selectedId)) {
            neoLinkSectionSelect.value = selectedId;
        }
    }

    function openNeoLinkEditor(link = null, sectionId = null) {
        editingNeoLinkId = link?.id || null;
        creatingNeoLinkSectionId = sectionId || link?.sectionId || neoState.sections[0]?.id || null;
        neoLinkEditorTitle.textContent = link ? "Edit Neopets Link" : "Add Neopets Link";
        neoLinkLabelInput.value = link?.label || "";
        neoLinkDescriptionInput.value = link?.description || "";
        neoLinkIconInput.value = link?.icon || "✦";
        neoLinkUrlInput.value = link?.url || "";
        populateNeoSectionSelect(creatingNeoLinkSectionId);
        neoLinkEditorBackdrop.classList.add("open");
        neoLinkEditorBackdrop.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => neoLinkLabelInput.focus());
    }

    function closeNeoLinkEditor() {
        editingNeoLinkId = null;
        creatingNeoLinkSectionId = null;
        neoLinkEditorBackdrop.classList.remove("open");
        neoLinkEditorBackdrop.setAttribute("aria-hidden", "true");
    }

    function nextNeoAccent() {
        return NEO_ACCENTS[neoState.links.length % NEO_ACCENTS.length];
    }

    saveNeoLinkEdit.addEventListener("click", () => {
        const label = neoLinkLabelInput.value.trim();
        const description = neoLinkDescriptionInput.value.trim();
        const icon = neoLinkIconInput.value.trim() || "✦";
        const url = neoLinkUrlInput.value.trim();
        const sectionId = neoLinkSectionSelect.value || neoState.sections[0]?.id;
        if (!label || !sectionId) return;

        const existing = neoState.links.find(link => link.id === editingNeoLinkId);
        if (existing) {
            existing.label = label;
            existing.description = description;
            existing.icon = icon;
            existing.url = url || "#";
            existing.sectionId = sectionId;
        } else {
            neoState.links.push({
                id: neoId("neo-link"),
                sectionId,
                label,
                description,
                icon,
                url: url || "#",
                accent: nextNeoAccent()
            });
        }

        saveNeoState(false);
        renderNeoLinks();
        closeNeoLinkEditor();
        showSaved();
    });

    [neoLinkLabelInput, neoLinkDescriptionInput, neoLinkIconInput, neoLinkUrlInput].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            saveNeoLinkEdit.click();
        });
    });

    cancelNeoLinkEdit.addEventListener("click", closeNeoLinkEditor);
    neoLinkEditorBackdrop.addEventListener("click", event => {
        if (event.target === neoLinkEditorBackdrop) closeNeoLinkEditor();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && neoLinkEditorBackdrop.classList.contains("open")) closeNeoLinkEditor();
    });

    function moveNeoLink(linkId, targetSectionId, targetLinkId = null, after = false) {
        const from = neoState.links.findIndex(link => link.id === linkId);
        if (from < 0) return;
        const [moved] = neoState.links.splice(from, 1);
        moved.sectionId = targetSectionId;

        if (targetLinkId && targetLinkId !== linkId) {
            let to = neoState.links.findIndex(link => link.id === targetLinkId);
            if (to >= 0) {
                if (after) to += 1;
                neoState.links.splice(to, 0, moved);
            } else {
                neoState.links.push(moved);
            }
        } else {
            let last = -1;
            neoState.links.forEach((link, index) => {
                if (link.sectionId === targetSectionId) last = index;
            });
            neoState.links.splice(last + 1, 0, moved);
        }

        saveNeoState(false);
        renderNeoLinks();
        showSaved();
    }

    function makeNeoLinkCard(link) {
        const card = document.createElement("article");
        card.className = "neo-daily";
        card.dataset.linkId = link.id;
        card.dataset.accent = NEO_ACCENTS.includes(link.accent) ? link.accent : "plum";

        const drag = document.createElement("span");
        drag.className = "neo-daily-drag";
        drag.textContent = "⋮⋮";
        drag.draggable = true;
        drag.title = "Drag to reorder or move to another section";

        const anchor = document.createElement("a");
        anchor.className = "neo-daily-link";
        anchor.href = link.url || "#";
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        if (!link.url || link.url === "#") anchor.addEventListener("click", event => event.preventDefault());

        const icon = document.createElement("span");
        icon.className = "neo-daily-icon";
        icon.textContent = link.icon || "✦";

        const textWrap = document.createElement("span");
        textWrap.className = "neo-daily-text";
        const name = document.createElement("span");
        name.className = "neo-daily-name";
        name.textContent = link.label;
        const description = document.createElement("span");
        description.className = "neo-daily-description";
        description.textContent = link.description || "";
        textWrap.append(name, description);
        anchor.append(icon, textWrap);

        const actions = document.createElement("div");
        actions.className = "neo-daily-actions";
        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "✎";
        edit.title = "Edit link";
        edit.addEventListener("click", event => { event.stopPropagation(); openNeoLinkEditor(link); });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.title = "Remove link";
        remove.addEventListener("click", event => {
            event.stopPropagation();
            neoState.links = neoState.links.filter(item => item.id !== link.id);
            saveNeoState(false);
            renderNeoLinks();
            showSaved();
        });
        actions.append(edit, remove);

        drag.addEventListener("dragstart", event => {
            draggedNeoLinkId = link.id;
            card.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("application/x-neopets-link", link.id);
        });
        drag.addEventListener("dragend", () => {
            draggedNeoLinkId = null;
            card.classList.remove("dragging");
            document.querySelectorAll(".neo-link-drop-target").forEach(node => node.classList.remove("neo-link-drop-target"));
        });

        card.addEventListener("dragover", event => {
            if (!draggedNeoLinkId || draggedNeoSectionId) return;
            event.preventDefault();
            event.stopPropagation();
            card.classList.add("neo-link-drop-target");
        });
        card.addEventListener("dragleave", () => card.classList.remove("neo-link-drop-target"));
        card.addEventListener("drop", event => {
            if (!draggedNeoLinkId || draggedNeoSectionId) return;
            event.preventDefault();
            event.stopPropagation();
            const rect = card.getBoundingClientRect();
            const after = event.clientY > rect.top + rect.height / 2;
            const source = draggedNeoLinkId;
            draggedNeoLinkId = null;
            moveNeoLink(source, link.sectionId, link.id, after);
        });

        card.append(drag, anchor, actions);
        return card;
    }

    function renderNeoLinks() {
        neoLinkSections.innerHTML = "";

        neoState.sections.forEach((section, sectionIndex) => {
            const wrapper = document.createElement("section");
            wrapper.className = "neo-link-section";
            wrapper.dataset.sectionId = section.id;

            const head = document.createElement("div");
            head.className = "neo-link-section-head";

            const handle = document.createElement("span");
            handle.className = "neo-section-drag";
            handle.textContent = "⋮⋮";
            handle.draggable = true;
            handle.title = "Drag section";

            const title = document.createElement("h3");
            title.className = "neo-link-section-title";
            title.contentEditable = "true";
            title.spellcheck = false;
            title.textContent = section.name || "Untitled section";
            title.addEventListener("input", () => {
                section.name = title.innerText.trim() || "Untitled section";
                saveNeoState();
            });

            const sectionActions = document.createElement("div");
            sectionActions.className = "neo-section-actions";
            const add = document.createElement("button");
            add.type = "button";
            add.textContent = "+";
            add.title = "Add link to this section";
            add.addEventListener("click", () => openNeoLinkEditor(null, section.id));
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Remove section";
            remove.disabled = neoState.sections.length <= 1;
            remove.addEventListener("click", () => {
                if (neoState.sections.length <= 1) return;
                const fallback = neoState.sections.find(item => item.id !== section.id);
                neoState.links.forEach(link => {
                    if (link.sectionId === section.id) link.sectionId = fallback.id;
                });
                neoState.sections = neoState.sections.filter(item => item.id !== section.id);
                saveNeoState(false);
                renderNeoLinks();
                showSaved();
            });
            sectionActions.append(add, remove);
            head.append(handle, title, sectionActions);

            handle.addEventListener("dragstart", event => {
                draggedNeoSectionId = section.id;
                wrapper.classList.add("dragging");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/x-neopets-section", section.id);
            });
            handle.addEventListener("dragend", () => {
                draggedNeoSectionId = null;
                wrapper.classList.remove("dragging");
            });
            wrapper.addEventListener("dragover", event => {
                if (!draggedNeoSectionId) return;
                event.preventDefault();
            });
            wrapper.addEventListener("drop", event => {
                if (!draggedNeoSectionId || draggedNeoSectionId === section.id) return;
                event.preventDefault();
                const from = neoState.sections.findIndex(item => item.id === draggedNeoSectionId);
                const to = sectionIndex;
                if (from < 0 || to < 0) return;
                const [moved] = neoState.sections.splice(from, 1);
                neoState.sections.splice(to, 0, moved);
                draggedNeoSectionId = null;
                saveNeoState(false);
                renderNeoLinks();
                showSaved();
            });

            const grid = document.createElement("div");
            grid.className = "neo-daily-grid";
            grid.dataset.sectionId = section.id;
            const links = neoState.links.filter(link => link.sectionId === section.id);
            if (!links.length) {
                const empty = document.createElement("div");
                empty.className = "neo-links-empty";
                empty.textContent = "Drop a link here or tap +.";
                grid.appendChild(empty);
            } else {
                links.forEach(link => grid.appendChild(makeNeoLinkCard(link)));
            }

            grid.addEventListener("dragover", event => {
                if (!draggedNeoLinkId || draggedNeoSectionId) return;
                event.preventDefault();
                grid.classList.add("neo-link-drop-target");
            });
            grid.addEventListener("dragleave", event => {
                if (!grid.contains(event.relatedTarget)) grid.classList.remove("neo-link-drop-target");
            });
            grid.addEventListener("drop", event => {
                if (!draggedNeoLinkId || draggedNeoSectionId || event.target.closest(".neo-daily")) return;
                event.preventDefault();
                grid.classList.remove("neo-link-drop-target");
                const source = draggedNeoLinkId;
                draggedNeoLinkId = null;
                moveNeoLink(source, section.id);
            });

            wrapper.append(head, grid);
            neoLinkSections.appendChild(wrapper);
        });
    }

    function addNeoSection() {
        const section = { id: neoId("neo-section"), name: "New Section" };
        neoState.sections.push(section);
        saveNeoState(false);
        renderNeoLinks();
        showSaved();
        requestAnimationFrame(() => {
            const title = neoLinkSections.querySelector(`[data-section-id="${section.id}"] .neo-link-section-title`);
            if (!title) return;
            title.focus();
            const range = document.createRange();
            range.selectNodeContents(title);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
    }
    document.getElementById("addNeoSection").addEventListener("click", addNeoSection);


    function nextNeoReferenceAccent() {
        const sequence = ["teal", "blue", "plum", "berry"];
        return sequence[neoState.references.length % sequence.length];
    }

    function openNeoReferenceEditor(reference = null) {
        editingNeoReferenceId = reference?.id || null;
        neoReferenceEditorTitle.textContent = reference ? "Edit Reference Link" : "Add Reference Link";
        neoReferenceLabelInput.value = reference?.label || "";
        neoReferenceDetailInput.value = reference?.detail || "";
        neoReferenceIconInput.value = reference?.icon || "◇";
        neoReferenceUrlInput.value = reference?.url === "#" ? "" : (reference?.url || "");
        neoReferenceEditorBackdrop.classList.add("open");
        neoReferenceEditorBackdrop.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => neoReferenceLabelInput.focus());
    }

    function closeNeoReferenceEditor() {
        editingNeoReferenceId = null;
        neoReferenceEditorBackdrop.classList.remove("open");
        neoReferenceEditorBackdrop.setAttribute("aria-hidden", "true");
    }

    function renderNeoReferences() {
        if (!neoReferenceLinks) return;
        neoReferenceLinks.innerHTML = "";

        if (!neoState.references.length) {
            const empty = document.createElement("div");
            empty.className = "neo-reference-empty";
            empty.textContent = "Add a reference when you want a useful outside doorway here.";
            neoReferenceLinks.appendChild(empty);
            return;
        }

        neoState.references.forEach(reference => {
            const card = document.createElement("article");
            card.className = "neo-reference-card";
            card.dataset.accent = NEO_ACCENTS.includes(reference.accent) ? reference.accent : "teal";

            const anchor = document.createElement("a");
            anchor.className = "neo-reference-link";
            anchor.href = reference.url || "#";
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
            if (!reference.url || reference.url === "#") {
                anchor.addEventListener("click", event => event.preventDefault());
            }

            const title = document.createElement("strong");
            title.textContent = `${reference.icon || "◇"} ${reference.label || "Reference"}`;
            const detail = document.createElement("small");
            detail.textContent = reference.detail || "external link";
            anchor.append(title, detail);

            const actions = document.createElement("div");
            actions.className = "neo-reference-actions";

            const edit = document.createElement("button");
            edit.type = "button";
            edit.textContent = "✎";
            edit.title = "Edit reference";
            edit.addEventListener("click", () => openNeoReferenceEditor(reference));

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Remove reference";
            remove.addEventListener("click", () => {
                neoState.references = neoState.references.filter(item => item.id !== reference.id);
                saveNeoState(false);
                renderNeoReferences();
                showSaved();
            });

            actions.append(edit, remove);
            card.append(anchor, actions);
            neoReferenceLinks.appendChild(card);
        });
    }

    if (addNeoReference) addNeoReference.addEventListener("click", () => openNeoReferenceEditor());

    if (saveNeoReferenceEdit) {
        saveNeoReferenceEdit.addEventListener("click", () => {
            const label = neoReferenceLabelInput.value.trim();
            if (!label) return;

            const detail = neoReferenceDetailInput.value.trim();
            const icon = neoReferenceIconInput.value.trim() || "◇";
            const url = neoReferenceUrlInput.value.trim() || "#";
            const existing = neoState.references.find(item => item.id === editingNeoReferenceId);

            if (existing) {
                existing.label = label;
                existing.detail = detail;
                existing.icon = icon;
                existing.url = url;
            } else {
                neoState.references.push({
                    id: neoId("neo-ref"),
                    label,
                    detail,
                    icon,
                    url,
                    accent: nextNeoReferenceAccent()
                });
            }

            saveNeoState(false);
            renderNeoReferences();
            closeNeoReferenceEditor();
            showSaved();
        });
    }

    [neoReferenceLabelInput, neoReferenceDetailInput, neoReferenceIconInput, neoReferenceUrlInput]
        .filter(Boolean)
        .forEach(input => {
            input.addEventListener("keydown", event => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                saveNeoReferenceEdit?.click();
            });
        });

    cancelNeoReferenceEdit?.addEventListener("click", closeNeoReferenceEditor);
    neoReferenceEditorBackdrop?.addEventListener("click", event => {
        if (event.target === neoReferenceEditorBackdrop) closeNeoReferenceEditor();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && neoReferenceEditorBackdrop?.classList.contains("open")) {
            closeNeoReferenceEditor();
        }
    });

    function focusEditable(element) {
        if (!element) return;
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function bindSideDrag(row, kind, item, index, render) {
        const drag = row.querySelector(".neo-side-drag");
        drag.addEventListener("dragstart", event => {
            draggedNeoSide = { kind, id: item.id };
            row.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", item.id);
        });
        drag.addEventListener("dragend", () => {
            draggedNeoSide = null;
            row.classList.remove("dragging");
        });
        row.addEventListener("dragover", event => {
            if (!draggedNeoSide || draggedNeoSide.kind !== kind) return;
            event.preventDefault();
        });
        row.addEventListener("drop", event => {
            if (!draggedNeoSide || draggedNeoSide.kind !== kind || draggedNeoSide.id === item.id) return;
            event.preventDefault();
            const from = neoState[kind].findIndex(entry => entry.id === draggedNeoSide.id);
            if (from < 0) return;
            const [moved] = neoState[kind].splice(from, 1);
            neoState[kind].splice(index, 0, moved);
            draggedNeoSide = null;
            saveNeoState(false);
            render();
            showSaved();
        });
    }

    function renderDreamies() {
        dreamieList.innerHTML = "";
        neoState.dreamies.forEach((item, index) => {
            const row = document.createElement("article");
            row.className = "neo-dreamie";
            row.dataset.id = item.id;

            const image = document.createElement("div");
            image.className = "neo-dream-image";
            if (item.image) {
                const img = document.createElement("img");
                img.src = item.image;
                img.alt = item.name || "Dream pet";
                img.addEventListener("error", () => { img.remove(); image.textContent = "✦"; });
                image.appendChild(img);
            } else {
                image.textContent = ["✦", "☾", "✧"][index % 3];
            }

            const content = document.createElement("div");
            content.className = "neo-dream-content";
            const name = document.createElement("div");
            name.className = "neo-dream-name";
            name.contentEditable = "true";
            name.textContent = item.name || "Dream Pet";
            const type = document.createElement("div");
            type.className = "neo-dream-type";
            type.contentEditable = "true";
            type.textContent = item.type || "species • color";
            name.addEventListener("input", () => { item.name = name.innerText; saveNeoState(); });
            type.addEventListener("input", () => { item.type = type.innerText; saveNeoState(); });
            content.append(name, type);

            const controls = document.createElement("div");
            controls.className = "neo-side-controls";
            const drag = document.createElement("span");
            drag.className = "neo-side-drag";
            drag.textContent = "⋮⋮";
            drag.draggable = true;
            drag.title = "Drag to reorder";
            const imageEdit = document.createElement("button");
            imageEdit.type = "button";
            imageEdit.textContent = "◎";
            imageEdit.title = "Set or clear image URL";
            imageEdit.addEventListener("click", () => {
                const next = window.prompt("Dreamie image URL (leave blank to clear):", item.image || "");
                if (next === null) return;
                item.image = next.trim();
                saveNeoState(false);
                renderDreamies();
                showSaved();
            });
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Remove dreamie";
            remove.addEventListener("click", () => {
                neoState.dreamies.splice(index, 1);
                saveNeoState(false);
                renderDreamies();
                showSaved();
            });
            controls.append(drag, imageEdit, remove);
            row.append(image, content, controls);
            bindSideDrag(row, "dreamies", item, index, renderDreamies);
            dreamieList.appendChild(row);
        });
    }

    function renderStreaks() {
        streakList.innerHTML = "";
        neoState.streaks.forEach((item, index) => {
            const row = document.createElement("article");
            row.className = "neo-task" + (item.done ? " done" : "");
            row.dataset.id = item.id;

            const drag = document.createElement("span");
            drag.className = "neo-side-drag";
            drag.textContent = "⋮⋮";
            drag.draggable = true;
            drag.title = "Drag to reorder";
            const check = document.createElement("input");
            check.type = "checkbox";
            check.checked = Boolean(item.done);
            check.addEventListener("change", () => {
                item.done = check.checked;
                saveNeoState(false);
                renderStreaks();
                showSaved();
            });
            const text = document.createElement("div");
            text.className = "neo-task-text";
            text.contentEditable = "true";
            text.textContent = item.text || "New streak";
            text.addEventListener("input", () => { item.text = text.innerText; saveNeoState(); });
            const remove = document.createElement("button");
            remove.className = "neo-side-remove";
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Remove task";
            remove.addEventListener("click", () => {
                neoState.streaks.splice(index, 1);
                saveNeoState(false);
                renderStreaks();
                showSaved();
            });
            row.append(drag, check, text, remove);
            bindSideDrag(row, "streaks", item, index, renderStreaks);
            streakList.appendChild(row);
        });
    }

    function renderTreasures() {
        treasureList.innerHTML = "";
        neoState.treasures.forEach((item, index) => {
            const row = document.createElement("article");
            row.className = "neo-want";
            row.dataset.id = item.id;
            const drag = document.createElement("span");
            drag.className = "neo-side-drag";
            drag.textContent = "⋮⋮";
            drag.draggable = true;
            drag.title = "Drag to reorder";
            const icon = document.createElement("span");
            icon.className = "neo-want-icon";
            icon.textContent = "◇";
            const text = document.createElement("div");
            text.className = "neo-treasure-text";
            text.contentEditable = "true";
            text.textContent = item.text || "New treasure";
            text.addEventListener("input", () => { item.text = text.innerText; saveNeoState(); });
            const remove = document.createElement("button");
            remove.className = "neo-side-remove";
            remove.type = "button";
            remove.textContent = "×";
            remove.title = "Remove item";
            remove.addEventListener("click", () => {
                neoState.treasures.splice(index, 1);
                saveNeoState(false);
                renderTreasures();
                showSaved();
            });
            row.append(drag, icon, text, remove);
            bindSideDrag(row, "treasures", item, index, renderTreasures);
            treasureList.appendChild(row);
        });
    }

    document.getElementById("addDreamie").addEventListener("click", () => {
        const item = { id: neoId("dream"), name: "Dream Pet", type: "species • color", image: "" };
        neoState.dreamies.push(item);
        saveNeoState(false);
        renderDreamies();
        showSaved();
        requestAnimationFrame(() => focusEditable(dreamieList.querySelector(`[data-id="${item.id}"] .neo-dream-name`)));
    });

    document.getElementById("addNeoStreak").addEventListener("click", () => {
        const item = { id: neoId("streak"), text: "New streak", done: false };
        neoState.streaks.push(item);
        saveNeoState(false);
        renderStreaks();
        showSaved();
        requestAnimationFrame(() => focusEditable(streakList.querySelector(`[data-id="${item.id}"] .neo-task-text`)));
    });

    document.getElementById("addTreasure").addEventListener("click", () => {
        const item = { id: neoId("treasure"), text: "New treasure" };
        neoState.treasures.push(item);
        saveNeoState(false);
        renderTreasures();
        showSaved();
        requestAnimationFrame(() => focusEditable(treasureList.querySelector(`[data-id="${item.id}"] .neo-treasure-text`)));
    });

    renderNeoLinks();
    renderDreamies();
    renderStreaks();
    renderTreasures();
    renderNeoReferences();
    saveNeoState(false);
}
