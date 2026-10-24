import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFile,readdir} from 'node:fs/promises';import {join} from 'node:path';
import {TextDocument} from 'vscode-languageserver-textdocument';
const require=createRequire(import.meta.url);const {complete,vocabulary}=require('../test-dist/completion.cjs');
function run(text){const cursor=text.indexOf('|'),source=text.replace('|',''),d=TextDocument.create('file:///recipe.opensauce','opensauce',1,source);const before=d.getText();const result=complete(d,d.positionAt(cursor));assert.equal(d.getText(),before);return result;}
for(const [title,source,id]of [
 ['process','::instructions\n<jul|','process:julienne'],['case-insensitive','::instructions\n<WHI|','process:whisk'],['alias','::instructions\n<put|','process:place'],['generic','::instructions\n<retur|','process:return'],['equipment','::equipment\n(mix|','equipment:mixing-bowl'],['equipment alias','::equipment\n(squirt|','equipment:squeeze-bottle'],['ingredient','::ingredients\n(cour|','ingredient:courgette'],['nested context','::instructions\n{dough} <mix, using (mix|','equipment:mixing-bowl'],['group','::instructions\nOptional [\n  <jul|','process:julienne'],['broken earlier line','::instructions\n<unfinished\n<jul|','process:julienne'],['CRLF','::equipment\r\n(mix|','equipment:mixing-bowl']
])test(title,()=>assert.ok(run(source).items.some(x=>x.data.identity===id)));
for(const [title,source]of [
 ['comment','::instructions\n# <jul|'],['inline comment','::instructions\n(flour) # <jul|'],['raw','::source\n<<<\n::instructions\n<jul|'],['unclosed source','::source\n<<<\n(mix|'],['metadata','::recipe\nname: <jul|'],['notes','::notes\n(mix|'],['unknown section','::random\n<jul|'],['action parameter','::instructions\n<mix, wh|'],['qualifier','::equipment\n(bowl, mix|'],['product','::ingredients\n(gin @ mix|'],['variant','::ingredients\n(flour; mix|'],['part','::ingredients\n(egg: wh|'],['nested malformed','::equipment\n((mix|'],['ambiguous action nesting','::instructions\n<mix <jul|'],['result','::instructions\n{mix|'],['image','::instructions\n![mix](mix|'],['URL','::instructions\nhttps://example.org/#<jul|'],['section boundary','::equipment\n::ingredients|'],['no section','<jul|']
])test('no suggestions: '+title,()=>assert.deepEqual(run(source).items,[]));
test('after closed raw source new section resumes',()=>assert.ok(run('::source\n<<<\n<raw\n>>>\n::instructions\n<jul|').items.some(x=>x.label==='julienne')));
test('clear domains never cross and identities deduplicate',()=>{
 for(const [s,domain]of [['::equipment\n(|','equipment:'],['::ingredients\n(|','ingredient:'],['::instructions\n<|','process:']]){const result=run(s);assert.ok(result.items.length);assert.ok(result.items.every(i=>i.data.identity.startsWith(domain)));assert.equal(new Set(result.items.map(i=>i.data.identity)).size,result.items.length);assert.ok(result.items.length<=60);}
});
test('locals, roles and qualifiers are authored; stable ranking and exact matching',()=>{
 const source='::equipment\n(mixing bowl)\n(flour bowl)\n(bowl, for flour)\n::instructions\n(fl|';const a=run(source);assert.equal(a.items[0].label,'flour bowl');assert.equal(a.items[0].textEdit.newText,'flour bowl');assert.equal(a.items[0].data.local,true);assert.deepEqual(a,run(source));
 assert.ok(run('::equipment\n(bowl, for flour)\n::instructions\n(bo|').items.some(x=>x.label==='bowl, for flour'));
 assert.equal(run('::equipment\n(cup|').items[0].label,'cup');
});
test('mid-name edit preserves closing punctuation and remaining document',()=>{
 const text='::instructions\n<ju|lienne, fine>\n(flour)',r=run(text),item=r.items.find(x=>x.label==='julienne');assert.deepEqual(item.textEdit.range,{start:{line:1,character:1},end:{line:1,character:9}});assert.equal(item.textEdit.newText,'julienne');
});
test('unknown ingredients are permitted and no suggestions are invented',()=>assert.deepEqual(run('::ingredients\n(xyzunknown|').items,[]));
test('UTF-16 positions and trailing spaces remain safe',()=>assert.ok(run('::instructions\n{🍞} <  jul|').items.some(x=>x.label==='julienne')));
test('exact approved Core identities are present',()=>{assert.equal(vocabulary.entries.length,969);assert.equal(vocabulary.resolve('mixing bowl','equipment')[0].id,'mixing-bowl');assert.equal(vocabulary.resolve('put','process')[0].id,'place');});
test('all real Corpus files still parse; representative declarations complete',{skip:!process.env.OSF_CORPUS},async()=>{
 const {parseRecipe}=await import('@open-sauce/core');let count=0;const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(p.endsWith('.opensauce'))files.push(p);}}await walk(join(process.env.OSF_CORPUS,'examples'));
 for(const file of files){const text=await readFile(file,'utf8'),recipe=parseRecipe(text,{vocabulary});assert.equal(recipe.source,text);assert.equal(recipe.diagnostics.filter(d=>d.severity==='error').length,0,file);count++;}
 assert.equal(count,490);
 const ravioli=await readFile(join(process.env.OSF_CORPUS,'examples/public-domain-recipes/ravioli/ravioli.opensauce'),'utf8');assert.ok(run(ravioli+'\n::instructions\n(tea|').items.some(x=>x.label==='teaspoon'&&x.data.local));
});

test('refreshed identity inventory and later tranche completions',()=>{
 assert.deepEqual(Object.fromEntries(['ingredient','equipment','process'].map(k=>[k,vocabulary.entries.filter(e=>e.kind===k).length])),{ingredient:414,equipment:255,process:300});
 for(const [source,id] of [
 ['::equipment\n(pasta extr|','equipment:pasta-extruder'],
 ['::instructions\n<velv|','process:velvet'],
 ['::instructions\n<tourn|','process:tourne']
 ])assert.ok(run(source).items.some(i=>i.data.identity===id),id);
});
