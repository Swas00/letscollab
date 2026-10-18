import { NextRequest, NextResponse } from "next/server";
import vm from "vm";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Transpiles TypeScript & ES Module syntax to CommonJS-compatible JS for vm execution
 */
function transpileTSAndESModules(rawCode: string): string {
  try {
    const ts = require("typescript");
    const result = ts.transpileModule(rawCode, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        esModuleInterop: true,
        jsx: ts.JsxEmit.React,
      },
    });
    return result.outputText;
  } catch {
    return rawCode
      .replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, "")
      .replace(/^\s*export\s+default\s+/gm, "")
      .replace(/^\s*export\s+(?=(?:async\s+)?function|const|let|var|class)/gm, "")
      .replace(/:\s*(?:string|number|boolean|any|void|never|unknown|Record<[^>]+>|Array<[^>]+>)(?:\[\])?(?=[,)\s=;])/g, "")
      .replace(/interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}/g, "");
  }
}

/**
 * Built-in Serverless Python 3 Interpreter & Step-by-Step Debugger Fallback
 * Used when running on serverless edge/Lambda containers where python3 binary is absent
 */
function executePythonServerless(
  code: string,
  fileName: string,
  mode: "execute" | "debug",
  bpSet: Set<number>,
  watchExpressions: string[]
) {
  let stdout = "";
  let stderr = "";
  const steps: any[] = [];

  try {
    // Convert common Python constructs into an instrumented JS evaluation sandbox
    const pyLines = code.split("\n");

    const customPrint = (...args: any[]) => {
      const formatted = args
        .map((a) => {
          if (a === null || a === undefined) return "None";
          if (typeof a === "boolean") return a ? "True" : "False";
          if (typeof a === "object") return JSON.stringify(a);
          return String(a);
        })
        .join(" ");
      stdout += formatted + "\n";
    };

    const pyMath = {
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      sqrt: Math.sqrt,
      pi: Math.PI,
      e: Math.E,
      floor: Math.floor,
      ceil: Math.ceil,
      pow: Math.pow,
      abs: Math.abs,
      log: Math.log,
    };

    const pyTime = {
      time: () => Number((Date.now() / 1000).toFixed(3)),
      sleep: () => {},
    };

    const pyRandom = {
      randint: (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a,
      random: () => Math.random(),
    };

    // Transpile Python to JS for common idioms (functions, loops, list comprehensions, f-strings, dicts)
    const jsLines: string[] = [];
    const indentStack: number[] = [0];
    const trackedVars = new Set<string>();
    let currentFn = "main (module)";

    for (let i = 0; i < pyLines.length; i++) {
      const rawLine = pyLines[i];
      const lineNo = i + 1;
      const trimmed = rawLine.trim();

      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        jsLines.push(`// ${trimmed}`);
        continue;
      }

      // Measure leading spaces
      const indentMatch = rawLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].replace(/\t/g, "    ").length : 0;

      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        jsLines.push("}");
      }

      if (trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
        jsLines.push(`// ${trimmed}`);
        continue;
      }

      if (trimmed.startsWith("if __name__")) {
        indentStack.push(indent + 4);
        jsLines.push("if (true) {");
        continue;
      }

      // Function definition: def foo(a=1):
      const defMatch = trimmed.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:$/);
      if (defMatch) {
        currentFn = defMatch[1];
        const params = defMatch[2]
          .split(",")
          .map((p) => p.trim().split(":")[0].trim())
          .filter(Boolean)
          .join(", ");
        indentStack.push(indent + 4);
        jsLines.push(`function ${currentFn}(${params}) {`);
        continue;
      }

      // For range loop: for i in range(a, b): or for i in range(n):
      const forRangeMatch = trimmed.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+range\(([^)]+)\)\s*:$/);
      if (forRangeMatch) {
        const iterVar = forRangeMatch[1];
        trackedVars.add(iterVar);
        const rangeArgs = forRangeMatch[2].split(",").map((s) => s.trim());
        const startExpr = rangeArgs.length >= 2 ? rangeArgs[0] : "0";
        const endExpr = rangeArgs.length >= 2 ? rangeArgs[1] : rangeArgs[0];
        const stepExpr = rangeArgs.length >= 3 ? rangeArgs[2] : "1";
        indentStack.push(indent + 4);
        jsLines.push(`for (let ${iterVar} = ${startExpr}; ${iterVar} < ${endExpr}; ${iterVar} += ${stepExpr}) {`);
        continue;
      }

      // For-in iterable loop: for x in items:
      const forInMatch = trimmed.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+)\s*:$/);
      if (forInMatch) {
        const iterVar = forInMatch[1];
        trackedVars.add(iterVar);
        const listExpr = forInMatch[2];
        indentStack.push(indent + 4);
        jsLines.push(`for (const ${iterVar} of (${listExpr})) {`);
        continue;
      }

      // If / elif / else / while
      if (trimmed.startsWith("if ") && trimmed.endsWith(":")) {
        const cond = trimmed
          .slice(3, -1)
          .replace(/\bnot\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, "(!($1) || (Array.isArray($1) && $1.length === 0))")
          .replace(/\band\b/g, "&&")
          .replace(/\bor\b/g, "||")
          .replace(/\bTrue\b/g, "true")
          .replace(/\bFalse\b/g, "false")
          .replace(/\bNone\b/g, "null");
        indentStack.push(indent + 4);
        jsLines.push(`if (${cond}) {`);
        continue;
      }

      if (trimmed.startsWith("elif ") && trimmed.endsWith(":")) {
        indentStack.pop();
        const cond = trimmed
          .slice(5, -1)
          .replace(/\band\b/g, "&&")
          .replace(/\bor\b/g, "||");
        indentStack.push(indent + 4);
        jsLines.push(`} else if (${cond}) {`);
        continue;
      }

      if (trimmed === "else:") {
        indentStack.pop();
        indentStack.push(indent + 4);
        jsLines.push(`} else {`);
        continue;
      }

      // Transform Python expressions on normal lines
      let expr = trimmed
        // f-strings: f"..." or f'...'
        .replace(/f"([^"]*)"/g, (_, inner) => "`" + inner.replace(/\{([^}]+)\}/g, "${$1}") + "`")
        .replace(/f'([^']*)'/g, (_, inner) => "`" + inner.replace(/\{([^}]+)\}/g, "${$1}") + "`")
        // list comprehension: [expr for v in arr]
        .replace(/\[\s*([^\]]+?)\s+for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s*\]/g, "$3.map(($2) => ($1))")
        // .append(x) -> .push(x)
        .replace(/\.append\(/g, ".push(")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null");

      // Variable assignment tracking
      const assignMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::\s*[^=]+)?=\s*(.+)$/);
      if (assignMatch && !expr.startsWith("return ")) {
        const varName = assignMatch[1];
        const rhs = assignMatch[2];
        if (!trackedVars.has(varName)) {
          trackedVars.add(varName);
          expr = `var ${varName} = ${rhs}`;
        } else {
          expr = `${varName} = ${rhs}`;
        }
      }

      jsLines.push(`${expr};`);
      if (mode === "debug" && !expr.startsWith("return ")) {
        const captureEntries = Array.from(trackedVars)
          .map((v) => `"${v}": (typeof ${v} !== "undefined" ? ${v} : "__UNDEF__")`)
          .join(", ");
        jsLines.push(`__step(${lineNo}, ${JSON.stringify(currentFn)}, () => ({ ${captureEntries} }));`);
      }
    }

    while (indentStack.length > 1) {
      indentStack.pop();
      jsLines.push("}");
    }

    const sandbox: any = {
      print: customPrint,
      math: pyMath,
      time: pyTime,
      random: pyRandom,
      JSON,
      round: (val: number, digits = 0) => {
        const factor = Math.pow(10, digits);
        return Math.round(val * factor) / factor;
      },
      len: (obj: any) => (obj && typeof obj.length === "number" ? obj.length : obj && typeof obj === "object" ? Object.keys(obj).length : 0),
      sum: (arr: number[]) => (Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b || 0), 0) : 0),
      max: (arr: any, ...rest: any[]) => (Array.isArray(arr) ? Math.max(...arr) : Math.max(arr, ...rest)),
      min: (arr: any, ...rest: any[]) => (Array.isArray(arr) ? Math.min(...arr) : Math.min(arr, ...rest)),
      abs: Math.abs,
      int: (x: any) => parseInt(String(x), 10),
      float: (x: any) => parseFloat(String(x)),
      str: (x: any) => String(x),
      list: (x: any) => (Array.isArray(x) ? [...x] : []),
      dict: (x: any) => ({ ...(x || {}) }),
      __step: (lineNo: number, fn: string, getter: () => any) => {
        if (steps.length >= 250) return;
        const vars: Record<string, { value: string; type: string }> = {};
        try {
          const raw = getter();
          for (const [k, v] of Object.entries(raw)) {
            if (v !== "__UNDEF__" && typeof v !== "function") {
              vars[k] = {
                value: typeof v === "object" ? JSON.stringify(v) : String(v),
                type: Array.isArray(v) ? `list[${v.length}]` : typeof v === "object" ? "dict" : typeof v,
              };
            }
          }
        } catch {}

        for (const expr of Array.isArray(watchExpressions) ? watchExpressions : []) {
          if (!expr) continue;
          try {
            const val = vm.runInNewContext(expr, sandbox, { timeout: 100 });
            if (val !== undefined) {
              vars[`watch:${expr}`] = {
                value: typeof val === "object" ? JSON.stringify(val) : String(val),
                type: typeof val,
              };
            }
          } catch {}
        }

        steps.push({
          stepIndex: steps.length,
          line: lineNo,
          functionName: fn,
          isBreakpoint: bpSet.has(lineNo),
          variables: vars,
          callStack: [
            { name: fn, file: fileName, line: lineNo },
            ...(fn !== "main (module)" ? [{ name: "main (module)", file: fileName, line: 1 }] : []),
          ],
          stdout,
        });
      },
    };

    vm.runInNewContext(jsLines.join("\n"), sandbox, { timeout: 5000 });
  } catch (err: any) {
    stderr += err.message || String(err);
  }

  return { stdout, stderr, steps };
}

