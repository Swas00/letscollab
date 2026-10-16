import { NextRequest, NextResponse } from "next/server";
import vm from "vm";

/**
 * Serverless fallback execution & step-by-step debugger for JS/TS/Python
 * Ensures instant zero-latency Run & Debug even if backend is cold-starting.
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
    } = body;

    const lang = String(language).toLowerCase();
    const bpSet = new Set<number>((Array.isArray(breakpoints) ? breakpoints : []).map(Number));

    if (lang === "javascript" || lang === "typescript") {
      // Strip TS type annotations lightly if needed
      const cleanCode = code
        .replace(/:\s*(?:string|number|boolean|any|void|never|unknown)(?:\[\])?(?=[,)\s=;])/g, "")
        .replace(/interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}/g, "");

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

      if (mode === "debug") {
        // Extract identifiers
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

    return NextResponse.json({
      stdout: "",
      stderr: `Serverless fallback supports JS/TS directly; use backend /api/editor for ${lang}.`,
      exitCode: 1,
      durationMs: Date.now() - startTime,
      problems: [],
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
