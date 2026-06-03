return {
  -- Treesitter: ensure parsers for the full stack
  {
    "nvim-treesitter/nvim-treesitter",
    opts = function(_, opts)
      vim.list_extend(opts.ensure_installed or {}, {
        "tsx", "typescript", "javascript", "html", "css",
        "java", "kotlin",
        "python",
        "rust", "toml",
        "json", "yaml", "markdown", "markdown_inline",
      })
    end,
  },

  -- Mason: auto-install LSP servers and formatters
  {
    "williamboman/mason.nvim",
    opts = function(_, opts)
      vim.list_extend(opts.ensure_installed or {}, {
        "typescript-language-server",
        "prettier",
        "eslint-lsp",
        "jdtls",
        "kotlin-language-server",
        "ktlint",
        "basedpyright",
        "ruff",
      })
    end,
  },

  -- LSP: add Kotlin and replace pyright with basedpyright
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        -- Kotlin (no LazyVim extra exists; configure manually)
        kotlin_language_server = {},
        -- basedpyright has stricter type inference than upstream pyright
        basedpyright = {
          settings = {
            basedpyright = { typeCheckingMode = "standard" },
          },
        },
        pyright = { enabled = false },
        ruff = {},
      },
    },
  },

  -- Formatters: ruff for Python, ktlint for Kotlin
  {
    "stevearc/conform.nvim",
    opts = {
      formatters_by_ft = {
        python = { "ruff_format" },
        kotlin = { "ktlint" },
      },
    },
  },
}
