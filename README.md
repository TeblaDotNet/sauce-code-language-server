# Sauce Code Language Server

Autocomplete for `.opensauce` files in editors that support the Language Server Protocol (LSP).

The server suggests ingredients, equipment and actions as you type. It uses Sauce Code's parser and vocabulary, and puts names declared in the current recipe ahead of shared suggestions.

**Related repositories:** [Sauce Code Core](https://github.com/TeblaDotNet/sauce-code) · [VS Code](https://github.com/TeblaDotNet/sauce-code-vscode) · [Vim/Neovim](https://github.com/TeblaDotNet/sauce-code-vim)

## Install

**VS Code:** the [Sauce Code extension](https://github.com/TeblaDotNet/sauce-code-vscode) already includes this server.

**Other editors:** download a standalone executable from [GitHub Releases](https://github.com/TeblaDotNet/sauce-code-language-server/releases/latest), then configure your editor to launch it with `--stdio` for `.opensauce` files.

On Windows, the executable is named `opensauce-language-server.exe`. It is an LSP service, so it expects an editor client to communicate over standard input/output; running it in an ordinary interactive terminal won't show a user interface.

Alternatively, with Node.js 24+, install the tarball from the same Releases page:

```sh
npm install -g /path/to/open-sauce-language-server-0.2.1.tgz
opensauce-language-server --stdio
```

The command installs the downloaded tarball, not an npm registry package. Keep the included licence notices. Windows x64 is native-tested; Linux/macOS executables are cross-compiled only.

## Autocomplete

For example:

- Type `<jul` in `::instructions` to look up an action.
- Type `(mix` in `::equipment` to look up equipment.
- Type `(cour` in `::ingredients` to look up an ingredient.

Suggestions are based on the cursor's position. Names and roles you've declared in the recipe are preferred where appropriate. Unknown ingredients are still valid Sauce Code — autocomplete is help, not a list of allowed words.

Version 0.2.1 focuses on **completion**; it doesn't yet provide diagnostics, hover information or navigation.

## Neovim

With [Sauce Code's Vim/Neovim plugin](https://github.com/TeblaDotNet/sauce-code-vim) installed for file detection, Neovim 0.11.1+ can use its built-in LSP client. In `init.lua`:

```lua
vim.lsp.config('opensauce', {
  cmd = { 'C:/tools/opensauce/opensauce-language-server.exe', '--stdio' },
  filetypes = { 'opensauce' },
  workspace_required = false,
})
vim.lsp.enable('opensauce')
```

Change the executable path to where you installed it. Open a `.opensauce` file and use `:checkhealth vim.lsp` to check attachment; in insert mode `Ctrl-X Ctrl-O` requests completion.

## Development

The server uses a pinned Sauce Code Core package and a bundled vocabulary snapshot. Builds intentionally use that pinned input rather than whichever Core checkout happens to be nearby.

For development commands, version pins, standalone builds and test coverage, see [building and testing](docs/development.md). Source and dependency licensing is in [LICENSE](LICENSE) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). Suggestions or problems can be reported in this repository's Issues.
