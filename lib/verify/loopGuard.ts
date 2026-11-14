import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { generate } from "astring";

export class LoopBudgetError extends Error {
  constructor(message = "LoopBudgetError: Maximum loop iterations exceeded (1,000,000)") {
    super(message);
    this.name = "LoopBudgetError";
  }
}

/**
 * Instruments JavaScript code with loop-guard counters.
 * Rewrites for, while, and do-while loops to throw a LoopBudgetError if any loop
 * exceeds maxIterations (default: 1,000,000) iterations.
 */
export function instrumentLoopGuard(code: string, maxIterations: number = 1_000_000): string {
  let ast: any;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
      locations: true,
    });
  } catch (err: any) {
    throw new Error(`AST Parse Error during loop instrumentation: ${err.message}`);
  }

  let counterId = 0;
  const loopTypes = ["WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement"];

  // Helper to instrument a block of statements
  function transformStatementList(statements: any[]) {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (loopTypes.includes(stmt.type)) {
        statements[i] = wrapAndInstrumentLoop(stmt, ++counterId, maxIterations);
      }
    }
  }

  // Walk the AST and transform statement lists
  walk.simple(ast, {
    Program(node: any) {
      transformStatementList(node.body);
    },
    BlockStatement(node: any) {
      transformStatementList(node.body);
    },
    SwitchCase(node: any) {
      transformStatementList(node.consequent);
    },
    IfStatement(node: any) {
      if (loopTypes.includes(node.consequent?.type)) {
        node.consequent = wrapAndInstrumentLoop(node.consequent, ++counterId, maxIterations);
      }
      if (node.alternate && loopTypes.includes(node.alternate.type)) {
        node.alternate = wrapAndInstrumentLoop(node.alternate, ++counterId, maxIterations);
      }
    },
  });

  return generate(ast);
}

function wrapAndInstrumentLoop(node: any, id: number, maxIterations: number): any {
  const counterVar = `__pt_loop_ctr_${id}`;

  // Build the check: if (++counter > maxIterations) throw new Error("LoopBudgetError: ...");
  const guardStatement: any = {
    type: "IfStatement",
    test: {
      type: "BinaryExpression",
      operator: ">",
      left: {
        type: "UpdateExpression",
        operator: "++",
        prefix: true,
        argument: {
          type: "Identifier",
          name: counterVar,
        },
      },
      right: {
        type: "Literal",
        value: maxIterations,
        raw: String(maxIterations),
      },
    },
    consequent: {
      type: "ThrowStatement",
      argument: {
        type: "NewExpression",
        callee: {
          type: "Identifier",
          name: "Error",
        },
        arguments: [
          {
            type: "Literal",
            value: `LoopBudgetError: Maximum iterations exceeded (${maxIterations})`,
            raw: `"LoopBudgetError: Maximum iterations exceeded (${maxIterations})"`,
          },
        ],
      },
    },
  };

  // Ensure loop body is a BlockStatement and prepend the guard
  let originalStatements: any[] = [];
  if (node.body?.type === "BlockStatement") {
    originalStatements = node.body.body;
  } else if (node.body) {
    originalStatements = [node.body];
  }

  node.body = {
    type: "BlockStatement",
    body: [guardStatement, ...originalStatements],
  };

  // Wrap the loop and counter declaration inside a BlockStatement:
  // { let __pt_loop_ctr_X = 0; for (...) { if (++__pt_loop_ctr_X > ...) ... } }
  return {
    type: "BlockStatement",
    body: [
      {
        type: "VariableDeclaration",
        kind: "let",
        declarations: [
          {
            type: "VariableDeclarator",
            id: { type: "Identifier", name: counterVar },
            init: { type: "Literal", value: 0, raw: "0" },
          },
        ],
      },
      node,
    ],
  };
}
