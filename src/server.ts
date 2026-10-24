import {createConnection,TextDocuments,TextDocumentSyncKind,ResponseError,ErrorCodes} from 'vscode-languageserver/node.js';
import {TextDocument} from 'vscode-languageserver-textdocument';
import {complete} from './completion.js';
// Explicit streams keep this service editor-independent. stdout is exclusively JSON-RPC.
const connection=createConnection(process.stdin,process.stdout);
const documents=new TextDocuments(TextDocument);
connection.onInitialize(()=>({capabilities:{textDocumentSync:TextDocumentSyncKind.Incremental,completionProvider:{triggerCharacters:['<','('],resolveProvider:false}},serverInfo:{name:'Sauce Code Language Server',version:'0.2.0'}}));
connection.onCompletion(params=>{
 // A stable protocol error avoids leaking engine-specific TypeErrors into replies.
 if(typeof params?.textDocument?.uri!=='string'||!Number.isInteger(params?.position?.line)||!Number.isInteger(params?.position?.character)||params.position.line<0||params.position.character<0)
  return new ResponseError(ErrorCodes.InvalidParams,'Expected textDocument.uri and a non-negative integer position');
 const document=documents.get(params.textDocument.uri);
 return document?.languageId==='opensauce'?complete(document,params.position):{isIncomplete:false,items:[]};
});
documents.listen(connection);
connection.listen();
