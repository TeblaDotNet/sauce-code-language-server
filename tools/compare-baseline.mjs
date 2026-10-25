import {createRequire} from 'node:module';import assert from 'node:assert/strict';import {TextDocument} from 'vscode-languageserver-textdocument';import {writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
const require=createRequire(import.meta.url),old=require(resolve(process.argv[2])),current=require('../test-dist/completion.cjs');
const cases=new Set(['::instructions\n<ju|lienne, fine>','::equipment\n(flour bowl)\n::instructions\n(fl|','::ingredients\n(heat seasoning)\n::instructions\n(he|','::instructions\n# <jul|','::source\n<<<\n::instructions\n<jul|','::recipe\nname: <jul|','::instructions\n<mix <jul|','::instructions\n{🍞} <jul|','::ingredients\n(egg: wh|','::instructions\n<put|']);
for(const e of old.vocabulary.entries)for(const name of [e.id,...Object.values(e.names),...Object.values(e.plural_names??{}),...(e.aliases??[]).map(a=>typeof a==='string'?a:a.name),...(e.exact_names??[]).map(a=>a.name)]){
 const section=e.kind==='process'?'instructions':e.kind==='equipment'?'equipment':'ingredients',op=e.kind==='process'?'<':'(';
 for(const n of [1,3,name.length])cases.add('::'+section+'\n'+op+name.slice(0,n)+'|');
}
for(const text of cases){const at=text.indexOf('|'),d=TextDocument.create('file:///crème-日本語.opensauce','opensauce',1,text.replace('|','')),p=d.positionAt(at);assert.deepEqual(current.complete(d,p),old.complete(d,p),text);}
const result={cases:cases.size,identical:true,compared:['identities','labels','inserted text','ordering','ranges','details','isIncomplete'],baseline:resolve(process.argv[2])};if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(result,null,2));console.log(result);
