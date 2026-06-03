local augroup = vim.api.nvim_create_augroup
local autocmd = vim.api.nvim_create_autocmd

-- 4-space indent for Java and Kotlin (overrides the global 2-space default)
autocmd("FileType", {
  group = augroup("indent_jvm", { clear = true }),
  pattern = { "java", "kotlin" },
  callback = function()
    vim.opt_local.tabstop = 4
    vim.opt_local.shiftwidth = 4
  end,
})

-- Close terminal buffer automatically when the process exits cleanly
autocmd("TermClose", {
  group = augroup("term_close", { clear = true }),
  callback = function()
    if vim.v.event.status == 0 then
      vim.api.nvim_buf_delete(0, { force = true })
    end
  end,
})
