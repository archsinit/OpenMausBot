import { expect, it } from "vitest";
import { compactNativeToolProse } from "./pi-native-prose.ts";

const STOCK = [
  {
    "type": "function",
    "function": {
      "name": "read",
      "description": "Read the contents of a file. Supports text files and images (jpg, png, gif, webp, bmp). Images are sent as attachments. For text files, output is truncated to 2000 lines or 50KB (whichever is hit first). Use offset/limit for large files. When you need the full file, continue with offset until complete.",
      "parameters": {
        "type": "object",
        "required": [
          "path"
        ],
        "properties": {
          "path": {
            "type": "string",
            "description": "Path to the file to read (relative or absolute)"
          },
          "offset": {
            "type": "number",
            "description": "Line number to start reading from (1-indexed)"
          },
          "limit": {
            "type": "number",
            "description": "Maximum number of lines to read"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "bash",
      "description": "Execute a bash command in the current working directory. Returns stdout and stderr. Output is truncated to last 2000 lines or 50KB (whichever is hit first). If truncated, full output is saved to a temp file. Optionally provide a timeout in seconds.",
      "parameters": {
        "type": "object",
        "required": [
          "command"
        ],
        "properties": {
          "command": {
            "type": "string",
            "description": "Shell command to execute"
          },
          "timeout": {
            "type": "number",
            "description": "Timeout in seconds (optional, no default timeout)"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "edit",
      "description": "Edit a single file using exact text replacement. Every edits[].oldText must match a unique, non-overlapping region of the original file. If two changes affect the same block or nearby lines, merge them into one edit instead of emitting overlapping edits. Do not include large unchanged regions just to connect distant changes.",
      "parameters": {
        "type": "object",
        "required": [
          "path",
          "edits"
        ],
        "properties": {
          "path": {
            "type": "string",
            "description": "Path to the file to edit (relative or absolute)"
          },
          "edits": {
            "type": "array",
            "items": {
              "type": "object",
              "required": [
                "oldText",
                "newText"
              ],
              "properties": {
                "oldText": {
                  "type": "string",
                  "description": "Exact text for one targeted replacement. It must be unique in the original file and must not overlap with any other edits[].oldText in the same call."
                },
                "newText": {
                  "type": "string",
                  "description": "Replacement text for this targeted edit."
                }
              }
            },
            "description": "One or more targeted replacements. Each edit is matched against the original file, not incrementally. Do not include overlapping or nested edits. If two changes touch the same block or nearby lines, merge them into one edit instead."
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "write",
      "description": "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Automatically creates parent directories.",
      "parameters": {
        "type": "object",
        "required": [
          "path",
          "content"
        ],
        "properties": {
          "path": {
            "type": "string",
            "description": "Path to the file to write (relative or absolute)"
          },
          "content": {
            "type": "string",
            "description": "Content to write to the file"
          }
        }
      }
    }
  }
];

function withoutDescriptions(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutDescriptions);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "description").map(([key, item]) => [key, withoutDescriptions(item)]));
}

it("shortens stock prose without changing any schema structure or underlying metadata", () => {
  const payload = { tools: structuredClone(STOCK), instructions: "operator instructions", metadata: { tools: STOCK } };
  const original = structuredClone(payload);
  const compact = compactNativeToolProse(payload);
  expect(withoutDescriptions(compact)).toEqual(withoutDescriptions(original));
  expect(payload).toEqual(original);
  expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(payload).length - 1000);
  expect(JSON.stringify(compact)).toContain("Timeout in seconds; no default");
  expect(JSON.stringify(compact)).toContain("offset (1-indexed line)");
  const declarations = (compact as typeof payload).tools;
  for (const tool of declarations) expect(JSON.stringify(tool.function.parameters)).not.toContain('"description"');
  expect(declarations.find((tool) => tool.function.name === "edit")?.function.description).toContain("uniquely match the original; edits must not overlap");
  expect((compact as typeof payload).metadata).toEqual(original.metadata);
});

it("handles top-level, function wrappers, Anthropic and nested Codex/Google forms", () => {
  const definitions = STOCK.map(({ function: tool }) => tool);
  const anthropic = definitions.map(({ parameters, ...tool }) => ({ ...tool, input_schema: parameters }));
  const payload = { tools: anthropic, input: [{ tools: definitions }, { tools: [{ functionDeclarations: definitions }] }, { content: "personal AGENTS and skills", tools: STOCK }] };
  const compact = compactNativeToolProse(payload) as typeof payload;
  expect(withoutDescriptions(compact)).toEqual(withoutDescriptions(payload));
  expect(compact.tools[0].description.length).toBeLessThan(payload.tools[0].description.length);
  expect(compact.input[0].tools).not.toEqual(payload.input[0].tools);
  expect(compact.input[1].tools).not.toEqual(payload.input[1].tools);
  expect(compact.input[2].content).toBe("personal AGENTS and skills");
});

it("leaves unknown overrides, custom prose and unfamiliar validation constraints untouched", () => {
  for (const modify of [
    (tool: any) => { tool.description += " Operator custom policy."; },
    (tool: any) => { tool.parameters.properties.path.description = "Personal path policy"; },
    (tool: any) => { tool.parameters.properties.path.type = "integer"; },
    (tool: any) => { tool.parameters.properties.path.pattern = "^safe/"; },
    (tool: any) => { tool.parameters.properties.path.enum = ["safe"]; },
    (tool: any) => { tool.parameters.required = []; },
    (tool: any) => { tool.parameters.properties.extra = { type: "boolean" }; },
  ]) {
    const tool = structuredClone(STOCK[0]);
    modify(tool.function);
    const payload = { tools: [tool] };
    expect(compactNativeToolProse(payload)).toEqual(payload);
  }
});

function codexStock(name: "read" | "bash") {
  const tool = structuredClone(STOCK.find((item) => item.function.name === name)!);
  const parameters: any = tool.function.parameters;
  for (const key of name === "read" ? ["offset", "limit"] : ["timeout"]) {
    parameters.properties[key] = { anyOf: [parameters.properties[key], { type: "null" }] };
  }
  parameters.required = Object.keys(parameters.properties);
  parameters.additionalProperties = false;
  return tool;
}

it("recognizes actual Codex all-required nullable stock read/bash without changing validation", () => {
  const tools = [codexStock("read"), codexStock("bash")];
  const payload = { input: [{ role: "system", tools }] };
  const original = structuredClone(payload);
  const compact = compactNativeToolProse(payload) as typeof payload;
  expect(payload).toEqual(original);
  expect(withoutDescriptions(compact)).toEqual(withoutDescriptions(original));
  for (let index = 0; index < tools.length; index++) {
    expect(compact.input[0].tools[index].function.description.length).toBeLessThan(tools[index].function.description.length);
  }
  const read: any = compact.input[0].tools[0].function.parameters;
  const bash: any = compact.input[0].tools[1].function.parameters;
  expect(read.properties.offset.anyOf).toEqual([{ type: "number" }, { type: "null" }]);
  expect(bash.properties.timeout.anyOf).toEqual([{ type: "number" }, { type: "null" }]);
});

it("refuses modified Codex branches, descriptions, constraints and partial strict transforms", () => {
  for (const modify of [
    (schema: any) => { schema.properties.offset.anyOf[0].description += " Custom rule"; },
    (schema: any) => { schema.properties.offset.anyOf[0].minimum = 1; },
    (schema: any) => { schema.properties.offset.anyOf[0].type = "integer"; },
    (schema: any) => { schema.properties.offset.anyOf[1].description = "Custom null policy"; },
    (schema: any) => { schema.properties.offset.anyOf[1].type = "string"; },
    (schema: any) => { schema.properties.offset.anyOf.push({ type: "boolean" }); },
    (schema: any) => { schema.properties.offset.anyOf.reverse(); },
    (schema: any) => { schema.required = ["path"]; },
    (schema: any) => { delete schema.additionalProperties; },
    (schema: any) => { schema.properties.limit = schema.properties.limit.anyOf[0]; },
    (schema: any) => { schema.properties.offset.anyOf[0].items = { type: "string" }; },
  ]) {
    const tool = codexStock("read");
    modify(tool.function.parameters);
    const payload = { tools: [tool] };
    expect(compactNativeToolProse(payload)).toEqual(payload);
  }
});

it("accepts recursively strict nested edit objects while preserving their constraints", () => {
  const tool: any = structuredClone(STOCK.find((item) => item.function.name === "edit")!);
  tool.function.parameters.additionalProperties = false;
  tool.function.parameters.properties.edits.items.additionalProperties = false;
  const payload = { tools: [tool] };
  const compact = compactNativeToolProse(payload);
  expect(withoutDescriptions(compact)).toEqual(withoutDescriptions(payload));
  expect(compact).not.toEqual(payload);
});

it("preserves non-prose metadata including strictness and serialized object constraints", () => {
  const tool: any = structuredClone(STOCK[1]);
  tool.function.strict = true;
  tool.function.parameters.additionalProperties = false;
  tool.function.parameters.title = "Operator title";
  const payload = { tools: [tool], operatorGuidelines: ["Never send external messages"] };
  const compact = compactNativeToolProse(payload);
  expect(withoutDescriptions(compact)).toEqual(withoutDescriptions(payload));
  expect(compact).not.toEqual(payload);
});
