(function () {
  const SL = window.SchimmerLogic;
  const I = window.SchimmerI18n;
  const SVGNS = "http://www.w3.org/2000/svg";
  const STORE = "schimmerblasen-v1";
  const MINUS = "−";
  const unlockAll = new URLSearchParams(location.search).has("alle");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HUES = [188, 204, 164, 258, 328, 28, 210, 286, 142, 48];

  const home = document.getElementById("home");
  const levelsScreen = document.getElementById("levels");
  const play = document.getElementById("play");
  const stage = document.getElementById("stage");
  const bubblesEl = document.getElementById("bubbles");
  const linksSvg = document.getElementById("links");
  const nline = document.getElementById("nline");
  const goalEl = document.getElementById("goal");
  const feedback = document.getElementById("feedback");
  const hintBtn = document.getElementById("hint");
  const dialog = document.getElementById("done");
  const canvas = document.getElementById("motes");
  const motesCtx = canvas.getContext("2d");

  let save = load();
  let game = null;
  let closeAction = "levels";
  let ignoreClose = false;
  let resetArmed = false;
  let audioCtx = null;
  let layoutPending = false;
  let laidSize = { w: 0, h: 0 };

  const motes = Array.from({ length: 32 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 2.4 + 0.6,
    s: Math.random() * 0.012 + 0.004,
    a: Math.random() * 0.28 + 0.08,
    w: Math.random() * 0.7 + 0.2,
    p: Math.random() * Math.PI * 2,
  }));

  function emptyStars() {
    const stars = {};
    Object.keys(SL.modes).forEach((mode) => {
      stars[mode] = SL.modes[mode].levels.map(() => 0);
    });
    return stars;
  }

  function chooseLang(raw) {
    const saved = raw && raw.lang;
    if (I && I.langs.indexOf(saved) !== -1) return saved;
    const nav = (navigator.language || "de").toLowerCase().split("-")[0];
    if (I && I.langs.indexOf(nav) !== -1) return nav;
    return "de";
  }

  function load() {
    const fresh = { stars: emptyStars(), sound: true };
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(STORE) || "null");
    } catch (err) {
      raw = null;
    }
    if (raw && typeof raw === "object") {
      const stars = emptyStars();
      Object.keys(stars).forEach((mode) => {
        const incoming = raw.stars && Array.isArray(raw.stars[mode]) ? raw.stars[mode] : [];
        stars[mode] = stars[mode].map((_, i) => {
          const v = incoming[i];
          return v >= 1 && v <= 3 ? v : 0;
        });
      });
      fresh.stars = stars;
      fresh.sound = raw.sound !== "off";
    }
    if (I) I.setLang(chooseLang(raw));
    return fresh;
  }

  function persist() {
    const data = {
      stars: save.stars,
      sound: save.sound ? "on" : "off",
    };
    if (I) data.lang = I.getLang();
    localStorage.setItem(STORE, JSON.stringify(data));
  }

  function levelCopy(mode, index) {
    const level = SL.modes[mode].levels[index];
    const copy = I && I.level(mode, index);
    if (!copy) return { name: level.name, blurb: level.blurb, coach: level.coach };
    return copy;
  }

  function modeCopy(mode) {
    const spec = SL.modes[mode];
    const copy = I && I.mode(mode);
    if (!copy) return { title: spec.title, lead: spec.lead };
    return copy;
  }

  function currentMode() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return SL.modes[parts[0]] ? parts[0] : null;
  }

  function capstoneOpen() {
    if (unlockAll) return true;
    const dezi = save.stars.dezi;
    const bruch = save.stars.bruch;
    return dezi[dezi.length - 1] > 0 && bruch[bruch.length - 1] > 0;
  }

  function unlocked(mode, index) {
    if (unlockAll) return true;
    if (mode === "misch") return capstoneOpen();
    if (index === 0) return true;
    return save.stars[mode][index - 1] > 0;
  }

  function appTitle() {
    const raw = I ? I.t("appTitle") : "Zauberhafte Zahlenordnung";
    return raw.replace(/\s*\n\s*/g, " ");
  }

  function show(name) {
    home.hidden = name !== "home";
    levelsScreen.hidden = name !== "levels";
    play.hidden = name !== "play";
  }

  function go(hash) {
    const next = "#" + hash;
    if (location.hash === next) route();
    else location.hash = next;
  }

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const mode = parts[0];
    if (!SL.modes[mode]) {
      show("home");
      renderHome();
      document.title = appTitle();
      return;
    }
    if (parts[1] && /^\d+$/.test(parts[1])) {
      const index = Number(parts[1]) - 1;
      const count = SL.modes[mode].levels.length;
      if (index >= 0 && index < count && unlocked(mode, index)) {
        startLevel(mode, index);
        return;
      }
    }
    show("levels");
    renderLevels(mode);
  }

  function summary(mode) {
    const stars = save.stars[mode];
    const done = stars.filter((n) => n > 0).length;
    const total = stars.reduce((a, b) => a + b, 0);
    if (I) return I.summary(done, stars.length, total);
    const levelWord = stars.length === 1 ? "Level" : "Leveln";
    return done + " von " + stars.length + " " + levelWord + " · " + total + " von " + stars.length * 3 + " Sternen";
  }

  function fitAppTitle() {
    const h1 = document.querySelector("#home h1");
    if (!h1 || home.hidden) return;
    const wrap = h1.parentElement;
    const pad = parseFloat(getComputedStyle(wrap).paddingLeft) + parseFloat(getComputedStyle(wrap).paddingRight);
    const available = wrap.clientWidth - pad - 4;
    if (available < 8) return;
    h1.style.fontSize = "";
    let size = parseFloat(getComputedStyle(h1).fontSize);
    if (!size) return;
    const textWidth = () => {
      const range = document.createRange();
      range.selectNodeContents(h1);
      return range.getBoundingClientRect().width;
    };
    h1.style.fontSize = size + "px";
    for (let step = 0; step < 4 && textWidth() > available; step++) {
      size = Math.max(15, size * available / textWidth());
      h1.style.fontSize = size + "px";
    }
  }

  function renderHome() {
    document.getElementById("meta-dezi").textContent = summary("dezi");
    document.getElementById("meta-bruch").textContent = summary("bruch");
    const card = document.getElementById("open-misch");
    const open = capstoneOpen();
    card.disabled = !open;
    card.classList.toggle("locked", !open);
    card.classList.toggle("open", open);
    const tides = levelCopy("dezi", SL.modes.dezi.levels.length - 1).name;
    const crown = levelCopy("bruch", SL.modes.bruch.levels.length - 1).name;
    document.getElementById("meta-misch").textContent = open
      ? summary("misch")
      : (I ? I.lockedMeta(tides, crown) : "Noch zu: " + tides + " und " + crown + " abschließen");
    fitAppTitle();
  }

  function starSVG(on) {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "star " + (on ? "on" : "off"));
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVGNS, "path");
    path.setAttribute("d", "M12 2.4 14.7 8.5 21.4 9.2 16.4 13.8 17.8 20.4 12 17.1 6.2 20.4 7.6 13.8 2.6 9.2 9.3 8.5Z");
    svg.appendChild(path);
    return svg;
  }

  function renderStars(host, lit, label, big) {
    host.replaceChildren();
    host.classList.toggle("big", !!big);
    host.setAttribute("aria-label", label);
    for (let i = 0; i < 3; i++) {
      const star = starSVG(i < lit);
      if (big) star.style.animationDelay = i * 0.12 + "s";
      host.appendChild(star);
    }
  }

  function renderLevels(mode) {
    const spec = SL.modes[mode];
    const copy = modeCopy(mode);
    document.getElementById("levels-kicker").textContent = I ? I.t("choose") : "Wähle ein Level";
    document.getElementById("levels-title").textContent = copy.title;
    document.getElementById("levels-lead").textContent = copy.lead;
    document.title = copy.title + " · " + appTitle();
    const list = document.getElementById("level-list");
    list.replaceChildren();
    let markedNext = false;
    spec.levels.forEach((level, index) => {
      const open = unlocked(mode, index);
      const best = save.stars[mode][index];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level" + (open ? "" : " locked");
      btn.disabled = !open;
      if (open && best === 0 && !markedNext) {
        btn.classList.add("next-up");
        markedNext = true;
      }
      const no = document.createElement("span");
      no.className = "lvl-no";
      no.textContent = String(index + 1);
      const copy = levelCopy(mode, index);
      const name = document.createElement("span");
      name.className = "lvl-name";
      name.textContent = copy.name;
      const blurb = document.createElement("span");
      blurb.className = "lvl-blurb";
      blurb.textContent = open ? copy.blurb : (I ? I.lockedBlurb(copy.blurb) : copy.blurb + " · noch zu");
      const stars = document.createElement("span");
      stars.className = "stars";
      const lit = open ? best : 0;
      renderStars(stars, lit, I ? I.stars(lit) : lit + " von 3 Sternen");
      btn.append(no, name, stars, blurb);
      btn.addEventListener("click", () => go("/" + mode + "/" + (index + 1)));
      list.appendChild(btn);
    });
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function buildFace(item) {
    const face = document.createElement("span");
    face.className = "face";
    face.setAttribute("aria-hidden", "true");
    if (item.form === "fraction" || item.form === "mixed") {
      if (item.sign) {
        const sign = document.createElement("span");
        sign.className = "sign";
        sign.textContent = MINUS;
        face.appendChild(sign);
      }
      if (item.form === "mixed") {
        const whole = document.createElement("span");
        whole.className = "whole";
        whole.textContent = String(item.whole);
        face.appendChild(whole);
      }
      face.appendChild(stack(item.num, item.den));
    } else {
      const text = document.createElement("span");
      text.className = "deci";
      text.textContent = item.text;
      face.appendChild(text);
    }
    return face;
  }

  function stack(num, den) {
    const el = document.createElement("span");
    el.className = "stack";
    const n = document.createElement("span");
    n.className = "num";
    n.textContent = String(num);
    const bar = document.createElement("span");
    bar.className = "bar";
    const d = document.createElement("span");
    d.className = "den";
    d.textContent = String(den);
    el.append(n, bar, d);
    return el;
  }

  function fillToken(el, item) {
    el.className = "token" + (item.isNeg ? " is-neg" : "") + (item.isZero ? " is-zero" : "");
    el.replaceChildren();
    if (item.form === "fraction" || item.form === "mixed") {
      if (item.sign) {
        const sign = document.createElement("span");
        sign.className = "sign";
        sign.textContent = MINUS;
        el.appendChild(sign);
      }
      if (item.form === "mixed") {
        const whole = document.createElement("span");
        whole.className = "whole";
        whole.textContent = String(item.whole);
        el.appendChild(whole);
      }
      el.appendChild(stack(item.num, item.den));
    } else {
      el.textContent = item.text;
    }
  }

  function clearLinks() {
    Array.from(linksSvg.children).forEach((node) => {
      if (node.localName !== "defs") node.remove();
    });
  }

  function startLevel(mode, index) {
    const level = SL.modes[mode].levels[index];
    const items = SL.generateLevel(mode, index);
    const hues = shuffle(HUES);
    game = {
      mode: mode,
      index: index,
      level: level,
      items: items,
      next: 0,
      mistakes: 0,
      hints: 0,
      done: false,
      stopped: false,
      linked: [],
      segments: [],
      bubbles: [],
      t0: performance.now(),
    };
    laidSize = { w: 0, h: 0 };
    const copy = levelCopy(mode, index);
    show("play");
    document.title = copy.name + " · " + appTitle();
    document.getElementById("play-title").textContent = copy.name;
    hintBtn.disabled = false;
    bubblesEl.replaceChildren();
    clearLinks();
    const now = performance.now();
    items.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bubble" + (item.isNeg ? " is-neg" : "") + (item.isZero ? " is-zero" : "");
      btn.style.setProperty("--hue", String(hues[i % hues.length]));
      btn.style.setProperty("--spin-dur", (6 + (i % 4)) + "s");
      btn.style.setProperty("--sheen-delay", (-i * 0.7) + "s");
      btn.style.opacity = "0";
      btn.setAttribute("aria-label", item.aria);
      const sheen = document.createElement("span");
      sheen.className = "sheen";
      sheen.setAttribute("aria-hidden", "true");
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.setAttribute("aria-hidden", "true");
      btn.append(sheen, buildFace(item), badge);
      btn.addEventListener("click", () => onPick(item));
      bubblesEl.appendChild(btn);
      game.bubbles.push({
        item: item,
        el: btn,
        baseX: 0,
        baseY: 0,
        cx: 0,
        cy: 0,
        size: 90,
        born: now + i * 70,
        spx: 0.65 + (i % 5) * 0.08,
        spy: 0.55 + (i % 4) * 0.07,
        phx: i * 1.3,
        phy: i * 0.9,
        ax: 8 + (i % 3) * 2,
        ay: 9 + (i % 4) * 2,
        shakeUntil: 0,
        popUntil: 0,
      });
    });
    layout();
    renderLine();
    updateHud();
    goalEl.textContent = goalText();
    setFeedback(copy.coach, "coach", "coach");
    updateSoundButton();
  }

  function gridPlace(count, w, h, mode) {
    const cols = Math.max(1, Math.round(Math.sqrt(count * (w / Math.max(h, 1)))));
    const rows = Math.ceil(count / cols);
    const cellW = w / cols;
    const cellH = h / rows;
    const preferred = mode === "dezi" ? 92 : 108;
    const size = Math.max(58, Math.min(preferred, cellW - 26, cellH - 26));
    const amp = Math.max(4, Math.min(12, (Math.min(cellW, cellH) - size) / 5));
    const pts = [];
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const inRow = row === rows - 1 ? count - row * cols : cols;
      const offset = (w - inRow * cellW) / 2;
      const slackX = Math.max(0, (cellW - size) / 2 - amp - 4);
      const slackY = Math.max(0, (cellH - size) / 2 - amp - 4);
      const jx = slackX ? ((i * 37) % 100) / 50 * slackX - slackX : 0;
      const jy = slackY ? ((i * 53) % 100) / 50 * slackY - slackY : 0;
      pts.push({
        x: offset + (col + 0.5) * cellW + jx,
        y: (row + 0.5) * cellH + jy,
      });
    }
    return { pts: pts, size: size, amp: amp };
  }

  function layout() {
    if (!game || play.hidden) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (w < 40 || h < 40) {
      if (!layoutPending) {
        layoutPending = true;
        requestAnimationFrame(() => {
          layoutPending = false;
          layout();
        });
      }
      return;
    }
    if (Math.abs(w - laidSize.w) < 8 && Math.abs(h - laidSize.h) < 8 && game.bubbles[0].baseX) return;
    laidSize = { w: w, h: h };
    const placed = gridPlace(game.bubbles.length, w, h, game.mode);
    const pts = shuffle(placed.pts);
    const size = placed.size;
    const amp = placed.amp;
    linksSvg.setAttribute("width", String(w));
    linksSvg.setAttribute("height", String(h));
    game.bubbles.forEach((bubble, i) => {
      bubble.baseX = pts[i].x;
      bubble.baseY = pts[i].y;
      bubble.cx = pts[i].x;
      bubble.cy = pts[i].y;
      bubble.size = size;
      bubble.ax = amp;
      bubble.ay = amp * 0.85;
      bubble.el.style.setProperty("--size", size + "px");
      bubble.el.style.fontSize = (size < 90 ? 14 : 16) + "px";
    });
    applyMotion(performance.now());
  }

  function applyMotion(now) {
    if (!game) return;
    const motion = reduceMotion ? 0 : 1;
    for (const bubble of game.bubbles) {
      const age = now - bubble.born;
      let enter = age <= 0 ? 0 : Math.min(1, age / 420);
      enter = 1 - (1 - enter) ** 3;
      let ox = Math.sin(now / 1000 * bubble.spx + bubble.phx) * bubble.ax * motion;
      let oy = Math.cos(now / 1000 * bubble.spy + bubble.phy) * bubble.ay * motion;
      if (bubble.shakeUntil > now) {
        const u = 1 - (bubble.shakeUntil - now) / 460;
        ox += Math.sin(u * Math.PI * 7) * (1 - u) * 8;
      }
      const pop = bubble.popUntil > now ? Math.sin(((bubble.popUntil - now) / 280) * Math.PI) * 0.07 : 0;
      const scale = Math.max(0.001, enter) * (1 + pop);
      const tx = bubble.baseX + ox - bubble.size / 2;
      const ty = bubble.baseY + oy - bubble.size / 2;
      bubble.cx = bubble.baseX + ox;
      bubble.cy = bubble.baseY + oy;
      bubble.el.style.opacity = String(enter);
      bubble.el.style.pointerEvents = enter > 0.85 ? "auto" : "none";
      bubble.el.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
    }
    for (const seg of game.segments) {
      const d = curve(seg.a, seg.b, seg.bend);
      seg.thread.setAttribute("d", d);
      seg.pearls.setAttribute("d", d);
    }
  }

  function curve(a, b, bend) {
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const len = Math.hypot(dx, dy) || 1;
    const limitX = Math.max(8, stage.clientWidth - 8);
    const limitY = Math.max(8, stage.clientHeight - 8);
    const cx = Math.min(limitX, Math.max(8, (a.cx + b.cx) / 2 + (-dy / len) * bend));
    const cy = Math.min(limitY, Math.max(8, (a.cy + b.cy) / 2 + (dx / len) * bend));
    return "M " + a.cx + " " + a.cy + " Q " + cx + " " + cy + " " + b.cx + " " + b.cy;
  }

  function goalText() {
    const step = game ? game.next : 0;
    const total = game ? game.items.length : 0;
    if (I) return I.goal(step, total);
    if (step <= 0) return "Suche die kleinste Zahl.";
    if (step >= total - 1) return "Jetzt die größte der übrigen Zahlen.";
    return "Suche die nächstgrößere Zahl.";
  }

  function updateHud() {
    const modeTitle = modeCopy(game.mode).title;
    document.getElementById("play-kicker").textContent = I
      ? I.progress(modeTitle, game.next, game.items.length)
      : modeTitle + " · " + game.next + " von " + game.items.length;
    const possible = game.done ? game.earned : Math.max(1, 3 - game.mistakes - game.hints);
    renderStars(
      document.getElementById("live-stars"),
      possible,
      I ? I.starsLeft(possible) : possible + " von 3 Sternen noch möglich"
    );
  }

  function setFeedback(text, kind, token) {
    feedback.textContent = text;
    feedback.className = kind || "";
    if (game) game.feedbackToken = token != null ? token : (kind || "");
  }

  function wrongMessage(picked, correct) {
    const cv = SL.numeric(correct);
    const pv = SL.numeric(picked);
    const say = function (key, fallback) { return I ? I.t(key) : fallback; };
    if (cv < 0 && pv >= 0) {
      return say("wrongNeg", "Es ist noch eine Zahl unter null frei. Die ist kleiner als jede positive Zahl.");
    }
    if (cv < 0 && pv < 0) {
      return say("wrongBoth", "Beide sind negativ. Die Zahl weiter links ist kleiner. −4 ist kleiner als −1.");
    }
    if (
      correct.kind === "bruch" &&
      correct.num === 1 &&
      picked.num === 1 &&
      correct.form === "fraction" &&
      picked.form === "fraction" &&
      cv > 0 &&
      pv > 0
    ) {
      return say("wrongUnit", "Bei Stammbrüchen ist der größere Nenner der kleinere Bruch.");
    }
    if (
      correct.kind === "bruch" &&
      correct.form === "fraction" &&
      picked.form === "fraction" &&
      correct.den === picked.den
    ) {
      return say("wrongSame", "Gleicher Nenner: Der kleinere Zähler ist der kleinere Bruch.");
    }
    if (
      cv !== 0 && pv !== 0 &&
      (picked.kind !== correct.kind || picked.form !== correct.form) &&
      (picked.kind === "deci" || correct.kind === "deci" || picked.form === "mixed" || correct.form === "mixed")
    ) {
      return say("wrongForm", "Wandle in dieselbe Schreibweise um. 1/2 ist dasselbe wie 0,5.");
    }
    if (pv - cv < 0.35) return say("wrongClose", "Knapp daneben. Vergleiche noch einmal Stelle für Stelle.");
    return say("wrongBig", "Noch nicht. Diese Zahl ist größer. Suche die kleinste freie Zahl.");
  }

  function onPick(item) {
    if (!game || game.done) return;
    const bubble = game.bubbles.find((entry) => entry.item === item);
    if (item.rank < game.next) {
      setFeedback(I ? I.t("already") : "Die Blase ist schon in der Kette.", "info", "info");
      return;
    }
    if (item.rank !== game.next) {
      game.mistakes += 1;
      bubble.shakeUntil = performance.now() + 460;
      bubble.el.classList.add("nope");
      window.setTimeout(() => bubble.el.classList.remove("nope"), 460);
      playBad();
      game.lastWrong = { picked: item, correct: game.items[game.next] };
      setFeedback(wrongMessage(item, game.items[game.next]), "bad", "bad");
      if (game.mistakes >= 4) stopLevel();
      else updateHud();
      return;
    }
    connect(bubble);
    game.next += 1;
    playOk();
    setFeedback("", "", "");
    goalEl.textContent = goalText();
    updateHud();
    renderLine();
    if (game.next >= game.items.length) finish();
  }

  function connect(bubble) {
    bubble.el.classList.add("linked");
    bubble.el.classList.remove("hint");
    bubble.el.querySelector(".badge").textContent = String(bubble.item.rank + 1);
    const place = bubble.item.rank + 1;
    bubble.el.setAttribute("aria-label", I ? I.rank(bubble.item.aria, place) : bubble.item.aria + ", Stelle " + place);
    bubble.popUntil = performance.now() + 280;
    game.linked.push(bubble);
    if (game.linked.length >= 2) addSegment(game.linked[game.linked.length - 2], game.linked[game.linked.length - 1]);
    sparkle(bubble);
  }

  function addSegment(a, b) {
    const group = document.createElementNS(SVGNS, "g");
    const thread = document.createElementNS(SVGNS, "path");
    thread.setAttribute("class", "thread");
    const pearls = document.createElementNS(SVGNS, "path");
    pearls.setAttribute("class", "pearls");
    group.append(thread, pearls);
    linksSvg.appendChild(group);
    const bend = (game.segments.length % 2 === 0 ? 1 : -1) * 12;
    game.segments.push({ a: a, b: b, thread: thread, pearls: pearls, bend: bend });
  }

  function sparkle(bubble) {
    for (let i = 0; i < 8; i++) {
      const dot = document.createElement("i");
      dot.className = "spark";
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 26;
      dot.style.left = bubble.cx + "px";
      dot.style.top = bubble.cy + "px";
      dot.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      dot.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      bubblesEl.appendChild(dot);
      dot.addEventListener("animationend", () => dot.remove());
    }
  }

  function renderLine() {
    if (!game) return;
    const values = game.items.map(SL.numeric);
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const span = max - min || 1;
    const pad = span * 0.1;
    const start = min - pad;
    const end = max + pad;
    nline.replaceChildren();
    const label = document.createElement("p");
    label.className = "nline-label";
    label.textContent = I ? I.t("nline") : "Zahlenstrahl";
    const track = document.createElement("div");
    track.className = "track";
    nline.append(label, track);
    if (min < 0 && max > 0) {
      const zero = document.createElement("div");
      zero.className = "zero";
      zero.style.left = ((0 - start) / (end - start)) * 100 + "%";
      zero.textContent = "0";
      nline.appendChild(zero);
    }
    const width = nline.clientWidth || 600;
    const gap = game.mode === "dezi" ? 52 : game.mode === "misch" ? 90 : 78;
    let lastX = -999;
    game.linked.forEach((bubble) => {
      const pct = ((SL.numeric(bubble.item) - start) / (end - start)) * 100;
      const dot = document.createElement("div");
      dot.className = "dot";
      dot.style.left = pct + "%";
      const x = (pct / 100) * width;
      const zeroTick = min < 0 && max > 0 && bubble.item.isZero;
      if (x - lastX > gap && !zeroTick) {
        const caption = document.createElement("span");
        caption.textContent = SL.plain(bubble.item);
        dot.appendChild(caption);
        lastX = x;
      }
      nline.appendChild(dot);
    });
  }

  function finish() {
    game.done = true;
    game.stopped = false;
    hintBtn.disabled = true;
    game.earned = Math.max(1, 3 - game.mistakes - game.hints);
    game.prevStars = save.stars[game.mode][game.index];
    save.stars[game.mode][game.index] = Math.max(game.prevStars, game.earned);
    persist();
    game.elapsed = performance.now() - game.t0;
    renderDone();
    renderLine();
    playWin();
    closeAction = "levels";
    dialog.showModal();
  }

  function stopLevel() {
    game.done = true;
    game.stopped = true;
    game.earned = 0;
    game.prevStars = save.stars[game.mode][game.index];
    hintBtn.disabled = true;
    game.elapsed = performance.now() - game.t0;
    updateHud();
    renderDone();
    closeAction = "levels";
    dialog.showModal();
  }

  function renderDone() {
    const copy = levelCopy(game.mode, game.index);
    const earned = game.earned;
    const prev = game.prevStars;
    document.getElementById("done-kicker").textContent = copy.name;
    document.getElementById("done-stats").textContent = I
      ? I.statsLine(game.mistakes, game.hints, game.elapsed)
      : statsLine(game.elapsed);
    const seqLabel = document.getElementById("done-seq-label");
    if (game.stopped) {
      document.getElementById("done-title").textContent = I ? I.t("stoppedTitle") : "Vier Versuche sind vorbei";
      renderStars(document.getElementById("done-stars"), 0, I ? I.stars(0) : "0 von 3 Sternen", true);
      document.getElementById("done-note").textContent = I
        ? I.t("stoppedNote")
        : "Das Level stoppt nach vier Fehlern. Versuch es noch einmal.";
      document.getElementById("done-seq").replaceChildren();
      document.getElementById("done-order").textContent = "";
      seqLabel.hidden = true;
    } else {
      document.getElementById("done-title").textContent = I
        ? I.doneTitle(earned)
        : (earned === 3 ? "Wunderschön sortiert" : earned === 2 ? "Gut gelöst" : "Geschafft");
      renderStars(document.getElementById("done-stars"), earned, I ? I.stars(earned) : earned + " von 3 Sternen", true);
      document.getElementById("done-note").textContent = I ? I.note(earned, prev) : noteFor(earned, prev);
      seqLabel.hidden = false;
      const seq = document.getElementById("done-seq");
      seq.replaceChildren();
      game.items.forEach((item, i) => {
        if (i > 0) {
          const arrow = document.createElement("span");
          arrow.className = "seq-arrow";
          arrow.textContent = "→";
          seq.appendChild(arrow);
        }
        const token = document.createElement("span");
        fillToken(token, item);
        seq.appendChild(token);
      });
      const spoken = game.items.map((item) => item.aria).join(", ");
      document.getElementById("done-order").textContent = I ? I.order(spoken) : "Von klein nach groß: " + spoken;
      const last = game.index >= SL.modes[game.mode].levels.length - 1;
      const all = save.stars[game.mode].every((n) => n > 0);
      let extra = "";
      if (game.mode === "misch" && all) extra = I ? I.extraCapstone() : " Das Abschlusslevel ist geschafft.";
      else if (last && all) extra = I ? I.extraMode() : " Alle Level in diesem Modus sind geschafft.";
      if (game.mode !== "misch" && last && prev === 0 && capstoneOpen()) {
        const finale = levelCopy("misch", 0).name;
        extra += I ? I.extraOpen(finale) : " " + finale + " ist jetzt offen.";
      }
      if (extra) document.getElementById("done-note").textContent += extra;
    }
    const nextIndex = game.index + 1;
    const hasNext = nextIndex < SL.modes[game.mode].levels.length && unlocked(game.mode, nextIndex);
    document.getElementById("done-next").hidden = !hasNext;
  }

  function statsLine(ms) {
    const parts = [];
    parts.push(game.mistakes === 0 ? "keine Fehler" : game.mistakes === 1 ? "1 Fehler" : game.mistakes + " Fehler");
    if (game.hints === 1) parts.push("1 Hilfe");
    else if (game.hints > 1) parts.push(game.hints + " Hilfen");
    const seconds = Math.max(0, Math.round(ms / 1000));
    if (seconds < 60) parts.push(seconds === 1 ? "1 Sekunde" : seconds + " Sekunden");
    else parts.push(Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0"));
    return parts.join(" · ");
  }

  function noteFor(earned, prev) {
    if (earned > prev) return "Neue Bestleistung.";
    if (earned < prev) return "Deine Bestleistung bleibt bei " + prev + (prev === 1 ? " Stern." : " Sternen.");
    if (prev > 0) return "Bestleistung gehalten.";
    return "";
  }

  function giveHint() {
    if (!game || game.done || game.hints >= 2) return;
    const bubble = game.bubbles.find((entry) => entry.item.rank === game.next);
    if (!bubble) return;
    bubble.el.classList.add("hint");
    window.setTimeout(() => bubble.el.classList.remove("hint"), 2300);
    game.hints += 1;
    if (game.hints >= 2) hintBtn.disabled = true;
    updateHud();
    playHint();
    setFeedback(I ? I.t("hintNext") : "Die leuchtende Blase ist die nächste.", "coach", "hint");
  }

  function updateSoundButton() {
    const btn = document.getElementById("sound");
    btn.textContent = I ? I.sound(save.sound) : (save.sound ? "Ton an" : "Ton aus");
    btn.setAttribute("aria-pressed", save.sound ? "true" : "false");
  }

  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, when, dur, type, gain) {
    if (!save.sound) return;
    const ac = ctx();
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, when);
    amp.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function playOk() {
    if (!save.sound) return;
    const t = ctx().currentTime;
    tone(620, t, 0.12, "sine", 0.04);
    tone(930, t + 0.07, 0.16, "sine", 0.035);
  }

  function playBad() {
    if (!save.sound) return;
    tone(196, ctx().currentTime, 0.18, "triangle", 0.03);
  }

  function playHint() {
    if (!save.sound) return;
    tone(740, ctx().currentTime, 0.2, "sine", 0.03);
  }

  function playWin() {
    if (!save.sound) return;
    const t = ctx().currentTime;
    [523, 659, 784, 1046].forEach((freq, i) => tone(freq, t + i * 0.09, 0.22, "sine", 0.04));
  }

  function sizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  function drawMotes(now) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    motesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    motesCtx.clearRect(0, 0, w, h);
    const t = now / 1000;
    for (const mote of motes) {
      const x = ((mote.x + Math.sin(t * mote.w + mote.p) * 0.02) % 1) * w;
      const y = ((mote.y - t * mote.s) % 1 + 1) % 1 * h;
      motesCtx.beginPath();
      motesCtx.arc(x, y, mote.r, 0, Math.PI * 2);
      motesCtx.strokeStyle = "rgba(255,255,255," + mote.a + ")";
      motesCtx.lineWidth = 1.1;
      motesCtx.stroke();
    }
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    drawMotes(now);
    if (!game || play.hidden) return;
    applyMotion(now);
  }

  document.getElementById("open-dezi").addEventListener("click", () => go("/dezi"));
  document.getElementById("open-bruch").addEventListener("click", () => go("/bruch"));
  document.getElementById("open-misch").addEventListener("click", () => go("/misch"));
  document.getElementById("back-home").addEventListener("click", () => go("/"));
  document.getElementById("back-levels").addEventListener("click", () => {
    if (game) go("/" + game.mode);
    else go("/");
  });
  document.getElementById("rule").addEventListener("click", () => {
    if (game) setFeedback(levelCopy(game.mode, game.index).coach, "coach", "coach");
  });
  hintBtn.addEventListener("click", giveHint);
  document.getElementById("sound").addEventListener("click", () => {
    save.sound = !save.sound;
    persist();
    updateSoundButton();
    if (save.sound) playOk();
  });
  document.getElementById("reset").addEventListener("click", () => {
    const btn = document.getElementById("reset");
    if (!resetArmed) {
      resetArmed = true;
      btn.textContent = I ? I.t("resetConfirm") : "Wirklich löschen?";
      window.setTimeout(() => {
        if (!resetArmed) return;
        resetArmed = false;
        btn.textContent = I ? I.t("reset") : "Fortschritt löschen";
      }, 2500);
      return;
    }
    save.stars = emptyStars();
    persist();
    resetArmed = false;
    btn.textContent = I ? I.t("reset") : "Fortschritt löschen";
    renderHome();
  });
  document.getElementById("done-replay").addEventListener("click", () => {
    closeAction = "replay";
    dialog.close();
  });
  document.getElementById("done-next").addEventListener("click", () => {
    closeAction = "next";
    dialog.close();
  });
  document.getElementById("done-list").addEventListener("click", () => {
    closeAction = "levels";
    dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (ignoreClose) {
      ignoreClose = false;
      return;
    }
    if (!game) return;
    if (closeAction === "replay") startLevel(game.mode, game.index);
    else if (closeAction === "next") go("/" + game.mode + "/" + (game.index + 2));
    else go("/" + game.mode);
  });
  window.addEventListener("hashchange", () => {
    if (dialog.open) {
      ignoreClose = true;
      dialog.close();
    }
    route();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dialog.open && !play.hidden && game) go("/" + game.mode);
  });
  window.addEventListener("resize", () => {
    sizeCanvas();
    layout();
    fitAppTitle();
    if (game && !play.hidden) renderLine();
  });
  if (typeof ResizeObserver === "function") {
    const stageObserver = new ResizeObserver(() => {
      layout();
      if (game && !play.hidden) renderLine();
    });
    stageObserver.observe(stage);
  }

  function refreshLanguage() {
    if (!I) return;
    I.applyStatic();
    document.getElementById("hint").title = I.t("hintTitle");
    updateSoundButton();
    const resetBtn = document.getElementById("reset");
    resetBtn.textContent = resetArmed ? I.t("resetConfirm") : I.t("reset");
    if (!home.hidden) {
      document.title = appTitle();
      renderHome();
      return;
    }
    if (!levelsScreen.hidden) {
      const mode = currentMode();
      if (mode) renderLevels(mode);
      return;
    }
    if (!game) return;
    game.items.forEach((item) => SL.localizeItem(item));
    game.bubbles.forEach((bubble) => {
      const face = bubble.el.querySelector(".face");
      if (face) face.replaceWith(buildFace(bubble.item));
      const placed = bubble.item.rank < game.next;
      bubble.el.setAttribute(
        "aria-label",
        placed ? I.rank(bubble.item.aria, bubble.item.rank + 1) : bubble.item.aria
      );
    });
    const copy = levelCopy(game.mode, game.index);
    document.title = copy.name + " · " + appTitle();
    document.getElementById("play-title").textContent = copy.name;
    goalEl.textContent = goalText();
    updateHud();
    const token = game.feedbackToken || "";
    if (token === "bad" && game.lastWrong) {
      setFeedback(wrongMessage(game.lastWrong.picked, game.lastWrong.correct), "bad", "bad");
    } else if (token === "info") {
      setFeedback(I.t("already"), "info", "info");
    } else if (token === "hint") {
      setFeedback(I.t("hintNext"), "coach", "hint");
    } else if (token === "coach" || token === "") {
      setFeedback(copy.coach, "coach", "coach");
    }
    renderLine();
    if (dialog.open) renderDone();
  }

  if (I) {
    I.applyStatic();
    document.getElementById("hint").title = I.t("hintTitle");
    document.getElementById("langs").addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;
      const next = btn.getAttribute("data-lang");
      if (!next || next === I.getLang()) return;
      I.setLang(next);
      persist();
      refreshLanguage();
    });
  }

  sizeCanvas();
  updateSoundButton();
  requestAnimationFrame(loop);
  route();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAppTitle);
})();
