const SUPABASE_URL = "https://haydgzxjgwworgmmckwk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wL4Uye0U6WHtXiVQJ9buhQ_dRtLh8nk";

const cloudClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   DATABASE STORAGE HELPERS
   ========================================================= */

function isDatabaseStorageKey(key) {
    if (!key) return false;

    const isAppData =
        key.startsWith("pigeonhole-") ||
        key.startsWith("brain-aquarium-");

    const isDemoShareData =
        key.startsWith("pigeonhole-share-");

    return isAppData && !isDemoShareData;
}


function collectDatabaseState() {
    const data = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (isDatabaseStorageKey(key)) {
            data[key] = localStorage.getItem(key);
        }
    }

    return data;
}


function makeStateSnapshot(data) {
    return JSON.stringify(
        Object.entries(data)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    );
}


/* =========================================================
   PAGE SETUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const status =
        document.getElementById("saveStatus");

    const cloudLoginButton =
        document.getElementById("cloudLoginButton");

    const localBackupButton =
        document.getElementById("localBackupButton");

    const uploadCloudButton =
        document.getElementById("uploadCloudButton");

    const loadCloudButton =
        document.getElementById("loadCloudButton");


    let signedInUser = null;

    let lastLocalSnapshot =
        makeStateSnapshot(
            collectDatabaseState()
        );

    let autoSaveTimer = null;
    let autoSaveBusy = false;
    let cloudLoadBusy = false;


    function setCloudStatus(message) {
        if (status) {
            status.textContent = message;
        }
    }


    /* =========================================================
       AUTOMATIC CLOUD SAVE
       ========================================================= */

    async function saveCurrentStateToCloud() {
        if (
            !signedInUser ||
            autoSaveBusy ||
            cloudLoadBusy
        ) {
            return;
        }

        autoSaveBusy = true;

        const currentData =
            collectDatabaseState();

        setCloudStatus("syncing...");

        const { error } = await cloudClient
            .from("database_state")
            .upsert(
                {
                    user_id: signedInUser.id,
                    data: currentData,
                    updated_at:
                        new Date().toISOString()
                },
                {
                    onConflict: "user_id"
                }
            );

        autoSaveBusy = false;

        if (error) {
            console.error(
                "Cloud sync failed:",
                error
            );

            setCloudStatus(
                "cloud sync failed"
            );

            return;
        }

        lastLocalSnapshot =
            makeStateSnapshot(currentData);

        setCloudStatus(
            "saved to cloud ✓"
        );
    }


    function stopAutomaticCloudSave() {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
        }
    }


    function startAutomaticCloudSave() {
        stopAutomaticCloudSave();

        lastLocalSnapshot =
            makeStateSnapshot(
                collectDatabaseState()
            );

        autoSaveTimer = setInterval(
            async () => {

                if (
                    !signedInUser ||
                    autoSaveBusy ||
                    cloudLoadBusy
                ) {
                    return;
                }

                const currentData =
                    collectDatabaseState();

                const currentSnapshot =
                    makeStateSnapshot(
                        currentData
                    );

                if (
                    currentSnapshot ===
                    lastLocalSnapshot
                ) {
                    return;
                }

                await saveCurrentStateToCloud();

            },
            1500
        );
    }


    /* =========================================================
       REPLACE THIS BROWSER'S APP DATA
       ========================================================= */

    function replaceLocalDatabaseState(
        cloudData
    ) {
        const keysToRemove = [];

        for (
            let i = 0;
            i < localStorage.length;
            i++
        ) {
            const key =
                localStorage.key(i);

            if (
                isDatabaseStorageKey(key)
            ) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });


        for (
            const [key, value]
            of Object.entries(cloudData)
        ) {
            if (
                !isDatabaseStorageKey(key)
            ) {
                continue;
            }

            if (
                typeof value === "string"
            ) {
                localStorage.setItem(
                    key,
                    value
                );
            } else {
                localStorage.setItem(
                    key,
                    JSON.stringify(value)
                );
            }
        }

        lastLocalSnapshot =
            makeStateSnapshot(
                collectDatabaseState()
            );
    }


    /* =========================================================
       CLOUD-FIRST LOAD

       Before automatic saving starts, fetch the user's cloud
       state. If this browser differs from the cloud, the cloud
       copy wins and the page reloads.

       This prevents a fresh phone/browser from accidentally
       overwriting the real Database with starter/default data.
       ========================================================= */

    async function loadCloudState({
        askFirst = false
    } = {}) {

        if (!signedInUser) {
            return;
        }

        cloudLoadBusy = true;
        stopAutomaticCloudSave();

        setCloudStatus(
            "checking cloud..."
        );


        const {
            data: cloudRow,
            error
        } = await cloudClient
            .from("database_state")
            .select("data, updated_at")
            .eq(
                "user_id",
                signedInUser.id
            )
            .maybeSingle();


        if (error) {
            console.error(
                "Cloud load failed:",
                error
            );

            cloudLoadBusy = false;

            setCloudStatus(
                "cloud load failed"
            );

            return;
        }


        /* No cloud row yet.
           Local data may safely become the first cloud state. */
        if (
            !cloudRow ||
            !cloudRow.data
        ) {
            cloudLoadBusy = false;

            setCloudStatus(
                "cloud connected ✓"
            );

            startAutomaticCloudSave();

            return;
        }


        const cloudData = {};

        for (
            const [key, value]
            of Object.entries(
                cloudRow.data
            )
        ) {
            if (
                isDatabaseStorageKey(key)
            ) {
                cloudData[key] = value;
            }
        }


        const cloudSnapshot =
            makeStateSnapshot(
                cloudData
            );

        const localSnapshot =
            makeStateSnapshot(
                collectDatabaseState()
            );


        /* Browser already matches cloud. */
        if (
            cloudSnapshot ===
            localSnapshot
        ) {
            lastLocalSnapshot =
                localSnapshot;

            cloudLoadBusy = false;

            setCloudStatus(
                "cloud connected ✓"
            );

            startAutomaticCloudSave();

            return;
        }


        /* Manual restore button gets an extra confirmation.
           Automatic login/session restoration does not. */
        if (askFirst) {
            const confirmed =
                window.confirm(
                    "Load your cloud Database into this browser?\n\n" +
                    "This browser's current Database data will be " +
                    "replaced with the cloud copy."
                );

            if (!confirmed) {
                cloudLoadBusy = false;

                setCloudStatus(
                    "cloud load cancelled"
                );

                return;
            }
        }


        replaceLocalDatabaseState(
            cloudData
        );

        cloudLoadBusy = false;

        setCloudStatus(
            "cloud data loaded ✓"
        );

        window.location.reload();
    }


    /* =========================================================
       LOCAL BACKUP
       ========================================================= */

    if (localBackupButton) {
        localBackupButton.addEventListener(
            "click",
            () => {

                const backup = {};

                for (
                    let i = 0;
                    i < localStorage.length;
                    i++
                ) {
                    const key =
                        localStorage.key(i);

                    if (
                        key &&
                        (
                            key.startsWith(
                                "pigeonhole-"
                            ) ||
                            key.startsWith(
                                "brain-aquarium-"
                            )
                        )
                    ) {
                        backup[key] =
                            localStorage
                                .getItem(key);
                    }
                }


                const blob = new Blob(
                    [
                        JSON.stringify(
                            backup,
                            null,
                            2
                        )
                    ],
                    {
                        type:
                            "application/json"
                    }
                );


                const url =
                    URL.createObjectURL(
                        blob
                    );

                const a =
                    document.createElement(
                        "a"
                    );

                a.href = url;

                a.download =
                    "personal-database-backup.json";

                a.click();


                setTimeout(() => {
                    URL.revokeObjectURL(
                        url
                    );
                }, 1000);
            }
        );
    }


    /* =========================================================
       MANUAL BACKUP FILE → CLOUD
       Emergency / migration tool.
       ========================================================= */

    if (uploadCloudButton) {
        uploadCloudButton
            .addEventListener(
                "click",
                async () => {

                    if (!signedInUser) {
                        alert(
                            "Please sign in to the cloud first."
                        );

                        return;
                    }


                    const fileInput =
                        document.createElement(
                            "input"
                        );

                    fileInput.type =
                        "file";

                    fileInput.accept =
                        ".json,application/json";


                    fileInput
                        .addEventListener(
                            "change",
                            async () => {

                                const file =
                                    fileInput
                                        .files?.[0];

                                if (!file) {
                                    return;
                                }


                                try {
                                    const rawBackup =
                                        JSON.parse(
                                            await file
                                                .text()
                                        );


                                    const cloudData =
                                        {};

                                    for (
                                        const [
                                            key,
                                            value
                                        ]
                                        of Object.entries(
                                            rawBackup
                                        )
                                    ) {
                                        if (
                                            isDatabaseStorageKey(
                                                key
                                            )
                                        ) {
                                            cloudData[key] =
                                                value;
                                        }
                                    }


                                    const {
                                        error
                                    } =
                                        await cloudClient
                                            .from(
                                                "database_state"
                                            )
                                            .upsert(
                                                {
                                                    user_id:
                                                        signedInUser.id,

                                                    data:
                                                        cloudData,

                                                    updated_at:
                                                        new Date()
                                                            .toISOString()
                                                },
                                                {
                                                    onConflict:
                                                        "user_id"
                                                }
                                            );


                                    if (error) {
                                        alert(
                                            "Cloud upload failed: " +
                                            error.message
                                        );

                                        return;
                                    }


                                    setCloudStatus(
                                        "cloud upload complete ✓"
                                    );


                                    alert(
                                        "Cloud upload succeeded! Saved " +
                                        Object.keys(
                                            cloudData
                                        ).length +
                                        " app keys."
                                    );

                                } catch (error) {
                                    alert(
                                        "Could not read backup: " +
                                        error.message
                                    );
                                }
                            }
                        );


                    fileInput.click();
                }
            );
    }


    /* =========================================================
       MANUAL CLOUD RESTORE
       ========================================================= */

    if (loadCloudButton) {
        loadCloudButton.addEventListener(
            "click",
            async () => {

                if (!signedInUser) {
                    alert(
                        "Please sign in to the cloud first."
                    );

                    return;
                }

                await loadCloudState({
                    askFirst: true
                });
            }
        );
    }


    /* =========================================================
       LOGIN
       Cloud state loads BEFORE automatic saving begins.
       ========================================================= */

    if (cloudLoginButton) {
        cloudLoginButton
            .addEventListener(
                "click",
                async () => {

                    const email =
                        window.prompt(
                            "Database email:"
                        );

                    if (!email) {
                        return;
                    }


                    const password =
                        window.prompt(
                            "Database password:"
                        );

                    if (!password) {
                        return;
                    }


                    setCloudStatus(
                        "connecting..."
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
                        alert(
                            "Login failed: " +
                            error.message
                        );

                        setCloudStatus(
                            "cloud login failed"
                        );

                        return;
                    }


                    signedInUser =
                        data.user;


                    cloudLoginButton
                        .textContent =
                        "signed in";


                    await loadCloudState({
                        askFirst: false
                    });
                }
            );
    }


    /* =========================================================
       RESTORE EXISTING LOGIN SESSION

       This runs automatically on page load. Cloud data is checked
       first. Only after the browser matches the cloud do we allow
       automatic saving.
       ========================================================= */

    const {
        data: sessionData
    } =
        await cloudClient
            .auth
            .getSession();


    if (
        sessionData
            .session
            ?.user
    ) {
        signedInUser =
            sessionData
                .session
                .user;


        if (cloudLoginButton) {
            cloudLoginButton
                .textContent =
                "signed in";
        }


        await loadCloudState({
            askFirst: false
        });

    } else {
        setCloudStatus(
            "cloud bridge ready"
        );
    }
});