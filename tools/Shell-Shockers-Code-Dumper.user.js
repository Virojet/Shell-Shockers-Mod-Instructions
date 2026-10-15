// ==UserScript==
// @name         Shell Shockers Code Dumper
// @namespace    https://github.com/Virojet
// @version      2.0.0
// @description  Saves the game's readable code (shellshock.js) to a file, for reading and for writing mods. It takes the code the moment the game runs it, so it keeps working when the game changes how the file is encoded.
// @author       Virojet
// @license      MIT
// @homepageURL  https://github.com/Virojet/Shell-Shockers-Mod-Instructions
// @supportURL   https://github.com/Virojet/Shell-Shockers-Mod-Instructions/issues
// @match        *://*.shellshock.io/*
// @match        *://*.algebra.best/*
// @match        *://*.algebra.monster/*
// @match        *://*.algebra.vip/*
// @match        *://*.biologyclass.club/*
// @match        *://*.combateggs.com/*
// @match        *://*.deadlyegg.com/*
// @match        *://*.deathegg.life/*
// @match        *://*.deathegg.world/*
// @match        *://*.egg.dance/*
// @match        *://*.eggbattle.com/*
// @match        *://*.eggboy.club/*
// @match        *://*.eggboy.me/*
// @match        *://*.eggboy.xyz/*
// @match        *://*.eggcombat.com/*
// @match        *://*.eggfacts.fun/*
// @match        *://*.egggames.best/*
// @match        *://*.egghead.institute/*
// @match        *://*.eggisthenewblack.com/*
// @match        *://*.eggsarecool.com/*
// @match        *://*.eggshock.com/*
// @match        *://*.eggshock.me/*
// @match        *://*.eggshock.net/*
// @match        *://*.eggshooter.best/*
// @match        *://*.eggshooter.com/*
// @match        *://*.eggwarfare.com/*
// @match        *://*.eggwars.io/*
// @match        *://*.geometry.best/*
// @match        *://*.geometry.monster/*
// @match        *://*.geometry.pw/*
// @match        *://*.geometry.report/*
// @match        *://*.hardboiled.life/*
// @match        *://*.hardshell.life/*
// @match        *://*.humanorganising.org/*
// @match        *://*.math.international/*
// @match        *://*.mathactivity.club/*
// @match        *://*.mathactivity.xyz/*
// @match        *://*.mathdrills.info/*
// @match        *://*.mathdrills.life/*
// @match        *://*.mathfun.rocks/*
// @match        *://*.mathgames.world/*
// @match        *://*.mathlete.fun/*
// @match        *://*.mathlete.pro/*
// @match        *://*.overeasy.club/*
// @match        *://*.risenegg.com/*
// @match        *://*.scrambled.best/*
// @match        *://*.scrambled.tech/*
// @match        *://*.scrambled.today/*
// @match        *://*.scrambled.us/*
// @match        *://*.scrambled.world/*
// @match        *://*.shellgame.me/*
// @match        *://*.shellplay.live/*
// @match        *://*.shellshock.guru/*
// @match        *://*.shellshockers.best/*
// @match        *://*.shellshockers.ca/*
// @match        *://*.shellshockers.club/*
// @match        *://*.shellshockers.life/*
// @match        *://*.shellshockers.site/*
// @match        *://*.shellshockers.today/*
// @match        *://*.shellshockers.us/*
// @match        *://*.shellshockers.website/*
// @match        *://*.shellshockers.wiki/*
// @match        *://*.shellshockers.world/*
// @match        *://*.shellshockers.xyz/*
// @match        *://*.shellsocks.com/*
// @match        *://*.softboiled.club/*
// @match        *://*.urbanegger.com/*
// @match        *://*.violentegg.club/*
// @match        *://*.violentegg.fun/*
// @match        *://*.yolk.best/*
// @match        *://*.yolk.life/*
// @match        *://*.yolk.monster/*
// @match        *://*.yolk.quest/*
// @match        *://*.yolk.rocks/*
// @match        *://*.yolk.tech/*
// @match        *://*.yolk.today/*
// @match        *://*.zygote.cafe/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/* Shell Shockers Code Dumper: saves the game's code as the game itself runs it.

   Why the old dumper stopped working: it downloaded js/shellshock.js and decoded it with yolkbot's processJS, imported
   from yolkbot.xyz. That file is not plain JavaScript: the game ships it encoded, and its WebAssembly decodes it, puts
   the result in a <script> element and adds that to the page. processJS copies one version of that decoding (each
   character XORed with (88 + its position) & 127), and it only existed in yolkbot 1.5.0 to 1.5.12: yolkbot 2.0 moved
   to another registry, went private and changed its API. The old dumper also broke with any change of encoding, and
   on mirror domains, where its absolute shellshock.io address is another site.

   How this one works: it takes the code from the game's own decoder, so the encoding no longer matters. It looks in
   three places, earliest first:
     1. the moment the code is written into a <script> (the textContent, text and innerHTML setters);
     2. the moment a <script> is added to the page (appendChild, insertBefore, append and the rest);
     3. a MutationObserver, for anything added some other way.
   Nothing is changed: the code and the script go on exactly as they came. Taking it at step 1 means other mods that
   patch the game when its script is added (most of them) can't have changed it yet.

   If the code is never caught (the game changed how it starts), "Decode the file" downloads the encoded file from this
   same site and tries every XOR start from 0 to 127 on its raw bytes, keeping the one that gives readable JavaScript.

   The saved file is the game's own code, owned by Blue Wizard Digital. Read it on your computer to write mods, and
   don't publish it.

   Console: window.ssCodeDumper.save() saves again, .decodeFile() decodes the file directly, .status() says what
   happened. */
