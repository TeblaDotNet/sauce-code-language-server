import {createRequire} from 'node:module';
import {runtimeHash,sourceHash} from './core-integrity.mjs';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';import {dirname,resolve} from 'node:path';
import {build} from 'esbuild';import {loadVocabulary} from '@open-sauce/core/vocabulary/node';
const input=JSON.parse(await readFile('core-input.json','utf8'));
const hash=createHash('sha256').update(await readFile(input.tarball)).digest('hex');if(hash!==input.sha256)throw Error('Pinned Core input checksum mismatch');
const core=resolve(dirname(fileURLToPath(import.meta.resolve('@open-sauce/core'))),'..');
if(await runtimeHash(core)!==input.runtimeHash)throw Error('Installed Core runtime differs from pinned revision');
const v=await loadVocabulary(resolve(core,'knowledge'));if(v.entries.length!==input.entries||!v.resolve('mixing bowl','equipment').length||!v.resolve('roll out','process').length)throw Error('Wrong Core vocabulary');
if(JSON.stringify(Object.fromEntries(['ingredient','equipment','process'].map(k=>[k,v.entries.filter(e=>e.kind===k).length])))!==JSON.stringify(input.counts))throw Error('Core domain inventory mismatch');
const excluded=new Set(['evidence','observed_parameters','observed_qualifiers','status','curation','scope','nutrition','typical_mass','reference_density']);
const entries=JSON.parse(JSON.stringify(v.entries,(key,value)=>excluded.has(key)?undefined:value));
await mkdir('generated',{recursive:true});await mkdir('dist',{recursive:true});await mkdir('test-dist',{recursive:true});
await writeFile('generated/vocabulary.json',JSON.stringify({coreCommit:input.coreCommit,entries}));
const options={bundle:true,platform:'node',format:'cjs',target:'node18',legalComments:'eof',metafile:true};
const result=await build({...options,entryPoints:['src/server.ts'],outfile:'dist/server.cjs',banner:{js:'#!/usr/bin/env node'}});
await build({...options,entryPoints:['src/completion.ts'],outfile:'test-dist/completion.cjs'});
await writeFile('dist/build-info.json',JSON.stringify({...input,serverVersion:JSON.parse(await readFile('package.json')).version,sourceHash:await sourceHash('.'),snapshotBytes:Buffer.byteLength(JSON.stringify(entries)),serverSha256:createHash('sha256').update(await readFile('dist/server.cjs')).digest('hex')},null,2)+'\n');
await writeFile('test-dist/bundle-inputs.json',JSON.stringify(Object.keys(result.metafile.inputs),null,2));
// Original licence texts for every bundled runtime component; no test fixtures or recipes.
await mkdir('LICENSES',{recursive:true});for(const name of ['MIT.txt','CC0-1.0.txt','CC-BY-4.0.txt'])await writeFile(resolve('LICENSES','Core-'+name),(await readFile(resolve(core,'LICENSES',name),'utf8')).trimEnd()+'\n');
for(const pkg of ['vscode-languageserver','vscode-languageserver-textdocument','vscode-languageserver-protocol','vscode-languageserver-types','vscode-jsonrpc']){
 const serverRequire=createRequire(import.meta.resolve('vscode-languageserver/node.js'));
 const protocolRequire=createRequire(serverRequire.resolve('vscode-languageserver-protocol/node.js'));
 const modulePath=pkg==='vscode-languageserver-textdocument'?import.meta.resolve(pkg):pkg==='vscode-languageserver'?import.meta.resolve(pkg+'/node.js'):pkg==='vscode-languageserver-types'?protocolRequire.resolve(pkg):pkg==='vscode-jsonrpc'?protocolRequire.resolve(pkg+'/node.js'):serverRequire.resolve(pkg+'/node.js');
 let dir=dirname(modulePath.startsWith('file:')?fileURLToPath(modulePath):modulePath);while(true){try{const meta=JSON.parse(await readFile(resolve(dir,'package.json'),'utf8'));if(meta.name===pkg)break;}catch{}const parent=dirname(dir);if(parent===dir)throw Error('License package not found: '+pkg);dir=parent;}
 await copyFile(resolve(dir,'License.txt'),resolve('LICENSES',pkg+'.txt'));
}
