<div align="center">

# Shell Shockers Mod Instructions

**One file that teaches any AI coding assistant to build [Shell Shockers](https://shellshock.io) mods that work, look like part of the game, and keep working after updates.**

<br>

[![Download the instructions](https://img.shields.io/badge/Download-Shell--Shockers--Mod--Instructions.txt-2ea44f?style=for-the-badge&logo=readthedocs&logoColor=white)](https://raw.githubusercontent.com/Virojet/Shell-Shockers-Mod-Instructions/main/Shell-Shockers-Mod-Instructions.txt)

[![Version](https://img.shields.io/badge/version-1.1.0-0E7697?style=flat-square)](#changelog)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](./LICENSE)
[![Works with](https://img.shields.io/badge/works_with-Codex_%C2%B7_Cursor_%C2%B7_Copilot_%C2%B7_Antigravity_%C2%B7_Claude_%C2%B7_ChatGPT_%C2%B7_Gemini-0C576F?style=flat-square)](#use-it-with-your-ai)

[**Use it**](#use-it-with-your-ai) &nbsp;·&nbsp; [**What's inside**](#whats-inside) &nbsp;·&nbsp; [**Code Dumper**](#the-code-dumper) &nbsp;·&nbsp; [**Template**](#the-starter-template) &nbsp;·&nbsp; [**Limits**](#honest-limits)

</div>

---

## What this is

`Shell-Shockers-Mod-Instructions.txt` is a plain-text guide written for AI assistants. Give it to your AI before you
ask for a mod, and the AI builds it the way the published, working mods are built:

- **It works.** It hooks the game through the surfaces that real mods use and that survive updates, instead of
  guessing at variable names that change with every build.
- **It looks native.** Settings go into the game's own Settings popup, with the game's buttons, checkboxes,
  sliders, colors, fonts and sounds. No floating neon panels.
- **It survives updates.** Every hook re-attaches after the game's menus re-render, every code patch reports
  whether it applied, and nothing breaks the game when something fails.
- **It plays fair.** Cosmetic, HUD, stats, audio and quality-of-life mods only. The AI is told to turn down cheats,
  which also keeps it from refusing your whole request.

Everything in it comes from the source code of mods that are published and in use: Better HUD, Stats Mod, Valorant
Sensitivity, Valorant Kill Sounds, Blossom V4 Theme, Cherry Blossom Theme, Gun Sounds, Mod Menu and No Chat Cooldown, plus the yolkbot
library and community clients. Facts are marked **VERIFIED** (a working mod relies on them) or **CHECK** (confirm
in the current game first).

## Use it with your AI

### Any chat: ChatGPT, Claude, Gemini, Copilot Chat

1. **[Download the TXT](https://raw.githubusercontent.com/Virojet/Shell-Shockers-Mod-Instructions/main/Shell-Shockers-Mod-Instructions.txt)** (right click, Save link as).
2. Attach it to a new chat, or paste all of it as your first message.
3. Ask: *"Read the attached Shell Shockers Mod Instructions fully and follow them. Then build me a mod that ..."*

### Coding agents: Codex, Cursor, Copilot, Antigravity

1. Copy **`Shell-Shockers-Mod-Instructions.txt`** and **`AGENTS.md`** into your mod's folder.
2. Open the folder in your tool. `AGENTS.md` is loaded automatically and makes the agent read the TXT before it
   writes code.
3. Ask for your mod.

| Tool | What it reads | Notes |
|---|---|---|
| **Codex** (CLI, IDE, cloud) | `AGENTS.md` | Codex loads at most 32 KiB of `AGENTS.md` by default, which is why the full guide lives in the TXT and `AGENTS.md` stays short. |
| **Cursor** | `AGENTS.md` | You can also type `@Shell-Shockers-Mod-Instructions.txt` in the chat to attach it directly. |
| **GitHub Copilot** | `AGENTS.md` (agent mode, coding agent, CLI) | For Copilot Chat in an editor, also copy `AGENTS.md` to `.github/copilot-instructions.md`, or attach the TXT with `#file`. |
| **Antigravity** | `AGENTS.md` (recent versions) or `GEMINI.md` | On older versions, copy `AGENTS.md` to `GEMINI.md` in the folder. |
| **Claude Code** | `CLAUDE.md` | Copy `AGENTS.md` to `CLAUDE.md`, or tell it to read the TXT. |

### Prompts that work well

- *"Build a mod that shows my current kill streak under the crosshair, styled like the game, with an on/off setting
  in Settings."*
- *"Make a theme that turns the menus dark green and gold, including the loading screen."*
- *"Add a Settings option that plays a sound I choose from my computer when I get a kill."*
- *"My mod broke after a game update. Here is the console line and the code around the anchor from the new build:
  ... Fix the patch."*

Tip: when the AI needs something it can't know (a method name, a piece of the game's code), the instructions make it
ask you to run a short console command or to paste part of the game's code. Section 7 of the TXT has the commands,
and the Code Dumper below gets you the code.

## What's inside

| Section | What it covers |
|---|---|
| 0 | The AI's working method and the 20 rules that matter most |
| 1 | Scope and fair play: what to build, what never to build, and why |
| 2 | How the game is built: Babylon.js, Vue, WebAssembly, and how its code reaches the page |
| 3 | Userscript basics: the header, `document-start`, `@grant none`, all 77 domains |
| 4 | The game's stable surfaces: `vueApp`, `extern`, `BAWK`, `set_mouse_params`, the Settings popup, HUD ids |
| 5 | Choosing how to hook in, from CSS (safest) to code patches (last resort) |
| 6 | Getting and reading the game's code |
| 7 | Console commands to explore the game |
| 8 | Patching the game's code safely |
| 9 | Architecture and code standards |
| 10 | Making it look and feel native |
| 11 | Working with other mods: the Mod Menu, Better HUD, shared hooks |
| 12 | Recipes: complete, copyable code for the common jobs |
| 13 | Testing, debugging, and fixing a mod after a game update |
| 14 | Publishing on GitHub |
| 15 | The anti-patterns that make a mod look like AI slop |
| 16 | The checklist the AI runs before it answers |
| A to E | Domain list, starter template, game data, glossary, sources |

## The Code Dumper

**[`tools/Shell-Shockers-Code-Dumper.user.js`](./tools/Shell-Shockers-Code-Dumper.user.js)** saves the game's
readable code to a file, for writing and fixing mods.

**[Install the Code Dumper](https://raw.githubusercontent.com/Virojet/Shell-Shockers-Mod-Instructions/main/tools/Shell-Shockers-Code-Dumper.user.js)**,
reload the game, and `shellshock_decoded_<date>_<build>.js` lands in your downloads. Reloading the same build won't
download it again; the toast offers **Save again** instead.

**Why the old dumper stopped working.** It downloaded `js/shellshock.js` and decoded it with yolkbot's `processJS`,
imported from `yolkbot.xyz`. That file isn't plain JavaScript: the game ships it encoded, and its WebAssembly decodes
it into a `<script>` at startup. `processJS` copied one version of that decoding (a rolling XOR starting at 88), and
it only existed in yolkbot 1.5.0 to 1.5.12. The npm package is now deprecated (*"yolkbot 2.0 has been released, which
is distributed through a different registry"*), the codebase went private in June 2026, and its API changed, so the
old `WASM.processJS` import most likely no longer exists. The old script also broke with any change of encoding, and
on mirror domains, where its absolute `https://shellshock.io/` address points at another site.

**How the new one works.** It takes the code from the game's own decoder, at the moment the code is written into the
`<script>` element, so the encoding doesn't matter anymore. It changes nothing. If the game ever stops using a
`<script>`, the toast offers **Decode the file**, which downloads the file and tries every XOR start from 0 to 127.

- For a clean copy, switch your other Shell Shockers mods off while dumping. The dumper warns you when it sees other
  mods hooking the game's code.
- Make it readable: `npx prettier@3 --parser babel --print-width 120 shellshock_decoded_*.js > shellshock_pretty.js`
- Console: `ssCodeDumper.save()`, `ssCodeDumper.decodeFile()`, `ssCodeDumper.status()`.

> [!IMPORTANT]
> The decoded file is Blue Wizard Digital's code. Keep it on your computer to read; don't upload or share it.

## The starter template

**[`templates/Shell-Shockers-Mod-Template.user.js`](./templates/Shell-Shockers-Mod-Template.user.js)** is a small,
complete mod built exactly the way the instructions describe. The TXT includes it (Appendix B), so your AI starts from
it. It is also a quick way to see every convention in one place.

## Honest limits

- **The game changes.** Anything marked CHECK must be confirmed in the current game. VERIFIED items were relied on by
  working mods in October 2026, but any update can rename a method or move a menu. The instructions teach the AI to
  re-check and to fail safely.
- **An AI can still be wrong.** The instructions make it say what it couldn't verify and give you a test plan. Run the
  plan before you publish anything.
- **No cheats.** The instructions tell the AI to leave out anything that helps you beat other players or reveals what
  the game hides. That is the line the community and the developers accept, and features that crossed it have been
  removed from mods on the developers' request.

## Changelog

#### v1.1.0
- The Mod Menu now has its own public repository: Section 11.1 names it and lists its API, including the
  "Check for updates" button.
- Section 11.2 adds Gun Sounds as a second example of a mod that coexists with Better HUD.
- Header and mod list brought up to date.

#### v1.0.0
- First release: the instructions, `AGENTS.md`, the starter template, and the rebuilt Code Dumper.

## Credits

- Made by Virojet, from Virojet's own mods.
- [yolkbot](https://github.com/yolkop/yolkbot) by 1ust (VillainsRule), for game constants and the decoding scheme
  (facts only: its license reserves all rights, and none of its code is used here).
- [StateFarm Client](https://github.com/Hydroflame522/StateFarmClient), for its domain list and code organization
  only.
- Shell Shockers is made by Blue Wizard Digital. This project is unofficial and not endorsed by them.

## License

[MIT](./LICENSE)
