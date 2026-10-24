# Validation record — 24 October 2026

Core input: ce601f0039a84f00f8809a1618cbb145fad47c9b. Development runtime Node 24; VS Code host 1.141.0 on Windows x64.

- Server build and TypeScript checks pass.
- 41 automated server tests pass, including real stdio initialization, full and incremental synchronization, completion, document isolation, close and shutdown.
- All 490 active Corpus recipes/specifications parse; their complete ASTs match full Core vocabulary output exactly when using the compact runtime snapshot. Accepted-name resolution matches full Core across default, en-GB and en-US locales.
- Standalone tarball installed offline in an isolated prefix; only one runtime package was installed. Its bundled stdio server passed the lifecycle test with no sibling Core or runtime node_modules dependencies.
- Six existing VS Code TextMate/configuration tests pass, including representative real recipes read in place.
- Installed VSIX editor-host tests pass for file recognition, comments, bracket behaviour and indentation in light/dark themes, plus action/equipment/ingredient/local-role completion and comments/raw-source suppression. The host runs in an isolated profile with standalone Node removed from PATH and NODE_PATH empty; VS Code supplies the runtime. Independent built-in word suggestions are filtered out of provider-specific assertions.
- VSIX inventory checks exclude development source/tests/tools, Core YAML, vendor archives, node_modules, source maps and Corpus recipes. One generated semantic snapshot is embedded in the server. Original runtime dependency notices are included.

No Neovim editor-host validation is claimed. No new diagnostics, hover, navigation, formatting or preview. Core, Corpus, Site and Vim plugin sources are untouched. Nothing is merged, pushed, published or deployed.

Evidence and local packages: ../_work/vscode-extension/. Final package checksum/inventory is recorded in lsp-package-inventory.json. Host evidence is lsp-host-v1/host-test-result.json. Server tests are lsp-server-tests.log; Core regression log is lsp-core-regression.log. These are local build/audit outputs, not runtime dependencies.

Final Core regression suite: 592 passed. Automatic onLanguage activation passed from the installed final VSIX. Final VSIX: 31 entries, 241460 bytes; SHA-256 87890167f288d19dcd4220567147e0353d21c1784c9190c09826928ba97a74ff.
