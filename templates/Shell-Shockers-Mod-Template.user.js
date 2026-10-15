// ==UserScript==
// @name         Shell Shockers Kill Glow
// @namespace    https://github.com/Virojet
// @version      1.0.0
// @description  A soft glow around the edge of the screen on each of your kills, in the color you pick. A small, complete mod built the way the Shell Shockers Mod Instructions describe: use it as the starting point for your own.
// @author       Virojet
// @license      MIT
// @homepageURL  https://github.com/Virojet/Shell-Shockers-Mod-Instructions
// @supportURL   https://github.com/Virojet/Shell-Shockers-Mod-Instructions/issues
// @downloadURL  https://raw.githubusercontent.com/Virojet/Shell-Shockers-Mod-Instructions/main/templates/Shell-Shockers-Mod-Template.user.js
// @updateURL    https://raw.githubusercontent.com/Virojet/Shell-Shockers-Mod-Instructions/main/templates/Shell-Shockers-Mod-Template.user.js
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

/* Kill Glow: a soft glow around the edge of the screen each time you crack someone.

   How it knows: on each of your kills the game shows its message by calling
   vueApp.shellIngameNotification({ type: 0, streak }). The mod wraps that call, starts the glow, and lets the game
   show its message as usual. Only your own kills make that call with type 0. The game's code isn't changed.

   The glow never takes a click and sits outside the crosshair, so it can't get in the way while you aim. With
   "reduce motion" on in your system, it fades instead of pulsing.

   Settings > the speaker tab > Kill Glow: on or off, the color and the strength, and a Test button. As with the
   game's settings around it, a change is kept when you press Confirm.

   It stores its settings in this site's localStorage under "ssKillGlow" and sends nothing anywhere.

   window.ssKillGlow: version, settings(), set({ enabled, color, strength }), flash(), status().

   Building your own mod from this file: keep the structure (guard, settings store, hook, UI cell, tick, start and
   stop, public API, Mod Menu), rename "Kill Glow" / ssKillGlow / ss-kill-glow / sskg everywhere, and replace the
   glow with your feature. */
