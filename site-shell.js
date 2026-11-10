// SNI Site Shell & Global App Controller
const installButton = document.getElementById("site-install-button");
const isPortalPage = /^\/(star|support|evaluation)(\/|$)/.test(window.location.pathname);
const rootPrefix = isPortalPage ? "../" : "./";

if (location.hash === "#videoSearch") {
    document.getElementById("videoSearch")?.focus({ preventScroll: true });
}

if ("serviceWorker" in navigator && location.protocol !== "file:" && !isPortalPage) {
    navigator.serviceWorker.register(`${rootPrefix}sw.js`).catch(error => {
        console.error("SNI app install support could not be enabled:", error);
    });
}

// -----------------------------------------------------------------------------
// PWA INSTALL BUTTON CONTROLLER
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// GLOBAL SITE SEARCH (ALL PAGES, PORTALS, SERVICES, & VIDEOS)
// -----------------------------------------------------------------------------
(function initGlobalSiteSearch() {
    // 1. Comprehensive Search Database
    const getSearchData = () => [
        // --- PORTALS & APPS ---
        {
            title: "Home — S Natural Intelligence",
            desc: "Welcome to SNI. Innovation, technology and creative ideas for a smarter, connected future.",
            category: "Pages",
            categorySlug: "pages",
            icon: "🌐",
            url: `${rootPrefix}index.html#home`,
            keywords: "home main sni natural intelligence welcome landing"
        },
        {
            title: "STAR Galaxy Portal",
            desc: "Weekly Status & Academies Portal. Member tracking, training academies, and weekly status updates.",
            category: "Portals",
            categorySlug: "star",
            icon: "★",
            url: `${rootPrefix}star/`,
            keywords: "star galaxy portal weekly status academies academy training progress milestone members"
        },
        {
            title: "Support Portal & Resource Library",
            desc: "Full SNI support system: Feasts & Prayers, New Songs, Sermons, SPB Books, Quiz, Files and Helpdesk.",
            category: "Portals",
            categorySlug: "support",
            icon: "S",
            url: `${rootPrefix}support/`,
            keywords: "support portal help helpdesk tickets library resources materials documents"
        },
        {
            title: "Evaluation Official Schedule",
            desc: "Official evaluation schedule, exam timetable, subject reviews, and academic subject manager.",
            category: "Portals",
            categorySlug: "evaluation",
            icon: "E",
            url: `${rootPrefix}evaluation/`,
            keywords: "evaluation schedule timetable official exam test marks subjects dates manager"
        },
        {
            title: "Videos Library",
            desc: "Browse categorized video library, watch gospel presentations, tutorials, and shared video collections.",
            category: "Portals",
            categorySlug: "videos",
            icon: "▶",
            url: `${rootPrefix}videos.html`,
            keywords: "videos video library watch youtube player presentations preachings tutorials clips"
        },

        // --- HOMEPAGE SECTIONS ---
        {
            title: "About SNI",
            desc: "Ideas, Innovation, Intelligence. Exploring natural intelligence and our creative vision.",
            category: "Pages",
            categorySlug: "about",
            icon: "💡",
            url: `${rootPrefix}index.html#about`,
            keywords: "about sni ideas innovation intelligence mission vision story background"
        },
        {
            title: "Our Services & Capabilities",
            desc: "Full-spectrum digital solutions: Intelligent Web Systems, Creative Media, Cloud Engineering.",
            category: "Pages",
            categorySlug: "services",
            icon: "⚙️",
            url: `${rootPrefix}index.html#services`,
            keywords: "services solutions web development engineering cloud technology tools creative systems"
        },
        {
            title: "Why SNI — Natural vs Artificial Intelligence",
            desc: "Why choose S Natural Intelligence. Combining human insight, organic intelligence and tech excellence.",
            category: "Pages",
            categorySlug: "about",
            icon: "🧠",
            url: `${rootPrefix}index.html#why`,
            keywords: "why sni natural intelligence benefits philosophy creative technology reason value"
        },
        {
            title: "Contact SNI",
            desc: "Reach out to the S Natural Intelligence team for collaborations, support, or inquiries.",
            category: "Pages",
            categorySlug: "contact",
            icon: "✉️",
            url: `${rootPrefix}index.html#contact`,
            keywords: "contact reach us email address message inquiry support phone connect"
        },

        // --- SUPPORT CATEGORIES & CONTENT ---
        {
            title: "Feasts & Prayers (Support)",
            desc: "Passover, Unleavened Bread, Resurrection Day, Pentecost, Trumpets, Day of Atonement prayers.",
            category: "Support",
            categorySlug: "support",
            icon: "🕊️",
            url: `${rootPrefix}support/#Feast`,
            keywords: "feasts prayers feast passover unleavened bread resurrection pentecost trumpet atonement prayer week"
        },
        {
            title: "New Song Room (Support)",
            desc: "Spiritual praise songs, choral melodies, prayer worship songs, digital albums and children songs.",
            category: "Support",
            categorySlug: "support",
            icon: "🎵",
            url: `${rootPrefix}support/#NewSong`,
            keywords: "new song songs music worship melodies prayer praise audio albums mp3 singing"
        },
        {
            title: "Sermon Room (Support)",
            desc: "Biblical study sermons, recorded spiritual audio/video preachings, and video transcripts.",
            category: "Support",
            categorySlug: "support",
            icon: "📖",
            url: `${rootPrefix}support/#Sermon`,
            keywords: "sermon sermons message preaching word bible scriptures teach study audio"
        },
        {
            title: "Preaching Videos (Support)",
            desc: "UCC gospel video collections, evangelism presentations, and short preaching video clips.",
            category: "Support",
            categorySlug: "support",
            icon: "🎬",
            url: `${rootPrefix}support/#PreachingVideo`,
            keywords: "preaching videos ucc gospel presentations clips videos evangelism"
        },
        {
            title: "SPB — Preaching Books (Support)",
            desc: "Full Subject Preaching Books (SPB), explanatory diagrams, and all-in-one download bundles.",
            category: "Support",
            categorySlug: "support",
            icon: "📚",
            url: `${rootPrefix}support/#SPB`,
            keywords: "spb books preaching diagrams full subject study guide zip download"
        },
        {
            title: "Watv Life Essence & Happy Home (Support)",
            desc: "Inspiring life fragrance stories, Happy Home series, mother's love, and spiritual testimonies.",
            category: "Support",
            categorySlug: "support",
            icon: "🌟",
            url: `${rootPrefix}support/#Watv`,
            keywords: "watv life essence happy home family love fragrance faith mother stories"
        },
        {
            title: "Quiz Room (Support)",
            desc: "Interactive Bible quizzes, sermon question reviews, and knowledge self-tests.",
            category: "Support",
            categorySlug: "support",
            icon: "❓",
            url: `${rootPrefix}support/#Quiz`,
            keywords: "quiz test questions review practice knowledge exam study"
        },
        {
            title: "Worship Orders (Support)",
            desc: "Order of services for Tuesday and Sabbath worships, service prayers and liturgies.",
            category: "Support",
            categorySlug: "support",
            icon: "⛪",
            url: `${rootPrefix}support/#Worship`,
            keywords: "worship orders tuesday sabbath service schedule liturgy order"
        },
        {
            title: "Files & Printables (Support)",
            desc: "Downloadable documents, PDFs, study sheets, templates, and printable resources.",
            category: "Support",
            categorySlug: "support",
            icon: "📁",
            url: `${rootPrefix}support/#Files`,
            keywords: "files documents pdf printables downloads forms sheets print"
        },

        // --- STAR GALAXY SUB-SECTIONS ---
        {
            title: "Weekly Status Tracking (Star)",
            desc: "Track weekly milestones, branch attendance, and periodic progress in STAR Galaxy.",
            category: "Star",
            categorySlug: "star",
            icon: "📊",
            url: `${rootPrefix}star/`,
            keywords: "weekly status tracking milestones attendance progress star"
        },
        {
            title: "STAR Academies & Learning Modules",
            desc: "Educational curricula, training branches, academy courses and student materials.",
            category: "Star",
            categorySlug: "star",
            icon: "🎓",
            url: `${rootPrefix}star/`,
            keywords: "academies academy learning training courses education modules star"
        },

        // --- EVALUATION SUB-SECTIONS ---
        {
            title: "Official Exam Timetable (Evaluation)",
            desc: "View official schedules, examination dates, evaluation slots and timings.",
            category: "Evaluation",
            categorySlug: "evaluation",
            icon: "📅",
            url: `${rootPrefix}evaluation/`,
            keywords: "exam timetable dates schedule evaluation timings official"
        },
        {
            title: "Subject Manager & Grading (Evaluation)",
            desc: "Manage evaluation subjects, criteria, curriculum topics, and student grades.",
            category: "Evaluation",
            categorySlug: "evaluation",
            icon: "📝",
            url: `${rootPrefix}evaluation/`,
            keywords: "subject manager grading topics criteria curriculum review evaluation"
        },

        // --- VIDEOS SEARCH & TOPICS ---
        {
            title: "Video Search & Categories",
            desc: "Search through SNI's shared video library by category, title or topic.",
            category: "Videos",
            categorySlug: "videos",
            icon: "🔍",
            url: `${rootPrefix}videos.html#videoSearch`,
            keywords: "search videos video search category filter title"
        }
    ];

    // 2. Inject Styles
    if (!document.getElementById("sni-search-styles")) {
        const style = document.createElement("style");
        style.id = "sni-search-styles";
        style.textContent = `
            .sni-search-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999999;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding: clamp(16px, 6vh, 60px) 16px;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.22s;
                font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .sni-search-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            .sni-search-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(4, 17, 39, 0.78);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
            }
            .sni-search-container {
                position: relative;
                width: min(100%, 650px);
                max-height: 82vh;
                display: flex;
                flex-direction: column;
                background: #071b3b;
                border: 1px solid rgba(245, 199, 94, 0.4);
                border-radius: 16px;
                box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 199, 94, 0.15);
                overflow: hidden;
                color: #ffffff;
                transform: translateY(-16px) scale(0.97);
                transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .sni-search-overlay.active .sni-search-container {
                transform: translateY(0) scale(1);
            }
            .sni-search-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 18px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.03);
            }
            .sni-search-input-wrap {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .sni-search-icon {
                width: 20px;
                height: 20px;
                stroke: #f5c75e;
                stroke-width: 2.2;
                fill: none;
                flex-shrink: 0;
            }
            .sni-search-input {
                width: 100%;
                border: 0;
                outline: none;
                background: transparent;
                color: #ffffff;
                font-size: 16px;
                font-family: inherit;
            }
            .sni-search-input::placeholder {
                color: #8da2c0;
            }
            .sni-search-clear {
                border: 0;
                background: rgba(255, 255, 255, 0.12);
                color: #cbd7e8;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: grid;
                place-items: center;
                font-size: 14px;
                line-height: 1;
                transition: background 0.2s, color 0.2s;
            }
            .sni-search-clear:hover {
                background: rgba(255, 255, 255, 0.25);
                color: #fff;
            }
            .sni-search-close {
                background: transparent;
                border: 0;
                cursor: pointer;
                padding: 0;
            }
            .sni-search-close kbd {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 11px;
                color: #d5e1f2;
                font-family: inherit;
                font-weight: 700;
                transition: all 0.2s;
            }
            .sni-search-close:hover kbd {
                background: rgba(255, 255, 255, 0.2);
                color: #fff;
                border-color: #f5c75e;
            }
            .sni-search-filters {
                display: flex;
                gap: 8px;
                padding: 10px 18px;
                background: rgba(0, 0, 0, 0.2);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                overflow-x: auto;
                scrollbar-width: none;
            }
            .sni-search-filters::-webkit-scrollbar {
                display: none;
            }
            .sni-filter-chip {
                padding: 5px 12px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                background: transparent;
                color: #c5d2e6;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s;
            }
            .sni-filter-chip:hover {
                border-color: rgba(245, 199, 94, 0.6);
                color: #fff;
            }
            .sni-filter-chip.active {
                background: #f5c75e;
                color: #071b3b;
                border-color: #f5c75e;
            }
            .sni-search-body {
                flex: 1;
                overflow-y: auto;
                padding: 12px 14px;
                max-height: 52vh;
            }
            .sni-search-section-label {
                padding: 6px 10px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #8da2c0;
            }
            .sni-search-results {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .sni-result-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 14px;
                border-radius: 10px;
                border: 1px solid transparent;
                background: rgba(255, 255, 255, 0.04);
                color: #ffffff;
                text-decoration: none;
                transition: background 0.15s, border-color 0.15s, transform 0.15s;
            }
            .sni-result-item:hover,
            .sni-result-item.selected {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(245, 199, 94, 0.45);
                transform: translateX(3px);
            }
            .sni-result-icon {
                display: grid;
                place-items: center;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.08);
                font-size: 17px;
                font-weight: bold;
                color: #f5c75e;
                flex-shrink: 0;
            }
            .sni-result-info {
                flex: 1;
                min-width: 0;
            }
            .sni-result-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
            .sni-result-title {
                font-size: 14px;
                font-weight: 700;
                color: #ffffff;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .sni-result-title mark,
            .sni-result-desc mark {
                background: transparent;
                color: #f5c75e;
                font-weight: 800;
                text-decoration: underline;
            }
            .sni-result-category {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 2px 7px;
                border-radius: 6px;
                flex-shrink: 0;
            }
            .sni-cat-portals,
            .sni-cat-star {
                background: rgba(124, 58, 237, 0.25);
                color: #c4b5fd;
                border: 1px solid rgba(124, 58, 237, 0.4);
            }
            .sni-cat-support {
                background: rgba(5, 150, 105, 0.25);
                color: #6ee7b7;
                border: 1px solid rgba(5, 150, 105, 0.4);
            }
            .sni-cat-evaluation {
                background: rgba(67, 56, 202, 0.25);
                color: #a5b4fc;
                border: 1px solid rgba(67, 56, 202, 0.4);
            }
            .sni-cat-videos {
                background: rgba(225, 29, 72, 0.25);
                color: #fda4af;
                border: 1px solid rgba(225, 29, 72, 0.4);
            }
            .sni-cat-pages,
            .sni-cat-about,
            .sni-cat-services,
            .sni-cat-contact {
                background: rgba(18, 75, 145, 0.35);
                color: #93c5fd;
                border: 1px solid rgba(18, 75, 145, 0.5);
            }
            .sni-result-desc {
                margin: 3px 0 0;
                font-size: 12px;
                color: #94a3b8;
                line-height: 1.4;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .sni-result-arrow {
                color: #8da2c0;
                font-size: 15px;
                transition: transform 0.15s, color 0.15s;
            }
            .sni-result-item:hover .sni-result-arrow,
            .sni-result-item.selected .sni-result-arrow {
                color: #f5c75e;
                transform: translateX(3px);
            }
            .sni-search-empty {
                padding: 40px 20px;
                text-align: center;
                color: #94a3b8;
            }
            .sni-empty-icon {
                font-size: 38px;
                margin-bottom: 12px;
            }
            .sni-search-empty h4 {
                margin: 0 0 6px;
                color: #fff;
                font-size: 16px;
            }
            .sni-search-empty p {
                margin: 0;
                font-size: 13px;
                color: #8da2c0;
            }
            .sni-search-empty strong {
                color: #f5c75e;
            }
            .sni-search-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 16px;
                padding: 10px 18px;
                background: rgba(0, 0, 0, 0.25);
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                font-size: 11px;
                color: #8da2c0;
            }
            .sni-search-footer kbd {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 4px;
                padding: 2px 5px;
                font-size: 10px;
                color: #cbd7e8;
            }
            @media (max-width: 600px) {
                .sni-search-overlay {
                    padding: 0;
                }
                .sni-search-container {
                    width: 100%;
                    height: 100%;
                    max-height: 100vh;
                    border-radius: 0;
                    border: 0;
                }
                .sni-search-footer {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 3. Inject Search Modal DOM
    let searchOverlay = document.getElementById("sni-search-overlay");
    if (!searchOverlay) {
        searchOverlay = document.createElement("div");
        searchOverlay.id = "sni-search-overlay";
        searchOverlay.className = "sni-search-overlay";
        searchOverlay.setAttribute("role", "dialog");
        searchOverlay.setAttribute("aria-modal", "true");
        searchOverlay.setAttribute("aria-label", "Global Site Search");
        searchOverlay.innerHTML = `
            <div class="sni-search-backdrop" id="sni-search-backdrop"></div>
            <div class="sni-search-container" role="document">
                <div class="sni-search-header">
                    <div class="sni-search-input-wrap">
                        <svg class="sni-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="11" cy="11" r="7"></circle>
                            <path d="m20 20-4-4"></path>
                        </svg>
                        <input class="sni-search-input" id="sni-search-input" type="search" placeholder="Search entire site (pages, portals, services, videos)..." autocomplete="off" spellcheck="false">
                        <button class="sni-search-clear" id="sni-search-clear" type="button" aria-label="Clear search" hidden>×</button>
                    </div>
                    <button class="sni-search-close" id="sni-search-close" type="button" aria-label="Close search (Esc)">
                        <kbd>ESC</kbd>
                    </button>
                </div>

                <div class="sni-search-filters" id="sni-search-filters">
                    <button class="sni-filter-chip active" type="button" data-filter="all">All</button>
                    <button class="sni-filter-chip" type="button" data-filter="portals">Portals</button>
                    <button class="sni-filter-chip" type="button" data-filter="pages">Pages & Sections</button>
                    <button class="sni-filter-chip" type="button" data-filter="support">Support Topics</button>
                    <button class="sni-filter-chip" type="button" data-filter="videos">Videos</button>
                </div>

                <div class="sni-search-body">
                    <div class="sni-search-results" id="sni-search-results" role="listbox"></div>
                </div>

                <div class="sni-search-footer">
                    <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
                    <span><kbd>↵</kbd> select</span>
                    <span><kbd>esc</kbd> close</span>
                </div>
            </div>
        `;
        document.body.appendChild(searchOverlay);
    }

    const searchInput = document.getElementById("sni-search-input");
    const searchClear = document.getElementById("sni-search-clear");
    const searchResults = document.getElementById("sni-search-results");
    const searchClose = document.getElementById("sni-search-close");
    const searchBackdrop = document.getElementById("sni-search-backdrop");
    const filterButtons = document.querySelectorAll("#sni-search-filters .sni-filter-chip");

    let currentFilter = "all";
    let selectedIndex = -1;

    // Open & Close Handlers
    const openSearch = () => {
        searchOverlay.classList.add("active");
        searchOverlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        renderResults(searchInput.value.trim());
        setTimeout(() => searchInput.focus(), 50);
    };

    const closeSearch = () => {
        searchOverlay.classList.remove("active");
        searchOverlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    };

    // Helper: Escape regex characters
    const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Helper: Highlight text
    const highlight = (text, query) => {
        if (!query) return text;
        const words = query.trim().split(/\s+/).filter(Boolean).map(escapeRegExp);
        if (!words.length) return text;
        const regex = new RegExp(`(${words.join("|")})`, "gi");
        return text.replace(regex, "<mark>$1</mark>");
    };

    // Render search results
    const renderResults = query => {
        const data = getSearchData();
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

        // Filter by category chip
        let filtered = data.filter(item => {
            if (currentFilter === "portals") return ["Portals", "Star", "Support", "Evaluation"].includes(item.category);
            if (currentFilter === "pages") return item.category === "Pages";
            if (currentFilter === "support") return item.category === "Support";
            if (currentFilter === "videos") return item.category === "Videos";
            return true;
        });

        // Filter by query terms
        if (terms.length > 0) {
            filtered = filtered.map(item => {
                const titleLower = item.title.toLowerCase();
                const descLower = item.desc.toLowerCase();
                const keywordsLower = item.keywords.toLowerCase();
                const catLower = item.category.toLowerCase();

                let score = 0;
                let matchesAll = true;

                for (const term of terms) {
                    if (titleLower.includes(term)) {
                        score += 15;
                        if (titleLower.startsWith(term)) score += 10;
                    } else if (keywordsLower.includes(term)) {
                        score += 8;
                    } else if (descLower.includes(term)) {
                        score += 5;
                    } else if (catLower.includes(term)) {
                        score += 4;
                    } else {
                        matchesAll = false;
                        break;
                    }
                }

                return matchesAll ? { ...item, score } : null;
            }).filter(Boolean).sort((a, b) => b.score - a.score);
        }

        selectedIndex = -1;

        if (terms.length === 0) {
            // Quick access suggestions when empty
            let html = `<div class="sni-search-section-label">Quick Access & Key Portals</div>`;
            filtered.slice(0, 8).forEach(item => {
                html += `
                    <a class="sni-result-item" href="${item.url}" role="option" tabindex="-1">
                        <div class="sni-result-icon">${item.icon}</div>
                        <div class="sni-result-info">
                            <div class="sni-result-top">
                                <span class="sni-result-title">${item.title}</span>
                                <span class="sni-result-category sni-cat-${item.categorySlug}">${item.category}</span>
                            </div>
                            <p class="sni-result-desc">${item.desc}</p>
                        </div>
                        <span class="sni-result-arrow" aria-hidden="true">→</span>
                    </a>
                `;
            });
            searchResults.innerHTML = html;
            return;
        }

        if (filtered.length === 0) {
            searchResults.innerHTML = `
                <div class="sni-search-empty">
                    <div class="sni-empty-icon">🔍</div>
                    <h4>No matches found for "${query}"</h4>
                    <p>Try searching for <strong>Star</strong>, <strong>Support</strong>, <strong>Evaluation</strong>, <strong>Videos</strong>, <strong>About</strong>, or <strong>Services</strong>.</p>
                </div>
            `;
            return;
        }

        let html = `<div class="sni-search-section-label">${filtered.length} Result${filtered.length === 1 ? "" : "s"} Found</div>`;
        filtered.forEach(item => {
            html += `
                <a class="sni-result-item" href="${item.url}" role="option" tabindex="-1">
                    <div class="sni-result-icon">${item.icon}</div>
                    <div class="sni-result-info">
                        <div class="sni-result-top">
                            <span class="sni-result-title">${highlight(item.title, query)}</span>
                            <span class="sni-result-category sni-cat-${item.categorySlug}">${item.category}</span>
                        </div>
                        <p class="sni-result-desc">${highlight(item.desc, query)}</p>
                    </div>
                    <span class="sni-result-arrow" aria-hidden="true">→</span>
                </a>
            `;
        });
        searchResults.innerHTML = html;
    };

    // Update active selection with keyboard
    const updateSelection = () => {
        const items = searchResults.querySelectorAll(".sni-result-item");
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add("selected");
                item.scrollIntoView({ block: "nearest" });
            } else {
                item.classList.remove("selected");
            }
        });
    };

    // Event Listeners
    searchInput.addEventListener("input", e => {
        const val = e.target.value;
        searchClear.hidden = !val;
        renderResults(val.trim());
    });

    searchClear.addEventListener("click", () => {
        searchInput.value = "";
        searchClear.hidden = true;
        searchInput.focus();
        renderResults("");
    });

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter") || "all";
            renderResults(searchInput.value.trim());
            searchInput.focus();
        });
    });

    // Keyboard navigation in search
    searchInput.addEventListener("keydown", e => {
        const items = searchResults.querySelectorAll(".sni-result-item");
        if (!items.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection();
        } else if (e.key === "Enter") {
            if (selectedIndex >= 0 && items[selectedIndex]) {
                e.preventDefault();
                items[selectedIndex].click();
            } else if (items[0]) {
                e.preventDefault();
                items[0].click();
            }
        }
    });

    searchClose.addEventListener("click", closeSearch);
    searchBackdrop.addEventListener("click", closeSearch);

    // Global click listener to intercept any search trigger button or link
    document.addEventListener("click", e => {
        const trigger = e.target.closest(".site-search-link, .site-search-button, #site-global-search-btn");
        if (trigger) {
            e.preventDefault();
            openSearch();
        }
    });

    // Global keyboard shortcut: Ctrl+K, Cmd+K, or "/"
    document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
            e.preventDefault();
            if (searchOverlay.classList.contains("active")) {
                closeSearch();
            } else {
                openSearch();
            }
        } else if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
            e.preventDefault();
            openSearch();
        } else if (e.key === "Escape" && searchOverlay.classList.contains("active")) {
            e.preventDefault();
            closeSearch();
        }
    });
})();
