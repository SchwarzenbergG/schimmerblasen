/* Schimmerblasen — rationale Zahlen vergleichen und ordnen (Klasse 6).
   All values stay exact fractions. Decimals are hundredths or tenths. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SchimmerLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MINUS = "−";

  const DEN_WORDS = {
    2: "Halb",
    3: "Drittel",
    4: "Viertel",
    5: "Fünftel",
    6: "Sechstel",
    7: "Siebtel",
    8: "Achtel",
    9: "Neuntel",
    10: "Zehntel",
    12: "Zwölftel",
    14: "Vierzehntel",
    15: "Fünfzehntel",
    16: "Sechzehntel",
    18: "Achtzehntel",
  };

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  function reduce(n, d) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    if (n === 0) return { n: 0, d: 1 };
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
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

  function compare(a, b) {
    return a.n * b.d - b.n * a.d;
  }

  function numeric(item) {
    return item.n / item.d;
  }

  function separated(a, b, minGap) {
    const left = Math.abs(a.n * b.d - b.n * a.d) * 100000;
    const right = Math.round(minGap * 100000) * a.d * b.d;
    return left >= right;
  }

  function localeApi() {
    const host = typeof globalThis !== "undefined" ? globalThis : null;
    return host && host.SchimmerI18n ? host.SchimmerI18n : null;
  }

  function decimalSep() {
    const api = localeApi();
    return api ? api.decimalSep() : ",";
  }

  function speakMinus() {
    const api = localeApi();
    return api ? api.speech().minus : "minus";
  }

  function speakComma() {
    const api = localeApi();
    return api ? api.speech().comma : "Komma";
  }

  function speakAnd() {
    const api = localeApi();
    return api ? api.speech().and : "und";
  }

  function formatDecimal(n, d) {
    const sign = n < 0 ? MINUS : "";
    const abs = Math.abs(n);
    const ip = Math.floor(abs / d);
    const rem = abs % d;
    const sep = decimalSep();
    if (rem === 0) return sign + String(ip);
    if (d === 100 && rem % 10 === 0) return sign + ip + sep + String(rem / 10);
    const digits = d === 100 ? 2 : 1;
    return sign + ip + sep + String(rem).padStart(digits, "0");
  }

  function ariaDecimal(text) {
    const neg = text.startsWith(MINUS);
    const body = neg ? text.slice(1) : text;
    const parts = body.split(decimalSep());
    let spoken = (neg ? speakMinus() + " " : "") + parts[0];
    if (parts[1]) spoken += " " + speakComma() + " " + parts[1].split("").join(" ");
    return spoken;
  }

  function denWord(num, den) {
    const api = localeApi();
    if (api) return api.speech().denWord(num, den);
    if (den === 2) return num === 1 ? "Halb" : "Halbe";
    return DEN_WORDS[den] || den + "tel";
  }

  function numWord(num) {
    const api = localeApi();
    if (api) return api.speech().numWord(num);
    return num === 1 ? "ein" : String(num);
  }

  function ariaFrac(neg, num, den) {
    return (neg ? speakMinus() + " " : "") + numWord(num) + " " + denWord(num, den);
  }

  function ariaMixed(neg, whole, num, den) {
    return (neg ? speakMinus() + " " : "") + whole + " " + speakAnd() + " " + numWord(num) + " " + denWord(num, den);
  }

  function deciItem(n, d) {
    const text = formatDecimal(n, d);
    return {
      kind: "deci",
      n: n,
      d: d,
      form: "decimal",
      text: text,
      sign: "",
      whole: 0,
      num: 0,
      den: 1,
      isNeg: n < 0,
      isZero: n === 0,
      aria: ariaDecimal(text),
    };
  }

  function makeBruch(n, d, display) {
    const reduced = reduce(n, d);
    n = reduced.n;
    d = reduced.d;
    const neg = n < 0;
    const absN = Math.abs(n);
    const base = {
      kind: "bruch",
      n: n,
      d: d,
      isNeg: neg,
      isZero: n === 0,
      text: "",
      sign: "",
      whole: 0,
      num: 0,
      den: 1,
    };
    if (n === 0 || absN % d === 0) {
      const ip = absN / d;
      const text = (neg ? MINUS : "") + String(ip);
      return Object.assign(base, { form: "integer", text: text, aria: (neg ? speakMinus() + " " : "") + String(ip) });
    }
    if (display === "mixed" && absN > d) {
      const whole = Math.floor(absN / d);
      const rem = absN % d;
      const g = gcd(rem, d);
      const num = rem / g;
      const den = d / g;
      return Object.assign(base, {
        form: "mixed",
        sign: neg ? MINUS : "",
        whole: whole,
        num: num,
        den: den,
        aria: ariaMixed(neg, whole, num, den),
      });
    }
    return Object.assign(base, {
      form: "fraction",
      sign: neg ? MINUS : "",
      num: absN,
      den: d,
      aria: ariaFrac(neg, absN, d),
    });
  }

  function unreducedKs(num, den) {
    const ks = [];
    for (let k = 2; k <= 4; k++) {
      if (num * k <= 16 && den * k <= 16) ks.push(k);
    }
    return ks;
  }

  function integerCount(list) {
    return list.filter((it) => it.n % it.d === 0).length;
  }

  function hundredthsCount(list) {
    return list.filter((it) => it.d === 100 && Math.abs(it.n) % 10 !== 0).length;
  }

  function hasClosePair(list, maxGap) {
    const values = list.map(numeric).sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      const diff = values[i] - values[i - 1];
      if (diff > 1e-6 && diff <= maxGap + 1e-6) return true;
    }
    return false;
  }

  function deciCandidates(spec) {
    const d = spec.places === 1 ? 10 : 100;
    const lo = Math.ceil(spec.min * d - 1e-6);
    const hi = Math.floor(spec.max * d + 1e-6);
    const out = [];
    for (let n = lo; n <= hi; n++) out.push({ n: n, d: d, kind: "deci" });
    return out;
  }

  function findClosePair(cands, minGap, maxGap) {
    const sorted = cands.slice().sort(compare);
    if (sorted.length < 2) return null;
    const start = Math.floor(Math.random() * sorted.length);
    for (let step = 0; step < sorted.length; step++) {
      const i = (start + step) % sorted.length;
      const a = sorted[i];
      const av = numeric(a);
      for (let j = i + 1; j < sorted.length; j++) {
        const diff = numeric(sorted[j]) - av;
        if (diff > maxGap + 1e-9) break;
        if (diff + 1e-9 >= minGap) return [a, sorted[j]];
      }
    }
    return null;
  }

  function pickSpread(cands, count, minGap, options) {
    const pre = options.pre || [];
    const groups = options.groups || [];
    const accept = options.accept || function () { return true; };
    let gap = minGap;
    for (let relax = 0; relax < 8; relax++) {
      for (let trial = 0; trial < 40; trial++) {
        const picked = pre.slice();
        let failed = false;
        for (let g = 0; g < groups.length; g++) {
          const group = groups[g];
          let need = group.min - picked.filter(group.test).length;
          if (need <= 0) continue;
          const pool = shuffle(group.items);
          for (let k = 0; k < pool.length && need > 0; k++) {
            const it = pool[k];
            if (picked.some((p) => p.n === it.n && p.d === it.d)) continue;
            if (picked.every((p) => separated(p, it, gap))) {
              picked.push(it);
              need--;
            }
          }
          if (need > 0) {
            failed = true;
            break;
          }
        }
        if (failed) continue;
        const pool = shuffle(cands);
        for (let k = 0; k < pool.length && picked.length < count; k++) {
          const it = pool[k];
          if (picked.some((p) => p.n === it.n && p.d === it.d)) continue;
          if (picked.every((p) => separated(p, it, gap))) picked.push(it);
        }
        if (picked.length < count) continue;
        const slice = picked.slice(0, count);
        if (accept(slice)) return slice;
      }
      gap *= 0.82;
    }
    return null;
  }

  function allTightChains(cands, count, minGap, spanLimit) {
    const sorted = cands.slice().sort(compare);
    const chains = [];
    for (let i = 0; i < sorted.length; i++) {
      const picked = [sorted[i]];
      for (let j = i + 1; j < sorted.length && picked.length < count; j++) {
        if (separated(picked[picked.length - 1], sorted[j], minGap)) picked.push(sorted[j]);
      }
      if (picked.length === count) {
        const span = numeric(picked[picked.length - 1]) - numeric(picked[0]);
        if (span <= spanLimit + 1e-9) chains.push(picked);
      }
    }
    return chains;
  }

  function pickTight(cands, count, minGap, spanLimit, accept) {
    let gap = minGap;
    let span = spanLimit;
    for (let relax = 0; relax < 7; relax++) {
      const chains = shuffle(allTightChains(cands, count, gap, span));
      for (let i = 0; i < chains.length; i++) {
        if (accept(chains[i])) return chains[i];
      }
      gap *= 0.85;
      span *= 1.15;
    }
    return null;
  }

  function acceptDeci(spec, list) {
    if (spec.maxIntegers != null && integerCount(list) > spec.maxIntegers) return false;
    if (spec.minHundredths && hundredthsCount(list) < spec.minHundredths) return false;
    if (spec.minNeg && list.filter((it) => it.n < 0).length < spec.minNeg) return false;
    if (spec.minPos && list.filter((it) => it.n > 0).length < spec.minPos) return false;
    if (spec.anchorZero && !list.some((it) => it.n === 0)) return false;
    if (spec.nearZero && !list.some((it) => {
      const v = Math.abs(numeric(it));
      return v > 0 && v < 1;
    })) return false;
    if (spec.closePair && !hasClosePair(list, spec.closePair)) return false;
    if (spec.positive && list.some((it) => it.n <= 0)) return false;
    return true;
  }

  function genDeci(spec) {
    const cands = deciCandidates(spec);
    const accept = function (list) { return acceptDeci(spec, list); };
    let raw = null;
    if (spec.tight) {
      raw = pickTight(cands, spec.count, spec.minGap, spec.spanLimit, accept);
    } else {
      const pre = [];
      if (spec.anchorZero) {
        const zero = cands.find((it) => it.n === 0);
        if (zero) pre.push(zero);
      }
      if (spec.closePair) {
        let pool = cands;
        if (spec.maxIntegers === 0 || (spec.anchorZero && spec.maxIntegers <= 1)) {
          pool = cands.filter((it) => it.n % it.d !== 0);
        }
        const pair = findClosePair(pool, spec.minGap, spec.closePair);
        if (pair) pre.push(pair[0], pair[1]);
      }
      const groups = [];
      if (spec.minNeg) {
        groups.push({ min: spec.minNeg, test: function (it) { return it.n < 0; }, items: cands.filter((it) => it.n < 0) });
      }
      if (spec.minPos) {
        groups.push({ min: spec.minPos, test: function (it) { return it.n > 0; }, items: cands.filter((it) => it.n > 0) });
      }
      raw = pickSpread(cands, spec.count, spec.minGap, { pre: pre, groups: groups, accept: accept });
    }
    if (!raw) return null;
    return raw.map((it) => deciItem(it.n, it.d));
  }

  function fracPool(dens, nRange) {
    const map = new Map();
    for (let i = 0; i < dens.length; i++) {
      const d = dens[i];
      const bounds = nRange(d);
      for (let n = bounds[0]; n <= bounds[1]; n++) {
        if (n === 0) continue;
        const r = reduce(n, d);
        map.set(r.n + "/" + r.d, { n: r.n, d: r.d, kind: "bruch" });
      }
    }
    return Array.from(map.values());
  }

  function decorate(raw, policy) {
    if (!raw) return null;
    const items = raw.map((r) => ({ n: r.n, d: r.d }));
    const improp = [];
    for (let i = 0; i < items.length; i++) {
      const absN = Math.abs(items[i].n);
      if (absN > items[i].d && absN % items[i].d !== 0) improp.push(i);
    }
    const mixedNeed = policy.minMixed || 0;
    const impropShown = policy.minImproperShown || 0;
    if (improp.length < mixedNeed + impropShown) return null;
    const mixedAt = new Set(shuffle(improp).slice(0, mixedNeed));
    const display = items.map((it) => {
      const absN = Math.abs(it.n);
      if (it.n === 0 || absN % it.d === 0) return "integer";
      return "fraction";
    });
    mixedAt.forEach((index) => {
      display[index] = "mixed";
    });
    const made = items.map((it, i) => makeBruch(it.n, it.d, display[i]));
    const needUn = policy.minUnreduced || 0;
    if (needUn) {
      const opts = [];
      for (let i = 0; i < made.length; i++) {
        if (made[i].form !== "fraction") continue;
        const ks = unreducedKs(made[i].num, made[i].den);
        if (ks.length) opts.push({ i: i, ks: ks });
      }
      if (opts.length < needUn) return null;
      const chosen = shuffle(opts).slice(0, needUn);
      for (let u = 0; u < chosen.length; u++) {
        const pick = chosen[u];
        const k = pick.ks[Math.floor(Math.random() * pick.ks.length)];
        const it = made[pick.i];
        it.num *= k;
        it.den *= k;
        it.aria = ariaFrac(!!it.sign, it.num, it.den);
      }
    }
    return made;
  }

  function genSameDen(count) {
    const den = shuffle([8, 9, 10, 12])[0];
    const nums = shuffle(range(1, den - 1)).slice(0, count);
    return nums.map((n) => {
      const item = makeBruch(n, den, "fraction");
      item.num = n;
      item.den = den;
      item.aria = ariaFrac(false, n, den);
      return item;
    });
  }

  function genUnit(count) {
    const dens = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]).slice(0, count);
    return dens.map((d) => makeBruch(1, d, "fraction"));
  }

  function range(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }

  function genProper(spec) {
    const pool = fracPool([2, 3, 4, 5, 6, 8, 10], function (d) { return [1, d - 1]; });
    const raw = pickSpread(pool, spec.count, spec.minGap, {
      accept: function (list) {
        return list.every((it) => it.n > 0 && Math.abs(it.n) < it.d);
      },
    });
    return decorate(raw, { minUnreduced: spec.minUnreduced || 0 });
  }

  function genMixedLevel(spec) {
    const pool = fracPool([2, 3, 4, 5, 6, 8], function (d) { return [1, d * 3]; });
    const raw = pickSpread(pool, spec.count, spec.minGap, {
      accept: function (list) {
        if (integerCount(list) > 1) return false;
        const below = list.filter((it) => numeric(it) > 0 && numeric(it) < 1).length;
        const above = list.filter((it) => {
          const a = Math.abs(it.n);
          return a > it.d && a % it.d !== 0;
        }).length;
        return below >= 1 && above >= 3 && list.every((it) => it.n > 0);
      },
    });
    return decorate(raw, { minMixed: 2, minImproperShown: 1, minUnreduced: 1 });
  }

  function genNegative(spec) {
    const pool = fracPool([2, 3, 4, 5, 6, 8], function (d) {
      return [-Math.floor(d * 1.5), Math.floor(d * 1.5)];
    }).filter((it) => it.n % it.d !== 0);
    const zero = { n: 0, d: 1, kind: "bruch" };
    const raw = pickSpread(pool, spec.count, spec.minGap, {
      pre: [zero],
      groups: [
        { min: 3, test: function (it) { return it.n < 0; }, items: pool.filter((it) => it.n < 0) },
        { min: 3, test: function (it) { return it.n > 0; }, items: pool.filter((it) => it.n > 0) },
      ],
      accept: function (list) {
        return integerCount(list) <= 1 && list.some((it) => it.n < 0) && list.some((it) => it.n > 0);
      },
    });
    return decorate(raw, { minMixed: 0, minUnreduced: 0 });
  }

  function genClose(spec) {
    const pool = fracPool([5, 6, 8, 10, 12], function (d) { return [1, Math.floor(d * 1.4)]; });
    const raw = pickTight(pool, spec.count, spec.minGap, spec.spanLimit, function (list) {
      return list.every((it) => it.n > 0);
    });
    return decorate(raw, { minUnreduced: 1 });
  }

  function genCapstone(spec) {
    const pool = fracPool([2, 3, 4, 5, 6, 8, 10], function (d) { return [-2 * d, 2 * d]; })
      .filter((it) => it.n % it.d !== 0);
    const raw = pickSpread(pool, spec.count, spec.minGap, {
      groups: [
        { min: 3, test: function (it) { return it.n < 0; }, items: pool.filter((it) => it.n < 0) },
        { min: 3, test: function (it) { return it.n > 0; }, items: pool.filter((it) => it.n > 0) },
      ],
      accept: function (list) {
        const big = list.filter((it) => Math.abs(it.n) > it.d && Math.abs(it.n) % it.d !== 0).length;
        const neg = list.filter((it) => it.n < 0).length;
        const pos = list.filter((it) => it.n > 0).length;
        return big >= 2 && neg >= 3 && pos >= 3;
      },
    });
    return decorate(raw, { minMixed: 2, minUnreduced: 1 });
  }

  function valueKey(n, d) {
    const reduced = reduce(n, d);
    return reduced.n + "/" + reduced.d;
  }

  function addUnique(list, seen, item) {
    const key = valueKey(item.n, item.d);
    if (seen.has(key)) return;
    seen.add(key);
    list.push(item);
  }

  function mischPool() {
    const list = [];
    const seen = new Set();
    [
      [-25, 10], [-15, 10], [-8, 10], [-5, 10], [-35, 100],
      [0, 10],
      [4, 10], [6, 10], [35, 100], [65, 100], [85, 100],
      [15, 10], [25, 10],
    ].forEach((pair) => addUnique(list, seen, deciItem(pair[0], pair[1])));
    [
      [-4, 3], [-3, 4], [-2, 3], [-1, 3], [-1, 4], [-3, 8], [-5, 6],
      [1, 5], [1, 4], [1, 3], [1, 2], [3, 8], [2, 3], [3, 4], [4, 5], [5, 6], [7, 8],
    ].forEach((pair) => addUnique(list, seen, makeBruch(pair[0], pair[1], "fraction")));
    [
      [5, 4], [6, 5], [5, 3], [7, 4], [7, 5], [8, 5], [9, 5], [7, 3], [8, 3], [9, 4],
    ].forEach((pair) => addUnique(list, seen, makeBruch(pair[0], pair[1], "mixed")));
    return list;
  }

  function findCrossPair(decimals, others, minGap, maxGap) {
    const left = shuffle(decimals);
    const right = shuffle(others);
    for (let i = 0; i < left.length; i++) {
      for (let j = 0; j < right.length; j++) {
        const diff = Math.abs(numeric(left[i]) - numeric(right[j]));
        if (diff + 1e-9 >= minGap && diff <= maxGap + 1e-9) return [left[i], right[j]];
      }
    }
    return null;
  }

  function hasCrossClose(list, maxGap) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (list[i].kind === list[j].kind) continue;
        const diff = Math.abs(numeric(list[i]) - numeric(list[j]));
        if (diff > 1e-6 && diff <= maxGap + 1e-6) return true;
      }
    }
    return false;
  }

  function genMisch(spec) {
    const pool = mischPool();
    const zero = pool.find((it) => it.n === 0);
    const decimals = pool.filter((it) => it.kind === "deci" && it.n !== 0);
    const hundredths = decimals.filter((it) => it.d === 100 && Math.abs(it.n) % 10 !== 0);
    const fractions = pool.filter((it) => it.form === "fraction");
    const mixed = pool.filter((it) => it.form === "mixed");
    const pair = findCrossPair(decimals, fractions.concat(mixed), spec.minGap, spec.closePair);
    const pre = pair ? [zero, pair[0], pair[1]] : [zero];
    return pickSpread(pool, spec.count, spec.minGap, {
      pre: pre,
      groups: [
        { min: 2, test: function (it) { return it.kind === "deci" && it.n !== 0; }, items: decimals },
        { min: 1, test: function (it) { return it.kind === "deci" && it.d === 100 && Math.abs(it.n) % 10 !== 0; }, items: hundredths },
        { min: 2, test: function (it) { return it.form === "fraction"; }, items: fractions },
        { min: 1, test: function (it) { return it.form === "mixed"; }, items: mixed },
        { min: 2, test: function (it) { return it.n < 0; }, items: pool.filter((it) => it.n < 0) },
        { min: 3, test: function (it) { return it.n > 0; }, items: pool.filter((it) => it.n > 0) },
      ],
      accept: function (list) {
        return list.some((it) => it.n === 0)
          && list.filter((it) => it.kind === "deci" && it.n !== 0).length >= 2
          && list.filter((it) => it.form === "fraction").length >= 2
          && list.filter((it) => it.form === "mixed").length >= 1
          && list.filter((it) => it.n < 0).length >= 2
          && list.filter((it) => it.n > 0).length >= 3
          && list.some((it) => it.kind === "deci" && it.d === 100 && Math.abs(it.n) % 10 !== 0)
          && hasCrossClose(list, spec.closePair);
      },
    });
  }

  function mischFallback() {
    return [
      deciItem(-15, 10),
      makeBruch(-3, 4, "fraction"),
      deciItem(0, 10),
      makeBruch(2, 5, "fraction"),
      deciItem(65, 100),
      makeBruch(3, 4, "fraction"),
      makeBruch(5, 4, "mixed"),
    ];
  }

  const DEZI = [
    {
      name: "Seichte Lagune",
      blurb: "Positive Zahlen mit einer Nachkommastelle.",
      coach: "Tippe die kleinste Zahl zuerst, danach immer die nächstgrößere.",
      count: 5, min: 0.3, max: 9.2, places: 1, minGap: 1, maxIntegers: 1, positive: true,
      build: function () { return genDeci(this); },
    },
    {
      name: "Helle Bucht",
      blurb: "Bis zu zwei Stellen nach dem Komma.",
      coach: "Vergleiche erst die Einer, dann die Zehntel, dann die Hundertstel.",
      count: 6, min: 0.15, max: 9.8, places: 2, minGap: 0.75, maxIntegers: 1, minHundredths: 3, positive: true,
      build: function () { return genDeci(this); },
    },
    {
      name: "Nahe Nachbarn",
      blurb: "Die Zahlen liegen eng beieinander.",
      coach: "Die Zahlen liegen nah beieinander. Vergleiche sie Stelle für Stelle.",
      count: 7, min: 0.4, max: 4.6, places: 2, minGap: 0.16, maxIntegers: 0, minHundredths: 4, positive: true,
      tight: true, spanLimit: 1.9,
      build: function () { return genDeci(this); },
    },
    {
      name: "Spiegelwasser",
      blurb: "Jetzt kommen negative Zahlen dazu.",
      coach: "Negative Zahlen sind kleiner als null. " + MINUS + "5 ist kleiner als " + MINUS + "1.",
      count: 6, min: -6.5, max: 6.5, places: 1, minGap: 0.8, maxIntegers: 2,
      minNeg: 2, minPos: 2, anchorZero: true,
      build: function () { return genDeci(this); },
    },
    {
      name: "Tiefenriff",
      blurb: "Negative Zahlen mit zwei Nachkommastellen.",
      coach: "Bei zwei negativen Zahlen ist die weiter von null entfernt die kleinere. " + MINUS + "2,4 ist kleiner als " + MINUS + "1,8.",
      count: 8, min: -5, max: 5, places: 2, minGap: 0.32, maxIntegers: 1, minHundredths: 3,
      minNeg: 3, minPos: 3, nearZero: true,
      build: function () { return genDeci(this); },
    },
    {
      name: "Perlenwirbel",
      blurb: "Ganz nah beieinander, auch unter null.",
      coach: "Schau genau hin: " + MINUS + "0,8 ist kleiner als " + MINUS + "0,15, weil " + MINUS + "0,8 weiter links liegt.",
      count: 8, min: -3.4, max: 3.4, places: 2, minGap: 0.1, maxIntegers: 1, minHundredths: 4,
      minNeg: 3, minPos: 3, nearZero: true, closePair: 0.22,
      build: function () { return genDeci(this); },
    },
    {
      name: "Gezeiten",
      blurb: "Viele Zahlen, kleine Abstände, beide Seiten der Null.",
      coach: "Erst das Vorzeichen, dann die Nachkommastellen. Die kleinste Zahl zuerst.",
      count: 9, min: -4.8, max: 4.8, places: 2, minGap: 0.08, maxIntegers: 1, minHundredths: 5,
      minNeg: 4, minPos: 4, nearZero: true, closePair: 0.18,
      build: function () { return genDeci(this); },
    },
  ];

  const BRUCH = [
    {
      name: "Klare Tropfen",
      blurb: "Alle Brüche haben denselben Nenner.",
      coach: "Der Nenner ist bei allen gleich. Der kleinere Zähler ist der kleinere Bruch.",
      count: 5, sameDen: true, positive: true,
      build: function () { return genSameDen(this.count); },
    },
    {
      name: "Stammbrüche",
      blurb: "Der Zähler ist immer 1.",
      coach: "Der Zähler ist 1. Je größer der Nenner, desto kleiner der Bruch. 1/2 ist größer als 1/8.",
      count: 6, unit: true, positive: true,
      build: function () { return genUnit(this.count); },
    },
    {
      name: "Bunte Nenner",
      blurb: "Zähler und Nenner wechseln.",
      coach: "Die Nenner sind verschieden. Du kannst über Kreuz vergleichen oder die Brüche gleichnamig machen.",
      count: 6, minGap: 0.08, minUnreduced: 1, positive: true, proper: true,
      build: function () { return genProper(this); },
    },
    {
      name: "Über eins",
      blurb: "Unechte Brüche und gemischte Zahlen.",
      coach: "1 3/4 ist dasselbe wie 7/4. Wandle gemischte Zahlen um, bevor du sie vergleichst.",
      count: 6, minGap: 0.18, minMixed: 2, minUnreduced: 1, minBelow: 1, minAbove: 3, positive: true,
      build: function () { return genMixedLevel(this); },
    },
    {
      name: "Unter null",
      blurb: "Negative Brüche und die Null.",
      coach: MINUS + "3/4 ist kleiner als " + MINUS + "1/4. Unter null liegt die kleinere Zahl weiter links.",
      count: 7, minGap: 0.1, anchorZero: true, minNeg: 3, minPos: 3,
      build: function () { return genNegative(this); },
    },
    {
      name: "Eng beieinander",
      blurb: "Brüche mit knappem Abstand.",
      coach: "Diese Brüche liegen eng zusammen. Gleichnamig machen hilft beim Vergleichen.",
      count: 7, minGap: 0.04, spanLimit: 0.95, minUnreduced: 1, positive: true, tight: true,
      build: function () { return genClose(this); },
    },
    {
      name: "Kronenriff",
      blurb: "Vorzeichen, gemischte Zahlen und enge Brüche.",
      coach: "Erst das Vorzeichen. Negative Brüche kommen vor allen positiven.",
      count: 8, minGap: 0.07, minMixed: 2, minUnreduced: 1, minNeg: 3, minPos: 3, minAbove: 2,
      build: function () { return genCapstone(this); },
    },
  ];

  const MISCH = [
    {
      name: "Perlmutt",
      blurb: "Dezimalzahlen, Brüche und gemischte Zahlen zusammen.",
      coach: "Erst das Vorzeichen. Dann dieselbe Schreibweise: 1/2 ist dasselbe wie 0,5.",
      count: 7, minGap: 0.08, closePair: 0.2,
      build: function () { return genMisch(this); },
    },
  ];

  function deciFallback(index) {
    const sets = [
      [[8, 10], [24, 10], [37, 10], [51, 10], [86, 10]],
      [[25, 100], [140, 100], [275, 100], [405, 100], [650, 100], [820, 100]],
      [[105, 100], [128, 100], [146, 100], [173, 100], [196, 100], [214, 100], [238, 100]],
      [[-45, 10], [-20, 10], [-5, 10], [0, 10], [15, 10], [35, 10]],
      [[-420, 100], [-250, 100], [-80, 100], [-15, 100], [40, 100], [125, 100], [260, 100], [405, 100]],
      [[-305, 100], [-180, 100], [-40, 100], [15, 100], [70, 100], [155, 100], [240, 100], [315, 100]],
      [[-450, 100], [-210, 100], [-75, 100], [-8, 100], [20, 100], [95, 100], [180, 100], [305, 100], [440, 100]],
    ];
    return sets[index].map((pair) => deciItem(pair[0], pair[1]));
  }

  function bruchFallback(index) {
    const sets = [
      [[1, 8], [3, 8], [4, 8], [6, 8], [7, 8]],
      [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 8]],
      [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6]],
      [[1, 2], [3, 4], [5, 4], [7, 4], [2, 1], [11, 4]],
      [[-5, 4], [-1, 2], [-1, 4], [0, 1], [1, 3], [3, 4], [5, 4]],
      [[1, 2], [3, 5], [2, 3], [3, 4], [4, 5], [5, 6], [7, 8]],
      [[-7, 4], [-5, 4], [-1, 2], [1, 4], [1, 2], [3, 4], [5, 4], [7, 4]],
    ];
    const displays = [
      ["fraction", "fraction", "fraction", "fraction", "fraction"],
      ["fraction", "fraction", "fraction", "fraction", "fraction", "fraction"],
      ["fraction", "fraction", "fraction", "fraction", "fraction", "fraction"],
      ["fraction", "fraction", "mixed", "mixed", "integer", "mixed"],
      ["fraction", "fraction", "fraction", "integer", "fraction", "fraction", "mixed"],
      ["fraction", "fraction", "fraction", "fraction", "fraction", "fraction", "fraction"],
      ["mixed", "mixed", "fraction", "fraction", "fraction", "fraction", "mixed", "mixed"],
    ];
    return sets[index].map((pair, i) => makeBruch(pair[0], pair[1], displays[index][i]));
  }

  function localizeItem(item) {
    if (item.kind === "deci" || item.form === "decimal") {
      item.text = formatDecimal(item.n, item.d);
      item.aria = ariaDecimal(item.text);
      return item;
    }
    if (item.form === "integer") {
      const neg = item.n < 0;
      const ip = Math.abs(item.n) / item.d;
      item.text = (neg ? MINUS : "") + String(ip);
      item.aria = (neg ? speakMinus() + " " : "") + String(ip);
      return item;
    }
    const neg = item.n < 0;
    if (item.form === "mixed") {
      item.aria = ariaMixed(neg, item.whole, item.num, item.den);
      return item;
    }
    if (item.form === "fraction") {
      item.aria = ariaFrac(neg, item.num, item.den);
      return item;
    }
    return item;
  }

  function shownNumeric(item) {
    if (item.kind === "deci" || item.form === "decimal" || item.form === "integer") {
      return Number(String(item.text).replace(MINUS, "-").replace(",", "."));
    }
    const sign = item.sign ? -1 : 1;
    if (item.form === "mixed") return sign * (item.whole + item.num / item.den);
    return sign * (item.num / item.den);
  }

  function plain(item) {
    if (item.form === "fraction") return (item.sign || "") + item.num + "/" + item.den;
    if (item.form === "mixed") return (item.sign || "") + item.whole + " " + item.num + "/" + item.den;
    return item.text;
  }

  function consistent(item) {
    if (!(item.d > 0) || !Number.isFinite(item.n)) return false;
    const shown = shownNumeric(item);
    if (!Number.isFinite(shown)) return false;
    if (Math.abs(shown - item.n / item.d) > 1e-6) return false;
    if (item.isNeg !== item.n < 0) return false;
    if (item.isZero !== (item.n === 0)) return false;
    if (item.kind === "deci") {
      const bad = decimalSep() === "." ? "," : ".";
      if (String(item.text).includes(bad)) return false;
    }
    return true;
  }

  function finalize(items, isFallback) {
    if (!items || !items.length) throw new Error("leer");
    const out = items.map((it) => Object.assign({}, it, { fallback: isFallback }));
    out.sort(compare);
    for (let i = 1; i < out.length; i++) {
      if (!(compare(out[i - 1], out[i]) < 0)) throw new Error("Reihenfolge");
    }
    for (let i = 0; i < out.length; i++) {
      out[i].rank = i;
      if (!consistent(out[i])) throw new Error("Anzeige passt nicht: " + plain(out[i]));
    }
    return out;
  }

  function buildLevel(mode, index) {
    const level = modes[mode].levels[index];
    let last = "unbekannt";
    for (let i = 0; i < 12; i++) {
      try {
        const items = level.build();
        if (!items || items.length !== level.count) {
          last = "Anzahl";
          continue;
        }
        return finalize(items, false);
      } catch (err) {
        last = err && err.message ? err.message : "Fehler";
      }
    }
    throw new Error(mode + " Level " + (index + 1) + ": " + last);
  }

  function generateLevel(mode, index) {
    try {
      return buildLevel(mode, index);
    } catch (err) {
      const raw = mode === "dezi" ? deciFallback(index) : mode === "bruch" ? bruchFallback(index) : mischFallback();
      return finalize(raw, true);
    }
  }

  const modes = {
    dezi: {
      id: "dezi",
      title: "Dezimalzahlen",
      lead: "Zahlen mit Komma, bis zu zwei Nachkommastellen.",
      levels: DEZI,
    },
    bruch: {
      id: "bruch",
      title: "Brüche",
      lead: "Echte Brüche, gemischte Zahlen und negative Brüche.",
      levels: BRUCH,
    },
    misch: {
      id: "misch",
      title: "Gemischt",
      lead: "Dezimalzahlen und Brüche in einer Runde. Zuerst das Vorzeichen, dann dieselbe Schreibweise.",
      levels: MISCH,
    },
  };

  return {
    modes: modes,
    generateLevel: generateLevel,
    compare: compare,
    numeric: numeric,
    plain: plain,
    shownNumeric: shownNumeric,
    formatDecimal: formatDecimal,
    localizeItem: localizeItem,
  };
});
