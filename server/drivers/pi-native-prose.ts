type Json = Record<string, unknown>;

const STOCK = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
] as const;

const SHORT: Record<string, string> = {
  read: "Read text/images; text capped at 2000 lines/50KB. Continue with offset (1-indexed line)/limit (lines).",
  bash: "Run bash in cwd; stdout/stderr capped at last 2000 lines/50KB; full truncated output saved. Timeout in seconds; no default.",
  edit: "Exact replacements in one file. Each oldText must uniquely match the original; edits must not overlap. Merge nearby edits; keep matches short.",
  write: "Write/overwrite a file; creates parent directories.",
};
function record(value: unknown): value is Json {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sameShape(value: unknown, expected: unknown, key = ""): boolean {
  if (Array.isArray(expected)) {
    if (!Array.isArray(value) || value.length !== expected.length) return false;
    if (key === "required") return JSON.stringify([...value].sort()) === JSON.stringify([...expected].sort());
    return expected.every((item, index) => sameShape(value[index], item));
  }
  if (!record(expected)) return value === expected;
  if (!record(value)) return false;
  if (!Object.entries(expected).every(([name, item]) => sameShape(value[name], item, name))) return false;
  // Only known provider-added schema metadata is accepted beyond the exact stock shape.
  return Object.keys(value).every((name) => Object.hasOwn(expected, name)
    || (key !== "properties" && (name === "title" || name === "$schema"
      || (name === "additionalProperties" && value[name] === false))));
}

function strictSchema(value: Json): Json {
  const result = { ...value };
  if (record(value.properties)) {
    const required = Array.isArray(value.required) ? value.required : [];
    result.properties = Object.fromEntries(Object.entries(value.properties).map(([name, schema]) => {
      const strict = record(schema) ? strictSchema(schema) : schema;
      return [name, required.includes(name) ? strict : { anyOf: [strict, { type: "null" }] }];
    }));
    result.required = Object.keys(value.properties);
    result.additionalProperties = false;
  }
  if (record(value.items)) result.items = strictSchema(value.items);
  return result;
}

function shortenSchema(value: Json, propertyName?: string): Json {
  const result = { ...value };
  if (propertyName && typeof value.description === "string") delete result.description;
  if (record(value.properties)) result.properties = Object.fromEntries(Object.entries(value.properties).map(([name, schema]) =>
    [name, record(schema) ? shortenSchema(schema, name) : schema]));
  if (record(value.items)) result.items = shortenSchema(value.items);
  if (Array.isArray(value.anyOf)) result.anyOf = value.anyOf.map((branch) => record(branch) ? shortenSchema(branch, propertyName) : branch);
  return result;
}

function compactTool(value: unknown): unknown {
  if (!record(value)) return value;
  if (record(value.function)) return { ...value, function: compactTool(value.function) };
  if (Array.isArray(value.functionDeclarations)) return { ...value, functionDeclarations: value.functionDeclarations.map(compactTool) };
  const stock = STOCK.find((tool) => tool.name === value.name && tool.description === value.description);
  const schemaKey = record(value.parameters) ? "parameters" : record(value.input_schema) ? "input_schema" : undefined;
  if (!stock || !schemaKey || (!sameShape(value[schemaKey], stock.parameters)
    && !sameShape(value[schemaKey], strictSchema(stock.parameters)))) return value;
  return { ...value, description: SHORT[stock.name], [schemaKey]: shortenSchema(value[schemaKey] as Json) };
}

/** Compact recognized Pi 1.5.2 stock prose only in provider tool declarations; never mutate tool metadata or validation. */
export function compactNativeToolProse(payload: unknown): unknown {
  if (!record(payload)) return payload;
  const result = { ...payload };
  if (Array.isArray(payload.tools)) result.tools = payload.tools.map(compactTool);
  if (Array.isArray(payload.input)) result.input = payload.input.map(compactNativeToolProse);
  return result;
}
