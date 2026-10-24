import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,copyFile,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const binary=resolve(process.argv[2]??join(root,'standalone/windows-x64/opensauce-language-server.exe'));
const outside=await mkdtemp(join(tmpdir(),'Sauce LSP crème 日本語 ')),empty=join(outside,'empty');await mkdir(empty);
const exe=join(outside,process.platform==='win32'?'opensauce-language-server.exe':'opensauce-language-server');await copyFile(binary,exe);
const env={PATH:empty,HOME:outside,USERPROFILE:outside,TEMP:outside,TMP:outside,NODE_PATH:''};
for(const k of ['SystemRoot','WINDIR','ComSpec'])if(process.env[k])env[k]=process.env[k];
for(const cmd of ['node','bun','npm','pnpm'])assert.ok(spawnSync(cmd,['--version'],{cwd:outside,env}).error,cmd+' discoverable');
await writeFile(join(outside,'.env'),'NODE_OPTIONS=--invalid-option\n');
await writeFile(join(outside,'bunfig.toml'),'preload = ["./must-not-load.js"]\n');
async function session(command,args,mode='normal'){
 const child=spawn(command,args,{cwd:outside,env,stdio:['pipe','pipe','pipe'],windowsHide:true});
 let buffer=Buffer.alloc(0),stderr='',invalid;const messages=[],pending=new Map();let id=0;
 const exited=new Promise((res,rej)=>{child.on('error',rej);child.on('close',(code,signal)=>res({code,signal}));});
 child.stderr.on('data',b=>stderr+=b);
 child.stdout.on('data',b=>{
  try{
   buffer=Buffer.concat([buffer,b]);
   while(buffer.length){
    const end=buffer.indexOf('\r\n\r\n');if(end<0)break;
    const header=buffer.subarray(0,end).toString();assert.match(header,/^Content-Length: \d+(?:\r\nContent-Type: [^\r\n]+)?$/i,'Non-protocol stdout');
    const len=Number(header.match(/Content-Length: (\d+)/i)[1]);if(buffer.length<end+4+len)break;
    const message=JSON.parse(buffer.subarray(end+4,end+4+len));buffer=buffer.subarray(end+4+len);
    messages.push(message);if(pending.has(message.id)){pending.get(message.id)(message);pending.delete(message.id);}
   }
  }catch(e){invalid=e;child.kill();}
 });
 function send(value,fragment=false){
  const body=Buffer.from(JSON.stringify(value)),frame=Buffer.concat([Buffer.from('Content-Length: '+body.length+'\r\n\r\n'),body]);
  if(fragment){child.stdin.write(frame.subarray(0,7));child.stdin.write(frame.subarray(7,29));child.stdin.write(frame.subarray(29));}else child.stdin.write(frame);
 }
 async function request(method,params,fragment=false){
  const n=++id;let timer;
  const answer=new Promise((res,rej)=>{pending.set(n,res);timer=setTimeout(()=>rej(Error('Timed out: '+method+' '+stderr)),8000);});
  send({jsonrpc:'2.0',id:n,method,params},fragment);
  try{return await answer;}finally{clearTimeout(timer);}
 }
 const notify=(method,params)=>send({jsonrpc:'2.0',method,params});
 async function exitWithin(){let timer;try{return await Promise.race([exited,new Promise((_,rej)=>{timer=setTimeout(()=>rej(Error('Exit timeout')),8000);})]);}finally{clearTimeout(timer);}}
 try{
  const init=await request('initialize',{processId:null,rootUri:null,capabilities:{}},true);assert.equal(init.result.capabilities.textDocumentSync,2);
  notify('initialized',{});
  const uri='file:///C:/recipes/cr%C3%A8me%20%E6%97%A5%E6%9C%AC.opensauce',other='file:///second.opensauce';
  const open=(u,text)=>notify('textDocument/didOpen',{textDocument:{uri:u,languageId:'opensauce',version:1,text}});
  const completion=async(u,line,character)=>{const r=await request('textDocument/completion',{textDocument:{uri:u},position:{line,character}});assert.ok(r.result);return r.result;};
  if(mode==='normal'){
   open(uri,'::equipment\n(pasta extr');assert.ok((await completion(uri,1,11)).items.some(i=>i.data.identity==='equipment:pasta-extruder'));
   notify('textDocument/didChange',{textDocument:{uri,version:2},contentChanges:[{range:{start:{line:1,character:1},end:{line:1,character:11}},text:'mix'}]});
   assert.ok((await completion(uri,1,4)).items.some(i=>i.data.identity==='equipment:mixing-bowl'));
   notify('textDocument/didChange',{textDocument:{uri,version:3},contentChanges:[{text:'::equipment\n(flour bowl)\n::instructions\n(fl'}]});
   const local=await completion(uri,3,3);assert.equal(local.items[0].label,'flour bowl');
   assert.deepEqual(await completion(uri,3,3),local);
   open(other,'::instructions\n(fl');assert.ok(!(await completion(other,1,3)).items.some(i=>i.label==='flour bowl'));
   for(const [text,line,col,expected] of [
    ['::instructions\n<velv',1,5,'process:velvet'],
    ['::instructions\n<put',1,4,'process:place'],
    ['::ingredients\n(cour',1,5,'ingredient:courgette'],
    ['::instructions\n{🍞} <jul',1,9,'process:julienne'],
    ['::instructions\n# <jul',1,6,null],
    ['::source\n<<<\n::instructions\n<jul',3,4,null]
   ]){
    notify('textDocument/didChange',{textDocument:{uri,version:4},contentChanges:[{text}]});
    const result=await completion(uri,line,col);if(expected)assert.ok(result.items.some(i=>i.data.identity===expected),expected);else assert.deepEqual(result.items,[]);
   }
   assert.equal((await request('sauce/unsupported',{})).error.code,-32601);
   assert.equal((await request('textDocument/completion',{})).error.code,-32602);
   notify('textDocument/didClose',{textDocument:{uri}});assert.deepEqual((await completion(uri,1,4)).items,[]);
   assert.equal((await request('shutdown',null)).result,null);notify('exit');
  }else if(mode==='exit-before-shutdown'){notify('exit');}
  else if(mode==='eof'){child.stdin.end();}
  else if(mode==='signal'){child.kill('SIGTERM');}
  const exit=await exitWithin();if(invalid)throw invalid;assert.equal(buffer.length,0,'Trailing non-protocol stdout');
  assert.equal(stderr,'');if(mode==='normal')assert.equal(exit.code,0);if(mode==='exit-before-shutdown')assert.equal(exit.code,1);
  return {messages,exit};
 }finally{if(child.exitCode===null&&child.signalCode===null)child.kill();}
}
const results={};
for(const mode of ['normal','exit-before-shutdown','eof','signal']){
 const node=await session(process.execPath,[join(root,'dist/server.cjs'),'--stdio'],mode);
 const standalone=await session(exe,['--stdio'],mode);
 assert.deepEqual(standalone,node,mode+' protocol/runtime mismatch');results[mode]=node;
}
const evidence={passed:true,platform:process.platform,arch:process.arch,executableSha256:createHash('sha256').update(await readFile(exe)).digest('hex'),outside,isolation:'External directory, restricted PATH, no installed Core/dependencies/knowledge there; not an OS sandbox or fresh VM.',results};
await mkdir(join(root,'work'),{recursive:true});await writeFile(join(root,'work/protocol-parity.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({passed:true,outside,modes:Object.keys(results),messages:results.normal.messages.length,sha256:evidence.executableSha256}));
