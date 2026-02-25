// =========================
// Traguardo — SPA (Option B)
// Pages : Accueil / Nos solutions (+2) / Actualités / Avis / Contact
// =========================

const SMARTAGENDA_URL =
  "https://www.smartagenda.fr/pro/traguardo/rendez-vous/?affrdv&tkaction=2046--97769-057d68da795c0";

// Endpoint optionnel (API serveur) pour l'envoi d'email
// Tu peux le définir dans config.js : window.CONTACT_ENDPOINT = "https://.../api/contact";
const CONTACT_ENDPOINT = window.CONTACT_ENDPOINT || "";

// Mini contenu "Actualités" (modifiable)
const POSTS = [
  {
    slug: "reprendre-le-controle-sans-sepuiser",
    title: "Reprendre le contrôle sans s'épuiser",
    date: "2026-01-10",
    excerpt: "Charge mentale, priorités et énergie : une méthode simple pour respirer.",
    content: [
      "Quand tout semble urgent, le stress prend toute la place.",
      "On repart de vos objectifs personnels, on clarifie les priorités, puis on met en place un plan réaliste.",
      "Le but : moins de pression, plus de sérénité au travail."
    ]
  },
  {
    slug: "motivation-durable",
    title: "Motivation durable : le mythe et la méthode",
    date: "2026-01-05",
    excerpt: "La motivation n'est pas une ressource magique. C'est un système.",
    content: [
      "On ne « trouve » pas la motivation : on la construit.",
      "Rituels, environnement, boucles de feedback : trois piliers qui tiennent sur la durée."
    ]
  },
  {
    slug: "reconversion-sans-se-perdre",
    title: "Reconversion : avancer sans se perdre",
    date: "2025-12-15",
    excerpt: "Changer de voie demande une méthode claire et des étapes réalistes.",
    content: [
      "Une reconversion réussie commence par clarifier ses envies, ses contraintes et ses compétences transférables.",
      "Ensuite, on avance par petites étapes concrètes pour garder le cap."
    ]
  }
];

const $app = document.getElementById("app");
const $year = document.getElementById("year");
if ($year) $year.textContent = new Date().getFullYear();

// =========================
// Header interactions
// =========================
const burgerBtn = document.getElementById("burgerBtn");
const mobileNav = document.getElementById("mobileNav");

burgerBtn?.addEventListener("click", () => {
  const expanded = burgerBtn.getAttribute("aria-expanded") === "true";
  burgerBtn.setAttribute("aria-expanded", String(!expanded));
  if (mobileNav) mobileNav.hidden = expanded;
});

// Ferme le menu mobile quand on clique un lien SPA
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-link]");
  if (!a) return;
  if (mobileNav && !mobileNav.hidden) {
    burgerBtn?.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  }
});

