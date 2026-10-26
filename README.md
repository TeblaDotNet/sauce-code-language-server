# Sauce Code Language Server

This language server brings Sauce Code autocomplete to editors that support LSP. Version 0.2.1 handles completion requests over standard input/output. Core handles parsing and vocabulary; the server tracks documents, identifies where the cursor is and ranks suggestions.

## Use

Download standalone archives or the Node-compatible tarball from [GitHub Releases](https://github.com/TeblaDotNet/sauce-code-language-server/releases/latest). Verify SHA256SUMS.txt and retain the licence notices. Windows x64 is native-tested; Linux/macOS targets are cross-compiled only.

The VS Code extension 0.3.1 includes the server. Install its VSIX and open a `.opensauce` file; you do not need to install Core or Node.js separately.

For another editor, use the standalone executable without Node, or install the downloaded tarball with Node.js 24 or later:

```sh
npm install -g /path/to/open-sauce-language-server-0.2.1.tgz
opensauce-language-server --stdio
```

Configure an ordinary LSP client with command `opensauce-language-server`, argument `--stdio`, filetype `opensauce`, and `.opensauce` file detection. The process speaks framed JSON-RPC on stdin/stdout, not an interactive terminal interface. No VS Code APIs, workspace execution, network calls or installation-time downloads are used at runtime. The existing dependency-free Vim plugin remains independent. See the native Neovim validation below.

## What completion does

- `<jul` in instructions: action heads only, including accepted aliases and ordinary actions with `reference: false`.
- `(mix` under `::equipment`: equipment names only.
- `(cour` under `::ingredients`: basic known ingredient names. Unknown ingredients remain legal; suggestions are assistance, not validation.
- Instruction parentheses: Core-parsed local ingredient/equipment declarations first, then matching global ingredients/equipment. Sauce Code uses the same punctuation for both, so the service does not guess a domain from prose such as “using”. Local roles and qualifiers retain their exact authored spelling.
- Matching is case-insensitive and prefix-based, with one global result per identity. Exact matches rank before other prefixes; reference-eligible concepts rank ahead of ordinary actions at equal match strength. Up to 60 results are returned; `isIncomplete` asks the client to request again as the prefix narrows.
- Only name text is replaced on acceptance, including the remaining suffix when completing mid-word. Closing brackets and qualifiers are not inserted or rewritten. No edits happen merely by requesting suggestions.

Core identifies sections, comments, source fences, declarations and resolved references. The server adds a small cursor check for unfinished names, rather than maintaining its own parser. Comments, raw source, prose/metadata sections, product/variant/part/qualifier positions, malformed nesting and ambiguous contexts receive no completion. Future part/state/product completions are deliberately deferred. Extremely large documents have no special indexing yet; v1 parses on request.

## Build and test

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

Core is pinned to **8cf1de9af9742db231999d3ff088468f2d3e43e2**, using the canonical-only Stage 4B distribution, via `vendor/open-sauce-core-8cf1de9.tgz`. `core-input.json` records archive SHA-256 and an installed dist content hash plus canonical vocabulary/resource digests. Builds reject changed inputs, rather than silently using another sibling checkout or published 0.1.0 Core package. The vendor archive is an immutable development input with original notices, not a manually maintained vocabulary fork.

The build uses loadBundledCanonicalVocabulary() and a reviewed semantic allowlist in tools/snapshot.mjs. It retains identity, accepted names/plurals/aliases and compatibility warnings, locale-specific exact names, parts/variants/states, targets, structural groups and reference eligibility. It excludes editorial sources, prose, review metadata, photographs, measurements and browsing taxonomy. Knowledge is never loaded or required. Core's parser and Vocabulary implementation and the snapshot are bundled once into `dist/server.cjs`. No Core YAML, source maps, recipes, tests, fonts or logos are included in the runtime package. `dist/build-info.json` records input and output checksums. Runtime dependencies are bundled; the npm installation package has no runtime dependency downloads. LSP libraries are pinned to the established 9.0.1 API line, with text-document support 1.0.12; development tools and transitive dependencies are locked.

The exact revision can be updated only by deliberately repacking the approved Core checkout, reviewing a new pin and regenerating/testing the bundle. No Core API modification was needed for v1.

## Not yet supported

This version does not provide diagnostics, hover text, go-to-definition, formatting, previews or snippets. It does not change Sauce Code syntax or decide what an unknown ingredient means. Generic and composite actions remain eligible for completion even if they have no public reference page.

LSP v2 should first improve context fixtures, locale-aware presentation, local-choice ranking and performance measurements. Add one separately scoped feature (for example Core diagnostics) only after agreeing its treatment of incomplete authoring; hover/navigation can follow without changing the transport or document manager.

## Licensing

Copyright 2026 Tebla and Open Sauce Food contributors. Server/tooling/test code: MIT. Authored documentation: CC BY 4.0. Generated project-owned canonical data: CC0 1.0. Core and dependency notices remain intact; see LICENSE, LICENSES and THIRD-PARTY-NOTICES.md. No publication has been performed.

## Standalone executable

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
The ordinary npm package still requires Node.js 24+. VS Code 0.3.1 instead bundles
the Node-compatible server and uses the editor's own runtime.

The executable compiles the same dist/server.cjs used by Node and VS Code.
Only framed LSP messages are written to stdout. It is a server, not an interactive
CLI: initialization, document changes, completion and shutdown come from an LSP
client. No diagnostics, hover, navigation or formatting are added.
Malformed completion parameters return InvalidParams rather than an
engine-dependent TypeError.

Current Core inventory: 414 ingredient, 255 equipment and 300 process/action
identities (969 total). Canonical data, plurals, aliases and reference
eligibility are retained; 911 full editorial enrichment records are not bundled.
The vendor archive is built from the exact detached Core commit and contains its generated canonical resource, not the former mixed knowledge directory.

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
Stage 5 tests the refreshed executable with an isolated Neovim configuration when available; see VALIDATION.md for the exact host version and results. The previous server was also manually tested by the user. Theme-dependent syntax-group colour differences are optional future polish, not a migration blocker.

Bun packaging API: [standalone executables](https://bun.sh/docs/bundler/executables).

## Project and contributions

Sauce Code is the language and tooling; Open Sauce Food is the culinary encyclopaedia and recipe collection built using it. Existing opensauce commands, filetype and extension identifiers remain unchanged. Knowledge is optional and is not loaded for editor completion. See the [seven-repository setup map](https://github.com/TeblaDotNet/sauce-code/blob/main/docs/ecosystem.md), [contribution and AI-development disclosure](https://github.com/TeblaDotNet/sauce-code/blob/main/CONTRIBUTING.md#development-process), and this repository's [licence scopes](LICENSE). Code review and culinary review are separate.
