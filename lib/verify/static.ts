import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { VerificationCheck } from "@/lib/schemas/contracts";

export const BANNED_IDENTIFIERS = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "eval",
  "Function",
  "importScripts",
  "document.write",
  "parent",
  "top",
  "postMessage",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "Math.random",
  "Date.now",
  "performance.now",
] as const;

export interface StaticAnalysisResult {
  passed: boolean;
  checks: VerificationCheck[];
  ast?: any;
}

export function runStaticChecks(code: string): StaticAnalysisResult {
  const checks: VerificationCheck[] = [];

  // Check 1: Size Cap (24 KB)
  const byteLength = Buffer.byteLength(code, "utf8");
  if (byteLength > 24576) {
    checks.push({
      id: "static.size",
      status: "fail",
      message: `Code size exceeds 24 KB limit (${(byteLength / 1024).toFixed(1)} KB)`,
    });
    return { passed: false, checks };
  } else {
    checks.push({
      id: "static.size",
      status: "pass",
    });
  }

  // Check 2: Parse Check
  let ast: any;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
      locations: true,
    });
    checks.push({
      id: "static.parse",
      status: "pass",
    });
  } catch (err: any) {
    checks.push({
      id: "static.parse",
      status: "fail",
      message: `JavaScript parse error at line ${err.loc?.line || "?"}, col ${err.loc?.column || "?"}: ${err.message}`,
      evidence: { line: err.loc?.line, column: err.loc?.column },
    });
    return { passed: false, checks };
  }

  // Check 3: Banned Identifiers & API Calls
  const foundBanned: { name: string; line: number }[] = [];

  walk.simple(ast, {
    Identifier(node: any) {
      if (BANNED_IDENTIFIERS.includes(node.name)) {
        foundBanned.push({ name: node.name, line: node.loc?.start?.line || 0 });
      }
    },
    MemberExpression(node: any) {
      // Check for Math.random, Date.now, performance.now, window.parent, etc.
      const objName = node.object?.name;
      const propName = node.property?.name;

      if (objName && propName) {
        const full = `${objName}.${propName}`;
        if (BANNED_IDENTIFIERS.includes(full as any)) {
          foundBanned.push({ name: full, line: node.loc?.start?.line || 0 });
        }
      }
    },
    ImportExpression(node: any) {
      foundBanned.push({ name: "dynamic import()", line: node.loc?.start?.line || 0 });
    },
  });

  if (foundBanned.length > 0) {
    const list = foundBanned.map((b) => `'${b.name}' (line ${b.line})`).join(", ");
    checks.push({
      id: "static.banned",
      status: "fail",
      message: `Disallowed API or non-deterministic call found: ${list}. Generated code must be pure and sandbox-constrained.`,
      evidence: foundBanned,
    });
    return { passed: false, checks, ast };
  } else {
    checks.push({
      id: "static.banned",
      status: "pass",
    });
  }

  // Check 4: Contract Declaration Check
  // Code must define a global `const sim = { ... }` or `sim = { ... }`
  let hasSimObject = false;
  const methods = new Set<string>();

  walk.simple(ast, {
    VariableDeclarator(node: any) {
      if (node.id?.name === "sim" && node.init?.type === "ObjectExpression") {
        hasSimObject = true;
        for (const prop of node.init.properties) {
          if (prop.key?.name) {
            methods.add(prop.key.name);
          }
        }
      }
    },
    AssignmentExpression(node: any) {
      if (node.left?.name === "sim" && node.right?.type === "ObjectExpression") {
        hasSimObject = true;
        for (const prop of node.right.properties) {
          if (prop.key?.name) {
            methods.add(prop.key.name);
          }
        }
      }
    },
  });

  const requiredMethods = ["init", "step", "metrics", "draw"];
  const missingMethods = requiredMethods.filter((m) => !methods.has(m));

  if (!hasSimObject || missingMethods.length > 0) {
    checks.push({
      id: "static.contract",
      status: "fail",
      message: !hasSimObject
        ? "Code must declare a global 'const sim = { ... }' object."
        : `Simulation object 'sim' is missing required method(s): ${missingMethods.join(", ")}`,
      evidence: { foundMethods: Array.from(methods) },
    });
    return { passed: false, checks, ast };
  } else {
    checks.push({
      id: "static.contract",
      status: "pass",
    });
  }

  return { passed: true, checks, ast };
}
