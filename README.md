# Sauce Code Language Server

Open Sauce Food's editor-independent Language Server Protocol service. Version 0.2.0 provides completion only, over standard input/output. Core owns parsing and vocabulary; this repository owns document synchronization, cursor context and completion ranking.

## Use

The accompanying Open Sauce Food VS Code extension 0.3.0 bundles this service. Install its VSIX and open a `.opensauce` file; no separate Core or Node installation is required in VS Code.

For another editor, install a locally built package with Node.js 24 or later:

```sh
npm install -g /path/to/open-sauce-language-server-0.2.0.tgz
opensauce-language-server --stdio
```

Configure an ordinary LSP client with command `opensauce-language-server`, argument `--stdio`, filetype `opensauce`, and `.opensauce` file detection. The process speaks framed JSON-RPC on stdin/stdout, not an interactive terminal interface. No VS Code APIs, workspace execution, network calls or installation-time downloads are used at runtime. Neovim host integration has not been tested; the existing dependency-free Vim plugin remains independent.

## Completion

- `<jul` in instructions: action heads only, including accepted aliases and ordinary actions with `reference: false`.
- `(mix` under `::equipment`: equipment names only.
- `(cour` under `::ingredients`: basic known ingredient names. Unknown ingredients remain legal; suggestions are assistance, not validation.
- Instruction parentheses: Core-parsed local ingredient/equipment declarations first, then matching global ingredients/equipment. Sauce Code uses the same punctuation for both, so the service does not guess a domain from prose such as “using”. Local roles and qualifiers retain their exact authored spelling.
- Matching is case-insensitive and prefix-based, with one global result per identity. Exact matches rank before other prefixes; reference-eligible concepts rank ahead of ordinary actions at equal match strength. Up to 60 results are returned; `isIncomplete` asks the client to request again as the prefix narrows.
- Only name text is replaced on acceptance, including the remaining suffix when completing mid-word. Closing brackets and qualifiers are not inserted or rewritten. No edits happen merely by requesting suggestions.

Core parses sections, comments, source fences, declarations and resolution. A small line-local cursor detector identifies unfinished action/thing heads; it is not a second recipe parser. Comments, raw source, prose/metadata sections, product/variant/part/qualifier positions, malformed nesting and ambiguous contexts receive no completion. Future part/state/product completions are deliberately deferred. Extremely large documents have no special indexing yet; v1 parses on request.

## Reproducible development

