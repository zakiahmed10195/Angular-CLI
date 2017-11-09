// @ignoreDep typescript
import * as ts from 'typescript';
import { WebpackCompilerHost } from '../compiler_host';


// Find all nodes from the AST in the subtree of node of SyntaxKind kind.
export function collectDeepNodes<T extends ts.Node>(node: ts.Node, kind: ts.SyntaxKind): T[] {
  const nodes: T[] = [];
  const helper = (child: ts.Node) => {
    if (child.kind === kind) {
      nodes.push(child as T);
    }
    ts.forEachChild(child, helper);
  };
  ts.forEachChild(node, helper);

  return nodes;
}

export function getFirstNode(sourceFile: ts.SourceFile): ts.Node | null {
  if (sourceFile.statements.length > 0) {
    return sourceFile.statements[0] || null;
  }
  return null;
}

export function getLastNode(sourceFile: ts.SourceFile): ts.Node | null {
  if (sourceFile.statements.length > 0) {
    return sourceFile.statements[sourceFile.statements.length - 1] || null;
  }
  return null;
}


export function transformTypescript(
  content: string,
  transformers: ts.TransformerFactory<ts.SourceFile>[]
) {

  // Set compiler options.
  const compilerOptions: ts.CompilerOptions = {
    noEmitOnError: false,
    allowJs: true,
    newLine: ts.NewLineKind.LineFeed,
    target: ts.ScriptTarget.ESNext,
    skipLibCheck: true,
    sourceMap: false,
    importHelpers: true
  };

  // Create compiler host.
  const basePath = '/project/src/';
  const compilerHost = new WebpackCompilerHost(compilerOptions, basePath);

  // Add a dummy file to host content.
  const fileName = basePath + 'test-file.ts';
  compilerHost.writeFile(fileName, content, false);

  // Create the TypeScript program.
  const program = ts.createProgram([fileName], compilerOptions, compilerHost);

  // Emit.
  const { emitSkipped, diagnostics } = program.emit(
    undefined, undefined, undefined, undefined, { before: transformers }
  );

  // Log diagnostics if emit wasn't successfull.
  if (emitSkipped) {
    console.log(diagnostics);
    return null;
  }

  // Return the transpiled js.
  return compilerHost.readFile(fileName.replace(/\.ts$/, '.js'));
}
