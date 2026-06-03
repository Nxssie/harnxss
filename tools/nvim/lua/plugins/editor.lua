return {
  -- Git blame inline (extend LazyVim's gitsigns defaults)
  {
    "lewis6991/gitsigns.nvim",
    opts = {
      current_line_blame = true,
      current_line_blame_opts = { delay = 500 },
    },
  },

  -- Harpoon2: jump between hot files without Telescope
  {
    "ThePrimeagen/harpoon",
    branch = "harpoon2",
    dependencies = { "nvim-lua/plenary.nvim" },
    keys = {
      { "<leader>ha", function() require("harpoon"):list():add() end,                                                   desc = "Harpoon add" },
      { "<leader>hh", function() local h = require("harpoon"); h.ui:toggle_quick_menu(h:list()) end,                   desc = "Harpoon menu" },
      { "<leader>1",  function() require("harpoon"):list():select(1) end,                                              desc = "Harpoon file 1" },
      { "<leader>2",  function() require("harpoon"):list():select(2) end,                                              desc = "Harpoon file 2" },
      { "<leader>3",  function() require("harpoon"):list():select(3) end,                                              desc = "Harpoon file 3" },
      { "<leader>4",  function() require("harpoon"):list():select(4) end,                                              desc = "Harpoon file 4" },
    },
  },

  -- Oil.nvim: edit the filesystem as a buffer
  {
    "stevearc/oil.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    keys = {
      { "-", "<cmd>Oil<cr>", desc = "Open parent directory (oil)" },
    },
    opts = {
      -- Let neo-tree (<leader>e) remain the primary sidebar
      default_file_explorer = false,
    },
  },
}
