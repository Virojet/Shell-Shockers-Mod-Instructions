# AGENTS.md: Shell Shockers mod rules

This project builds userscript mods (`.user.js` files for Tampermonkey or Violentmonkey) for Shell Shockers, the
browser FPS at shellshock.io.

**Before you write or change mod code, read Section 0 and Section 1 of `Shell-Shockers-Mod-Instructions.txt`,**
then the sections and checklist relevant to the task. Read the full guide for a new mod or when needed to resolve
uncertainty. The TXT is the source of truth for game internals, hooks, UI, the template and checklist. This file is only the summary. If the TXT is missing, ask the user for it:
https://github.com/Virojet/Shell-Shockers-Mod-Instructions

## Working method

1. Restate the request in one or two sentences and check it against the scope below. Leave out any part that is out
   of scope, say so in one sentence, offer the closest in-scope alternative, and build the rest.
2. Choose the least invasive hook level (TXT Section 5: CSS, DOM, Vue app and globals, property traps, code patches)
   and say which one and why.
3. Use only game details the TXT marks VERIFIED. For anything else, ask the user to run a console check (TXT
   Section 7) or to paste the relevant part of the decoded game code (TXT Section 6). Never invent game internals.
4. Write one complete `.user.js` file from the template (TXT Appendix B). No placeholders, no TODOs.
5. Make it look native: the game's Settings popup, classes, `var(--ss-...)` colors, fonts and sounds (TXT Section 10).
6. Run the pre-delivery checklist (TXT Section 16) and fix every failure.
7. Deliver the file, install steps, a test plan the user can follow (TXT 13.2), and known limits.

## Scope

In scope: themes, HUD changes, crosshairs, menus and settings, audio, the user's own stats and match history,
information the game already shows the user, quality of life, accessibility, performance.

Never, not even as an option: aim help, revealing anything the game hides (ESP, wallhacks, radar, seeing through
smoke or scopes), recoil, spread, fire-rate, reload or movement changes, packet crafting or editing, changing what
other players see or hear, spam or bots, rate-limit or chat-filter bypasses, paid-item unlocks, anti-cheat or
detection evasion (hiding from the game, faking what its WebAssembly reads, spoofing input). Leave the game's
WebAssembly functions alone; the only allowed use is passing the user's own chosen sensitivity through
`window.set_mouse_params`.

## Core rules

- **R1** Scope as above.
- **R2** Header: `@run-at document-start`, `@grant none`, the full `@match` list (TXT Appendix A), plus `@name`,
  `@namespace`, `@version` (semver), `@description`, `@author`, `@license`, `@homepageURL`, `@supportURL`,
  `@downloadURL`, `@updateURL`.
- **R3** One file, one IIFE, `"use strict"`, a double-run guard: `if (window.ssMyMod) return;`
- **R4** Least invasive hook first.
- **R5** Never hard-code the game's short obfuscated names (`nc`, `Rc`, `tP`, ...). They change every build. Anchor on
  stable strings and property names; capture short names with `([\w$]+)`.
- **R6** Wrap, never replace. Keep the original, call it, mark the wrapper with `Symbol.for(...)`, keep a live flag so
  unhooking is safe when another mod wrapped after you.
- **R7** Re-attach in a one-second `tick()`: Vue re-renders remove inserted elements, and the app can be replaced.
- **R8** Look native: `ss_button btn_blue bevel_blue`, `ss_checkbox` + `checkmark`, `ss_slider`, `ss_select`,
  `popup_window`, `f_row`, `text_blue4`, `var(--ss-...)`, Nunito and Sigmar One. No floating neon panels, no emoji,
  no `alert`/`confirm`/`prompt`.
- **R9** Settings go in the game's Settings popup. A cell inside one of the game's tabs honors Confirm, Reset to
  Defaults and Cancel; a whole tab of your own may apply changes at once, with its own Reset.
- **R10** Keys: ignore them while the user types; `stopPropagation` inside your inputs; never take a key the game
  binds; hotkeys configurable.
- **R11** While aiming (`document.pointerLockElement`), overlays use `pointer-events: none` and stay out of the way.
- **R12** One `localStorage` key, JSON, validated by `clean()` with defaults, inside `try/catch`.
- **R13** No per-frame work unless it is the feature; timers at 1 s or slower; stop everything in `stop()`.
- **R14** Untrusted text via `textContent`, never `innerHTML`. No `eval`. Network only for your own pinned assets,
  disclosed.
- **R15** Console lines prefixed `[Mod Name]`, never repeated every frame.
- **R16** Code patches: one pass, exact match counts, one summary line of applied and NOT applied patches, fail soft.
- **R17** Register with the Mod Menu (`window.ssModMenuQueue`); defer to Better HUD where features overlap; prefix
  every id, class, key and global.
- **R18** Public API on `window`: `version`, `settings()`, `set()`, `status()`.
- **R19** `start()` and `stop()` fully undo each other and are safe to call twice.
- **R20** Say what you could not verify. Never claim in-game testing the user did not confirm.

## Verified game surfaces (details and more in the TXT, Section 4)

- `window.vueApp`: the Vue root. `showSettingsPopup()`, `shellIngameNotification({ type: 0, streak })` on the
  user's own kills, `$refs.settings` (`settingsUi`, `onSettingAdjusted(id, v)`, `onSettingToggled(id, v)`), `$watch`.
- `window.extern.setMouseSpeed(v)`, `window.set_mouse_params(speed, invert, gunZoom, aiming, id)`.
- `window.BAWK.audioCtx` and `window.BAWK.gainNode`: play sounds through the game's own output.
- Settings popup: `#settings`, tabs `#keyboard_button` and `#misc_button`, sections `#settings_keyboard` and
  `#settings_misc > .display-grid`, buttons `#settings .grid-column-3-eq > button` (`btn_green` Confirm, `btn_yolk`
  Reset to Defaults, `btn_red` Cancel).
- The decoded game code arrives as a `<script>` whose text is set and then appended at startup; catch it at
  `document-start` (tools/Shell-Shockers-Code-Dumper.user.js shows how).

