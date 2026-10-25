import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFile,readdir} from 'node:fs/promises';import {dirname,resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';
import {parseRecipe} from '@open-sauce/core';import {loadBundledCanonicalVocabulary} from '@open-sauce/core/vocabulary/node';
const {vocabulary}=createRequire(import.meta.url)('../test-dist/completion.cjs');
const original=await loadBundledCanonicalVocabulary();
test('compact runtime snapshot preserves original accepted-name resolution',()=>{
 for(const entry of original.entries)for(const locale of [undefined,'en-GB','en-US'])for(const name of [entry.id,...Object.values(entry.names),...Object.values(entry.plural_names??{}),...(entry.aliases??[]).map(a=>typeof a==='string'?a:a.name),...(entry.exact_names??[]).map(a=>a.name)])assert.deepEqual(vocabulary.resolve(name,entry.kind,locale).map(e=>e.id),original.resolve(name,entry.kind,locale).map(e=>e.id));
});
test('all Corpus ASTs match full Core vocabulary exactly',{skip:!process.env.OSF_CORPUS},async()=>{
 const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(p.endsWith('.opensauce'))files.push(p);}}await walk(join(process.env.OSF_CORPUS,'examples'));assert.equal(files.length,490);
 for(const file of files){const text=await readFile(file,'utf8');assert.deepEqual(parseRecipe(text,{vocabulary}),parseRecipe(text,{vocabulary:original}),file);}
});