// Dropdown desktop : ouverture au clic
(function setupDropdowns() {
  const pairs = [
    { btnId: "aboutBtn", menuId: "aboutMenu" },
    { btnId: "solutionsBtn", menuId: "solutionsMenu" }
  ];
  const closers = [];

  function closeAll(exceptBtnId = "") {
    pairs.forEach(({ btnId: id }) => {
      if (id === exceptBtnId) return;
      const otherBtn = document.getElementById(id);
      const otherDropdown = otherBtn?.closest(".navDropdown");
      if (otherBtn && otherDropdown) {
        otherDropdown.classList.remove("open");
        otherBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  pairs.forEach(({ btnId, menuId }) => {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    menu.querySelectorAll('a[role="menuitem"], a').forEach((item, index) => {
      item.style.setProperty("--menu-i", String(index));
    });

    const dropdown = btn.closest(".navDropdown");
    if (!dropdown) return;
    let closeTimer = null;

    function clearCloseTimer() {
      if (!closeTimer) return;
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    function open(focusFirst = false) {
      clearCloseTimer();
      dropdown.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      if (focusFirst) {
        const firstItem = menu.querySelector('a[role="menuitem"], a');
        if (firstItem) setTimeout(() => firstItem.focus(), 0);
      }
    }
    function close() {
      clearCloseTimer();
      dropdown.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
    closers.push(close);
    function scheduleClose() {
      clearCloseTimer();
      closeTimer = setTimeout(() => close(), 260);
    }
    function toggle() {
      dropdown.classList.contains("open") ? close() : open();
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAll(btnId);
      toggle();
    });

    // Ouverture au survol (desktop), fermeture quand la souris quitte le bloc.
    dropdown.addEventListener("mouseenter", () => {
      const isDesktop = window.matchMedia && window.matchMedia("(min-width: 860px)").matches;
      if (!isDesktop) return;
      closeAll(btnId);
      open(false);
    });
    dropdown.addEventListener("mouseleave", () => {
      const isDesktop = window.matchMedia && window.matchMedia("(min-width: 860px)").matches;
      if (!isDesktop) return;
      scheduleClose();
    });
    menu.addEventListener("mouseenter", () => clearCloseTimer());
    menu.addEventListener("mouseleave", () => scheduleClose());

    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        open(true);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });

    menu.addEventListener("click", (e) => e.stopPropagation());
  });

  document.addEventListener("click", () => {
    closers.forEach((close) => close());
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closers.forEach((close) => close());
  });
  window.addEventListener("hashchange", () => {
    closers.forEach((close) => close());
  });
})();

// =========================
// Effet "goutte d'eau" au clic
// =========================
(function setupClickDrops() {
  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  document.addEventListener("pointerdown", (e) => {
    const tag = (e.target?.tagName || "").toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return;

    const drop = document.createElement("span");
    drop.className = "clickDrop";
    drop.style.left = `${e.clientX}px`;
    drop.style.top = `${e.clientY}px`;
    document.body.appendChild(drop);
    drop.addEventListener("animationend", () => drop.remove(), { once: true });
  });
})();

// =========================
// Animation en cascade (4 mots)
// =========================
function setupWordAnimation() {
  const target = document.querySelector("#accompagnementMots .pills");
  if (!target) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const pills = entry.target.querySelectorAll(".pill");
        pills.forEach((pill, index) => {
          pill.style.animation = `fadeInUp 0.8s ease ${index * 0.3}s forwards`;
        });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(target);
}

let _revealCleanup = null;
function setupScrollReveal() {
  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!targets.length) return;
  targets.forEach((el) => el.classList.remove("is-visible"));
  if (_revealCleanup) _revealCleanup();

  targets.forEach((el, index) => {
    el.style.setProperty("--reveal-delay", "0ms");
  });

  let nextIndex = 0;
  let lastY = window.scrollY;
  let scrolledSinceLastReveal = 0;
  const REVEAL_STEP_PX = 120;

  const onScroll = () => {
    const y = window.scrollY;
    const delta = y - lastY;
    lastY = y;
    if (delta <= 0) return;

    scrolledSinceLastReveal += delta;
    if (scrolledSinceLastReveal < REVEAL_STEP_PX) return;
    scrolledSinceLastReveal = 0;

    if (nextIndex >= targets.length) return;
    targets[nextIndex].classList.add("is-visible");
    nextIndex += 1;
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  _revealCleanup = () => {
    window.removeEventListener("scroll", onScroll);
  };
}

// =========================
// Router
// =========================
window.addEventListener("hashchange", initPage);
window.addEventListener("load", initPage);

function initPage() {
  render();
  setTimeout(() => {
    setupWordAnimation();
    setupScrollReveal();
  }, 50);
  updateActiveNav();
  updateFabVisibilityByScroll();
}

function route() {
  const hash = location.hash || "#/";
  return hash.replace("#", "").split("?")[0];
}

function setTitle(suffix) {
  document.title = suffix ? `Traguardo — ${suffix}` : "Traguardo — Un cap, des solutions";
}


/* =========================
   Menu actif + FAB intelligent
========================= */
function updateActiveNav() {
  const path = route(); // ex: "/contact"
  const links = document.querySelectorAll('a[data-link]');
  links.forEach((a) => {
    const href = a.getAttribute("href") || "";
    const target = href.startsWith("#") ? href.slice(1) : href;
    const isActive = (target === path) || (path === "/" && (target === "/" || target === ""));
    a.classList.toggle("active", isActive);
  });
}

let _fabScrollBound = false;
function updateFabVisibilityByScroll() {
  const path = route();
  const isMobile = window.matchMedia && window.matchMedia("(max-width: 859px)").matches;

  // Cache sur desktop et sur la page contact
  if (!isMobile || path === "/contact") {
    setFabVisible(false);
    return;
  }

  const threshold = Math.max(180, Math.round(window.innerHeight * 0.25));
  setFabVisible(window.scrollY > threshold);

  if (_fabScrollBound) return;
  _fabScrollBound = true;

  window.addEventListener(
    "scroll",
    () => {
      const p = route();
      const mobile = window.matchMedia && window.matchMedia("(max-width: 859px)").matches;
      if (!mobile || p === "/contact") return setFabVisible(false);

      const thr = Math.max(180, Math.round(window.innerHeight * 0.25));
      setFabVisible(window.scrollY > thr);
    },
    { passive: true }
  );
}

function setFabVisible(visible) {
  const fab = document.querySelector(".fab");
  if (!fab) return;
  fab.classList.toggle("is-visible", Boolean(visible));
}

function trackEvent(category, action, label) {
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", action, {
        event_category: category,
        event_label: label
      });
    }
  } catch {}
}


function render() {
  const path = route();

  // Reset loader Elfsight si besoin
  const loadingElement = document.getElementById("elfsightLoading");
  if (loadingElement) loadingElement.style.display = "none";

  if (path === "/") {
    setTitle("");
    return renderHome();
  }
  if (path === "/notre-mission") {
    setTitle("Notre mission");
    return renderMission();
  }
  if (path === "/notre-equipe") {
    setTitle("Notre équipe");
    return renderEquipe();
  }
  if (path === "/solutions") {
    setTitle("Nos solutions");
    return renderSolutions();
  }
  if (path === "/orientation-professionnelle") {
    setTitle("Orientation professionnelle");
    return renderReperage();
  }
  if (path === "/accompagnement-salaries" || path === "/dynamiques-emploi") {
    setTitle("Accompagnement des salariés");
    return renderAccompagnementSalaries();
  }
  if (path === "/bilan-competences") {
    setTitle("Bilan de compétences");
    return renderBilanCompetences();
  }
  if (path === "/plan-action-carriere") {
    setTitle("Plan d'action carrière");
    return renderOutilSuivi();
  }
  if (path === "/reconversion-formation") {
    setTitle("Reconversion et formation");
    return renderEcoleFormation();
  }
  if (path === "/bien-etre-travail") {
    setTitle("Bien-être au travail");
    return renderBienEtreTravail();
  }
  if (path === "/actualites") {
    setTitle("Actualités");
    return renderActualites();
  }
  if (path.startsWith("/actualites/")) {
    setTitle("Actualités");
    const slug = path.split("/actualites/")[1];
    return renderArticle(slug);
  }
  if (path === "/avis") {
    setTitle("Avis");
    return renderAvis();
  }
  if (path === "/contact") {
    setTitle("Nous contacter");
    return renderContact();
  }

  setTitle("Page introuvable");
  return renderNotFound();
}

