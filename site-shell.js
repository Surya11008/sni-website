const installButton = document.getElementById("site-install-button");
const isPortalPage = /^\/(star|support|evaluation)(\/|$)/.test(window.location.pathname);

if (location.hash === "#videoSearch") {
    document.getElementById("videoSearch")?.focus({ preventScroll: true });
}

if ("serviceWorker" in navigator && location.protocol !== "file:" && !isPortalPage) {
    navigator.serviceWorker.register("/sw.js").catch(error => {
        console.error("SNI app install support could not be enabled:", error);
    });
}

if (installButton) {
    let deferredPrompt = null;
    const appName = installButton.getAttribute("aria-label")
        ?.replace(/^Install\s+/i, "")
        .replace(/\s+as an app$/i, "") || "SNI";
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches
        || navigator.standalone === true;
    const usesPortalInstallHandler = typeof window.triggerPwaInstall === "function"
        || typeof window.deferredPWAInstallPrompt !== "undefined";

    installButton.hidden = isInstalled;

    if (!usesPortalInstallHandler) {
        window.addEventListener("beforeinstallprompt", event => {
            event.preventDefault();
            deferredPrompt = event;
        });
    }

    window.addEventListener("appinstalled", () => {
        installButton.hidden = true;
        deferredPrompt = null;
    });

    installButton.addEventListener("click", async () => {
        if (typeof window.triggerPwaInstall === "function") {
            window.triggerPwaInstall();
            return;
        }

        const promptEvent = window.deferredPWAInstallPrompt || deferredPrompt;
        if (promptEvent) {
            installButton.disabled = true;
            try {
                await promptEvent.prompt();
                const choice = await promptEvent.userChoice;
                if (choice.outcome === "accepted") installButton.hidden = true;
            } finally {
                if (window.deferredPWAInstallPrompt === promptEvent) {
                    window.deferredPWAInstallPrompt = null;
                }
                deferredPrompt = null;
                installButton.disabled = false;
            }
            return;
        }

        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
            || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        window.alert(isIos
            ? `To install ${appName}, tap Share in Safari, then choose Add to Home Screen.`
            : `To install ${appName}, open your browser menu and choose Install app or Add to Home screen.`);
    });
}
