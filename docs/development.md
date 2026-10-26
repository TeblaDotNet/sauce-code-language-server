# Building and testing the Language Server

The [README](../README.md) is for installation and editor setup. This file records the build inputs, protocol checks and current implementation limits.

## Source build

Requires Node.js 24+, pnpm and the locked development dependencies.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm build
pnpm check
pnpm test
node dist/server.cjs --stdio
pnpm pack
```

`OSF_CORPUS` can point to an Open Sauce Food Corpus checkout for tests using all 490 real recipe/specification sources. Without it, that integration test is skipped; unit and protocol tests still run. Generated `test-dist/` data isn't packaged.

## Pinned Core input

The server's approved Core input is commit `8cf1de9af9742db231999d3ff088468f2d3e43e2`, packaged in `vendor/open-sauce-core-8cf1de9.tgz`. `core-input.json` records archive, distribution and canonical vocabulary hashes. The build rejects mismatched inputs.

`tools/snapshot.mjs` creates a bounded runtime vocabulary snapshot: identities, accepted names/plurals/aliases, compatible warnings, locale-specific names, parts, variants, states, structural groups and reference eligibility. It does not include Knowledge articles, sources, photographs, measurements or browsing taxonomy. Runtime parser, resolver and snapshot are bundled in `dist/server.cjs`, with input/output checksums in `dist/build-info.json`.

To update Core, intentionally repack and review the new Core revision, regenerate the snapshot, update the pin and rerun tests. Don't change a hash simply to make a build succeed. Runtime LSP libraries use the established 9.0.1 API line; document support is on 1.0.12.

## Completion behaviour

Suggestions are case-insensitive and prefix-based. Exact matches rank first; local declarations and reference-eligible identities receive context-specific priority. A request returns up to 60 suggestions and uses `isIncomplete` for clients to retry on a narrower prefix.

The server replaces only the matched name text, without inserting closing punctuation or editing qualifiers. It ignores comments, raw source fences, most prose/metadata positions, ambiguous nesting and unsupported part/state/product completion contexts. A small cursor detector supplements Core's parser for unfinished tokens; it isn't a second Sauce Code grammar.

Tests cover initialization, opened/changed/closed documents, multiple document isolation, completion, malformed request errors, shutdown and process exit. stdout is reserved for framed JSON-RPC messages. Large-document indexing and diagnostics are not part of this version.

## Standalone builds

Bun **1.4.4** is used to compile standalone executables (not needed by the binaries at runtime). `OSF_BUN` can point to a local Bun executable.

```sh
pnpm standalone:build windows-x64
pnpm standalone:test
pnpm standalone:build linux-x64 linux-arm64 darwin-x64 darwin-arm64
```

Use `node tools/check-standalone.mjs /path/to/executable` to test a specified executable. Build outputs and checksums are in ignored `standalone/`; protocol parity evidence is in ignored `work/`. Distributions retain `LICENSE`, `LICENSES`, `THIRD-PARTY-NOTICES.md` and the relinkable `server.cjs` material required by existing Bun notices.

Windows x64 has native execution evidence. Linux and macOS target builds are cross-compiled and were not natively validated in the recorded acceptance run. See [VALIDATION.md](../VALIDATION.md) for exact results. Standalone packaging ignores ambient dotenv, bunfig and build config; isolation checks are bounded host tests, not claims of a clean VM.
