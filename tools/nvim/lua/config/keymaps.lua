local map = vim.keymap.set

-- Quick escape from insert mode
map("i", "jk", "<Esc>", { desc = "Escape" })

-- Move selected lines up/down
map("v", "J", ":m '>+1<CR>gv=gv", { desc = "Move selection down" })
map("v", "K", ":m '<-2<CR>gv=gv", { desc = "Move selection up" })

-- Keep cursor centered while scrolling / searching
map("n", "<C-d>", "<C-d>zz")
map("n", "<C-u>", "<C-u>zz")
map("n", "n", "nzzzv")
map("n", "N", "Nzzzv")

-- Paste over selection without losing the register
map("x", "<leader>p", [["_dP]], { desc = "Paste without overwriting register" })

-- Inline diagnostics float
map("n", "<leader>cd", vim.diagnostic.open_float, { desc = "Line diagnostics" })
