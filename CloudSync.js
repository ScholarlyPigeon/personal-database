const SUPABASE_URL = "https://haydgzxjgwworgmmckwk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wL4Uye0U6WHtXiVQJ9buhQ_dRtLh8nk";

const cloudClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const CLOUD_TABLE = "database_state";

/*
    SAFE SYNC V2
    ---------------------------------------------------------
    The original cloud bridge replaced the entire cloud blob
    whenever one browser changed anything. That meant an older
    browser could overwrite newer keys written by another device.

    V2 keeps the existing Supabase table, but:
    - tracks the last successfully synced hash for every app key
    - fetches the newest cloud row before every write
    - merges only keys that actually changed locally
    - uses updated_at as an optimistic lock so concurrent saves retry
    - periodically checks for remote changes while the page is open
    - preserves a local copy if the same key changed differently on
      both devices before either saw the other's change
*/

const LOCAL_CHANGE_CHECK_MS = 1500;
const REMOTE_CHECK_MS = 10000;
const MAX_WRITE_ATTEMPTS = 4;

const SYNC_META_KEY = "personal-database-sync-meta-v2";
const SYNC_CONFLICT_KEY = "personal-database-sync-conflicts-v2";
const ABSENT_HASH = "__PDB_ABSENT__";

function isSyncedStorageKey(key) {
    if (!key) return false;

    const belongsToApp =
        key.startsWith("pigeonhole-") ||
        key.startsWith("brain-aquarium-");

    const isDemoShareData =
        key.startsWith("pigeonhole-share-");

    return belongsToApp && !isDemoShareData;
}

function isBackupStorageKey(key) {
    return Boolean(key) && (
        key.startsWith("pigeonhole-") ||
        key.startsWith("brain-aquarium-")
    );
}

function collectState(filter = isSyncedStorageKey) {
    const data = {};

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (filter(key)) {
            data[key] = localStorage.getItem(key);
        }
    }

    return data;
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function hashString(value) {
    const text = String(value);
    let hash = 2166136261;

    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return `v:${text.length}:${(hash >>> 0).toString(16)}`;
}

function valueHash(present, value) {
    return present ? hashString(value) : ABSENT_HASH;
}

function stateHashes(data) {
    const hashes = {};

    Object.entries(data).forEach(([key, value]) => {
        if (isSyncedStorageKey(key)) {
            hashes[key] = valueHash(true, value);
        }
    });

    return hashes;
}

function makeStateSnapshot(data) {
    return JSON.stringify(
        Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
    );
}

function readSyncMeta() {
    try {
        const parsed = JSON.parse(
            localStorage.getItem(SYNC_META_KEY) || "null"
        );

        if (
            parsed &&
            parsed.version === 2 &&
            parsed.hashes &&
            typeof parsed.hashes === "object"
        ) {
            return parsed;
        }
    } catch (error) {
        console.warn("Could not read sync metadata:", error);
    }

    return {
        version: 2,
        initialized: false,
        hashes: {},
        cloudUpdatedAt: null
    };
}

