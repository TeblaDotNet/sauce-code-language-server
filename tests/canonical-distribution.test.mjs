import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {completionEntry} from '../tools/snapshot.mjs';
test('reviewed semantic allowlist excludes nested editorial and observation fields',()=>{
 const value=completionEntry({id:'test',kind:'ingredient',names:{en:'test'},aliases:[{name:'old',warning:'compatibility',type:'legacy',observed_count:12}],exact_names:[{name:'test',locale:'en-GB',sources:[{citation:'not runtime'}],scope:'editorial scope'}],parts:{piece:{names:{en:'piece'},lexical_names:['test piece'],nutrition:{bad:true},variants:{cut:{names:{en:'cut'},sources:['no']}},part_groups:{group:{process:'cut',parts:['a','b'],description:'no',sources:['no']}}}},categories:['produce'],regional_mappings:[],editorial:[{text:'never bundled'}],hero:{asset:'photo.jpg'},curation:{status:'checked'},reference_density:[{value:2}]});
 assert.deepEqual(value,{id:'test',kind:'ingredient',names:{en:'test'},aliases:[{name:'old',type:'legacy',warning:'compatibility'}],parts:{piece:{names:{en:'piece'},lexical_names:['test piece'],variants:{cut:{names:{en:'cut'}}},part_groups:{group:{process:'cut',parts:['a','b']}}}},exact_names:[{name:'test',locale:'en-GB'}]});
});
test('runtime snapshot and bundle contain canonical data, no editorial assets or registries',async()=>{
 const snapshot=JSON.parse(await readFile('generated/vocabulary.json'));assert.equal(snapshot.entries.length,969);
 assert.deepEqual(Object.fromEntries(['ingredient','equipment','process'].map(k=>[k,snapshot.entries.filter(e=>e.kind===k).length])),{ingredient:414,equipment:255,process:300});
 const forbidden=new Set(['editorial','hero','resources','sources','review_version','review_status','curation','categories','regional_mappings','nutrition','typical_mass','reference_density','measurements','evidence','observed_parameters','observed_qualifiers']);
 function scan(v){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){assert.ok(!forbidden.has(k),'Unexpected runtime field '+k);scan(x);}}scan(snapshot);
 const inputs=JSON.parse(await readFile('test-dist/bundle-inputs.json'));assert.ok(inputs.every(p=>!/\.(yaml|jpe?g|png|webp)$/.test(p)&&!p.includes('/knowledge/')));
 const info=JSON.parse(await readFile('dist/build-info.json'));assert.equal(info.snapshotSha256,createHash('sha256').update(await readFile('generated/vocabulary.json')).digest('hex'));
});
