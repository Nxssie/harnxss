import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  ListToolsResultSchema,
  CallToolResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

const MCP_URL = "https://api.nan.builders/mcp";
const API_KEY = process.env.NAN_API_KEY ?? "";

function mcpJsonSchemaToTypebox(name: string, schema: Record<string, unknown>): Record<string, unknown> {
  const type = schema.type as string | undefined;
  const description = schema.description as string | undefined;

  switch (type) {
    case "string": {
      const enumValues = schema.enum as string[] | undefined;
      if (enumValues) {
        return Type.Unsafe<typeof Type.String>({
          type: "string" as const,
          enum: enumValues,
          description,
        });
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
      return Type.Array(
        items ? mcpJsonSchemaToTypebox(name, items) as never : Type.Unknown(),
        { description },
      );
    }
    case "object": {
      const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
      if (!props) return Type.Record(Type.String(), Type.Unknown(), { description });
      const converted: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(props)) {
        converted[key] = mcpJsonSchemaToTypebox(key, val);
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
      console.warn("[nan-mcp] NAN_API_KEY not set — skipping MCP registration");
      return;
    }

    client = new Client(
      { name: "nan-mcp-pi", version: "1.0.0" },
      { capabilities: {} },
    );

    transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
      requestInit: {
        headers: { Authorization: `Bearer ${API_KEY}` },
      },
    });

    await client.connect(transport);

    const toolsResult = await client.request(
      { method: "tools/list", params: {} },
      ListToolsResultSchema,
    );

    for (const tool of toolsResult.tools) {
      const inputSchema = (tool.inputSchema ?? {}) as Record<string, unknown>;
      const properties = (inputSchema.properties ?? {}) as Record<string, Record<string, unknown>>;
      const required = (inputSchema.required ?? []) as string[];
      const parameters: Record<string, unknown> = {};

      if (required.length > 0) {
        for (const key of required) {
          const val = properties[key];
          if (val) parameters[key] = mcpJsonSchemaToTypebox(key, val);
        }
      }

      const optionalProps: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(properties)) {
        if (!required.includes(key)) {
          optionalProps[key] = mcpJsonSchemaToTypebox(key, val);
        }
      }

      const finalParams = required.length > 0
        ? optionalProps && Object.keys(optionalProps).length > 0
          ? Type.Intersect([
              Type.Object(parameters, { additionalProperties: false }),
              Type.Partial(Type.Object(optionalProps, { additionalProperties: false })),
            ])
          : Type.Object(parameters, { additionalProperties: false })
        : Type.Partial(
            Type.Object(
              Object.keys(properties).length > 0
                ? optionalProps as Record<string, never>
                : {},
              { additionalProperties: false },
            ),
          );

      pi.registerTool({
        name: `nan-${tool.name}`,
        label: `Nan: ${tool.name}`,
        description: tool.description ?? `Nan Builders tool: ${tool.name}`,
        parameters: finalParams as never,
        async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
          if (!client) {
            return {
              content: [{ type: "text" as const, text: "MCP client not connected" }],
              details: {},
              isError: true,
            };
          }

          const result = await client.request(
            {
              method: "tools/call",
              params: { name: tool.name, arguments: params as Record<string, unknown> },
            },
            CallToolResultSchema,
          );

          const textParts = result.content
            .filter((c): c is { type: "text"; text: string } => c.type === "text")
            .map((c) => c.text);

          return {
            content: textParts.length > 0
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
      console.warn("[nan-mcp] Failed to connect:", err);
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