(() => {
  "use strict";
  if (window.ssKillGlow) return;   // already running: Tampermonkey and the Mod Menu both started it

  const VERSION = "1.0.0";
  const STORE = "ssKillGlow";
  // The game's own palette, so the glow matches its UI (Better HUD's tokens use the same colors).
  const COLORS = [
    { id: "yolk", name: "Yolk", value: "#ff9800" },
    { id: "blue", name: "Blue", value: "#2db8d4" },
    { id: "green", name: "Green", value: "#47f5b4" },
    { id: "pink", name: "Pink", value: "#ff7fb8" },
    { id: "red", name: "Red", value: "#d82727" },
  ];
  const DEFAULTS = Object.freeze({ enabled: true, color: "yolk", strength: 0.6 });
  // Bound now, at document-start: the game may wrap console later.
  const warn = console.warn.bind(console, "[Kill Glow]");

  /* ---- Saved settings ---- */
  // Everything from storage, from the controls, or from set() goes through clean(), so a damaged or old save can't
  // break the mod.
  function clean(s) {
    const ok = !!s && typeof s === "object";
    return {
      enabled: ok && typeof s.enabled === "boolean" ? s.enabled : DEFAULTS.enabled,
      color: ok && COLORS.some(c => c.id === s.color) ? s.color : DEFAULTS.color,
      strength: ok && Number.isFinite(s.strength) ? Math.min(1, Math.max(0.1, s.strength)) : DEFAULTS.strength,
    };
  }
  let saved;
  try { saved = clean(JSON.parse(localStorage.getItem(STORE))); } catch { saved = clean(null); }
  function save(s) {
    saved = clean(s);
    try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch { /* storage blocked: kept for this visit */ }
  }

  /* ---- The glow ---- */
  const GLOW = "ss-kill-glow";
  const colorOf = id => (COLORS.find(c => c.id === id) || COLORS[0]).value;
  const reducedMotion = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

  // `s`: the settings to show it with (the ones being edited, when Test is pressed).
  function flash(s = saved) {
    if (!document.body) return;
    let box = document.getElementById(GLOW);
    if (!box) {
      box = document.createElement("div");
      box.id = GLOW;
      // Fixed over the whole screen, never takes a click, and drawn only at the edges: the middle, where the
      // crosshair is, stays clear.
      box.style.cssText = "position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; opacity: 0;";
      document.body.append(box);
    }
    const c = colorOf(s.color), a = Math.round(s.strength * 255).toString(16).padStart(2, "0");
    box.style.boxShadow = `inset 0 0 ${(4 + 8 * s.strength).toFixed(1)}vh ${(1 + 2 * s.strength).toFixed(1)}vh ${c}${a}`;
    box.getAnimations().forEach(anim => anim.cancel());
    box.animate(reducedMotion() ? [{ opacity: 0.8 }, { opacity: 0 }] : [
      { opacity: 0, easing: "cubic-bezier(.2, .8, .3, 1)" },
      { opacity: 1, offset: 0.15 },
      { opacity: 0 },
    ], { duration: reducedMotion() ? 500 : 700 });
  }
  const hideGlow = () => document.getElementById(GLOW)?.remove();

  /* ---- The kill hook ---- */
  const MARK = Symbol.for("ssKillGlow.hook");
  let hooked = null;   // { app, orig, wrap }
  function hook() {
    const app = window.vueApp, cur = app && app.shellIngameNotification;
    if (typeof cur !== "function") return false;
    if (cur[MARK]) {   // ours already (this script's earlier hook)
      cur[MARK].live = true;
      hooked = { app, orig: cur[MARK].orig, wrap: cur };
      return true;
    }
    const state = { live: true, orig: cur };
    const wrap = function (item) {
      // Read before calling the game: it rewrites the message object.
      if (state.live && running && saved.enabled && item && item.type === 0) {
        try { flash(); } catch (err) { warn(err); }
      }
      return cur.apply(this, arguments);
    };
    wrap[MARK] = state;
    try { app.shellIngameNotification = wrap; } catch { return false; }
    if (app.shellIngameNotification !== wrap) return false;
    hooked = { app, orig: cur, wrap };
    return true;
  }
  function unhook() {
    if (!hooked) return;
    const { app, orig, wrap } = hooked;
    hooked = null;
    // If another script wrapped it since, ours stays in the chain but does nothing.
    wrap[MARK].live = false;
    try { if (app.shellIngameNotification === wrap) app.shellIngameNotification = orig; } catch { /* left as is */ }
  }

  /* ---- Settings > the speaker tab > Kill Glow ---- */
  const CELL = "ss-kill-glow-cell";
  const CSS = `
#${CELL} { min-width: 0; }
#${CELL} .f_row { align-items: center; }
#${CELL} select, #${CELL} input[type=range] { min-width: 0; }
#${CELL} select { flex: 1 1 auto; }
#${CELL} .ss_button, #${CELL} label { flex: none; }`;
  let ui = null, pending = null;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function injectUI() {
    const grid = document.querySelector("#settings_misc > .display-grid");
    if (!grid) return;
    if (ui) removeUI();
    const cell = el("div", "f_col");
    cell.id = CELL;
    // The game's own checkbox, select, slider and small blue button, as in its other settings.
    const on = el("input");
    on.type = "checkbox";
    const onLabel = el("label", "ss_checkbox label", "Kill Glow ");
    onLabel.title = "A soft glow around the edge of the screen on each of your kills.";
    onLabel.append(on, el("span", "checkmark"));
    const color = el("select", "ss_select ss_marginright_sm");
    for (const c of COLORS) color.append(new Option(c.name, c.id));
    color.title = "The glow's color.";
    const test = el("button", "ss_button btn_blue bevel_blue btn_sm", "Test");
    test.type = "button";
    test.title = "Shows the glow with these settings.";
    const range = el("input", "ss_slider");
    Object.assign(range, { type: "range", min: "0.1", max: "1", step: "0.05", title: "How strong the glow is." });
    const value = el("label", "ss_slider label text_blue4");
    const row = (...kids) => { const r = el("div", "f_row"); r.append(...kids); return r; };
    const onRow = el("div", "nowrap");
    onRow.append(onLabel);
    cell.append(el("h3", "margin-bottom-none h-short", "Kill Glow"), onRow, row(color, test), row(range, value));
    grid.append(cell);

    if (!document.getElementById(CELL + "-style")) {
      const style = el("style", null, CSS);
      style.id = CELL + "-style";
      (document.head || document.documentElement).append(style);
    }

    on.addEventListener("change", () => { pending.enabled = on.checked; refresh(); });
    color.addEventListener("change", () => { pending.color = color.value; flash(pending); });
    range.addEventListener("input", () => {
      pending.strength = Math.min(1, Math.max(0.1, Number(range.value) || DEFAULTS.strength));
      value.textContent = String(Math.round(pending.strength * 100));
    });
    range.addEventListener("change", () => flash(pending));
    test.addEventListener("click", () => flash(pending));

    // The popup opening or closing puts the saved settings back in the controls, so a change only stays if Confirm
    // saved it (Cancel, the X and Esc all leave things as they were).
    const me = { cell, on, color, test, range, value, io: null, shown: null };
    me.io = new IntersectionObserver(entries => {
      const shown = entries[entries.length - 1].isIntersecting;
      if (ui !== me || shown === me.shown) return;
      me.shown = shown;
      revert({ ...saved });
    });
    me.io.observe(cell.closest("#settings") || grid);
    ui = me;
    revert({ ...saved });
  }
  function removeUI() {
    if (!ui) return;
    ui.io.disconnect();
    ui.cell.remove();
    document.getElementById(CELL + "-style")?.remove();
    ui = null;
  }
  function revert(to) {
    pending = clean(to);
    refresh();
  }
  function refresh() {
    if (!ui) return;
    const p = pending || saved;
    ui.on.checked = p.enabled;
    ui.color.value = p.color;
    ui.range.value = String(p.strength);
    ui.value.textContent = String(Math.round(p.strength * 100));
    ui.color.disabled = ui.range.disabled = ui.test.disabled = !p.enabled;
  }

  // The game's Confirm, Reset to Defaults and Cancel buttons, under the tabs.
  function onClick(e) {
    if (!ui || !pending) return;
    const b = e.target instanceof Element && e.target.closest("#settings .grid-column-3-eq > button");
    if (!b) return;
    if (b.classList.contains("btn_green")) save(pending);
    else if (b.classList.contains("btn_yolk")) revert({ ...DEFAULTS });
    else if (b.classList.contains("btn_red")) revert({ ...saved });
  }

  // For the Mod Menu's shortcut: opens Settings on the speaker tab, where the Kill Glow cell is.
  function openSettings() {
    const app = window.vueApp;
    if (!running || !app || typeof app.showSettingsPopup !== "function") return false;
    try {
      app.showSettingsPopup();
      const tab = document.getElementById("misc_button");
      if (tab) tab.click();
      else if (typeof app.onSettingsPopupSwitchTabMisc === "function") app.onSettingsPopupSwitchTabMisc();
    } catch (err) { warn(err); return false; }
    tick();
    return true;
  }

  /* ---- On and off ---- */
  let running = false, timer = 0;
  // Every second: hook the game's app (again, if it was replaced) and put the settings cell back if Vue removed it.
  function tick() {
    if (!running) return;
    if (!hooked || hooked.app !== window.vueApp) hook();
    if (!ui || !ui.cell.isConnected) injectUI();
  }
  function start() {
    if (running) return;
    running = true;
    document.addEventListener("click", onClick, true);
    tick();
    timer = setInterval(tick, 1000);
  }
  function stop() {
    if (!running) return;
    running = false;
    clearInterval(timer);
    document.removeEventListener("click", onClick, true);
    unhook();
    removeUI();
    hideGlow();
  }

  window.ssKillGlow = {
    version: VERSION,
    settings: () => ({ ...saved }),
    set(s) { save({ ...saved, ...s }); revert({ ...saved }); return { ...saved }; },
    flash: () => flash(),   // shows the glow now, as on a kill
    status: () => ({ running, hooked: !!hooked, settingsShown: !!ui && ui.cell.isConnected }),
  };

  start();
  // The Mod Menu (if it's installed) lists it with an on/off switch and a shortcut to these settings.
  (window.ssModMenuQueue = window.ssModMenuQueue || []).push({
    id: "kill-glow", name: "Kill Glow", version: VERSION, group: "mod",
    description: "A soft glow around the edge of the screen on each of your kills.",
    enable: start, disable: stop, openSettings,
  });
})();
