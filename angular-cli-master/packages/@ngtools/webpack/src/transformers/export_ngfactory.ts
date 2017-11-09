// @ignoreDep typescript
import * as ts from 'typescript';
import { relative, dirname } from 'path';

import { collectDeepNodes, getFirstNode } from './ast_helpers';
import { StandardTransform, TransformOperation, AddNodeOperation } from './interfaces';
import { makeTransform } from './make_transform';

export function exportNgFactory(
  shouldTransform: (fileName: string) => boolean,
  getEntryModule: () => { path: string, className: string },
): ts.TransformerFactory<ts.SourceFile> {

  const standardTransform: StandardTransform = function (sourceFile: ts.SourceFile) {
    const ops: TransformOperation[] = [];

    const entryModule = getEntryModule();

    if (!shouldTransform(sourceFile.fileName) || !entryModule) {
      return ops;
    }

    // Find all identifiers using the entry module class name.
    const entryModuleIdentifiers = collectDeepNodes<ts.Identifier>(sourceFile,
      ts.SyntaxKind.Identifier)
      .filter(identifier => identifier.text === entryModule.className);

    if (entryModuleIdentifiers.length === 0) {
      return [];
    }

    const relativeEntryModulePath = relative(dirname(sourceFile.fileName), entryModule.path);
    const normalizedEntryModulePath = `./${relativeEntryModulePath}`.replace(/\\/g, '/');

    // Get the module path from the import.
    let modulePath: string;
    entryModuleIdentifiers.forEach((entryModuleIdentifier) => {
      if (entryModuleIdentifier.parent.kind !== ts.SyntaxKind.ExportSpecifier) {
        return;
      }

      const exportSpec = entryModuleIdentifier.parent as ts.ExportSpecifier;
      const moduleSpecifier = exportSpec.parent.parent.moduleSpecifier;

      if (moduleSpecifier.kind !== ts.SyntaxKind.StringLiteral) {
        return;
      }

      modulePath = (moduleSpecifier as ts.StringLiteral).text;

      // Add the transform operations.
      const factoryClassName = entryModule.className + 'NgFactory';
      const factoryModulePath = normalizedEntryModulePath + '.ngfactory';

      const namedExports = ts.createNamedExports([ts.createExportSpecifier(undefined,
        ts.createIdentifier(factoryClassName))]);
      const newImport = ts.createExportDeclaration(undefined, undefined, namedExports,
        ts.createLiteral(factoryModulePath));

      ops.push(new AddNodeOperation(
        sourceFile,
        getFirstNode(sourceFile),
        newImport
      ));
    });

    return ops;
  };

  return makeTransform(standardTransform);
}