// =========================
// Views
// =========================
function renderHome() {
  const latest = POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);

  $app.innerHTML = `
    <section class="hero">
      <div class="blob blob--a"></div>
      <div class="blob blob--b"></div>
      <div class="container hero__inner">
        <div class="stack">
          <div class="kicker">Accompagnement des salariés</div>
          <h1 class="h1">Avancer dans votre vie pro. <span class="muted">Sans vous épuiser.</span></h1>
          <p class="p maxW">
            Traguardo accompagne les salariés dans leurs étapes clés:
            évolution de poste, reconversion, bilan de compétences et équilibre professionnel.
          </p>
          <div class="programHero__cta">
            <a class="btn btn--solid" href="#/solutions" data-link>Découvrir les solutions salariés</a>
            <a class="btn btn--ghost" href="#/contact" data-link>Contactez-nous</a>
          </div>
        </div>

        <div class="card" id="accompagnementMots">
          <h3 class="h3">Nos 4 engagements</h3>
          <div class="pills">
            <div class="pill">Écoute</div>
            <div class="pill">Clarté</div>
            <div class="pill">Plan d'action concret</div>
            <div class="pill">Suivi régulier</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="h2">Un accompagnement en 3 blocs</h2>
        <div class="grid grid--3 mt24">
          <div class="card">
            <h3 class="h3">À propos</h3>
            <p class="p">Notre mission, notre équipe et notre méthode dédiée aux salariés.</p>
            <div class="mt16"><a class="btn btn--ghost" href="#/notre-mission" data-link>Voir la mission</a></div>
          </div>
          <div class="card">
            <h3 class="h3">Nos solutions</h3>
            <p class="p">6 solutions concrètes pour évoluer, changer de voie et retrouver de l'équilibre.</p>
            <div class="mt16"><a class="btn btn--ghost" href="#/solutions" data-link>Voir les solutions</a></div>
          </div>
          <div class="card">
            <h3 class="h3">Contact</h3>
            <p class="p">Un premier échange pour clarifier votre situation et vos priorités.</p>
            <div class="mt16"><a class="btn btn--ghost" href="#/contact" data-link>Nous contacter</a></div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="grid grid--3 mt24">
          <div class="card"><h3 class="h3">Clarifier</h3><p class="p">Faire le point sur votre situation et vos options.</p></div>
          <div class="card"><h3 class="h3">Évoluer</h3><p class="p">Construire un plan réaliste pour la suite de votre carrière.</p></div>
          <div class="card"><h3 class="h3">S'équilibrer</h3><p class="p">Retrouver une dynamique durable entre travail et bien-être.</p></div>
        </div>

        <div class="hr"></div>

        <div class="flexRow">
          <h2 class="h2">Dernières actualités</h2>
          <a class="btn btn--ghost" href="#/actualites" data-link>Voir toutes les actualités</a>
        </div>
        <div class="grid grid--3 mt24">
          ${latest.map((p) => postCard(p)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderSolutions() {
  $app.innerHTML = pageShell(
    "Nos solutions",
    "Une offre 100% dédiée aux salariés, avec 6 solutions complémentaires.",
    `
      <div class="grid grid--2 mt24">
        ${solutionCard(
          "Orientation professionnelle",
          "Faire le point sur votre situation, vos envies et vos priorités.",
          "#/orientation-professionnelle"
        )}
        ${solutionCard(
          "Accompagnement des salariés",
          "Avancer pas à pas avec un cadre clair, personnalisé et réaliste.",
          "#/accompagnement-salaries"
        )}
        ${solutionCard(
          "Bilan de compétences",
          "Clarifier un projet réaliste et aligné avec les compétences transférables.",
          "#/bilan-competences"
        )}
        ${solutionCard(
          "Plan d'action carrière",
          "Structurer vos prochaines étapes avec des objectifs simples et mesurables.",
          "#/plan-action-carriere"
        )}
        ${solutionCard(
          "Reconversion et formation",
          "Préparer un changement professionnel en sécurisant chaque étape.",
          "#/reconversion-formation"
        )}
        ${solutionCard(
          "Bien-être au travail",
          "Prévenir l'épuisement et retrouver une dynamique professionnelle saine.",
          "#/bien-etre-travail"
        )}
      </div>

      <div class="mt32">
        ${ctaContact()}
      </div>
    `
  );
}

function renderMission() {
  $app.innerHTML = pageShell(
    "Notre mission",
    "Aider les salariés à évoluer, se reconvertir et retrouver un équilibre professionnel durable.",
    `
      <div class="grid grid--2">
        <div class="card">
          <h3 class="h3">Notre vision</h3>
          <p class="p">
            Chaque salarié peut retrouver de la clarté et du pouvoir d'action
            quand il bénéficie d'un accompagnement concret et humain.
          </p>
        </div>
        <div class="card">
          <h3 class="h3">Notre méthode</h3>
          <p class="p">
            • Écoute de votre situation<br/>
            • Clarification des priorités<br/>
            • Plan d'action adapté<br/>
            • Suivi et ajustements réguliers
          </p>
        </div>
      </div>
      <div class="mt32">${ctaContact()}</div>
    `
  );
}

function renderEquipe() {
  $app.innerHTML = pageShell(
    "Notre équipe",
    "Une équipe pluridisciplinaire dédiée à l'accompagnement des salariés.",
    `
      <div class="grid grid--3">
        <div class="card"><h3 class="h3">Coach carrière</h3><p class="p">Clarification des objectifs et plan d'évolution professionnelle.</p></div>
        <div class="card"><h3 class="h3">Consultant bilan</h3><p class="p">Analyse des compétences et construction d'un projet réaliste.</p></div>
        <div class="card"><h3 class="h3">Référent bien-être</h3><p class="p">Prévention de l'épuisement et équilibre de vie au travail.</p></div>
      </div>
      <div class="mt32">${ctaContact()}</div>
    `
  );
}

function renderReperage() {
  $app.innerHTML = pageShell(
    "Orientation professionnelle",
    "Faire un état des lieux clair de votre situation pour choisir la bonne direction.",
    `
      <div class="grid grid--2">
        <div class="card">
          <h3 class="h3">Ce que nous faisons</h3>
          <p class="p">Analyse de votre parcours, de vos contraintes et de vos objectifs pour poser un cap réaliste.</p>
        </div>
        <div class="card">
          <h3 class="h3">Bénéfices</h3>
          <p class="p">Plus de clarté, moins d'hésitations et des décisions plus sereines pour la suite.</p>
        </div>
      </div>
      <div class="mt32">${ctaContact()}</div>
    `
  );
}

function renderAccompagnementSalaries() {
  $app.innerHTML = `
    <section class="hero programHero">
      <div class="blob blob--a"></div>
      <div class="blob blob--b"></div>
      <div class="container hero__inner">
        <div class="stack">
          <div class="badge">Programme salariés</div>
          <h1 class="h1">Accompagnement des salariés</h1>
          <p class="p maxW">
            Un accompagnement clair et structuré pour retrouver un cap professionnel,
            relancer la motivation et avancer avec méthode.
          </p>
          <div class="programHero__cta">
            <a class="btn btn--solid" href="#/contact" data-link>Demander un échange</a>
          </div>
        </div>

        <div class="card">
          <h3 class="h3">En bref</h3>
          <div class="grid mt16">
            <div class="programMetric">
              <div class="programMetric__value">3 phases</div>
              <p class="p">Écoute, plan d'action, passage à l'action.</p>
            </div>
            <div class="programMetric">
              <div class="programMetric__value">Sur mesure</div>
              <p class="p">Parcours adapté à votre situation de salarié.</p>
            </div>
            <div class="programMetric">
              <div class="programMetric__value">Concret</div>
              <p class="p">Des actions utiles dès les premières séances.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="h2">À qui s'adresse ce parcours ?</h2>
        <p class="p maxW">
          Personnes en transition professionnelle, en recherche d'emploi ou en reprise d'activité,
          qui veulent une méthode claire pour avancer de manière durable.
        </p>

        <div class="grid grid--2 mt24">
          <div class="card">
            <h3 class="h3">Objectifs du programme</h3>
            <p class="p">
              • Clarifier votre projet et vos priorités<br/>
              • Renforcer votre confiance professionnelle<br/>
              • Structurer vos actions semaine après semaine
            </p>
          </div>
          <div class="card">
            <h3 class="h3">Résultats attendus</h3>
            <p class="p">
              • Un plan d'évolution réaliste<br/>
              • Un meilleur niveau d'autonomie<br/>
              • Une dynamique de travail plus régulière
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section programSteps">
      <div class="container">
        <h2 class="h2">Le parcours en 3 phases</h2>
        <p class="p">Un déroulé simple, progressif et orienté résultats.</p>

        <div class="grid grid--3 mt24">
          <article class="card card--hover">
            <div class="programStep__index">01</div>
            <h3 class="h3 mt16">Diagnostic</h3>
            <p class="p">
              Analyse de votre situation, de vos freins et de vos ressources pour définir un point de départ fiable.
            </p>
          </article>
          <article class="card card--hover">
            <div class="programStep__index">02</div>
            <h3 class="h3 mt16">Plan d'action</h3>
            <p class="p">
              Construction d'un plan concret avec objectifs, priorités et étapes de progression.
            </p>
          </article>
          <article class="card card--hover">
            <div class="programStep__index">03</div>
            <h3 class="h3 mt16">Passage à l'action</h3>
            <p class="p">
              Mise en oeuvre accompagnée, ajustements réguliers, et montée en autonomie.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid grid--2">
          <div class="card">
            <h3 class="h3">Modalités</h3>
            <p class="p">
              • Séances individuelles en visio ou présentiel<br/>
              • Rythme adaptable selon les besoins<br/>
              • Support entre séances pour maintenir la dynamique
            </p>
          </div>
          <div class="card">
            <h3 class="h3">Livrables</h3>
            <p class="p">
              • Feuille de route personnalisée<br/>
              • Trame de priorisation hebdomadaire<br/>
              • Outils pratiques pour garder le cap
            </p>
          </div>
        </div>

        <div class="card mt32">
          <h3 class="h3">Questions fréquentes</h3>
          <div class="stack mt16">
            <p class="p"><strong>Combien de temps dure l'accompagnement ?</strong><br/>La durée varie selon votre objectif et votre point de départ, avec un format progressif.</p>
            <p class="p"><strong>Faut-il déjà avoir un projet précis ?</strong><br/>Non. Le cadrage du projet fait partie intégrante du programme.</p>
            <p class="p"><strong>Puis-je commencer rapidement ?</strong><br/>Oui, un premier échange permet de valider le bon format et de démarrer sans délai inutile.</p>
          </div>
        </div>

        <div class="mt32">${ctaContact()}</div>
      </div>
    </section>
  `;
}

function renderBilanCompetences() {
  $app.innerHTML = pageShell(
    "Bilan de compétences",
    "Guide pratique 2026 - financement CPF et points de vigilance.",
    `
      <div class="stack">
        <div class="card">
          <h3 class="h3">Introduction</h3>
          <p class="p">
            Le bilan de compétences est un outil professionnel reconnu qui permet de faire le point sur vos compétences,
            vos motivations et de construire un projet d'évolution ou de reconversion de façon claire et structurée.
          </p>
          <p class="kicker mt16" id="bilanLegalMeta">Dernière vérification Légifrance : --</p>
          <p class="p mt16" id="bilanLegalAlert" style="display:none;color:#92400e;">
            Une mise à jour réglementaire a été détectée. Vérifiez le contenu avant publication.
          </p>
          <p class="kicker mt8">
            <a id="bilanLegalSource" href="#" target="_blank" rel="noopener noreferrer" hidden>Source principale Légifrance</a>
          </p>
        </div>

        <div class="card data-reveal--peek" data-reveal>
          <h3 class="h3">1. Le CPF : un financement toujours disponible en 2026</h3>
          <p class="p">
            Le bilan de compétences reste éligible au financement via le CPF en 2026.
            Vous pouvez mobiliser vos droits CPF pour financer tout ou partie du parcours.
          </p>
        </div>

        <div class="card" data-reveal>
          <h3 class="h3">2. Participation forfaitaire obligatoire</h3>
          <p class="p">
            Depuis 2026, l'utilisation du CPF implique une participation forfaitaire :
            <strong id="bilanParticipationAmount">103,20 €</strong> par dossier mobilisé.
            Cette somme s'affiche lors de la validation sur Mon Compte Formation.
          </p>
        </div>

        <div class="card" data-reveal>
          <h3 class="h3">3. Plafond de financement CPF</h3>
          <p class="p">
            En 2026, le CPF est plafonné par action. Pour un bilan de compétences,
            les projets réglementaires indiquent un plafond autour de <strong id="bilanCpfCapAmount">1 600 €</strong> maximum pris en charge.
            Si le coût total dépasse ce plafond, le complément peut être financé via l'autofinancement,
            l'employeur, un OPCO ou France Travail.
          </p>
        </div>

        <div class="card" data-reveal>
          <h3 class="h3">4. Durée minimale et conditions</h3>
          <p class="p">
            • Le bilan doit comporter au moins 13 heures d'accompagnement effectif avec un prestataire certifié.<br/>
            • Un nouveau financement CPF pour un second bilan n'est possible qu'après 5 ans.
          </p>
        </div>

        <div class="card" data-reveal>
          <h3 class="h3">5. Comment s'organiser ?</h3>
          <p class="p">
            1. Vérifier vos droits sur moncompteformation.gouv.fr.<br/>
            2. Choisir un prestataire certifié Qualiopi.<br/>
            3. Monter le dossier CPF avec le bon intitulé d'action.<br/>
            4. Valider la demande et régler la participation forfaitaire.<br/>
            5. Prévoir des financements complémentaires si nécessaire.
          </p>
        </div>

        <div class="card" data-reveal>
          <h3 class="h3">6. Ce que cela signifie pour vous</h3>
          <p class="p">
            ✔ Le bilan peut toujours être financé par le CPF.<br/>
            ✔ Une participation forfaitaire est à prévoir.<br/>
            ✔ Un plafond de prise en charge s'applique.<br/>
            ✔ Le reste peut être financé par d'autres dispositifs.
          </p>
        </div>

        <div class="card" data-reveal>
          <h3 class="h3">7. Points de vigilance</h3>
          <p class="p">
            • Vérifier le coût total du bilan pour limiter le reste à charge.<br/>
            • Anticiper le budget et les financements complémentaires.<br/>
            • Demander un devis clair et détaillé au prestataire.
          </p>
        </div>

        <div class="card" data-reveal>
          <h3 class="h3">Conclusion</h3>
          <p class="p">
            Le bilan de compétences reste un outil puissant pour clarifier vos ambitions professionnelles.
            Grâce au CPF, il reste accessible, avec des règles tarifaires à intégrer dans votre stratégie.
          </p>
        </div>
      </div>
      <div class="mt32">${ctaContact()}</div>
    `
  );

  hydrateBilanLegalData();
}

async function hydrateBilanLegalData() {
  const participationEl = document.getElementById("bilanParticipationAmount");
  if (!participationEl) return;

  const capEl = document.getElementById("bilanCpfCapAmount");
  const metaEl = document.getElementById("bilanLegalMeta");
  const sourceEl = document.getElementById("bilanLegalSource");
  const alertEl = document.getElementById("bilanLegalAlert");

  try {
    const res = await fetch("./data/bilan-cpf-reglementation.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();

    if (data?.cpf_participation?.value_label) {
      participationEl.textContent = data.cpf_participation.value_label;
    }
    if (capEl && data?.cpf_cap?.value_label) {
      capEl.textContent = data.cpf_cap.value_label;
    }

    if (metaEl) {
      const dateIso = data?.generated_at || data?.last_checked_at;
      if (dateIso) {
        const d = new Date(dateIso);
        const label = Number.isNaN(d.getTime())
          ? String(dateIso)
          : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
        metaEl.textContent = `Dernière vérification Légifrance : ${label}`;
      }
    }

    const source = Array.isArray(data?.sources) ? data.sources[0] : null;
    if (sourceEl && source?.url) {
      sourceEl.href = source.url;
      sourceEl.hidden = false;
    }

    if (alertEl) {
      alertEl.style.display = data?.needs_review ? "block" : "none";
    }
  } catch {}
}

function renderOutilSuivi() {
  $app.innerHTML = pageShell(
    "Plan d'action carrière",
    "Structurer votre progression professionnelle avec des étapes claires et atteignables.",
    `
      <div class="grid grid--2">
        <div class="card">
          <h3 class="h3">Contenu du plan</h3>
          <p class="p">
            • Étapes concrètes par priorité<br/>
            • Objectifs hebdomadaires simples<br/>
            • Points d'ajustement réguliers
          </p>
        </div>
        <div class="card">
          <h3 class="h3">Bénéfices</h3>
          <p class="p">Plus de régularité, moins de dispersion et une progression visible dans le temps.</p>
        </div>
      </div>
      <div class="mt32">${ctaContact()}</div>
    `
  );
}

function renderEcoleFormation() {
  $app.innerHTML = pageShell(
    "Reconversion et formation",
    "Préparer un changement de métier ou une montée en compétences avec un cadre progressif.",
    `
      <div class="grid grid--2">
        <div class="card">
          <h3 class="h3">Ce que nous construisons</h3>
          <p class="p">Un parcours de reconversion réaliste: compétences à acquérir, étapes et calendrier.</p>
        </div>
        <div class="card">
          <h3 class="h3">Résultats attendus</h3>
          <p class="p">Une transition sécurisée, avec des choix de formation adaptés à votre profil.</p>
        </div>
      </div>
      <div class="mt32">${ctaContact()}</div>
    `
  );
}

function renderBienEtreTravail() {
  $app.innerHTML = pageShell(
    "Bien-être au travail",
    "Prévenir l'épuisement professionnel et retrouver un équilibre durable.",
    `
      <div class="grid grid--2">
        <div class="card">
          <h3 class="h3">Ce que nous travaillons</h3>
          <p class="p">Stress, charge mentale, relation au travail et organisation du quotidien professionnel.</p>
        </div>
        <div class="card">
          <h3 class="h3">Résultat</h3>
          <p class="p">Plus de recul, des limites plus claires et une dynamique de travail plus saine.</p>
        </div>
      </div>
      <div class="mt32">${ctaContact()}</div>
    `
  );
}

function renderActualites() {
  const sorted = POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  $app.innerHTML = pageShell(
    "Actualités",
    "Articles, méthodes, réflexions utiles (pas du bruit).",
    `
      <div class="grid mt24">
        ${sorted.map((p) => postCard(p)).join("")}
      </div>
    `
  );
}

function renderArticle(slug) {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return renderNotFound();

  $app.innerHTML = `
    <section class="section">
      <div class="container" style="max-width: 760px;">
        <a class="kicker" href="#/actualites" data-link>← Retour aux actualités</a>
        <p class="kicker mt16">${escapeHtml(post.date)}</p>
        <h1 class="h1" style="font-size:clamp(28px,4vw,44px)">${escapeHtml(post.title)}</h1>
        <p class="p">${escapeHtml(post.excerpt)}</p>

        <div class="hr"></div>

        <article class="stack" style="gap:14px">
          ${post.content
            .map((p) => `<p class="p" style="color:#111827">${escapeHtml(p)}</p>`)
            .join("")}
        </article>

        <div class="mt32">${ctaContact()}</div>
      </div>
    </section>
  `;
}

function renderAvis() {
  $app.innerHTML = pageShell(
    "Avis clients",
    "Avis vérifiés directement depuis Google.",
    `
      <div class="google-reviews-container">
        <div class="card">
          <div class="google-badge">
            <span>Google</span>
            <span style="color:#FFB400">★★★★★</span>
            <span>5.0</span>
          </div>

          <h3 class="h3">Ce que disent nos clients</h3>
          <p class="p">Avis vérifiés directement depuis Google.</p>

          <div class="elfsight-widget-container mt24">
            <div class="elfsight-app-db190f6e-a448-4957-b08a-c450f92a8b90" data-elfsight-app-lazy></div>
          </div>

          <div id="elfsightLoading" class="elfsight-widget-loading" style="display:none;">
            <div class="loader"></div>
            <p>Chargement des avis en cours...</p>
          </div>

          <div class="grid grid--2 mt32">
            <div>
              <h4 class="h3">Voir tous les avis</h4>
              <p class="p">Consultez l'intégralité de nos avis sur Google.</p>
              <a href="https://g.page/r/CfuCrPiZ69atEAE/review"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="btn btn--ghost mt16">
                Voir sur Google
              </a>
            </div>

            <div>
              <h4 class="h3">Laisser un avis</h4>
              <p class="p">Votre avis nous aide à améliorer notre accompagnement.</p>
              <a href="https://g.page/r/CfuCrPiZ69atEAE/review"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="btn btn--solid mt16">
                Laisser un avis
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="mt32">${ctaContact()}</div>
    `
  );

  const loading = document.getElementById("elfsightLoading");
  if (loading) loading.style.display = "flex";

  loadElfsightScript();

  setTimeout(() => {
    if (loading) loading.style.display = "none";
  }, 3000);
}

function loadElfsightScript() {
  if (document.querySelector('script[src*="elfsightcdn.com/platform.js"]')) return;
  const s = document.createElement("script");
  s.src = "https://elfsightcdn.com/platform.js";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

function renderContact() {
  $app.innerHTML = pageShell(
    "Nous contacter",
    "Un message, une question, ou directement un rendez-vous via l'agenda.",
    `
      <div class="grid grid--2 mt24">
        <div class="card">
          <h3 class="h3">📧 Nous écrire</h3>
          <p class="p">Remplissez le formulaire ci-dessous, nous vous répondrons rapidement.</p>


          <div class="quickChoices mt16" aria-label="Aide à la rédaction">
            <div class="kicker">Je vous contacte pour…</div>
            <div class="quickChoices__row">
              <button type="button" class="chip" data-template="motivation">Gagner en motivation</button>
              <button type="button" class="chip" data-template="reconversion">Préparer ma reconversion</button>
              <button type="button" class="chip" data-template="clarte">Clarifier mon projet pro</button>
            </div>
          </div>


          <form class="stack mt16" id="contactForm" novalidate>
            <div class="field-group">
              <label for="name" class="field-label">Votre nom *</label>
              <input class="input" id="name" name="name" placeholder="Ex: Marie Dupont" required>
            </div>

            <div class="field-group">
              <label for="email" class="field-label">Votre email *</label>
              <input class="input" id="email" name="email" type="email" placeholder="exemple@email.com" required>
            </div>

            <div class="field-group">
              <label for="message" class="field-label">Votre message *</label>
              <textarea class="input" id="message" name="message" rows="6" placeholder="Décrivez votre demande..." required></textarea>
            </div>

            <div class="honeypot" aria-hidden="true">
              <input type="text" name="website" tabindex="-1" autocomplete="off" placeholder="Ne pas remplir ce champ">
            </div>

            <button class="btn btn--solid mt16" type="submit" id="submitBtn">
              <span id="submitText">Envoyer le message</span>
              <span id="submitSpinner" class="spinner" style="display:none; margin-left:8px"></span>
            </button>

            <div id="formMessage" class="form-message mt16" style="display:none"></div>

            <p class="kicker mt8">Email : contact@traguardo.fr</p>
          </form>
        </div>

        <div class="card">
          <h3 class="h3">📅 Prendre rendez-vous</h3>
          <p class="p">Choisissez un créneau directement dans l'agenda.</p>

          <div class="agendaEmbed mt16">
            <iframe
              src="${SMARTAGENDA_URL}"
              title="SmartAgenda Traguardo"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <div class="mt16">
            <a class="btn btn--ghost" href="${SMARTAGENDA_URL}" target="_blank" rel="noopener noreferrer">
              Ouvrir l'agenda dans un nouvel onglet
            </a>
          </div>
        </div>
      </div>
    `
  );

  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const submitText = document.getElementById("submitText");
  const submitSpinner = document.getElementById("submitSpinner");

const formMessage = document.getElementById("formMessage");

// Mini-diagnostic : pré-remplit le message pour aider (sans friction)
const messageEl = document.getElementById("message");
const templates = {
  motivation:
    "Bonjour,\n\nJe souhaite gagner en motivation et retrouver une dynamique durable.\n\nContexte : …\nObjectif : …\nCe qui me bloque aujourd’hui : …\n\nMerci,",
  reconversion:
    "Bonjour,\n\nJe souhaite préparer une reconversion professionnelle.\n\nContexte : …\nObjectif : …\nContraintes : …\n\nMerci,",
  clarte:
    "Bonjour,\n\nJe souhaite clarifier mon projet professionnel et mes prochaines étapes.\n\nContexte : …\nObjectif : …\nContraintes : …\n\nMerci,"
};

document.querySelectorAll(".quickChoices .chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!messageEl) return;
    const kind = btn.getAttribute("data-template");
    const text = templates[kind] || "";
    if (text) messageEl.value = text;

    // Feedback visuel : “chip” actif
    document.querySelectorAll(".quickChoices .chip").forEach((b) => b.classList.remove("chip--active"));
    btn.classList.add("chip--active");

    messageEl.focus();
    messageEl.scrollIntoView({ behavior: "smooth", block: "center" });

    trackEvent("contact", "click", `prefill_${kind}`);
  });
});

form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const honeypot = form.website?.value;
    if (honeypot) return simulateSuccess();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim()
    };

    setFormState("loading", "Envoi en cours...");

    const isFileContext = window.location.protocol === "file:";
    const isRelativeEndpoint = CONTACT_ENDPOINT.startsWith("/");

    // Sans endpoint explicite (ou en file:// avec endpoint relatif), on affiche le fallback mail.
    if (!CONTACT_ENDPOINT || (isFileContext && isRelativeEndpoint)) {
      setFormState(
        "info",
        `ℹ️ L'envoi de formulaire nécessite une API serveur (les clés secrètes ne peuvent pas être exposées côté navigateur).
         En attendant, écris-nous directement : <a class="email-fallback" href="mailto:contact@traguardo.fr">contact@traguardo.fr</a>`
      );
      return;
    }

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        let apiError = "";
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("application/json")) {
          try {
            const data = await res.json();
            apiError = typeof data?.error === "string" ? data.error : "";
          } catch {}
        } else {
          try {
            apiError = (await res.text()).trim();
          } catch {}
        }

        const statusError = `HTTP ${res.status}`;
        throw new Error(apiError || statusError);
      }

      setFormState("success", "✅ Message envoyé ! Nous vous répondrons sous 24h.");
      form.reset();
    } catch (err) {
      const raw = String(err?.message || "").trim();
      const detail = raw ? ` (${escapeHtml(raw).slice(0, 140)})` : "";
      let hint = "";
      if (raw === "Server not configured") {
        hint = " Vérifie la configuration serveur (RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL).";
      } else if (raw === "Email send failed") {
        hint = " Vérifie que l'adresse d'envoi est bien validée dans Resend.";
      }
      setFormState(
        "error",
        `❌ Erreur lors de l'envoi${detail}.${hint} Contactez-nous : <a class="email-fallback" href="mailto:contact@traguardo.fr">contact@traguardo.fr</a>`
      );
    }
  });

  function setFormState(state, message = "") {
    if (!submitBtn || !submitText || !submitSpinner || !formMessage) return;

    submitBtn.disabled = state === "loading";
    submitText.textContent = state === "loading" ? "Envoi en cours..." : "Envoyer le message";
    submitSpinner.style.display = state === "loading" ? "inline-block" : "none";

    if (message) {
      formMessage.innerHTML = message;
      formMessage.style.display = "block";
      formMessage.className = `form-message ${state}`;
      setTimeout(() => {
        formMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }

  function simulateSuccess() {
    setFormState("loading", "Traitement...");
    setTimeout(() => {
      form.reset();
      setFormState("success", "✅ Message envoyé ! (protection anti-spam)");
    }, 900);
  }
}

function renderNotFound() {
  $app.innerHTML = pageShell(
    "Page introuvable",
    "Cette page n'existe pas (ou a pris un RTT).",
    `<a class="btn btn--ghost mt24" href="#/" data-link>Retour à l'accueil</a>`
  );
}

// =========================
// Helpers
// =========================
function pageShell(title, subtitle, contentHtml) {
  return `
    <section class="section">
      <div class="container">
        <h1 class="h1" style="font-size:clamp(30px,4vw,44px)">${escapeHtml(title)}</h1>
        <p class="p maxW">${escapeHtml(subtitle)}</p>
        <div class="mt32">${contentHtml}</div>
      </div>
    </section>
  `;
}

function solutionCard(title, desc, href) {
  return `
    <a class="card card--hover" href="${href}" data-link>
      <h3 class="h3">${escapeHtml(title)}</h3>
      <p class="p">${escapeHtml(desc)}</p>
      <div class="mt16">
        <span class="btn btn--ghost">Découvrir</span>
      </div>
    </a>
  `;
}

function postCard(p) {
  return `
    <a class="card card--hover" href="#/actualites/${escapeAttr(p.slug)}" data-link>
      <div class="kicker">${escapeHtml(p.date)}</div>
      <h3 class="h3 mt16" style="margin-top:10px">${escapeHtml(p.title)}</h3>
      <p class="p">${escapeHtml(p.excerpt)}</p>
    </a>
  `;
}

function ctaContact() {
  return `
    <div class="card">
      <h3 class="h3">Parlons de votre situation.</h3>
      <p class="p">Un message suffit pour démarrer, ou prenez un rendez-vous via l'agenda.</p>
      <div class="mt16">
        <a class="btn btn--solid" href="#/contact" data-link>Nous contacter</a>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll(" ", "%20");
}

// =========================
// Son discret au clic (Web Audio API)
// =========================
(function setupClickSound() {
  let audioCtx = null;
  let enabled = true;

  // (Option) mémorise le choix utilisateur
  try {
    const saved = localStorage.getItem("clickSoundEnabled");
    if (saved === "0") enabled = false;
  } catch {}

  function ensureCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Certains navigateurs "suspendent" l'audio tant qu'un geste user n'a pas eu lieu
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  }

  function playClick(type = "soft") {
    if (!enabled) return;
    ensureCtx();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // Oscillateur + gain pour un click très court
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Deux "saveurs" : soft / sharp
    const freq = type === "sharp" ? 1200 : 850;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    // Enveloppe ultra courte (attaque rapide + chute)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Joue sur pointerdown pour que ce soit réactif (souris + tactile)
  document.addEventListener("pointerdown", (e) => {
    // Si tu veux limiter aux éléments interactifs :
    const interactive = e.target.closest("a, button, summary, .btn, [role='button']");
    if (!interactive) return;

    playClick("soft");
  });

  // Expose un mini contrôleur (optionnel) pour un bouton ON/OFF
  window.__clickSound = {
    get enabled() { return enabled; },
    setEnabled(v) {
      enabled = Boolean(v);
      try { localStorage.setItem("clickSoundEnabled", enabled ? "1" : "0"); } catch {}
    }
  };
})();
