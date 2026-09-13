const SUPABASE_URL = "https://haydgzxjgwworgmmckwk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wL4Uye0U6WHtXiVQJ9buhQ_dRtLh8nk";

const cloudClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const CLOUD_TABLE = "database_state";
const AUTO_SAVE_INTERVAL_MS = 1500;

function isSyncedStorageKey(key) {
    if (!key) return false;

    const belongsToApp =
        key.startsWith("pigeonhole-") ||
        key.startsWith("brain-aquarium-");

    const isDemoShareData = key.startsWith("pigeonhole-share-");
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
        if (filter(key)) data[key] = localStorage.getItem(key);
    }

    return data;
}

function makeStateSnapshot(data) {
    return JSON.stringify(
        Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
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
    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = datedBackupFilename();
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createLoginDialog() {
    let backdrop = document.getElementById("cloudLoginBackdrop");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "cloudLoginBackdrop";
    backdrop.className = "cloud-login-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.innerHTML = `
        <form class="cloud-login-card" id="cloudLoginForm" role="dialog" aria-modal="true" aria-labelledby="cloudLoginTitle">
            <div class="cloud-login-kicker">☁ PERSONAL DATABASE</div>
            <h2 id="cloudLoginTitle">Connect your cloud</h2>
            <p>Sign in with the Supabase user created for this Database.</p>
            <label for="cloudEmailInput">Email</label>
            <input id="cloudEmailInput" type="email" autocomplete="username" required>
            <label for="cloudPasswordInput">Password</label>
            <input id="cloudPasswordInput" type="password" autocomplete="current-password" required>
            <div class="cloud-login-error" id="cloudLoginError" aria-live="polite"></div>
            <div class="cloud-login-actions">
                <button type="button" class="small-button" id="cloudLoginCancel">cancel</button>
                <button type="submit" class="small-button cloud-login-submit">sign in</button>
            </div>
        </form>
    `;

    document.body.appendChild(backdrop);
    return backdrop;
}

document.addEventListener("DOMContentLoaded", async () => {
    const status = document.getElementById("saveStatus");
    const loginButton = document.getElementById("cloudLoginButton");
    const backupButton = document.getElementById("localBackupButton");

    let signedInUser = null;
    let lastLocalSnapshot = makeStateSnapshot(collectState());
    let autoSaveTimer = null;
    let autoSaveBusy = false;
    let cloudLoadBusy = false;

    function setStatus(message, state = "") {
        if (status) {
            status.textContent = message;
            status.dataset.syncState = state;
        }
    }

    function setConnectedUi(connected) {
        document.body.dataset.cloudSync = connected ? "connected" : "disconnected";
        if (loginButton) loginButton.hidden = connected;
    }

    async function upsertState(data) {
        if (!signedInUser) return { error: new Error("Not signed in") };

        return cloudClient
            .from(CLOUD_TABLE)
            .upsert(
                {
                    user_id: signedInUser.id,
                    data,
                    updated_at: new Date().toISOString()
                },
                { onConflict: "user_id" }
            );
    }

    async function saveCurrentStateToCloud() {
        if (!signedInUser || autoSaveBusy || cloudLoadBusy) return;

        autoSaveBusy = true;
        const currentData = collectState();
        setStatus("☁ syncing…", "syncing");

        const { error } = await upsertState(currentData);
        autoSaveBusy = false;

        if (error) {
            console.error("Cloud sync failed:", error);
            setStatus("☁ sync failed", "error");
            return;
        }

        lastLocalSnapshot = makeStateSnapshot(currentData);
        setStatus("☁ synced ✓", "connected");
    }

    function stopAutomaticCloudSave() {
        if (!autoSaveTimer) return;
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
    }

    function startAutomaticCloudSave() {
        stopAutomaticCloudSave();
        lastLocalSnapshot = makeStateSnapshot(collectState());

        autoSaveTimer = setInterval(async () => {
            if (!signedInUser || autoSaveBusy || cloudLoadBusy) return;

            const currentData = collectState();
            const currentSnapshot = makeStateSnapshot(currentData);
            if (currentSnapshot === lastLocalSnapshot) return;

            await saveCurrentStateToCloud();
        }, AUTO_SAVE_INTERVAL_MS);
    }

    function replaceLocalState(cloudData) {
        const keysToRemove = [];

        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (isSyncedStorageKey(key)) keysToRemove.push(key);
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        Object.entries(cloudData).forEach(([key, value]) => {
            if (!isSyncedStorageKey(key)) return;
            localStorage.setItem(
                key,
                typeof value === "string" ? value : JSON.stringify(value)
            );
        });

        lastLocalSnapshot = makeStateSnapshot(collectState());
    }

    async function loadCloudState() {
        if (!signedInUser) return;

        cloudLoadBusy = true;
        stopAutomaticCloudSave();
        setStatus("☁ checking…", "checking");

        const { data: cloudRow, error } = await cloudClient
            .from(CLOUD_TABLE)
            .select("data, updated_at")
            .eq("user_id", signedInUser.id)
            .maybeSingle();

        if (error) {
            console.error("Cloud load failed:", error);
            cloudLoadBusy = false;
            setStatus("☁ cloud unavailable", "error");
            return;
        }

        if (!cloudRow?.data) {
            const firstState = collectState();
            const { error: firstSaveError } = await upsertState(firstState);
            cloudLoadBusy = false;

            if (firstSaveError) {
                console.error("Initial cloud save failed:", firstSaveError);
                setStatus("☁ sync failed", "error");
                return;
            }

            lastLocalSnapshot = makeStateSnapshot(firstState);
            setStatus("☁ synced ✓", "connected");
            startAutomaticCloudSave();
            return;
        }

        const cloudData = {};
        Object.entries(cloudRow.data).forEach(([key, value]) => {
            if (isSyncedStorageKey(key)) cloudData[key] = value;
        });

        const cloudSnapshot = makeStateSnapshot(cloudData);
        const localSnapshot = makeStateSnapshot(collectState());

        if (cloudSnapshot !== localSnapshot) {
            replaceLocalState(cloudData);
            cloudLoadBusy = false;
            setStatus("☁ updated ✓", "connected");
            window.location.reload();
            return;
        }

        lastLocalSnapshot = localSnapshot;
        cloudLoadBusy = false;
        setStatus("☁ synced ✓", "connected");
        startAutomaticCloudSave();
    }

    async function signIn(email, password) {
        setStatus("☁ connecting…", "checking");

        const { data, error } = await cloudClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setStatus("☁ sign-in failed", "error");
            return { error };
        }

        signedInUser = data.user;
        setConnectedUi(true);
        await loadCloudState();
        return { error: null };
    }

    function openLoginDialog() {
        const backdrop = createLoginDialog();
        const form = backdrop.querySelector("#cloudLoginForm");
        const emailInput = backdrop.querySelector("#cloudEmailInput");
        const passwordInput = backdrop.querySelector("#cloudPasswordInput");
        const errorBox = backdrop.querySelector("#cloudLoginError");
        const cancel = backdrop.querySelector("#cloudLoginCancel");
        const submit = backdrop.querySelector(".cloud-login-submit");

        const close = () => {
            backdrop.classList.remove("open");
            backdrop.setAttribute("aria-hidden", "true");
            passwordInput.value = "";
            errorBox.textContent = "";
        };

        backdrop.classList.add("open");
        backdrop.setAttribute("aria-hidden", "false");
        setTimeout(() => emailInput.focus(), 0);

        cancel.onclick = close;
        backdrop.onclick = event => {
            if (event.target === backdrop) close();
        };

        form.onsubmit = async event => {
            event.preventDefault();
            errorBox.textContent = "";
            submit.disabled = true;
            submit.textContent = "connecting…";

            const { error } = await signIn(
                emailInput.value.trim(),
                passwordInput.value
            );

            submit.disabled = false;
            submit.textContent = "sign in";

            if (error) {
                errorBox.textContent = error.message;
                return;
            }

            close();
        };
    }

    if (backupButton) {
        backupButton.addEventListener("click", downloadLocalBackup);
    }

    if (loginButton) {
        loginButton.addEventListener("click", openLoginDialog);
    }

    const { data: sessionData, error: sessionError } = await cloudClient.auth.getSession();

    if (sessionError) {
        console.error("Could not restore cloud session:", sessionError);
        setConnectedUi(false);
        setStatus("☁ cloud ready", "ready");
        return;
    }

    if (sessionData.session?.user) {
        signedInUser = sessionData.session.user;
        setConnectedUi(true);
        await loadCloudState();
    } else {
        setConnectedUi(false);
        setStatus("☁ cloud ready", "ready");
    }

    window.PigeonholeCloud = {
        isConnected: () => Boolean(signedInUser),
        backup: downloadLocalBackup
    };
});