(() => {
  "use strict";
  if (window.ssCodeDumper) return;

  const VERSION = "2.0.0";
  const STORE = "ssCodeDumper.lastSaved";
  // The game's code is one inline script of about 3.3 MB that starts with "(()=>{" (Better HUD's patch pipeline finds
  // it the same way, with the same 100,000 character floor).
  const MIN_LENGTH = 100000;
  // Names only the game's own code uses (Babylon.js, if the page loads it separately, has none of them). They're
  // property and method names the game's UI and mods rely on, so they outlive the short names that change with every
  // build. Two of them, or one plus the game's "(()=>{" opening, and the script is the game.
  const MARKERS = ["reloadCountdown", "vueApp", "BAWK", "shellIngameNotification", "set_mouse_params", "showSettingsPopup"];
  // Bound now, at document-start: the game may wrap console later.
  const log = console.log.bind(console, "[Code Dumper]");
  const warn = console.warn.bind(console, "[Code Dumper]");

  let caught = null;   // { code, how, at, otherHooks }
  const seen = new WeakSet();
  const ours = new Set();   // our wrappers, to tell them from other mods' at the moment the code is caught

  const isGameCode = text => {
    if (typeof text !== "string" || text.length < MIN_LENGTH) return false;
    const hits = MARKERS.filter(m => text.includes(m)).length;
    return hits >= 2 || (hits >= 1 && text.startsWith("(()=>{"));
  };

  /* ---- 1. The code being written into a <script> ---- */
  // Each setter checks the length first, so the page's ordinary text changes cost one comparison.
  function watchSetter(proto, prop) {
    const d = Object.getOwnPropertyDescriptor(proto, prop);
    if (!d || typeof d.set !== "function" || !d.configurable) return;
    const set = d.set;
    const setter = function (v) {
      if (!caught && typeof v === "string" && v.length >= MIN_LENGTH && this && this.tagName === "SCRIPT") {
        try { if (isGameCode(v)) { seen.add(this); found(v, prop + " setter"); } } catch (err) { warn(err); }
      }
      return set.call(this, v);
    };
    ours.add(setter);
    Object.defineProperty(proto, prop, { get: d.get, set: setter, enumerable: d.enumerable, configurable: true });
  }

  /* ---- 2. A <script> being added to the page ---- */
  function inspect(node, how) {
    if (caught || !node || typeof node !== "object") return;
    if (node.nodeType === 11 && node.querySelectorAll) {   // a fragment: its scripts run when it's added
      for (const s of node.querySelectorAll("script")) inspect(s, how);
      return;
    }
    if (node.nodeType !== 1 || node.tagName !== "SCRIPT" || seen.has(node)) return;
    seen.add(node);
    const text = node.text || node.textContent || "";
    if (isGameCode(text)) return found(text, how);
    // A script loaded from a blob: address has its code in the blob, not in the element.
    const src = node.src || "";
    if (src.startsWith("blob:")) {
      fetch(src).then(r => r.text()).then(t => { if (!caught && isGameCode(t)) found(t, how + " (blob)"); }, () => {});
    }
  }

  const isNative = f => typeof f === "function" && /\{\s*\[native code\]\s*\}\s*$/.test(Function.prototype.toString.call(f));
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const NODE = ["appendChild", "insertBefore", "replaceChild"];
  const PARENT = ["append", "prepend", "after", "before", "replaceWith", "replaceChildren"];
  const SETTERS = [[Node.prototype, "textContent"], [Element.prototype, "innerHTML"], [HTMLScriptElement.prototype, "text"]];
  // Checked before anything is wrapped: another script got here first.
  const hookedBefore = NODE.some(k => !isNative(Node.prototype[k]) || own(HTMLElement.prototype, k)) ||
    PARENT.some(k => typeof Element.prototype[k] === "function" && !isNative(Element.prototype[k])) ||
    SETTERS.some(([p, k]) => { const d = Object.getOwnPropertyDescriptor(p, k); return !!d && !isNative(d.set); });

  function wrap(proto, name, pick) {
    const orig = proto[name];
    if (typeof orig !== "function") return;
    const wrapped = function (...args) {
      try { for (const n of pick(args)) inspect(n, name); } catch (err) { warn(err); }
      return orig.apply(this, args);
    };
    ours.add(wrapped);
    proto[name] = wrapped;
  }
  const first = args => [args[0]];
  const all = args => args;

  for (const [proto, prop] of SETTERS) watchSetter(proto, prop);
  for (const k of NODE) {
    wrap(Node.prototype, k, first);
    // A mod that wrapped HTMLElement.prototype.appendChild before this ran keeps the native one to itself, so the
    // page's calls would skip Node.prototype: wrap its copy too. (Run after this, such a mod wraps this one instead.)
    if (own(HTMLElement.prototype, k)) wrap(HTMLElement.prototype, k, first);
  }
  for (const proto of [Element.prototype, Document.prototype, DocumentFragment.prototype]) {
    for (const k of PARENT) if (own(proto, k)) wrap(proto, k, all);
  }
  wrap(Element.prototype, "insertAdjacentElement", args => [args[1]]);

  /* ---- 3. The backstop: anything added some other way (document.write, a parent's innerHTML), just after it ran ---- */
  const mo = new MutationObserver(records => {
    for (const r of records) for (const n of r.addedNodes) inspect(n, "MutationObserver");
    if (caught) mo.disconnect();
  });
  mo.observe(document, { childList: true, subtree: true });

  // Other mods wrapped these after this script did (they run first, and may change the code before it's seen here).
  function hookedAfter() {
    for (const k of NODE) {
      if (!ours.has(Node.prototype[k])) return true;
      if (own(HTMLElement.prototype, k) && !ours.has(HTMLElement.prototype[k])) return true;
    }
    return SETTERS.some(([p, k]) => { const d = Object.getOwnPropertyDescriptor(p, k); return !!d && !ours.has(d.set); });
  }

  /* ---- Decoding the file directly ---- */
  // The share of plain text characters: tabs, line breaks and printable ASCII.
  function plainShare(bytes, key, n) {
    let ok = 0;
    for (let i = 0; i < n; i++) {
      const b = key < 0 ? bytes[i] : bytes[i] ^ ((key + i) & 127);
      if (b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127)) ok++;
    }
    return ok / n;
  }
  const looksLikeCode = text => /\b(function|var|let|const|return)\b/.test(text);

  // Returns { code, key }: the file as it is if it's already JavaScript, else decoded with the XOR start (0 to 127)
  // that gives readable text. Works on bytes, so nothing above 127 is lost.
  function decodeBytes(bytes) {
    const n = Math.min(bytes.length, 8192);
    if (!n) throw new Error("The file is empty.");
    const utf8 = b => new TextDecoder("utf-8").decode(b);
    if (plainShare(bytes, -1, n) > 0.99 && looksLikeCode(utf8(bytes.subarray(0, n)))) return { code: utf8(bytes), key: null };
    let best = -1, bestShare = 0;
    for (let k = 0; k < 128; k++) {
      const s = plainShare(bytes, k, n);
      if (s > bestShare) { bestShare = s; best = k; }
    }
    if (best < 0 || bestShare < 0.97) {
      throw new Error("Unknown encoding: no XOR start gives readable text (best " + Math.round(bestShare * 100) + "%).");
    }
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ ((best + i) & 127);
    const code = utf8(out);
    if (!looksLikeCode(code.slice(0, 20000))) throw new Error("Decoded with XOR start " + best + ", but it doesn't read as JavaScript.");
    return { code, key: best };
  }

  // The address the game loaded its code from, as the browser recorded it; else the usual one.
  function fileUrl() {
    try {
      const hit = performance.getEntriesByType("resource").map(e => e.name).find(u => /\/shellshock[^/]*\.js(\?|$)/.test(u));
      if (hit) return hit;
    } catch { /* no timing data */ }
    return new URL("js/shellshock.js", location.origin + "/").href;
  }

  async function decodeFile(url = fileUrl()) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Couldn't download ${url} (HTTP ${res.status})`);
    const { code, key } = decodeBytes(new Uint8Array(await res.arrayBuffer()));
    log(key === null ? "The file was already plain JavaScript." : "Decoded with XOR start " + key + ".");
    return code;
  }

  /* ---- Saving ---- */
  // FNV-1a over the code, so one game build always gets the same name and isn't saved twice by accident.
  function hash(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16).padStart(8, "0");
  }
  function download(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function save(code = caught && caught.code) {
    if (!code) { toast("Nothing caught yet. Try Decode the file."); return false; }
    const id = hash(code), name = `shellshock_decoded_${new Date().toISOString().slice(0, 10)}_${id}.js`;
    download(code, name);
    try { localStorage.setItem(STORE, id); } catch { /* storage blocked */ }
    log(`Saved ${(code.length / 1048576).toFixed(2)} MB as ${name}`);
    return true;
  }

  const CLEAN = "Other mods also hook the game's code, so the copy can include their changes. " +
    "For a clean copy, turn your other Shell Shockers mods off and reload.";
  function found(code, how) {
    caught = { code, how, at: Date.now(), otherHooks: hookedBefore || hookedAfter() };
    // Saving waits until the game has started running: this is called from inside the game's own startup.
    setTimeout(() => {
      log(`Caught the game's code (${(code.length / 1048576).toFixed(2)} MB) through ${how}.`);
      if (caught.otherHooks) warn(CLEAN);
      let last = null;
      try { last = localStorage.getItem(STORE); } catch { /* storage blocked */ }
      // The same build as last time isn't saved again on every reload: the toast offers it instead.
      if (last === hash(code)) toast("Game code caught: same build as the last one saved.", "Save again", () => save());
      else whenBody(() => { save(code); toast("Game code saved to your downloads."); });
    }, 0);
  }

  /* ---- A small toast in the game's colours ---- */
  function whenBody(fn) {
    if (document.body) fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }
  function toast(text, action, onAction) {
    whenBody(() => {
      document.getElementById("ss-code-dumper-toast")?.remove();
      const box = document.createElement("div");
      box.id = "ss-code-dumper-toast";
      box.style.cssText = "position:fixed;top:24px;left:50%;transform:translateX(-50%);display:flex;gap:12px;" +
        "align-items:center;background:#0d3d4f;color:#5ad4e6;padding:10px 16px;border-radius:10px;" +
        "border:2px solid #2db8d4;font:900 14px Nunito,system-ui,sans-serif;letter-spacing:.4px;" +
        "z-index:2147483000;box-shadow:0 4px 15px rgba(0,0,0,.45);user-select:none";
      box.append(text);
      if (action) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = action;
        b.style.cssText = "font:inherit;color:#0d3d4f;background:#5ad4e6;border:0;border-radius:6px;padding:4px 10px;cursor:pointer";
        b.addEventListener("click", () => { box.remove(); onAction(); });
        box.append(b);
      }
      document.body.appendChild(box);
      setTimeout(() => box.remove(), action ? 12000 : 4000);
    });
  }

  // Not caught 20 s after the page loaded: say so once, with the direct decode as the way out.
  window.addEventListener("load", () => setTimeout(() => {
    if (caught) return;
    warn("The game's code wasn't caught. The game may have changed how it starts.");
    toast("Game code not caught.", "Decode the file",
      () => decodeFile().then(code => save(code), err => { warn(err); toast(String(err.message || err)); }));
  }, 20000), { once: true });

  window.ssCodeDumper = {
    version: VERSION,
    save: () => save(),
    decodeFile: url => decodeFile(url).then(code => (save(code), code.length)),
    decodeBytes,   // decodeBytes(Uint8Array) -> { code, key }
    status: () => ({ caught: !!caught, how: caught && caught.how, length: caught ? caught.code.length : 0,
      otherHooks: caught ? caught.otherHooks : hookedBefore || hookedAfter() }),
  };
})();
