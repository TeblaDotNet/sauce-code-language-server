-- Run with nvim --headless -u NONE -l tools/test-neovim.lua.
-- Inputs are explicit environment paths; never loads the user's init.lua.
local exe=assert(vim.env.OSF_LSP_EXECUTABLE)
local plugin=assert(vim.env.OSF_VIM_PLUGIN)
local output=assert(vim.env.OSF_NVIM_RESULT)
vim.opt.runtimepath:prepend(plugin)
vim.cmd('filetype plugin indent on')
vim.cmd('syntax enable')
local filename=vim.fn.tempname()..'.opensauce'
vim.fn.writefile({'::instructions','<jul'},filename)
vim.cmd('edit '..vim.fn.fnameescape(filename))
assert(vim.bo.filetype=='opensauce','File recognition failed')
assert(vim.bo.syntax=='opensauce','Native syntax missing')
local id=assert(vim.lsp.start({name='opensauce-stage5',cmd={exe,'--stdio'},root_dir=vim.fn.fnamemodify(filename,':h')}))
assert(vim.wait(10000,function() local c=vim.lsp.get_client_by_id(id);return c and c.initialized end,10),'LSP attachment timeout')
local client=assert(vim.lsp.get_client_by_id(id))
local changes=0
vim.api.nvim_create_autocmd('LspNotify',{callback=function(args) if args.data.method=='textDocument/didChange' then changes=changes+1 end end})
local cases={
 {'::instructions\n<jul','julienne'},
 {'::equipment\n(mix','mixing bowl'},
 {'::equipment\n(flour bowl)\n::instructions\n(fl','flour bowl',true},
 {'::ingredients\n(cour','courgette'},
 {'::instructions\n# <jul',false},
 {'::source\n<<<\n::instructions\n<jul',false}
}
for _,case in ipairs(cases) do
 local lines=vim.split(case[1],'\n',{plain=true})
 local before=changes
 vim.api.nvim_buf_set_lines(0,0,-1,false,lines)
 assert(vim.wait(10000,function() return changes>before end,10),'Native didChange timeout')
 local response=assert(client:request_sync('textDocument/completion',{textDocument={uri=vim.uri_from_bufnr(0)},position={line=#lines-1,character=#lines[#lines]}},10000,0))
 assert(not response.err,vim.inspect(response.err))
 local items=response.result.items
 if case[2] then
  local found=false
  for _,item in ipairs(items) do if item.label==case[2] then found=true end end
  assert(found,'Missing '..case[2])
  if case[3] then assert(items[1].label==case[2],'Local priority') end
 else assert(#items==0,'Suppression failed') end
end
client:stop()
assert(vim.wait(10000,function() return vim.lsp.get_client_by_id(id)==nil end,10),'Shutdown timeout')
vim.fn.writefile({vim.json.encode({passed=true,version=vim.version(),cases=#cases,filetype=vim.bo.filetype,syntax=vim.bo.syntax,shutdown=true})},output)
vim.fn.delete(filename)
vim.cmd('qa!')