function writeSyncMeta(cloudData, cloudUpdatedAt) {
    const meta = {
        version: 2,
        initialized: true,
        hashes: stateHashes(cloudData),
        cloudUpdatedAt: cloudUpdatedAt || null,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem(
        SYNC_META_KEY,
        JSON.stringify(meta)
    );

    return meta;
}

function getConflictLog() {
    try {
        const parsed = JSON.parse(
            localStorage.getItem(SYNC_CONFLICT_KEY) || "[]"
        );

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function trimConflictValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value);
    const limit = 200000;

    if (text.length <= limit) {
        return text;
    }

    return (
        text.slice(0, limit) +
        "\n\n[Conflict value truncated because it exceeded 200,000 characters.]"
    );
}

function recordConflict(key, localPresent, localValue, remotePresent, remoteValue) {
    const conflicts = getConflictLog();

    conflicts.unshift({
        detectedAt: new Date().toISOString(),
        storageKey: key,
        localPresent,
        localValue: trimConflictValue(localValue),
        remotePresent,
        remoteValue: trimConflictValue(remoteValue)
    });

    localStorage.setItem(
        SYNC_CONFLICT_KEY,
        JSON.stringify(conflicts.slice(0, 12))
    );
}

function datedBackupFilename() {
    const date = new Date();

    const stamp = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");

    return `personal-database-backup-${stamp}.json`;
}

function downloadLocalBackup() {
    const backup = collectState(isBackupStorageKey);
    const conflicts = getConflictLog();

    /*
        Keep the backup format compatible with the Database's
        existing flat JSON backups. Recovery metadata uses keys
        outside the synced app prefixes, so an app-data restore
        can safely ignore them.
    */
    backup.__backup_created_at =
        new Date().toISOString();

    backup.__sync_conflicts_v2 =
        conflicts;

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = datedBackupFilename();
    anchor.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

function createLoginDialog() {
    let backdrop =
        document.getElementById("cloudLoginBackdrop");

    if (backdrop) {
        return backdrop;
    }

    backdrop = document.createElement("div");
    backdrop.id = "cloudLoginBackdrop";
    backdrop.className = "cloud-login-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    backdrop.innerHTML = `
        <form
            class="cloud-login-card"
            id="cloudLoginForm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cloudLoginTitle"
        >
            <div class="cloud-login-kicker">☁ PERSONAL DATABASE</div>
            <h2 id="cloudLoginTitle">Connect your cloud</h2>
            <p>Sign in with the Supabase user created for this Database.</p>

            <label for="cloudEmailInput">Email</label>
            <input
                id="cloudEmailInput"
                type="email"
                autocomplete="username"
                required
            >

            <label for="cloudPasswordInput">Password</label>
            <input
                id="cloudPasswordInput"
                type="password"
                autocomplete="current-password"
                required
            >

            <div
                class="cloud-login-error"
                id="cloudLoginError"
                aria-live="polite"
            ></div>

            <div class="cloud-login-actions">
                <button
                    type="button"
                    class="small-button"
                    id="cloudLoginCancel"
                >
                    cancel
                </button>

                <button
                    type="submit"
                    class="small-button cloud-login-submit"
                >
                    sign in
                </button>
            </div>
        </form>
    `;

    document.body.appendChild(backdrop);
    return backdrop;
}

document.addEventListener("DOMContentLoaded", async () => {
    const status =
        document.getElementById("saveStatus");

    const loginButton =
        document.getElementById("cloudLoginButton");

    const backupButton =
        document.getElementById("localBackupButton");

    let signedInUser = null;
    let syncBusy = false;
    let localChangeTimer = null;
    let remoteCheckTimer = null;
    let reloadQueued = false;
    let conflictNoticeShown = false;

    function setStatus(message, state = "") {
        if (!status) {
            return;
        }

        status.textContent = message;
        status.dataset.syncState = state;
    }

    function setConnectedUi(connected) {
        document.body.dataset.cloudSync =
            connected ? "connected" : "disconnected";

        if (loginButton) {
            loginButton.hidden = connected;
        }
    }

    function userIsActivelyEditing() {
        const element = document.activeElement;

        if (!element || element === document.body) {
            return false;
        }

        return Boolean(
            element.isContentEditable ||
            element.matches?.(
                'input:not([type="button"]):not([type="submit"]), textarea, select'
            )
        );
    }

    function requestSafeReload() {
        if (reloadQueued) {
            return;
        }

        reloadQueued = true;

        const tryReload = () => {
            if (!reloadQueued) {
                return;
            }

            if (!userIsActivelyEditing()) {
                reloadQueued = false;
                window.location.reload();
            }
        };

        setTimeout(tryReload, 250);

        document.addEventListener(
            "focusout",
            () => setTimeout(tryReload, 250),
            { once: true }
        );
    }

    function notifyConflict() {
        setStatus(
            "⚠ sync conflict backed up",
            "error"
        );

        if (conflictNoticeShown) {
            return;
        }

        conflictNoticeShown = true;

        window.setTimeout(() => {
            window.alert(
                "A cloud sync conflict was detected.\n\n" +
                "Both devices changed the same saved section before they saw each other's update. " +
                "The cloud copy was kept, and your displaced local copy was preserved in this browser's sync-conflict backup.\n\n" +
                "Use the Database Backup button if you want to save that recovery record."
            );
        }, 0);
    }

    async function fetchCloudRow() {
        return cloudClient
            .from(CLOUD_TABLE)
            .select("data, updated_at")
            .eq("user_id", signedInUser.id)
            .maybeSingle();
    }

    function filteredCloudData(rawData) {
        const cloudData = {};

        Object.entries(rawData || {}).forEach(([key, value]) => {
            if (!isSyncedStorageKey(key)) {
                return;
            }

            cloudData[key] =
                typeof value === "string"
                    ? value
                    : JSON.stringify(value);
        });

        return cloudData;
    }

    function replaceLocalState(cloudData) {
        const keysToRemove = [];

        for (
            let index = 0;
            index < localStorage.length;
            index += 1
        ) {
            const key = localStorage.key(index);

            if (isSyncedStorageKey(key)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        Object.entries(cloudData).forEach(([key, value]) => {
            if (isSyncedStorageKey(key)) {
                localStorage.setItem(key, value);
            }
        });
    }

    function applyRemoteValue(
        key,
        remotePresent,
        remoteValue,
        capturedLocalPresent,
        capturedLocalValue
    ) {
        const currentPresent =
            localStorage.getItem(key) !== null;

        const currentValue =
            currentPresent
                ? localStorage.getItem(key)
                : null;

        const capturedHash =
            valueHash(
                capturedLocalPresent,
                capturedLocalValue
            );

        const currentHash =
            valueHash(
                currentPresent,
                currentValue
            );

        /*
            If the user changed this exact key while a network
            request was in flight, preserve both versions instead
            of silently replacing their brand-new local edit.
        */
        if (currentHash !== capturedHash) {
            recordConflict(
                key,
                currentPresent,
                currentValue,
                remotePresent,
                remoteValue
            );

            notifyConflict();
            return false;
        }

        if (remotePresent) {
            localStorage.setItem(
                key,
                remoteValue
            );
        } else {
            localStorage.removeItem(key);
        }

        return true;
    }

    function hasLocalChangesAgainstMeta() {
        const meta = readSyncMeta();

        if (!meta.initialized) {
            return true;
        }

        const localData = collectState();

        const keys = new Set([
            ...Object.keys(localData),
            ...Object.keys(meta.hashes || {})
        ]);

        for (const key of keys) {
            const localPresent =
                hasOwn(localData, key);

            const localHash =
                valueHash(
                    localPresent,
                    localData[key]
                );

            const baseHash =
                hasOwn(meta.hashes || {}, key)
                    ? meta.hashes[key]
                    : ABSENT_HASH;

            if (localHash !== baseHash) {
                return true;
            }
        }

        return false;
    }

    async function createFirstCloudState(localData) {
        const nextUpdatedAt =
            new Date().toISOString();

        const { data, error } =
            await cloudClient
                .from(CLOUD_TABLE)
                .upsert(
                    {
                        user_id: signedInUser.id,
                        data: localData,
                        updated_at: nextUpdatedAt
                    },
                    {
                        onConflict: "user_id"
                    }
                )
                .select("data, updated_at")
                .maybeSingle();

        return {
            data,
            error
        };
    }

    async function writeMergedState(
        mergedData,
        expectedUpdatedAt
    ) {
        const nextUpdatedAt =
            new Date().toISOString();

        let query =
            cloudClient
                .from(CLOUD_TABLE)
                .update({
                    data: mergedData,
                    updated_at: nextUpdatedAt
                })
                .eq(
                    "user_id",
                    signedInUser.id
                );

        if (expectedUpdatedAt) {
            query =
                query.eq(
                    "updated_at",
                    expectedUpdatedAt
                );
        }

        const {
            data,
            error
        } =
            await query
                .select("data, updated_at")
                .maybeSingle();

        return {
            data,
            error
        };
    }

    async function initializeSafeSync() {
        setStatus(
            "☁ checking safely…",
            "checking"
        );

        const {
            data: cloudRow,
            error
        } = await fetchCloudRow();

        if (error) {
            console.error(
                "Cloud load failed:",
                error
            );

            setStatus(
                "☁ cloud unavailable",
                "error"
            );

            return false;
        }

        if (!cloudRow?.data) {
            const localData =
                collectState();

            const firstSave =
                await createFirstCloudState(
                    localData
                );

            if (firstSave.error) {
                console.error(
                    "Initial cloud save failed:",
                    firstSave.error
                );

                setStatus(
                    "☁ sync failed",
                    "error"
                );

                return false;
            }

            const savedData =
                filteredCloudData(
                    firstSave.data?.data ||
                    localData
                );

            writeSyncMeta(
                savedData,
                firstSave.data?.updated_at ||
                new Date().toISOString()
            );

            setStatus(
                "☁ synced safely ✓",
                "connected"
            );

            return true;
        }

        const cloudData =
            filteredCloudData(
                cloudRow.data
            );

        /*
            One-time V2 migration:
            the existing cloud state is the baseline. This mirrors
            the old fresh-device protection, but only happens once.
            From this point forward V2 performs key-by-key merges.
        */
        const localBefore =
            collectState();

        const changed =
            makeStateSnapshot(localBefore) !==
            makeStateSnapshot(cloudData);

        replaceLocalState(
            cloudData
        );

        writeSyncMeta(
            cloudData,
            cloudRow.updated_at
        );

        setStatus(
            "☁ safe sync ready ✓",
            "connected"
        );

        if (changed) {
            window.location.reload();
            return false;
        }

        return true;
    }

    async function syncOnce({
        remoteCheck = false
    } = {}) {
        if (
            !signedInUser ||
            syncBusy
        ) {
            return;
        }

        syncBusy = true;

        try {
            let meta =
                readSyncMeta();

            if (!meta.initialized) {
                const initialized =
                    await initializeSafeSync();

                if (!initialized) {
                    return;
                }

                meta =
                    readSyncMeta();
            }

            for (
                let attempt = 0;
                attempt < MAX_WRITE_ATTEMPTS;
                attempt += 1
            ) {
                const {
                    data: cloudRow,
                    error
                } = await fetchCloudRow();

                if (error) {
                    console.error(
                        "Cloud sync check failed:",
                        error
                    );

                    setStatus(
                        "☁ sync check failed",
                        "error"
                    );

                    return;
                }

                if (!cloudRow?.data) {
                    /*
                        Extremely unusual case: the row disappeared.
                        Re-create it from the local browser rather
                        than silently discarding local content.
                    */
                    const localData =
                        collectState();

                    const firstSave =
                        await createFirstCloudState(
                            localData
                        );

                    if (firstSave.error) {
                        setStatus(
                            "☁ sync failed",
                            "error"
                        );

                        return;
                    }

                    const savedData =
                        filteredCloudData(
                            firstSave.data?.data ||
                            localData
                        );

                    writeSyncMeta(
                        savedData,
                        firstSave.data?.updated_at
                    );

                    setStatus(
                        "☁ synced safely ✓",
                        "connected"
                    );

                    return;
                }

                const remoteData =
                    filteredCloudData(
                        cloudRow.data
                    );

                const localData =
                    collectState();

                const baseHashes =
                    meta.hashes || {};

                const allKeys =
                    new Set([
                        ...Object.keys(
                            localData
                        ),
                        ...Object.keys(
                            remoteData
                        ),
                        ...Object.keys(
                            baseHashes
                        )
                    ]);

                const mergedData = {
                    ...remoteData
                };

                const remoteActions = [];
                const conflicts = [];
                let cloudWriteNeeded = false;

                for (const key of allKeys) {
                    if (!isSyncedStorageKey(key)) {
                        continue;
                    }

                    const localPresent =
                        hasOwn(
                            localData,
                            key
                        );

                    const remotePresent =
                        hasOwn(
                            remoteData,
                            key
                        );

                    const localValue =
                        localPresent
                            ? localData[key]
                            : null;

                    const remoteValue =
                        remotePresent
                            ? remoteData[key]
                            : null;

                    const localHash =
                        valueHash(
                            localPresent,
                            localValue
                        );

                    const remoteHash =
                        valueHash(
                            remotePresent,
                            remoteValue
                        );

                    const baseHash =
                        hasOwn(
                            baseHashes,
                            key
                        )
                            ? baseHashes[key]
                            : ABSENT_HASH;

                    const localChanged =
                        localHash !==
                        baseHash;

                    const remoteChanged =
                        remoteHash !==
                        baseHash;

                    if (
                        localChanged &&
                        !remoteChanged
                    ) {
                        cloudWriteNeeded =
                            true;

                        if (localPresent) {
                            mergedData[key] =
                                localValue;
                        } else {
                            delete mergedData[key];
                        }

                        continue;
                    }

                    if (
                        !localChanged &&
                        remoteChanged
                    ) {
                        remoteActions.push({
                            key,
                            remotePresent,
                            remoteValue,
                            capturedLocalPresent:
                                localPresent,
                            capturedLocalValue:
                                localValue
                        });

                        continue;
                    }

                    if (
                        localChanged &&
                        remoteChanged
                    ) {
                        /*
                            Both devices changed this key. If they
                            independently arrived at the same value,
                            there is no conflict. Otherwise preserve
                            the local version before accepting the
                            already-saved cloud version.
                        */
                        if (
                            localHash ===
                            remoteHash
                        ) {
                            continue;
                        }

                        conflicts.push({
                            key,
                            localPresent,
                            localValue,
                            remotePresent,
                            remoteValue
                        });

                        remoteActions.push({
                            key,
                            remotePresent,
                            remoteValue,
                            capturedLocalPresent:
                                localPresent,
                            capturedLocalValue:
                                localValue
                        });
                    }
                }

                let finalCloudData =
                    remoteData;

                let finalUpdatedAt =
                    cloudRow.updated_at;

                if (cloudWriteNeeded) {
                    setStatus(
                        "☁ syncing safely…",
                        "syncing"
                    );

                    const writeResult =
                        await writeMergedState(
                            mergedData,
                            cloudRow.updated_at
                        );

                    if (writeResult.error) {
                        console.error(
                            "Cloud merge failed:",
                            writeResult.error
                        );

                        setStatus(
                            "☁ sync failed",
                            "error"
                        );

                        return;
                    }

                    /*
                        No row returned means updated_at changed after
                        our read: another device won the race. Retry
                        from the newest cloud copy instead of overwriting.
                    */
                    if (!writeResult.data) {
                        continue;
                    }

                    finalCloudData =
                        filteredCloudData(
                            writeResult.data.data
                        );

                    finalUpdatedAt =
                        writeResult.data.updated_at;
                }

                if (conflicts.length) {
                    conflicts.forEach(
                        conflict => {
                            recordConflict(
                                conflict.key,
                                conflict.localPresent,
                                conflict.localValue,
                                conflict.remotePresent,
                                conflict.remoteValue
                            );
                        }
                    );

                    notifyConflict();
                }

                let localUiChanged = false;

                remoteActions.forEach(
                    action => {
                        const applied =
                            applyRemoteValue(
                                action.key,
                                action.remotePresent,
                                action.remoteValue,
                                action.capturedLocalPresent,
                                action.capturedLocalValue
                            );

                        if (applied) {
                            localUiChanged =
                                true;
                        }
                    }
                );

                writeSyncMeta(
                    finalCloudData,
                    finalUpdatedAt
                );

                if (localUiChanged) {
                    if (!conflicts.length) {
                        setStatus(
                            "☁ updated safely ✓",
                            "connected"
                        );
                    }

                    requestSafeReload();
                    return;
                }

                if (!conflicts.length) {
                    setStatus(
                        remoteCheck
                            ? "☁ synced safely ✓"
                            : "☁ saved safely ✓",
                        "connected"
                    );
                }

                return;
            }

            /*
                If we lost several optimistic-lock races in a row,
                do not force a write. The next scheduled pass will
                try again from whatever is newest.
            */
            setStatus(
                "☁ retrying sync…",
                "checking"
            );
        } finally {
            syncBusy = false;
        }
    }

    function stopSyncLoops() {
        if (localChangeTimer) {
            clearInterval(
                localChangeTimer
            );

            localChangeTimer = null;
        }

        if (remoteCheckTimer) {
            clearInterval(
                remoteCheckTimer
            );

            remoteCheckTimer = null;
        }
    }

    function startSyncLoops() {
        stopSyncLoops();

        localChangeTimer =
            setInterval(
                () => {
                    if (
                        document.visibilityState !==
                        "visible"
                    ) {
                        return;
                    }

                    if (
                        hasLocalChangesAgainstMeta()
                    ) {
                        syncOnce({
                            remoteCheck: false
                        });
                    }
                },
                LOCAL_CHANGE_CHECK_MS
            );

        remoteCheckTimer =
            setInterval(
                () => {
                    if (
                        document.visibilityState !==
                        "visible"
                    ) {
                        return;
                    }

                    syncOnce({
                        remoteCheck: true
                    });
                },
                REMOTE_CHECK_MS
            );
    }

    async function signIn(
        email,
        password
    ) {
        setStatus(
            "☁ connecting…",
            "checking"
        );

        const {
            data,
            error
        } =
            await cloudClient
                .auth
                .signInWithPassword({
                    email,
                    password
                });

        if (error) {
            setStatus(
                "☁ sign-in failed",
                "error"
            );

            return {
                error
            };
        }

        signedInUser =
            data.user;

        setConnectedUi(
            true
        );

        /*
            If this browser has V2 sync metadata, treat a manual
            sign-in as a returning browser and merge normally.
            Only a genuinely fresh browser (no V2 metadata yet)
            uses the one-time cloud baseline migration.
        */
        const existingMeta =
            readSyncMeta();

        let initialized =
            true;

        if (!existingMeta.initialized) {
            initialized =
                await initializeSafeSync();
        } else {
            await syncOnce({
                remoteCheck: true
            });
        }

        if (initialized) {
            startSyncLoops();
        }

        return {
            error: null
        };
    }

    function openLoginDialog() {
        const backdrop =
            createLoginDialog();

        const form =
            backdrop.querySelector(
                "#cloudLoginForm"
            );

        const emailInput =
            backdrop.querySelector(
                "#cloudEmailInput"
            );

        const passwordInput =
            backdrop.querySelector(
                "#cloudPasswordInput"
            );

        const errorBox =
            backdrop.querySelector(
                "#cloudLoginError"
            );

        const cancel =
            backdrop.querySelector(
                "#cloudLoginCancel"
            );

        const submit =
            backdrop.querySelector(
                ".cloud-login-submit"
            );

        const close = () => {
            backdrop.classList.remove(
                "open"
            );

            backdrop.setAttribute(
                "aria-hidden",
                "true"
            );

            passwordInput.value = "";
            errorBox.textContent = "";
        };

        backdrop.classList.add(
            "open"
        );

        backdrop.setAttribute(
            "aria-hidden",
            "false"
        );

        setTimeout(
            () => emailInput.focus(),
            0
        );

        cancel.onclick =
            close;

        backdrop.onclick =
            event => {
                if (
                    event.target ===
                    backdrop
                ) {
                    close();
                }
            };

        form.onsubmit =
            async event => {
                event.preventDefault();

                errorBox.textContent =
                    "";

                submit.disabled =
                    true;

                submit.textContent =
                    "connecting…";

                const {
                    error
                } =
                    await signIn(
                        emailInput
                            .value
                            .trim(),
                        passwordInput
                            .value
                    );

                submit.disabled =
                    false;

                submit.textContent =
                    "sign in";

                if (error) {
                    errorBox.textContent =
                        error.message;

                    return;
                }

                close();
            };
    }

    if (backupButton) {
        backupButton.addEventListener(
            "click",
            downloadLocalBackup
        );
    }

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            openLoginDialog
        );
    }

    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                document.visibilityState ===
                "visible" &&
                signedInUser
            ) {
                syncOnce({
                    remoteCheck: true
                });
            }
        }
    );

    const {
        data: sessionData,
        error: sessionError
    } =
        await cloudClient
            .auth
            .getSession();

    if (sessionError) {
        console.error(
            "Could not restore cloud session:",
            sessionError
        );

        setConnectedUi(
            false
        );

        setStatus(
            "☁ cloud ready",
            "ready"
        );

        return;
    }

    if (
        sessionData
            .session
            ?.user
    ) {
        signedInUser =
            sessionData
                .session
                .user;

        setConnectedUi(
            true
        );

        const meta =
            readSyncMeta();

        let initialized = true;

        if (!meta.initialized) {
            initialized =
                await initializeSafeSync();
        } else {
            await syncOnce({
                remoteCheck: true
            });
        }

        if (initialized) {
            startSyncLoops();
        }
    } else {
        setConnectedUi(
            false
        );

        setStatus(
            "☁ cloud ready",
            "ready"
        );
    }

    window.PigeonholeCloud = {
        isConnected:
            () => Boolean(
                signedInUser
            ),

        backup:
            downloadLocalBackup,

        syncNow:
            () => syncOnce({
                remoteCheck: true
            }),

        conflicts:
            () => getConflictLog()
    };
});
