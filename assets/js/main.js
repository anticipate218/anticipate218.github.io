/*
 * 主逻辑 / Main script
 * 双语切换 · 主题切换 · 打字动画 · 星空背景 · 内容渲染 · GitHub 实时数据
 * i18n · themes · typing effect · starfield · rendering · live GitHub data
 */
(function () {
  "use strict";

  var DATA = window.SITE_DATA;
  var I18N = window.I18N;
  var Viz = window.Viz;
  var root = document.documentElement;
  var THEMES = ["celestial", "daylight", "aurora", "paper"];
  var GH_USER = DATA.meta.githubUser;
  var CACHE_TTL = 6 * 60 * 60 * 1000; // 6 小时 / 6 hours

  var state = {
    lang: (function () {
      // URL 参数优先（便于分享/截图），不写入 localStorage / ?lang= wins, not persisted
      var q = null;
      try { q = new URLSearchParams(location.search).get("lang"); } catch (e) { q = null; }
      if (q === "zh" || q === "en") return q;
      return root.getAttribute("data-lang") || "zh";
    })(),
    themePref: "system",
    pubFilter: "all",
    newsExpanded: false,
    repos: null,          // GitHub API 返回 / live repos
    starsLive: false,
    contrib: null,        // 贡献数据 / contributions
    contribError: false,
    motion: root.getAttribute("data-motion") !== "off"
  };

  /* ---------------- 工具函数 / helpers ---------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  function t(key) {
    var dict = I18N[state.lang] || I18N.zh;
    return dict[key] != null ? dict[key] : (I18N.zh[key] != null ? I18N.zh[key] : key);
  }

  /* 双语字段取值 / pick the current language from {zh, en} */
  function L(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value;
    return value[state.lang] != null ? value[state.lang] : (value.zh != null ? value.zh : value.en);
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function icon(id, cls) {
    return '<svg class="' + (cls || "") + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>';
  }

  var toastTimer = null;
  function toast(msg) {
    var node = $("#toast");
    node.textContent = msg;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.hidden = true; }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(new Error("copy failed")); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  function formatNews(date) {
    /* "2026-08" → 2026.08 */
    return String(date).replace("-", ".");
  }

  /* ---------------- 国际化 / i18n ---------------- */
  function applyStaticI18n() {
    root.setAttribute("lang", state.lang === "zh" ? "zh-CN" : "en");
    root.setAttribute("data-lang", state.lang);
    document.title = t("doc.title");
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("doc.description"));

    $all("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    $all("[data-i18n-attr]").forEach(function (node) {
      node.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var bits = pair.split(":");
        if (bits.length === 2) node.setAttribute(bits[0].trim(), t(bits[1].trim()));
      });
    });
    $all("[data-bind]").forEach(function (node) {
      node.textContent = L(getPath(DATA, node.getAttribute("data-bind")));
    });
    $all("[data-bind-attr]").forEach(function (node) {
      var bits = node.getAttribute("data-bind-attr").split(":");
      node.setAttribute(bits[0], L(getPath(DATA, bits[1])));
    });
    var hl = state.lang === "zh" ? "zh-CN" : "en";
    var scholar = "https://scholar.google.com/citations?user=" + DATA.meta.scholarId + "&hl=" + hl;
    ["#link-scholar", "#btn-scholar", "#cta-scholar"].forEach(function (s) { var a = $(s); if (a) a.href = scholar; });
  }

  function setLang(lang) {
    if (lang !== "zh" && lang !== "en") return;
    state.lang = lang;
    store("site-lang", lang);
    renderAll();
    restartTyping();
  }

  /* ---------------- 主题 / themes ---------------- */
  var systemLight = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

  function resolveTheme(pref) {
    if (THEMES.indexOf(pref) !== -1) return pref;
    return systemLight && systemLight.matches ? "daylight" : "celestial";
  }

  function applyTheme(pref, announce) {
    state.themePref = THEMES.indexOf(pref) !== -1 ? pref : "system";
    var resolved = resolveTheme(state.themePref);
    root.setAttribute("data-theme", resolved);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", Viz.cssVar("--bg") || "#050a1a");
    $all("[data-theme-option]").forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.getAttribute("data-theme-option") === state.themePref));
    });
    if (announce) toast(t("toast.themeChanged") + t("theme." + state.themePref));
    /* 主题相关的图形需要重绘 / theme-dependent graphics */
    renderActivity(false);
    renderCharts();
    refreshStars();
  }

  function setupThemePicker() {
    var btn = $("#theme-toggle");
    var menu = $("#theme-menu");

    function open() {
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      var current = menu.querySelector('[aria-checked="true"]') || menu.querySelector("button");
      if (current) current.focus();
    }
    function close(focusBack) {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (focusBack) btn.focus();
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.hidden) open(); else close(false);
    });
    menu.addEventListener("click", function (e) {
      var option = e.target.closest("[data-theme-option]");
      if (option) {
        var pref = option.getAttribute("data-theme-option");
        store("site-theme", pref);
        applyTheme(pref, true);
        close(true);
      }
    });
    menu.addEventListener("keydown", function (e) {
      var items = $all("button", menu);
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "Tab") { close(false); }
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) close(false);
    });

    if (systemLight) {
      var onChange = function () { if (state.themePref === "system") applyTheme("system", false); };
      if (systemLight.addEventListener) systemLight.addEventListener("change", onChange);
      else if (systemLight.addListener) systemLight.addListener(onChange);
    }

    /* 动画开关 / motion toggle */
    var motionBtn = $("#motion-toggle");
    motionBtn.setAttribute("aria-checked", String(state.motion));
    motionBtn.addEventListener("click", function () {
      state.motion = !state.motion;
      motionBtn.setAttribute("aria-checked", String(state.motion));
      if (state.motion) root.removeAttribute("data-motion"); else root.setAttribute("data-motion", "off");
      store("site-motion", state.motion ? "on" : "off");
      toast(t(state.motion ? "motion.on" : "motion.off"));
      restartTyping();
      startStars();
    });
  }

  /* ---------------- 打字动画 / typing effect ---------------- */
  var typingTimer = null;
  function restartTyping() {
    clearTimeout(typingTimer);
    var node = $("#typing-text");
    var phrases = L(DATA.profile.typing) || [];
    if (!phrases.length) return;
    var reduce = !state.motion || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduce) { node.textContent = phrases[0]; return; }

    var p = 0, i = 0, deleting = false;
    function tick() {
      var chars = Array.from(phrases[p]);
      if (!deleting) {
        i += 1;
        node.textContent = chars.slice(0, i).join("");
        if (i >= chars.length) { deleting = true; typingTimer = setTimeout(tick, 1900); return; }
        typingTimer = setTimeout(tick, state.lang === "zh" ? 110 : 55);
      } else {
        i -= 1;
        node.textContent = chars.slice(0, i).join("");
        if (i <= 0) { deleting = false; p = (p + 1) % phrases.length; typingTimer = setTimeout(tick, 380); return; }
        typingTimer = setTimeout(tick, state.lang === "zh" ? 45 : 22);
      }
    }
    node.textContent = "";
    tick();
  }

  /* ---------------- 首屏内容 / hero ---------------- */
  function renderHero() {
    $("#intro").innerHTML = L(DATA.profile.intro).map(function (p) { return "<p>" + escapeHTML(p) + "</p>"; }).join("");
    $("#interests").innerHTML = DATA.profile.interests.map(function (it) {
      return '<li class="chip">' + icon(it.icon) + "<span>" + escapeHTML(L(it)) + "</span></li>";
    }).join("");

    var eduHost = $("#edu-list");
    var edu = DATA.profile.education || [];
    if (eduHost && edu.length) {
      eduHost.innerHTML = edu.map(function (e) {
        var honors = (e.honors || []).map(function (h) {
          return '<span class="edu__honor">🏅 ' + escapeHTML(L(h)) + "</span>";
        }).join("");
        return '<span class="edu__item' + (e.current ? " is-current" : "") + '">' +
          '<span class="edu__school">' + escapeHTML(L(e.school)) + "</span>" +
          '<span class="edu__degree">' + escapeHTML(L(e.degree)) + "</span>" +
          (honors ? '<span class="edu__honors">' + honors + "</span>" : "") +
          "</span>";
      }).join("");
    }

    var email = DATA.profile.email;
    var row = $("#email-row");
    if (email) {
      row.hidden = false;
      var a = $("#link-email");
      a.href = "mailto:" + email;
      a.textContent = email;
    } else {
      row.hidden = true;
    }
    $("#sync-date").textContent = DATA.meta.syncedAt;
    $("#sync-date").setAttribute("datetime", DATA.meta.syncedAt);
    $("#footer-updated").textContent = DATA.meta.syncedAt;
    $("#footer-updated").setAttribute("datetime", DATA.meta.syncedAt);
    $("#year").textContent = String(new Date().getFullYear());
  }

  /* ---------------- 动态 / news ---------------- */
  var NEWS_VISIBLE = 5;
  /* 预印本暂时隐藏；data.js 中 meta.showPreprints 设为 true 即恢复 / preprints stay hidden until meta.showPreprints is true */
  var SHOW_PREPRINTS = !!(DATA.meta && DATA.meta.showPreprints);

  function visibleNews() {
    return DATA.news.filter(function (n) { return !n.hidden && (SHOW_PREPRINTS || n.tag !== "arxiv"); });
  }

  function renderNews() {
    var items = visibleNews();
    var hotLabel = escapeHTML(t("news.hot"));
    $("#news-list").innerHTML = items.map(function (n, idx) {
      var text = escapeHTML(L(n.text));
      var body = n.link ? '<a href="' + escapeHTML(n.link) + '" target="_blank" rel="noopener">' + text + "</a>" : text;
      var hot = n.hot ? '<span class="hot-mark" role="img" aria-label="' + hotLabel + '" title="' + hotLabel + '">🔥</span>' : "";
      return "<li" + (n.hot ? ' class="is-hot"' : "") + ' style="--i:' + idx + '"' + (idx >= NEWS_VISIBLE && !state.newsExpanded ? " hidden" : "") + ">" +
        '<div class="when">' + hot + '<time datetime="' + escapeHTML(n.date) + '">' + escapeHTML(formatNews(n.date)) + "</time>" +
        '<span class="badge badge--' + escapeHTML(n.tag) + '">' + escapeHTML(t("news.tag." + n.tag)) + "</span></div>" +
        "<p>" + body + "</p></li>";
    }).join("");
    var more = $("#news-more");
    more.hidden = items.length <= NEWS_VISIBLE;
    more.textContent = t(state.newsExpanded ? "news.less" : "news.more");
    more.setAttribute("aria-expanded", String(state.newsExpanded));
  }

  /* ---------------- 论文 / publications ---------------- */
  var TOPICS = ["all", "rs", "llm", "ml"];

  /* 论文排序：rank 越小级别越高，其次按引用数 / ranking: venue tier (rank, lower first), then citations */
  var TYPE_RANK = { conference: 50, journal: 50, preprint: 90 };

  function visiblePubs() {
    return DATA.publications.filter(function (p) { return !p.hidden && (SHOW_PREPRINTS || p.type !== "preprint"); });
  }

  function pubRank(p) {
    if (typeof p.rank === "number") return p.rank;
    return Object.prototype.hasOwnProperty.call(TYPE_RANK, p.type) ? TYPE_RANK[p.type] : 70;
  }

  function comparePubs(a, b) {
    return pubRank(a) - pubRank(b) ||
      (b.citations || 0) - (a.citations || 0) ||
      (b.year || 0) - (a.year || 0) ||
      String(a.title).localeCompare(String(b.title));
  }

  function levelText(value) {
    return typeof value === "string" ? value : L(value);
  }

  function renderPubFilters() {
    var pubs = visiblePubs();
    $("#pub-filters").innerHTML = TOPICS.map(function (topic) {
      var n = topic === "all" ? pubs.length : pubs.filter(function (p) { return p.topic === topic; }).length;
      var active = state.pubFilter === topic;
      return '<button class="chip-btn' + (active ? " is-active" : "") + '" type="button" role="tab" aria-selected="' + active +
        '" data-filter="' + topic + '">' + escapeHTML(t("pubs.filter." + topic)) + '<span class="count">' + n + "</span></button>";
    }).join("");
  }

  function highlightAuthors(authors) {
    return escapeHTML(authors).replace(/\bS Cao\b/g, "<strong>S Cao</strong>");
  }

  function bibtexFor(p) {
    var surname = function (a) { var parts = a.trim().split(/\s+/); return parts[parts.length - 1]; };
    var authorList = p.authors.split(",").map(function (a) { return a.trim(); }).filter(Boolean);
    var hasEtAl = authorList.some(function (a) { return /et al\.?|\.\.\./i.test(a); });
    var names = authorList.filter(function (a) { return !/et al\.?|\.\.\./i.test(a); }).map(function (a) {
      var parts = a.split(/\s+/);
      var last = parts.pop();
      var initials = parts.join(" ").split("").filter(function (ch) { return /[A-Za-z]/.test(ch); }).map(function (ch) { return ch + "."; }).join(" ");
      return last + ", " + initials;
    });
    if (hasEtAl) names.push("others");
    var key = surname(authorList[0]).toLowerCase() + p.year + p.title.split(/[\s:]+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    var type = p.type === "journal" ? "article" : p.type === "conference" ? "inproceedings" : "misc";
    var lines = ["@" + type + "{" + key + ","];
    lines.push("  title     = {" + p.title + "},");
    lines.push("  author    = {" + names.join(" and ") + "},");
    if (type === "article") lines.push("  journal   = {" + p.venue.replace(/,\s*\d+$/, "") + "},");
    if (type === "inproceedings") lines.push("  booktitle = {" + p.venue + "},");
    if (type === "misc") {
      var m = /arXiv:(\d{4}\.\d{4,5})/.exec(p.venue);
      if (m) {
        lines.push("  eprint    = {" + m[1] + "},");
        lines.push("  archivePrefix = {arXiv},");
      }
      lines.push("  note      = {" + p.venue + "},");
    }
    lines.push("  year      = {" + p.year + "}");
    lines.push("}");
    return lines.join("\n");
  }

  function renderPubs() {
    var pubs = visiblePubs().filter(function (p) { return state.pubFilter === "all" || p.topic === state.pubFilter; });
    var host = $("#pub-list");
    if (!pubs.length) {
      host.innerHTML = '<p class="empty">' + escapeHTML(t("pubs.empty")) + "</p>";
      return;
    }
    pubs.sort(comparePubs);
    host.innerHTML = '<ol class="pub-stack stagger">' + pubs.map(function (p, idx) {
      var lk = p.links || {};
      var links = "";
      if (lk.arxiv) links += '<a href="' + escapeHTML(lk.arxiv) + '" target="_blank" rel="noopener">' + icon("arrow") + "arXiv</a>";
      if (lk.pdf) links += '<a href="' + escapeHTML(lk.pdf) + '" target="_blank" rel="noopener">' + icon("doc") + "PDF</a>";
      if (lk.code) links += '<a href="' + escapeHTML(lk.code) + '" target="_blank" rel="noopener">' + icon("github") + "Code</a>";
      if (lk.scholar) links += '<a href="' + escapeHTML(lk.scholar) + '" target="_blank" rel="noopener">' + icon("scholar") + "Scholar</a>";
      links += '<button type="button" class="bib-toggle" aria-expanded="false" aria-controls="bib-' + escapeHTML(p.id) + '">' + icon("quote") + escapeHTML(t("pubs.bibtex")) + "</button>";
      var cites = '<span class="pub__cites">' + escapeHTML(t("pubs.cited")) + " <b>" + (p.citations || 0) + "</b></span>";
      var badges = "";
      if (p.level) badges += '<span class="badge badge--tier">' + escapeHTML(levelText(p.level)) + "</span>";
      if (p.selected) badges += '<span class="badge badge--selected">★ ' + escapeHTML(t("pubs.selected")) + "</span>";
      if (p.firstAuthor) badges += '<span class="badge badge--first">' + escapeHTML(t("selected.firstAuthor")) + "</span>";
      badges += '<span class="pub__year">' + escapeHTML(String(p.year)) + "</span>";
      return '<li class="pub-item" style="--i:' + idx + '">' +
        '<article class="pub' + (p.selected ? " is-selected" : "") + '" data-id="' + escapeHTML(p.id) + '">' +
        '<div class="pub__venue is-' + escapeHTML(p.type) + (String(p.venueShort || "").length > 10 ? " is-long" : "") + '">' + escapeHTML(p.venueShort) + "<small>" + escapeHTML(t("pubs.type." + p.type)) + "</small></div>" +
        '<div class="pub__body">' +
        '<div class="pub__badges">' + badges + "</div>" +
        '<h3 class="pub__title">' + escapeHTML(p.title) + "</h3>" +
        '<p class="pub__authors">' + highlightAuthors(p.authors) + "</p>" +
        '<p class="pub__where">' + escapeHTML(p.venue) + ", " + p.year + "</p>" +
        (p.summary ? '<p class="pub__summary">' + escapeHTML(L(p.summary)) + "</p>" : "") +
        (p.note ? '<p class="pub__note">' + escapeHTML(L(p.note)) + "</p>" : "") +
        '<div class="pub__links">' + links + cites + "</div>" +
        '<pre class="bibtex mono" id="bib-' + escapeHTML(p.id) + '" hidden>' + escapeHTML(bibtexFor(p)) + "</pre>" +
        "</div></article></li>";
    }).join("") + "</ol>";
  }

  function setupPubs() {
    $("#pub-filters").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      state.pubFilter = btn.getAttribute("data-filter");
      renderPubFilters();
      renderPubs();
    });
    $("#pub-list").addEventListener("click", function (e) {
      var btn = e.target.closest(".bib-toggle");
      if (!btn) return;
      var pre = document.getElementById(btn.getAttribute("aria-controls"));
      var open = pre.hidden;
      pre.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) {
        copyText(pre.textContent).then(function () { toast(t("pubs.copied")); }, function () { toast(t("pubs.copyFail")); });
      }
    });
  }

  /* ---------------- 项目 / repositories ---------------- */
  var LANG_COLORS = {
    Python: "#3572A5", JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", "C++": "#f34b7d",
    Jupyter: "#DA5B0B", "Jupyter Notebook": "#DA5B0B", Shell: "#89e051", CSS: "#563d7c", Go: "#00ADD8", Rust: "#dea584",
    Dataset: "#8b8bd8", Model: "#c678dd", Other: "#8b949e"
  };

  var REPO_ART = {
    rs: '<svg class="repo__art" viewBox="0 0 64 64" aria-hidden="true"><use href="#i-satellite"/></svg>',
    llm: '<svg class="repo__art" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cpu"/></svg>'
  };

  function repoLive(name) {
    if (!state.repos) return null;
    var lower = name.toLowerCase();
    for (var i = 0; i < state.repos.length; i++) {
      if (state.repos[i].name.toLowerCase() === lower) return state.repos[i];
    }
    return null;
  }

  function repoStats(p) {
    var live = repoLive(p.repo);
    return {
      stars: live ? (live.stargazers_count || 0) : (p.stars || 0),
      forks: live ? (live.forks_count || 0) : (p.forks || 0),
      lang: (live && live.language) || p.lang || "Other",
      url: (live && live.html_url) || ("https://github.com/" + GH_USER + "/" + p.repo)
    };
  }

  function renderRepos() {
    var items = DATA.projects.map(function (p) { return { p: p, s: repoStats(p) }; });
    items.sort(function (a, b) {
      return b.s.stars - a.s.stars || b.s.forks - a.s.forks || a.p.repo.localeCompare(b.p.repo);
    });
    var starWord = t("projects.stars");
    var forkWord = t("projects.forks");
    $("#repo-grid").innerHTML = items.map(function (item, idx) {
      var p = item.p;
      var s = item.s;
      var color = LANG_COLORS[s.lang] || LANG_COLORS.Other;
      return '<a class="repo" href="' + escapeHTML(s.url) + '" target="_blank" rel="noopener" style="--i:' + idx + '">' +
        (REPO_ART[p.topic] || "") +
        '<span class="repo__name">' + icon("repo") + escapeHTML(p.repo) + "</span>" +
        '<p class="repo__desc">' + escapeHTML(L(p.desc)) + "</p>" +
        '<span class="repo__foot">' +
        '<span class="lang"><i class="lang-dot" style="background:' + color + '"></i>' + escapeHTML(s.lang) + "</span>" +
        '<span class="stars" title="' + escapeHTML(s.stars + " " + starWord) + '">' + icon("star") + "<b>" + s.stars + '</b><span class="sr-only"> ' + escapeHTML(starWord) + "</span></span>" +
        '<span class="forks" title="' + escapeHTML(s.forks + " " + forkWord) + '">' + icon("fork") + "<b>" + s.forks + '</b><span class="sr-only"> ' + escapeHTML(forkWord) + "</span></span>" +
        "</span></a>";
    }).join("");
    var src = $("#stars-source");
    src.textContent = t(state.starsLive ? "projects.live" : "projects.cached");
  }

  function refreshStars() {
    var total = DATA.meta.githubStarsTotal || 0;
    if (state.repos) {
      total = state.repos.filter(function (r) { return !r.fork; }).reduce(function (a, r) { return a + (r.stargazers_count || 0); }, 0);
    }
    $("#stat-stars").textContent = String(total);
  }

  function fetchRepos() {
    var cacheKey = "gh-repos-" + GH_USER;
    try {
      var cached = JSON.parse(load(cacheKey) || "null");
      if (cached && Date.now() - cached.at < CACHE_TTL && Array.isArray(cached.repos)) {
        state.repos = cached.repos;
        state.starsLive = true;
        return Promise.resolve();
      }
    } catch (e) { /* ignore broken cache */ }
    if (typeof window.fetch !== "function") return Promise.reject(new Error("fetch unavailable"));
    return fetch("https://api.github.com/users/" + GH_USER + "/repos?per_page=100&type=owner&sort=updated", {
      headers: { Accept: "application/vnd.github+json" }
    }).then(function (res) {
      if (!res.ok) throw new Error("GitHub API " + res.status);
      return res.json();
    }).then(function (repos) {
      state.repos = repos.map(function (r) {
        return { name: r.name, html_url: r.html_url, stargazers_count: r.stargazers_count, forks_count: r.forks_count, language: r.language, fork: r.fork };
      });
      state.starsLive = true;
      store(cacheKey, JSON.stringify({ at: Date.now(), repos: state.repos }));
    });
  }

  /* ---------------- 科研数据 / activity ---------------- */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + Viz.pad(d.getMonth() + 1) + "-" + Viz.pad(d.getDate());
  }

  function renderActivity(animate) {
    var canvas = $("#iso-canvas");
    var statsHost = $("#iso-stats");
    if (state.contribError) {
      canvas.innerHTML = '<p class="muted">' + escapeHTML(t("activity.error")) + "</p>";
      statsHost.innerHTML = "";
      return;
    }
    if (!state.contrib) {
      canvas.innerHTML = '<p class="muted">' + escapeHTML(t("activity.loading")) + "</p>";
      return;
    }
    var days = state.contrib;
    var s = Viz.computeStats(days, todayISO());
    var d = t("activity.days");
    statsHost.innerHTML = [
      ["activity.total", s.total, ""],
      ["activity.activeDays", s.active, d],
      ["activity.longest", s.longest, d],
      ["activity.current", s.current, d],
      ["activity.best", s.best.count, s.best.date ? s.best.date.slice(5).replace("-", "/") : ""]
    ].map(function (row) {
      return '<div class="iso-stat"><b>' + row[1] + (row[2] ? "<small>" + escapeHTML(row[2]) + "</small>" : "") + "</b><span>" + escapeHTML(t(row[0])) + "</span></div>";
    }).join("");
    Viz.renderIsoCalendar(canvas, days, {
      t: t,
      lang: state.lang,
      tooltip: $("#iso-tooltip"),
      animate: !!animate && state.motion
    });
  }

  function fetchContributions() {
    var cacheKey = "gh-contrib-" + GH_USER;
    try {
      var cached = JSON.parse(load(cacheKey) || "null");
      if (cached && Date.now() - cached.at < CACHE_TTL && Array.isArray(cached.days)) {
        state.contrib = cached.days;
        return Promise.resolve();
      }
    } catch (e) { /* ignore */ }
    if (typeof window.fetch !== "function") return Promise.reject(new Error("fetch unavailable"));
    return fetch("https://github-contributions-api.jogruber.de/v4/" + GH_USER + "?y=last").then(function (res) {
      if (!res.ok) throw new Error("contrib " + res.status);
      return res.json();
    }).then(function (json) {
      var days = (json.contributions || []).map(function (c) { return { date: c.date, count: c.count, level: c.level }; });
      if (!days.length) throw new Error("empty contributions");
      days.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      state.contrib = days;
      store(cacheKey, JSON.stringify({ at: Date.now(), days: days }));
    });
  }

  function setupActivityTabs() {
    var tabs = [$("#tab-live"), $("#tab-metrics")];
    var panels = [$("#iso-live"), $("#iso-metrics")];
    var metricsLoaded = false;
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (x, j) {
          x.classList.toggle("is-active", i === j);
          x.setAttribute("aria-selected", String(i === j));
          panels[j].hidden = i !== j;
        });
        if (i === 1 && !metricsLoaded) {
          metricsLoaded = true;
          var img = $("#metrics-img");
          img.onerror = function () { img.hidden = true; $("#metrics-missing").hidden = false; };
          img.onload = function () { img.hidden = false; $("#metrics-missing").hidden = true; };
          img.src = "metrics/isocalendar.svg?v=" + DATA.meta.syncedAt;
        }
      });
    });
  }

  function shortTitle(title) {
    var head = title.split(":")[0].trim();
    return head.length <= 24 ? head : head.slice(0, 23) + "…";
  }

  function renderCharts() {
    var pubs = visiblePubs();
    var bars = pubs.filter(function (p) { return (p.citations || 0) > 0; })
      .sort(function (a, b) { return b.citations - a.citations; })
      .map(function (p) { return { label: shortTitle(p.title), full: p.title, value: p.citations }; });
    Viz.renderBars($("#viz-citations"), bars, { label: t("activity.citations") });

    var topicColors = { rs: Viz.cssVar("--accent"), llm: Viz.cssVar("--accent-2"), ml: Viz.cssVar("--accent-3") };
    var topics = ["rs", "llm", "ml"].map(function (k) {
      return { label: t("pubs.filter." + k), value: pubs.filter(function (p) { return p.topic === k; }).length, color: topicColors[k] };
    }).filter(function (x) { return x.value > 0; });
    Viz.renderDonut($("#viz-topics"), topics, { centerLabel: t("stats.papers"), label: t("activity.topics") });

    var counts = {};
    var source = state.repos ? state.repos.filter(function (r) { return !r.fork; }) : DATA.projects.map(function (p) { return { language: p.lang }; });
    source.forEach(function (r) {
      var lang = r.language || "Other";
      counts[lang] = (counts[lang] || 0) + 1;
    });
    var langs = Object.keys(counts).map(function (k) { return { label: k, value: counts[k], color: LANG_COLORS[k] || LANG_COLORS.Other }; })
      .sort(function (a, b) { return b.value - a.value; });
    if (langs.length > 5) {
      var rest = langs.slice(5).reduce(function (a, b) { return a + b.value; }, 0);
      langs = langs.slice(0, 5);
      var other = langs.filter(function (l) { return l.label === "Other"; })[0];
      if (other) other.value += rest; else langs.push({ label: "Other", value: rest, color: LANG_COLORS.Other });
    }
    var repoCount = source.length;
    Viz.renderDonut($("#viz-langs"), langs, { centerValue: repoCount, centerLabel: "repos", label: t("activity.languages") });
  }

  /* ---------------- 星空背景 / starfield ---------------- */
  var particlesContainer = null;
  var particlesGen = 0;
  var fallback = { raf: 0, running: false };

  function starColors() {
    return { star: Viz.cssVar("--star") || "#dbe9ff", link: Viz.cssVar("--star-link") || "#5aa9ff" };
  }

  function stopStars() {
    particlesGen += 1;
    if (particlesContainer) {
      try { particlesContainer.destroy(); } catch (e) { /* ignore */ }
      particlesContainer = null;
    }
    cancelAnimationFrame(fallback.raf);
    fallback.running = false;
  }

  function startStars() {
    stopStars();
    var light = ["daylight", "paper"].indexOf(root.getAttribute("data-theme")) !== -1;
    var c = starColors();
    if (window.tsParticles && typeof window.tsParticles.load === "function") {
      var gen = particlesGen;
      $("#starfield-fallback").hidden = true;
      window.tsParticles.load({
        id: "tsparticles",
        options: {
          fullScreen: { enable: false },
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          detectRetina: true,
          pauseOnBlur: true,
          pauseOnOutsideViewport: true,
          particles: {
            number: { value: light ? 70 : 140, density: { enable: true, width: 1400, height: 900 } },
            color: { value: [c.star, c.link] },
            shape: { type: "circle" },
            opacity: {
              value: { min: 0.15, max: light ? 0.55 : 0.95 },
              animation: { enable: state.motion, speed: 0.6, sync: false, startValue: "random" }
            },
            size: { value: { min: 0.4, max: light ? 1.8 : 1.6 } },
            move: { enable: state.motion, speed: 0.12, direction: "none", random: true, straight: false, outModes: { default: "out" } },
            links: { enable: true, distance: 110, color: c.link, opacity: light ? 0.08 : 0.12, width: 0.6 }
          },
          interactivity: {
            detectsOn: "window",
            events: { onHover: { enable: state.motion, mode: "grab" }, resize: { enable: true } },
            modes: { grab: { distance: 150, links: { opacity: light ? 0.25 : 0.35 } } }
          }
        }
      }).then(function (container) {
        if (gen !== particlesGen) { try { container.destroy(); } catch (e) { /* ignore */ } return; }
        particlesContainer = container;
      }).catch(function () { if (gen === particlesGen) startFallback(); });
    } else {
      startFallback();
    }
  }

  /* 无 CDN 时的轻量星空 / lightweight canvas fallback when the CDN is unavailable */
  function startFallback() {
    var canvas = $("#starfield-fallback");
    canvas.hidden = false;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var stars = [], shooting = null, c = starColors();
    var light = ["daylight", "paper"].indexOf(root.getAttribute("data-theme")) !== -1;

    function resize() {
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      var n = Math.round((innerWidth * innerHeight) / (light ? 16000 : 9000));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: (Math.random() * 1.2 + 0.3) * dpr, p: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 1.5 });
      }
    }
    function frame(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = c.star;
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        ctx.globalAlpha = (light ? 0.35 : 0.55) + Math.sin(st.p + time * 0.001 * st.s) * (light ? 0.2 : 0.4);
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (state.motion) {
        if (!shooting && Math.random() < 0.003) {
          shooting = { x: Math.random() * canvas.width * 0.7, y: Math.random() * canvas.height * 0.4, life: 1 };
        }
        if (shooting) {
          ctx.globalAlpha = shooting.life;
          ctx.strokeStyle = c.link;
          ctx.lineWidth = 1.2 * dpr;
          ctx.beginPath();
          ctx.moveTo(shooting.x, shooting.y);
          ctx.lineTo(shooting.x - 80 * dpr, shooting.y - 30 * dpr);
          ctx.stroke();
          shooting.x += 9 * dpr; shooting.y += 3.4 * dpr; shooting.life -= 0.02;
          if (shooting.life <= 0) shooting = null;
        }
      }
      ctx.globalAlpha = 1;
      if (state.motion) fallback.raf = requestAnimationFrame(frame);
    }
    resize();
    if (!fallback.bound) {
      fallback.bound = true;
      window.addEventListener("resize", function () { if (fallback.running) { stopStars(); startFallback(); } });
    }
    fallback.running = true;
    frame(0);
    if (state.motion) fallback.raf = requestAnimationFrame(frame);
  }

  function initStarsWhenReady() {
    var script = document.getElementById("tsparticles-lib");
    var started = false;
    function go() { if (!started) { started = true; startStars(); } }
    if (window.tsParticles) { go(); return; }
    if (script) {
      script.addEventListener("load", go);
      script.addEventListener("error", go);
    }
    /* CDN 太慢时先用后备星空 / don't wait forever on a slow CDN */
    setTimeout(function () {
      if (!started) { started = true; startFallback(); }
      else if (!particlesContainer && window.tsParticles && !fallback.running) startStars();
    }, 4000);
    /* 如果后备已启动、tsParticles 稍后到达，则切换 / upgrade when the library arrives late */
    if (script) script.addEventListener("load", function () { if (fallback.running) startStars(); });
  }

  /* ---------------- 导航 / navigation ---------------- */
  function setupNav() {
    var toggle = $("#nav-toggle");
    var nav = $("#site-nav");
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target)) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    });

    /* 滚动高亮 / scroll spy */
    if ("IntersectionObserver" in window) {
      var links = $all(".nav a");
      var map = {};
      links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            links.forEach(function (a) { a.classList.toggle("is-current", a === map[id]); });
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      ["about", "news", "publications", "projects", "activity"].forEach(function (id) {
        var node = document.getElementById(id);
        if (node) spy.observe(node);
      });

      /* 入场动画 / reveal on scroll */
      var revealer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealer.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      $all(".content > .section").forEach(function (node, i) {
        if (i === 0) return; // 首屏直接显示 / hero is visible immediately
        node.classList.add("reveal");
        revealer.observe(node);
      });

      /* 日历进入视口时再播放生长动画 / animate the calendar when it scrolls into view */
      var activityPlayed = false;
      var activityObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !activityPlayed && state.contrib) {
          activityPlayed = true;
          renderActivity(true);
          activityObs.disconnect();
        }
      }, { threshold: 0.25 });
      activityObs.observe($("#activity"));
    }
  }

  /* ---------------- 汇总渲染 / render everything ---------------- */
  function renderAll() {
    applyStaticI18n();
    renderHero();
    renderNews();
    renderPubFilters();
    renderPubs();
    renderRepos();
    refreshStars();
    renderActivity(false);
    renderCharts();
  }

  /* ---------------- 进入动画 / page-load entrance ---------------- */
  function playEntrance() {
    var reduce = !state.motion || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduce || !document.body) return;
    root.classList.add("is-entering");
    var bar = document.createElement("div");
    bar.className = "load-bar";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    function dropBar() { if (bar.parentNode) bar.parentNode.removeChild(bar); }
    bar.addEventListener("animationend", dropBar);
    window.setTimeout(dropBar, 2400);
    window.setTimeout(function () { root.classList.remove("is-entering"); }, 2600);
  }

  function init() {
    state.themePref = (function () {
      var p = new URLSearchParams(location.search).get("theme") || load("site-theme") || "system";
      return THEMES.indexOf(p) !== -1 ? p : "system";
    })();
    $all("[data-theme-option]").forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.getAttribute("data-theme-option") === state.themePref));
    });

    renderAll();
    playEntrance();
    restartTyping();
    setupThemePicker();
    setupPubs();
    setupActivityTabs();
    setupNav();

    $("#lang-toggle").addEventListener("click", function () { setLang(state.lang === "zh" ? "en" : "zh"); });
    $("#news-more").addEventListener("click", function () { state.newsExpanded = !state.newsExpanded; renderNews(); });
    $("#copy-email").addEventListener("click", function () {
      copyText(DATA.profile.email).then(function () { toast(t("pubs.copied")); }, function () { toast(t("pubs.copyFail")); });
    });

    fetchRepos().then(function () { renderRepos(); refreshStars(); renderCharts(); })
      .catch(function () { state.starsLive = false; renderRepos(); });

    fetchContributions().then(function () {
      var activity = $("#activity");
      var rect = activity.getBoundingClientRect();
      renderActivity(rect.top < innerHeight && rect.bottom > 0);
    }).catch(function () { state.contribError = true; renderActivity(false); });

    initStarsWhenReady();

    /* 主题切换时重建星空 / rebuild stars on theme change */
    var observer = new MutationObserver(function (muts) {
      muts.forEach(function (m) { if (m.attributeName === "data-theme") startStars(); });
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
