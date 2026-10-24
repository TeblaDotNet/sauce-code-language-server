# Sauce Code Language Server

Open Sauce Food's editor-independent Language Server Protocol service. Version 0.1.0 provides completion only, over standard input/output. Core owns parsing and vocabulary; this repository owns document synchronization, cursor context and completion ranking.

## Use

The accompanying Open Sauce Food VS Code extension 0.2.0 bundles this service. Install its VSIX and open a `.opensauce` file; no separate Core or Node installation is required in VS Code.

For another editor, install a locally built package with Node.js 24 or later:

```sh
npm install -g /path/to/open-sauce-language-server-0.1.0.tgz
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

Core is pinned to **ce601f0039a84f00f8809a1618cbb145fad47c9b**, including Processes & Equipment v1, via `vendor/open-sauce-core-ce601f0.tgz`. `core-input.json` records archive SHA-256 and an installed dist/knowledge content hash. Builds reject changed inputs, rather than silently using another sibling checkout or published 0.1.0 package. The vendor archive is an immutable development input with original notices, not a manually maintained vocabulary fork.

The build loads Core's indexed vocabulary and generates a compact semantic snapshot, removing editorial/evidence/measurement fields that completion does not use. Core's parser and Vocabulary implementation and the snapshot are bundled once into `dist/server.cjs`. No Core YAML, source maps, recipes, tests, fonts or logos are included in the runtime package. `dist/build-info.json` records input and output checksums. Runtime dependencies are bundled; the npm installation package has no runtime dependency downloads. LSP libraries are pinned to the established 9.0.1 API line, with text-document support 1.0.12; development tools and transitive dependencies are locked.

The exact revision can be updated only by deliberately repacking the approved Core checkout, reviewing a new pin and regenerating/testing the bundle. No Core API modification was needed for v1.

## Limits and next steps

No diagnostics, hover, definition/navigation, formatting, preview, snippets or editor-specific behavior. No syntax or vocabulary changes. No culinary meaning is inferred from missing names. Generic/composite actions remain valid and are not hidden by page policy.

LSP v2 should first improve context fixtures, locale-aware presentation, local-choice ranking and performance measurements. Add one separately scoped feature (for example Core diagnostics) only after agreeing its treatment of incomplete authoring; hover/navigation can follow without changing the transport or document manager.

## Licensing

Copyright 2026 Tebla and Open Sauce Food contributors. Server/tooling/test code: MIT. Authored documentation: CC BY 4.0. Generated project-owned canonical data: CC0 1.0. Core and dependency notices remain intact; see LICENSE, LICENSES and THIRD-PARTY-NOTICES.md. No publication has been performed.