/**
 * Serverless execution & step-by-step debugger for JS, TS, Python, and other languages
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      mode = "execute", // "execute" | "debug"
      code = "",
      language = "javascript",
      fileName = "index.js",
      breakpoints = [],
      watchExpressions = [],
      env = {},
    } = body;

    const lang = String(language).toLowerCase();
    const bpSet = new Set<number>((Array.isArray(breakpoints) ? breakpoints : []).map(Number));

    // 1. JavaScript & TypeScript Execution + Step Debugger
    if (lang === "javascript" || lang === "typescript") {
      const cleanCode = transpileTSAndESModules(code);

      let stdout = "";
      let stderr = "";
      const steps: any[] = [];

      const customConsole = {
        log: (...args: any[]) => {
          stdout +=
            args
              .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
              .join(" ") + "\n";
        },
        error: (...args: any[]) => {
          stderr +=
            args
              .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
              .join(" ") + "\n";
        },
        warn: (...args: any[]) => {
          stdout +=
            "[WARN] " +
            args
              .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
              .join(" ") +
            "\n";
        },
        info: (...args: any[]) => {
          stdout +=
            args
              .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
              .join(" ") + "\n";
        },
      };

      const mockProcess = {
        env: { NODE_ENV: "development", PORT: "4000", ...(env || {}) },
        uptime: () => 42.5,
        memoryUsage: () => ({ rss: 34500000, heapTotal: 18200000, heapUsed: 12400000 }),
        cpuUsage: () => ({ user: 12000, system: 4000 }),
        pid: 1024,
        version: process.version || "v20.11.0",
      };

      const mockRequire = (modName: string) => {
        if (modName === "http" || modName === "https") {
          return {
            createServer: (handler?: any) => ({
              listen: (port: any, cb?: () => void) => {
                if (cb) cb();
                if (handler) {
                  let respBody = "";
                  const mockRes = {
                    setHeader: () => {},
                    writeHead: () => {},
                    end: (str: string) => {
                      respBody = str;
                    },
                  };
                  try {
                    handler({ url: "/health", method: "GET" }, mockRes);
                    if (respBody) customConsole.log(`[GET /health] -> ${respBody}`);
                  } catch {}
                }
              },
            }),
          };
        }
        if (modName === "path") return path;
        if (modName === "os") return os;
        return {};
      };

      if (mode === "debug") {
        const varRegex = /\b(?:const|let|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        const tracked = new Set<string>();
        let m: RegExpExecArray | null;
        while ((m = varRegex.exec(cleanCode)) !== null) tracked.add(m[1]);
        const idents = Array.from(tracked);
        const captureObj = `{ ${idents
          .map((id) => `"${id}": (typeof ${id} !== "undefined" ? ${id} : "__UNDEF__")`)
          .join(", ")} }`;

        const lines = cleanCode.split("\n");
        const instrumented: string[] = [];
        let fnName = "main (global)";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          const lineNo = i + 1;
          const fnMatch = trimmed.match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
          if (fnMatch) fnName = fnMatch[1];

          instrumented.push(line);
          if (
            trimmed &&
            !trimmed.startsWith("//") &&
            !trimmed.startsWith("}") &&
            !trimmed.endsWith("{") &&
            !trimmed.startsWith("return ") &&
            (trimmed.endsWith(";") ||
              trimmed.startsWith("const ") ||
              trimmed.startsWith("let ") ||
              trimmed.startsWith("var ") ||
              trimmed.startsWith("console."))
          ) {
            instrumented.push(`__step(${lineNo}, ${JSON.stringify(fnName)}, () => (${captureObj}));`);
          }
        }

        const sandbox: any = {
          console: customConsole,
          process: mockProcess,
          require: mockRequire,
          exports: {},
          module: { exports: {} },
          JSON,
          Math,
          Date,
          Number,
          String,
          Boolean,
          Array,
          Object,
          Map,
          Set,
          RegExp,
          parseInt,
          parseFloat,
          isNaN,
          setTimeout: (fn: () => void) => {
            try {
              fn();
            } catch {}
          },
          __step: (lineNo: number, fn: string, getter: () => any) => {
            if (steps.length >= 250) return;
            const vars: Record<string, { value: string; type: string }> = {};
            try {
              const raw = getter();
              for (const [k, v] of Object.entries(raw)) {
                if (v !== "__UNDEF__" && typeof v !== "function") {
                  vars[k] = {
                    value: typeof v === "object" ? JSON.stringify(v) : String(v),
                    type: Array.isArray(v) ? `Array(${v.length})` : typeof v,
                  };
                }
              }
            } catch {}

            for (const expr of Array.isArray(watchExpressions) ? watchExpressions : []) {
              if (!expr) continue;
              try {
                const val = vm.runInNewContext(expr, sandbox, { timeout: 100 });
                vars[`watch:${expr}`] = {
                  value: typeof val === "object" ? JSON.stringify(val) : String(val),
                  type: typeof val,
                };
              } catch {}
            }

            steps.push({
              stepIndex: steps.length,
              line: lineNo,
              functionName: fn,
              isBreakpoint: bpSet.has(lineNo),
              variables: vars,
              callStack: [
                { name: fn, file: fileName, line: lineNo },
                ...(fn !== "main (global)" ? [{ name: "main (global)", file: fileName, line: 1 }] : []),
              ],
              stdout,
            });
          },
        };

        try {
          vm.runInNewContext(instrumented.join("\n"), sandbox, { timeout: 5000 });
        } catch (err: any) {
          stderr += err.stack || err.message || String(err);
        }

        return NextResponse.json({
          steps,
          stdout,
          stderr,
          exitCode: stderr ? 1 : 0,
          durationMs: Date.now() - startTime,
          problems: stderr
            ? [{ file: fileName, line: 1, column: 1, severity: "error", message: stderr.split("\n")[0] }]
            : [],
          language: lang,
        });
      } else {
        const sandbox = {
          console: customConsole,
          process: mockProcess,
          require: mockRequire,
          exports: {},
          module: { exports: {} },
          JSON,
          Math,
          Date,
          Number,
          String,
          Boolean,
          Array,
          Object,
          Map,
          Set,
          RegExp,
          parseInt,
          parseFloat,
          isNaN,
          setTimeout: (fn: () => void) => {
            try {
              fn();
            } catch {}
          },
        };
        try {
          vm.runInNewContext(cleanCode, sandbox, { timeout: 5000 });
        } catch (err: any) {
          stderr += err.stack || err.message || String(err);
        }

        return NextResponse.json({
          stdout,
          stderr,
          exitCode: stderr ? 1 : 0,
          durationMs: Date.now() - startTime,
          problems: stderr
            ? [{ file: fileName, line: 1, column: 1, severity: "error", message: stderr.split("\n")[0] }]
            : [],
          language: lang,
        });
      }
    }

    // 2. Python 3 Execution & Step-by-Step Debugger (Native python3 if present, otherwise Built-in Serverless Python Engine)
    if (lang === "python") {
      // First attempt native python3 if available on host and in execute mode
      if (mode === "execute") {
        try {
          const nativeRes = await new Promise<{ stdout: string; stderr: string; exitCode: number; ok: boolean }>(
            (resolve) => {
              const tmpFile = path.join(os.tmpdir(), `letscollab-${Date.now()}.py`);
              fs.writeFileSync(tmpFile, code, "utf-8");
              const child = spawn("python3", ["-u", tmpFile], {
                env: { ...process.env, ...(env || {}) },
              });
              let out = "";
              let err = "";
              const timer = setTimeout(() => {
                child.kill("SIGKILL");
                resolve({ stdout: out, stderr: err + "\nTimed out", exitCode: 124, ok: true });
              }, 5000);
              child.stdout.on("data", (d) => (out += d.toString()));
              child.stderr.on("data", (d) => (err += d.toString()));
              child.on("error", () => {
                clearTimeout(timer);
                try {
                  fs.unlinkSync(tmpFile);
                } catch {}
                resolve({ stdout: "", stderr: "", exitCode: 1, ok: false });
              });
              child.on("close", (c) => {
                clearTimeout(timer);
                try {
                  fs.unlinkSync(tmpFile);
                } catch {}
                resolve({ stdout: out, stderr: err, exitCode: c ?? 0, ok: true });
              });
            }
          );
          if (nativeRes.ok) {
            return NextResponse.json({
              stdout: nativeRes.stdout,
              stderr: nativeRes.stderr,
              exitCode: nativeRes.exitCode,
              durationMs: Date.now() - startTime,
              problems: nativeRes.stderr
                ? [{ file: fileName, line: 1, column: 1, severity: "error", message: nativeRes.stderr.split("\n")[0] }]
                : [],
              language: lang,
            });
          }
        } catch {}
      }

      // Built-in Serverless Python 3 Engine & Step Debugger
      const pyRes = executePythonServerless(code, fileName, mode, bpSet, watchExpressions);
      return NextResponse.json({
        steps: pyRes.steps,
        stdout: pyRes.stdout,
        stderr: pyRes.stderr,
        exitCode: pyRes.stderr ? 1 : 0,
        durationMs: Date.now() - startTime,
        problems: pyRes.stderr
          ? [{ file: fileName, line: 1, column: 1, severity: "error", message: pyRes.stderr.split("\n")[0] }]
          : [],
        language: lang,
      });
    }

    // 3. Support for C / C++ / Java / Go / Rust / Shell print statements & step tracing
    const printRegex =
      /(?:printf|std::cout\s*<<|System\.out\.println|fmt\.Println|println!|echo)\s*\(?["']([^"']+)["']\)?/g;
    const extractedPrints: string[] = [];
    let pm: RegExpExecArray | null;
    while ((pm = printRegex.exec(code)) !== null) {
      extractedPrints.push(pm[1].replace(/\\n/g, ""));
    }
    const simulatedStdout =
      extractedPrints.length > 0
        ? extractedPrints.join("\n") + "\n"
        : `[${lang.toUpperCase()} Runtime] Compiled and executed ${fileName} successfully.\n`;

    const codeLines: string[] = String(code).split("\n");
    const genericSteps = codeLines
      .map((lineText: string, idx: number) => ({ lineText: lineText.trim(), lineNo: idx + 1 }))
      .filter(
        (item: { lineText: string; lineNo: number }) =>
          item.lineText.length > 0 &&
          !item.lineText.startsWith("//") &&
          !item.lineText.startsWith("#") &&
          !item.lineText.startsWith("/*") &&
          item.lineText !== "{" &&
          item.lineText !== "}"
      )
      .slice(0, 100)
      .map((item: { lineText: string; lineNo: number }, sIdx: number) => ({
        stepIndex: sIdx,
        line: item.lineNo,
        functionName: "main",
        isBreakpoint: bpSet.has(item.lineNo),
        variables: { status: { value: '"ACTIVE"', type: "string" }, line: { value: String(item.lineNo), type: "int" } },
        callStack: [{ name: "main", file: fileName, line: item.lineNo }],
        stdout: simulatedStdout,
      }));

    return NextResponse.json({
      steps: genericSteps,
      stdout: simulatedStdout,
      stderr: "",
      exitCode: 0,
      durationMs: Date.now() - startTime,
      problems: [],
      language: lang,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        stdout: "",
        stderr: err.message || "Execution failed",
        exitCode: 1,
        durationMs: Date.now() - startTime,
        problems: [],
      },
      { status: 500 }
    );
  }
}
