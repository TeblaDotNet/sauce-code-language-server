import { parseRecipe, Vocabulary, type Node, type Recipe, type VocabularyEntry } from '@open-sauce/core';
import { CompletionItemKind, type CompletionItem, type CompletionList, type Position } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import data from '../generated/vocabulary.json' with { type: 'json' };
export const vocabulary = new Vocabulary(data.entries as unknown as VocabularyEntry[]);
const norm = (s: string) => s.trim().toLowerCase();
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function flatten(nodes: Node[]): Node[] { return nodes.flatMap(n => [n, ...('children' in n ? flatten(n.children) : [])]); }
interface Context {
    kind: 'process' | 'equipment' | 'ingredient' | 'thing';
    prefix: string;
    start: number;
    end: number;
    recipe: Recipe;
}
/** Only identifies an unfinished name on the cursor line. Core owns sections, comments and raw payloads. */
function context(document: TextDocument, position: Position): Context | undefined {
    const text = document.getText(), offset = document.offsetAt(position), prefix = text.slice(0, offset);
    if (position.line < 0 || position.character < 0 || document.positionAt(offset).line !== position.line || document.positionAt(offset).character !== position.character)
        return;
    const recipe = parseRecipe(prefix, { vocabulary });
    const section = recipe.sections.at(-1);
    if (!section || !['equipment', 'ingredients', 'instructions'].includes(section.name) || section.span.line === position.line + 1)
        return;
    const nodes = flatten(section.children);
    if (nodes.some(n => n.span.line === position.line + 1 && (n.kind === 'comment' || ('comment' in n && n.comment !== undefined) || ('closingComment' in n && n.closingComment !== undefined))))
        return;
    const lineStart = document.offsetAt({ line: position.line, character: 0 }), line = prefix.slice(lineStart);
    // Image paths, prose URLs, and malformed nested things are deliberately outside v1.
    if (line.includes('![') || /https?:\/\//.test(line))
        return;
    const stack: {
        char: string;
        at: number;
    }[] = [];
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '(') {
            if (stack.at(-1)?.char === '(' || stack.at(-1)?.char === '{')
                return;
            stack.push({ char: ch, at: i });
        }
        else if (ch === '<') {
            if (stack.length)
                return;
            stack.push({ char: ch, at: i });
        }
        else if (ch === '{') {
            if (stack.length)
                return;
            stack.push({ char: ch, at: i });
        }
        else if (ch === ')' || ch === '>' || ch === '}') {
            const wanted = ch === ')' ? '(' : ch === '>' ? '<' : '{';
            if (stack.at(-1)?.char !== wanted)
                return;
            stack.pop();
        }
    }
    const open = stack.at(-1);
    if (!open || open.char === '{')
        return;
    if (open.char === '(' && stack.length > 1) {
        const parent = stack.at(-2)!;
        if (parent.char !== '<' || !line.slice(parent.at, open.at).includes(','))
            return;
    }
    const head = line.slice(open.at + 1);
    if (!/^[\p{L}\p{N}\s'’\-]*$/u.test(head))
        return;
    if (open.char === '<' && section.name !== 'instructions')
        return;
    const leading = head.length - head.trimStart().length, start = lineStart + open.at + 1 + leading;
    // Replace an existing name suffix when invoked mid-word; never consume qualifiers or delimiters.
    const suffix = text.slice(offset).match(/^[\p{L}\p{N}'’\-]*/u)?.[0] ?? '';
    return { kind: open.char === '<' ? 'process' : section.name === 'equipment' ? 'equipment' : section.name === 'ingredients' ? 'ingredient' : 'thing', prefix: norm(head), start, end: offset + suffix.length, recipe };
}
function names(entry: VocabularyEntry, locale?: string): string[] {
    const offered = [entry.canonical_name, ...Object.values(entry.names), ...Object.values(entry.plural_names ?? {}), ...(entry.aliases ?? []).map(a => typeof a === 'string' ? a : a.name), ...(entry.exact_names ?? []).map(a => a.name)].filter((s): s is string => !!s);
    return [...new Set(offered)].filter(name => vocabulary.resolve(name, entry.kind, locale).some(e => e.id === entry.id));
}
interface Candidate {
    identity: string;
    label: string;
    domain: string;
    local: boolean;
    reference: boolean;
    exact: boolean;
}
export function complete(document: TextDocument, position: Position): CompletionList {
    const c = context(document, position);
    if (!c)
        return { isIncomplete: false, items: [] };
    const candidates = new Map<string, Candidate>();
    if (c.kind === 'thing') {
        // Complete tokens in Core declaration sections are authoritative, even with an unfinished instruction.
        const recipe = parseRecipe(document.getText(), { vocabulary });
        for (const section of recipe.sections.filter(s => ['equipment', 'ingredients'].includes(s.name)))
            for (const node of flatten(section.children)) {
                if (node.kind !== 'statement' || !['declaration', 'choice'].includes(node.role ?? ''))
                    continue;
                for (const token of node.tokens.filter(t => t.kind === 'thing' && t.name && t.raw.endsWith(')'))) {
                    const label = token.raw.slice(1, -1).trim();
                    if (!norm(label).startsWith(c.prefix))
                        continue;
                    const key = 'local:' + section.name + ':' + label;
                    candidates.set(key, { identity: key, label, domain: section.name === 'equipment' ? 'equipment' : 'ingredient', local: true, reference: token.reference !== false, exact: norm(label) === c.prefix });
                }
            }
    }
    for (const entry of vocabulary.entries) {
        if (c.kind !== 'thing' && entry.kind !== c.kind || c.kind === 'thing' && entry.kind === 'process')
            continue;
        const matches = names(entry, c.recipe.locale).filter(n => norm(n).startsWith(c.prefix));
        if (!matches.length)
            continue;
        matches.sort((a, b) => Number(norm(b) === c.prefix) - Number(norm(a) === c.prefix) || Number(b === entry.canonical_name) - Number(a === entry.canonical_name) || compare(a, b));
        const label = matches[0], identity = entry.kind + ':' + (entry.canonical_target ? entry.canonical_target.ingredient + ':' + entry.canonical_target.parts.join(':') : entry.id);
        // Do not duplicate an identical local spelling, but keep genuinely distinct authored roles.
        if ([...candidates.values()].some(x => x.local && x.domain === entry.kind && norm(x.label) === norm(label)))
            continue;
        if (!candidates.has(identity))
            candidates.set(identity, { identity, label, domain: entry.kind, local: false, reference: entry.reference !== false, exact: norm(label) === c.prefix });
    }
    // Rank local declarations, exact matches, reference eligibility, normalized label,
    // then identity. Local labels retain authored spelling, not a canonical substitute.
    const sorted = [...candidates.values()].sort((a, b) => Number(b.local) - Number(a.local) || Number(b.exact) - Number(a.exact) || Number(b.reference) - Number(a.reference) || compare(norm(a.label), norm(b.label)) || compare(a.identity, b.identity));
    // Cap at 60. isIncomplete requests another result as the prefix narrows;
    // truncation must not change candidate order or replacement ranges.
    const items: CompletionItem[] = sorted.slice(0, 60).map((x, i) => ({ label: x.label, kind: x.domain === 'process' ? CompletionItemKind.Function : x.local ? CompletionItemKind.Variable : CompletionItemKind.Class,
        detail: x.local ? 'Declared ' + x.domain + ' in this recipe' : x.identity + (x.reference ? '' : ' · ordinary action/equipment; no reference page'),
        filterText: x.label, sortText: String(i).padStart(4, '0'), textEdit: { range: { start: document.positionAt(c.start), end: document.positionAt(c.end) }, newText: x.label }, data: { identity: x.identity, local: x.local } }));
    return { isIncomplete: sorted.length > 60, items };
}
