import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("exit", {
    description: "Exit pi (alias for /quit)",
    handler: async (_args, ctx) => {
      ctx.shutdown();
    },
  });

  pi.registerCommand("clear", {
    description: "Reset the current session, discarding all context",
    handler: async (_args, ctx) => {
      const oldSession = ctx.sessionManager.getSessionFile();
      await ctx.newSession({
        withSession: async (_newCtx) => {
          if (oldSession) {
            const { unlink } = await import("node:fs/promises");
            await unlink(oldSession).catch(() => {});
          }
        },
      });
    },
  });
}
