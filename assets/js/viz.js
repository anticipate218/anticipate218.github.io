/*
 * 科研数据可视化 / Data visualizations
 *  - 等距贡献日历 Isometric contribution calendar (inspired by lowlighter/metrics)
 *  - 单篇引用条形图 Citations bar chart
 *  - 环形分布图 Donut charts
 * 纯 SVG，无第三方依赖 / pure SVG, no dependencies.
 */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG_NS, name);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function cssVar(name, scope) {
    return getComputedStyle(scope || document.documentElement).getPropertyValue(name).trim();
  }

  /* 把任意 CSS 颜色解析为 [r,g,b,a] / resolve any CSS color to rgba numbers */
  var probe = null;
  function parseColor(value) {
    if (!probe) {
      probe = document.createElement("span");
      probe.style.display = "none";
      document.body.appendChild(probe);
    }
    probe.style.color = "";
    probe.style.color = value;
    var out = getComputedStyle(probe).color || "rgb(0,0,0)";
    var m = out.match(/rgba?\(([^)]+)\)/);
    if (!m) return [0, 0, 0, 1];
    var parts = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts.length > 3 ? parts[3] : 1];
  }

  function shade(rgba, factor) {
    return "rgba(" + Math.round(rgba[0] * factor) + "," + Math.round(rgba[1] * factor) + "," +
      Math.round(rgba[2] * factor) + "," + rgba[3] + ")";
  }

  function rgbaStr(rgba) {
    return "rgba(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + "," + rgba[3] + ")";
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function parseISO(s) {
    var p = s.split("-");
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }

  /* ---------------- 贡献统计 / contribution stats ---------------- */
  function computeStats(days, todayISO) {
    var total = 0, active = 0, best = { count: 0, date: null };
    var longest = 0, run = 0;
    days.forEach(function (d) {
      total += d.count;
      if (d.count > 0) {
        active += 1;
        run += 1;
        if (run > longest) longest = run;
        if (d.count > best.count) best = { count: d.count, date: d.date };
      } else {
        run = 0;
      }
    });
    /* 当前连续：从今天（若今天为 0 则从昨天）向前数 / current streak counted back from today or yesterday */
    var idx = days.length - 1;
    while (idx >= 0 && days[idx].date > todayISO) idx -= 1;
    if (idx >= 0 && days[idx].count === 0) idx -= 1;
    var current = 0;
    while (idx >= 0 && days[idx].count > 0) { current += 1; idx -= 1; }
    return { total: total, active: active, longest: longest, current: current, best: best };
  }

  /* ---------------- 等距日历 / isometric calendar ---------------- */
  function renderIsoCalendar(container, days, opts) {
    opts = opts || {};
    var t = opts.t || function (k) { return k; };
    var lang = opts.lang || "zh";
    var tooltip = opts.tooltip || null;
    var animate = opts.animate !== false;

    container.innerHTML = "";
    if (!days || !days.length) return;

    var colors = [0, 1, 2, 3, 4].map(function (i) { return parseColor(cssVar("--c" + i)); });
    var max = days.reduce(function (m, d) { return Math.max(m, d.count); }, 0) || 1;

    var s = 11;                     // tile edge
    var dx = s * 0.866, dy = s * 0.5;
    var gap = 0.86;                 // tile shrink factor
    var maxH = 46;

    var first = parseISO(days[0].date);
    var offset = first.getUTCDay();  // 0 = Sunday
    var cells = days.map(function (d, i) {
      var k = i + offset;
      var w = Math.floor(k / 7), r = k % 7;
      var level = typeof d.level === "number" ? d.level : (d.count === 0 ? 0 : Math.min(4, Math.ceil(d.count / max * 4)));
      var h = d.count > 0 ? 3 + Math.sqrt(d.count / max) * maxH : 1.6;
      return { w: w, r: r, d: d, level: level, h: h };
    });
    var weeks = cells[cells.length - 1].w + 1;

    var minX = -(6 + 1) * dx - 4, maxX = (weeks - 1 + 1) * dx + 4;
    var minY = -maxH - 10, maxY = (weeks - 1 + 6) * dy + 2 * dy + 16;
    var width = maxX - minX, height = maxY - minY;

    var svg = el("svg", {
      viewBox: [minX, minY, width, height].map(function (v) { return v.toFixed(1); }).join(" "),
      role: "img",
      "aria-label": t("activity.total") + ": " + days.reduce(function (a, b) { return a + b.count; }, 0)
    });

    /* 月份标签 / month labels along the week axis */
    var labelGroup = el("g", { "aria-hidden": "true" }, svg);
    var lastMonth = -1;
    var monthsZh = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    var monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    cells.forEach(function (c) {
      if (c.r !== 0) return;
      var m = parseISO(c.d.date).getUTCMonth();
      if (m !== lastMonth && c.w > 0 && c.w < weeks - 1) {
        lastMonth = m;
        var x = (c.w - (-1.6)) * dx, y = (c.w + (-1.6)) * dy;
        var txt = el("text", { x: x.toFixed(1), y: y.toFixed(1), class: "month-label", "text-anchor": "middle" }, labelGroup);
        txt.textContent = (lang === "zh" ? monthsZh : monthsEn)[m];
      } else if (lastMonth === -1) {
        lastMonth = m;
      }
    });

    /* 由远及近绘制 / painter's order: back to front */
    var order = cells.slice().sort(function (a, b) { return (a.w + a.r) - (b.w + b.r) || a.w - b.w; });
    var root = el("g", {}, svg);

    order.forEach(function (c) {
      var x0 = (c.w - c.r) * dx, y0 = (c.w + c.r) * dy;
      var cx = x0, cy = y0 + dy;                 // tile centre on ground
      var hx = dx * gap, hy = dy * gap, h = c.h;
      var top = [[cx, cy - hy - h], [cx + hx, cy - h], [cx, cy + hy - h], [cx - hx, cy - h]];
      var left = [[cx - hx, cy - h], [cx, cy + hy - h], [cx, cy + hy], [cx - hx, cy]];
      var right = [[cx, cy + hy - h], [cx + hx, cy - h], [cx + hx, cy], [cx, cy + hy]];
      var col = colors[c.level] || colors[0];

      var g = el("g", {
        class: "cell",
        tabindex: c.d.count > 0 ? "0" : "-1",
        "data-date": c.d.date,
        "data-count": String(c.d.count)
      }, root);
      if (animate) g.style.animationDelay = (c.w * 14 + c.r * 6) + "ms";

      function pts(arr) { return arr.map(function (p) { return p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" "); }
      el("polygon", { points: pts(left), fill: shade(col, 0.72) }, g);
      el("polygon", { points: pts(right), fill: shade(col, 0.52) }, g);
      el("polygon", { points: pts(top), fill: rgbaStr(col) }, g);
      var title = el("title", {}, g);
      title.textContent = c.d.count + " " + t("activity.contributions") + " " + t("activity.on") + " " + c.d.date;
    });

    container.appendChild(svg);
    container.classList.toggle("is-animated", !!animate);

    /* 悬停提示 / hover tooltip */
    if (tooltip) {
      var stage = tooltip.parentElement;
      var show = function (target, clientX, clientY) {
        var date = target.getAttribute("data-date");
        var count = target.getAttribute("data-count");
        tooltip.textContent = count + " " + t("activity.contributions") + " · " + date;
        var rect = stage.getBoundingClientRect();
        var x = clientX, y = clientY;
        if (x == null) {
          var b = target.getBoundingClientRect();
          x = b.left + b.width / 2; y = b.top;
        }
        var left = Math.min(Math.max(x - rect.left, 70), rect.width - 70);
        tooltip.style.left = left + "px";
        tooltip.style.top = (y - rect.top) + "px";
        tooltip.hidden = false;
      };
      svg.addEventListener("mousemove", function (e) {
        var g = e.target.closest ? e.target.closest(".cell") : null;
        if (g) show(g, e.clientX, e.clientY); else tooltip.hidden = true;
      });
      svg.addEventListener("mouseleave", function () { tooltip.hidden = true; });
      svg.addEventListener("focusin", function (e) {
        var g = e.target.closest ? e.target.closest(".cell") : null;
        if (g) show(g);
      });
      svg.addEventListener("focusout", function () { tooltip.hidden = true; });
    }
  }

  /* ---------------- 条形图 / horizontal bar chart ---------------- */
  function renderBars(container, items, opts) {
    opts = opts || {};
    container.innerHTML = "";
    if (!items.length) return;
    var W = 420, rowH = 30, labelW = 150, valueW = 30;
    var H = items.length * rowH + 4;
    var max = items.reduce(function (m, i) { return Math.max(m, i.value); }, 0) || 1;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.label || "" });
    var defs = el("defs", {}, svg);
    var grad = el("linearGradient", { id: "barGrad", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
    el("stop", { offset: "0", "stop-color": cssVar("--accent") }, grad);
    el("stop", { offset: "1", "stop-color": cssVar("--accent-2") }, grad);

    items.forEach(function (item, i) {
      var y = i * rowH + 4;
      var g = el("g", { class: "bar-row" }, svg);
      var label = el("text", { x: 0, y: y + 15, "dominant-baseline": "middle" }, g);
      label.textContent = item.label.length > 22 ? item.label.slice(0, 21) + "…" : item.label;
      var tt = el("title", {}, g);
      tt.textContent = item.full || item.label;
      var trackW = W - labelW - valueW - 8;
      el("rect", { class: "track", x: labelW, y: y + 7, width: trackW, height: 16, rx: 5 }, g);
      var fill = el("rect", { class: "fill", x: labelW, y: y + 7, width: 0, height: 16, rx: 5, fill: "url(#barGrad)" }, g);
      var target = Math.max(4, trackW * item.value / max);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { fill.setAttribute("width", target.toFixed(1)); });
      });
      var val = el("text", { class: "val", x: W - valueW + 6, y: y + 15, "dominant-baseline": "middle" }, g);
      val.textContent = String(item.value);
    });
    container.appendChild(svg);
  }

  /* ---------------- 环形图 / donut chart ---------------- */
  function renderDonut(container, items, opts) {
    opts = opts || {};
    container.innerHTML = "";
    var total = items.reduce(function (a, b) { return a + b.value; }, 0);
    if (!total) return;
    var size = 160, r = 58, stroke = 20, c = 2 * Math.PI * r;
    var svg = el("svg", { viewBox: "0 0 " + size + " " + size, role: "img", "aria-label": opts.label || "", style: "max-width:170px;margin:0 auto" });
    el("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: cssVar("--c0"), "stroke-width": stroke }, svg);
    var acc = 0;
    items.forEach(function (item) {
      var frac = item.value / total;
      var seg = el("circle", {
        cx: size / 2, cy: size / 2, r: r, fill: "none",
        stroke: item.color, "stroke-width": stroke,
        "stroke-dasharray": (c * frac - 2).toFixed(2) + " " + (c - c * frac + 2).toFixed(2),
        "stroke-dashoffset": (-c * acc).toFixed(2),
        transform: "rotate(-90 " + size / 2 + " " + size / 2 + ")",
        "stroke-linecap": "butt"
      }, svg);
      var tt = el("title", {}, seg);
      tt.textContent = item.label + ": " + item.value;
      acc += frac;
    });
    var center = el("text", { x: size / 2, y: size / 2 - 2, "text-anchor": "middle", class: "donut-center" }, svg);
    center.textContent = String(opts.centerValue != null ? opts.centerValue : total);
    var sub = el("text", { x: size / 2, y: size / 2 + 16, "text-anchor": "middle", class: "donut-sub" }, svg);
    sub.textContent = opts.centerLabel || "";
    container.appendChild(svg);

    var ul = document.createElement("ul");
    ul.className = "donut-legend";
    items.forEach(function (item) {
      var li = document.createElement("li");
      var i = document.createElement("i");
      i.style.background = item.color;
      var span = document.createElement("span");
      span.textContent = item.label;
      var b = document.createElement("b");
      b.textContent = String(item.value);
      li.appendChild(i); li.appendChild(span); li.appendChild(b);
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  window.Viz = {
    computeStats: computeStats,
    renderIsoCalendar: renderIsoCalendar,
    renderBars: renderBars,
    renderDonut: renderDonut,
    cssVar: cssVar,
    pad: pad
  };
})();
