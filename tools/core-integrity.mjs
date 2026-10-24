import {readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {join} from 'node:path';
export async function runtimeHash(root){
 const rows=[];async function walk(dir){for(const e of await readdir(join(root,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await walk(p);else rows.push([p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')]);}}
 await walk('dist');await walk('knowledge');rows.sort(([a],[b])=>a<b?-1:a>b?1:0);return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}

export async function sourceHash(root){
 const files=['package.json','core-input.json','pnpm-lock.yaml','tools/build.mjs','tools/core-integrity.mjs'];
 async function walk(dir){for(const e of await readdir(join(root,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await walk(p);else files.push(p);}}
 await walk('src');files.sort();
 const rows=await Promise.all(files.map(async p=>[p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')]));
 return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}
