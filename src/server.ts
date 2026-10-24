import {createConnection,TextDocuments,TextDocumentSyncKind} from 'vscode-languageserver/node.js';
import {TextDocument} from 'vscode-languageserver-textdocument';
import {complete} from './completion.js';
// Explicit streams keep this service editor-independent. stdout is exclusively JSON-RPC.
const connection=createConnection(process.stdin,process.stdout);
const documents=new TextDocuments(TextDocument);
connection.onInitialize(()=>({capabilities:{textDocumentSync:TextDocumentSyncKind.Incremental,completionProvider:{triggerCharacters:['<','('],resolveProvider:false}},serverInfo:{name:'Sauce Code Language Server',version:'0.1.0'}}));
connection.onCompletion(params=>{
 const document=documents.get(params.textDocument.uri);
 return document?.languageId==='opensauce'?complete(document,params.position):{isIncomplete:false,items:[]};
});
documents.listen(connection);
connection.listen();
