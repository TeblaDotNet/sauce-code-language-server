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