Node.js 24+, pnpm and the installed development tools are needed for development only:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm build
pnpm check
pnpm test
node dist/server.cjs --stdio
pnpm pack
```

Set `OSF_CORPUS` to the sibling Corpus checkout before testing to run all 490 real recipes and representative local-declaration checks. Without it that one integration test is explicitly skipped. Unit and protocol tests need no sibling repository. Tests exercise actual stdio initialization, incremental/full updates, completion, isolation, close and clean shutdown. `test-dist/` is build-generated test support, excluded from installation packages.

Core is pinned to **2d94d35ef5e8c5c2e7bfcabb36efe452e5587728**, including the integrated knowledge expansion and enrichment, via `vendor/open-sauce-core-2d94d35.tgz`. `core-input.json` records archive SHA-256 and an installed dist/knowledge content hash. Builds reject changed inputs, rather than silently using another sibling checkout or published 0.1.0 Core package. The vendor archive is an immutable development input with original notices, not a manually maintained vocabulary fork.

The build loads Core's indexed vocabulary and generates a compact semantic snapshot, removing editorial/evidence/measurement fields that completion does not use. Core's parser and Vocabulary implementation and the snapshot are bundled once into `dist/server.cjs`. No Core YAML, source maps, recipes, tests, fonts or logos are included in the runtime package. `dist/build-info.json` records input and output checksums. Runtime dependencies are bundled; the npm installation package has no runtime dependency downloads. LSP libraries are pinned to the established 9.0.1 API line, with text-document support 1.0.12; development tools and transitive dependencies are locked.

The exact revision can be updated only by deliberately repacking the approved Core checkout, reviewing a new pin and regenerating/testing the bundle. No Core API modification was needed for v1.

## Limits and next steps

No diagnostics, hover, definition/navigation, formatting, preview, snippets or editor-specific behavior. No syntax or vocabulary changes. No culinary meaning is inferred from missing names. Generic/composite actions remain valid and are not hidden by page policy.

LSP v2 should first improve context fixtures, locale-aware presentation, local-choice ranking and performance measurements. Add one separately scoped feature (for example Core diagnostics) only after agreeing its treatment of incomplete authoring; hover/navigation can follow without changing the transport or document manager.

## Licensing

Copyright 2026 Tebla and Open Sauce Food contributors. Server/tooling/test code: MIT. Authored documentation: CC BY 4.0. Generated project-owned canonical data: CC0 1.0. Core and dependency notices remain intact; see LICENSE, LICENSES and THIRD-PARTY-NOTICES.md. No publication has been performed.

## Standalone executable (v0.2.0)

Copy the appropriate standalone/<target>/ distribution to a permanent location,
retaining LICENSE, LICENSES and THIRD-PARTY-NOTICES.md. The supplied server.cjs
is a relinkable application bundle for rebuilding with a modified Bun runtime;
the executable does not load it at runtime. Add that directory to PATH,
or configure your editor with the absolute executable path:

~~~sh
opensauce-language-server --stdio
~~~

Windows uses opensauce-language-server.exe. No Node.js, Bun, npm, pnpm, Core
installation or external knowledge folder is required for this executable.
The ordinary npm package still requires Node.js 24+. VS Code 0.3.0 instead bundles
the Node-compatible server and uses the editor's own runtime.

The executable compiles the same dist/server.cjs used by Node and VS Code.
Only framed LSP messages are written to stdout. It is a server, not an interactive
CLI: initialization, document changes, completion and shutdown come from an LSP
client. No diagnostics, hover, navigation or formatting are added.
Malformed completion parameters return InvalidParams rather than an
engine-dependent TypeError.

Current Core inventory: 414 ingredient, 255 equipment and 300 process/action
identities (969 total). Canonical data, plurals, aliases, categories and reference
eligibility are retained; 911 full editorial enrichment records are not bundled.
The vendor archive's shipped runtime/data were compared byte-for-byte with the
approved Core build; the npm package omits three knowledge-folder READMEs.

### Build and validate standalone

Install Bun **1.4.4** as a development tool; OSF_BUN may point to its executable.
After the normal build/check/tests:

~~~sh
pnpm standalone:build windows-x64
pnpm standalone:test
pnpm standalone:build linux-x64 linux-arm64 darwin-x64 darwin-arm64
~~~

Run the Windows parity gate before cross-compilation. To test another executable,
pass its path to node tools/check-standalone.mjs. The script defaults to the
Windows output. Compiled outputs live in ignored standalone/; protocol evidence
is in ignored work/protocol-parity.json. Each distribution includes sizes,
SHA-256 checksums, compiler version, source revision/dirty status and exact
Core/server build inputs. Build committed clean source for distribution.

Bun compilation disables ambient dotenv/bunfig/tsconfig/package configuration.
The isolation test deliberately places hostile dotenv/bunfig files beside the
copied executable. It uses an external Unicode/space-containing directory with
an empty PATH and NODE_PATH, not a fresh VM or OS-level filesystem sandbox.
The test driver uses Node externally; the server executable does not.

Windows x64 is the native validation target. Linux x64/ARM64 and macOS x64/ARM64
cross-compilation does not establish native compatibility. Consult VALIDATION.md
for actual results. Executables are unsigned; no installer or publication.

### Neovim (0.11.1 or later)

Install the existing Sauce Code Vim runtime plugin for .opensauce detection.
In init.lua, configure Neovim's native LSP client (no plugin manager required):

~~~lua
vim.lsp.config('opensauce', {
  cmd = { 'C:/tools/opensauce/opensauce-language-server.exe', '--stdio' },
  filetypes = { 'opensauce' },
  workspace_required = false,
})
vim.lsp.enable('opensauce')
~~~

Use the executable path appropriate to your OS. Open a .opensauce file and use
:checkhealth vim.lsp to inspect attachment. In insert mode, Ctrl-X Ctrl-O requests
native omnifunc completion; try <velv under ::instructions or (pasta extr under
::equipment. No external completion plugin or Node installation is needed.
The dependency-free syntax plugin itself remains unchanged.

API reference: [Neovim native LSP documentation](https://neovim.io/doc/user/lsp/).
Neovim was not installed in the validation environment; this configuration has
not received a native Neovim host test.

Bun packaging API: [standalone executables](https://bun.sh/docs/bundler/executables).
