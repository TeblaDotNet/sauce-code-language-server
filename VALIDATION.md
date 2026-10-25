# Stage 5 canonical-only refresh — 25 October 2026

Language Server 0.2.1 uses Core 8cf1de9af9742db231999d3ff088468f2d3e43e2.
core-input.json pins the archive, installed runtime, canonical resource and canonical digest.
All 969 identities remain: 414 ingredients, 255 equipment and 300 processes.

- Build, type checking and 44 unit/protocol/Corpus tests passed with no skipped cases.
- All 490 Corpus ASTs match the supported bundled Core vocabulary.
- 2,344 complete completion responses match the previous server exactly.
- Actual old/new stdio comparison preserves completion responses and capabilities; only serverInfo.version changes from 0.2.0 to 0.2.1.
- Windows standalone matches Node protocol output in normal, early-exit, EOF and termination modes, outside the repository with empty runtime search paths.
- Native Neovim 0.12.6 acceptance passes recognition, syntax, attachment, six completion/suppression cases, local priority and shutdown. The isolated test waits for actual didChange notifications, never arbitrary sleeps. User configuration and Vim plugin are unchanged.
- Windows, Linux x64/ARM64 and macOS x64/ARM64 compile with Bun 1.4.4. Only Windows is natively executed here.
- Runtime snapshot has no articles, sources, media, review metadata, browsing categories or measurements; semantic fields are explicitly allowlisted.

Final exact source revisions, executable hashes and isolated-profile VSIX results are recorded in the Stage 5 delivery report. Build manifests record source revision and dirty state; distribute only the final clean builds.

The prior validation account below is retained as historical evidence.

# Validation — Standalone Language Server v1

24 October 2026; Language Server 0.2.0 and VS Code extension 0.3.0.

- Core input: 2d94d35ef5e8c5c2e7bfcabb36efe452e5587728; vendor checksum and runtime
  integrity in core-input.json. 969 identities: 414 ingredients, 255 equipment,
  300 process/action identities.
- Language Server build/type checking and 42 tests passed. All 490 active Corpus
  recipes parse; full-Core and compact-snapshot ASTs are equal. Resolution parity
  covers aliases/plurals and en-GB/en-US/default locales.
- Later tranche pasta-extruder, velvet and tourne regressions passed.
- Windows x64 Bun 1.4.4 standalone: strict framed stdout, Node/executable protocol
  parity including initialization, full/incremental changes, completion ordering
  and edits, Unicode paths/text, local roles, document isolation, comments/raw
  source, invalid/unsupported requests, close, shutdown, early exit, EOF and
  process termination.
- Only compatibility change: malformed completion parameters return stable
  InvalidParams instead of a Node/Bun-specific TypeError.
- Runtime isolation uses an external Unicode/space-containing directory with
  Node/Bun/npm/pnpm absent from PATH, no Core/knowledge/dependency directories,
  and hostile dotenv/bunfig files. No fresh VM or filesystem access sandbox.
  Node runs the test driver; the executable server needs no installed runtime.
- Linux x64/ARM64 and macOS x64/ARM64 compile successfully. No native execution,
  protocol parity, POSIX signal handling, platform signing or notarization claimed.
- VS Code grammar tests (6) and installed VSIX host tests pass in light/dark themes,
  including refreshed process/equipment completion and unchanged editing support.
  External Node is removed from the isolated editor profile's PATH.
- Final VSIX inspection rejects source/tests/vendor archives/Corpus/YAML/maps and
  verifies bundled server checksum, version and Core pin.
- Neovim is unavailable; documented native LSP configuration is not host-tested.

Generated manifests contain executable sizes, checksums, source revision/dirty
status, compiler identity and Core inputs. Final committed-source artifacts and
protocol/VSIX receipts are recorded in ../_work/standalone-lsp-v1/.
No source edits in Core, Corpus, Site or Vim plugin; no merge, push or publication.
