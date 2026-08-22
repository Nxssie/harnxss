import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { TSchema } from "typebox";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ListToolsResultSchema, CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

// Pi has no native MCP client — it only calls locally-registered tools. This
// bridges the ai-gateway context MCP server (web_search, get_context,
// review_code, ...) by discovering its tools at session start and
// registering each as a native pi tool that forwards to tools/call.
const MCP_URL = "https://mcp.nxssie.dev";
const API_KEY = process.env.NX_GATEWAY_PAT ?? "";
const TOOL_PREFIX = "gateway_";

function mcpJsonSchemaToTypebox(schema: Record<string, unknown>): TSchema {
  const type = schema.type as string | undefined;
  const description = schema.description as string | undefined;

  switch (type) {
    case "string": {
      const enumValues = schema.enum as string[] | undefined;
      if (enumValues) {
        return Type.Unsafe<string>({ type: "string" as const, enum: enumValues, description });
      }
      return Type.String({ description });
    }
    case "number":
      return Type.Number({ description });
    case "integer":
      return Type.Integer({ description });
    case "boolean":
      return Type.Boolean({ description });
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      return Type.Array(items ? mcpJsonSchemaToTypebox(items) : Type.Unknown(), { description });
    }
    case "object": {
      const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
      if (!props) return Type.Record(Type.String(), Type.Unknown(), { description });
      const converted: Record<string, TSchema> = {};
      for (const [key, val] of Object.entries(props)) {
        converted[key] = mcpJsonSchemaToTypebox(val);
      }
      const required = schema.required as string[] | undefined;
      return required
        ? Type.Object(converted, { description, additionalProperties: false })
        : Type.Partial(Type.Object(converted, { additionalProperties: false }), { description });
    }
    default:
      return Type.Unknown({ description });
  }
}

export default function (pi: ExtensionAPI) {
  let client: Client | null = null;
  let transport: StreamableHTTPClientTransport | null = null;

  async function connect() {
    if (client) return;
    if (!API_KEY) {
      console.warn("[ai-gateway-mcp] NX_GATEWAY_PAT not set — skipping MCP registration");
      return;
    }

    client = new Client({ name: "ai-gateway-mcp-pi", version: "1.0.0" }, { capabilities: {} });
    transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
      requestInit: { headers: { Authorization: `Bearer ${API_KEY}` } },
    });
    await client.connect(transport);

    const toolsResult = await client.request({ method: "tools/list", params: {} }, ListToolsResultSchema);

    for (const tool of toolsResult.tools) {
      const inputSchema = (tool.inputSchema ?? {}) as Record<string, unknown>;
      const properties = (inputSchema.properties ?? {}) as Record<string, Record<string, unknown>>;
      const required = (inputSchema.required ?? []) as string[];

      // A single Type.Object with Type.Optional() fields — not
      // Type.Intersect() of two objects. typebox v1's Intersect serializes
      // to a bare `{"allOf": [...]}` with no top-level "type": "object",
      // which strict providers (e.g. Kimi K3 via the gateway) reject with
      // "tools.function.parameters.type is required and must be object".
      const allProps: Record<string, TSchema> = {};
      for (const [key, val] of Object.entries(properties)) {
        const converted = mcpJsonSchemaToTypebox(val);
        allProps[key] = required.includes(key) ? converted : Type.Optional(converted);
      }
      const finalParams = Type.Object(allProps, { additionalProperties: false });

      pi.registerTool({
        name: `${TOOL_PREFIX}${tool.name}`,
        label: `Gateway: ${tool.name}`,
        description: tool.description ?? `ai-gateway MCP tool: ${tool.name}`,
        parameters: finalParams as never,
        async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
          if (!client) {
            return {
              content: [{ type: "text" as const, text: "MCP client not connected" }],
              details: {},
            };
          }

          const result = await client.request(
            { method: "tools/call", params: { name: tool.name, arguments: params as Record<string, unknown> } },
            CallToolResultSchema
          );

          const textParts = result.content
            .filter((c): c is { type: "text"; text: string } => c.type === "text")
            .map((c) => c.text);

          return {
            content:
              textParts.length > 0
                ? textParts.map((text) => ({ type: "text" as const, text }))
                : [{ type: "text" as const, text: "Tool returned no text content." }],
            details: {},
          };
        },
      });
    }
  }

  pi.on("session_start", async () => {
    try {
      await connect();
    } catch (err) {
      console.warn("[ai-gateway-mcp] Failed to connect:", err);
    }
  });

  pi.on("session_shutdown", async () => {
    try {
      await transport?.close();
    } catch {
      // ignore close errors on shutdown
    }
    client = null;
    transport = null;
  });
}
