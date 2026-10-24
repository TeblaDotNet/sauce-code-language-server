import {sourceHash} from './core-integrity.mjs';
import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const compiler=process.env.OSF_BUN??'bun';
function run(exe,args){const r=spawnSync(exe,args,{cwd:root,encoding:'utf8',windowsHide:true});if(r.error||r.status!==0)throw Error(r.error?.message??r.stderr);return r.stdout.trim();}
if(run(compiler,['--version'])!=='1.4.4')throw Error('Use validated Bun 1.4.4 via OSF_BUN.');
const targets=process.argv.slice(2);if(!targets.length)targets.push('windows-x64');
if(targets.some(t=>!['windows-x64','linux-x64','linux-arm64','darwin-x64','darwin-arm64'].includes(t)))throw Error('Unsupported target');
const info=JSON.parse(await readFile(join(root,'dist/build-info.json')));
if(hash(await readFile(join(root,'dist/server.cjs')))!==info.serverSha256)throw Error('Stale server build');
if(info.sourceHash!==await sourceHash(root))throw Error('Source changed; run pnpm build first');
const pin=JSON.parse(await readFile(join(root,'core-input.json')));if(info.coreCommit!==pin.coreCommit||info.sha256!==pin.sha256)throw Error('Stale Core build');
const pkg=JSON.parse(await readFile(join(root,'package.json')));
const sourceRevision=run('git',['rev-parse','HEAD']);
const dirty=run('git',['status','--porcelain','--untracked-files=no'])!=='';
await mkdir(join(root,'work'),{recursive:true});
for(const target of targets){
 const output=join(root,'standalone',target);await mkdir(output,{recursive:true});
 const file='opensauce-language-server'+(target.startsWith('windows')?'.exe':'');
 // Compile the exact same bundled entry as Node/VS Code. No parallel server.
 const script=`const result=await Bun.build({entrypoints:[${JSON.stringify(join(root,'dist/server.cjs'))}],compile:{target:${JSON.stringify('bun-'+target)},outfile:${JSON.stringify(join(output,file))},autoloadDotenv:false,autoloadBunfig:false,autoloadTsconfig:false,autoloadPackageJson:false},minify:true});if(!result.success){console.error(result.logs);process.exit(1);}`;
 await writeFile(join(root,'work/compile.mjs'),script);run(compiler,['--no-env-file',join(root,'work/compile.mjs')]);
 await cp(join(root,'dist/server.cjs'),join(output,'server.cjs')); // Relinkable application bundle; not needed at runtime.
 for(const name of ['LICENSE','THIRD-PARTY-NOTICES.md'])await cp(join(root,name),join(output,name));
 await cp(join(root,'LICENSES'),join(output,'LICENSES'),{recursive:true});
 const bytes=await readFile(join(output,file));
 const manifest={schema:1,package:pkg.name,version:pkg.version,sourceRevision,trackedChanges:dirty,core:info,compiler:{version:'1.4.4',revision:run(compiler,['--revision'])},target,file,bytes:bytes.length,sha256:hash(bytes),validation:'Compiled only; execution/parity evidence recorded separately.'};
 await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const inventory={};async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await scan(p);else if(e.name!=='inventory.json'){const b=await readFile(p);inventory[relative(output,p).replaceAll('\\','/')]={bytes:b.length,sha256:hash(b)};}}}
 await scan(output);await writeFile(join(output,'inventory.json'),JSON.stringify(inventory,null,2)+'\n');
 console.log(JSON.stringify({target,bytes:bytes.length,sha256:manifest.sha256,sourceRevision,trackedChanges:dirty}));
}
