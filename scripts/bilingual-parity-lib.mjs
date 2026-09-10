import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function leafFields(value, prefix = "") {
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => Object.entries(leafFields(item, prefix ? `${prefix}.${key}` : key))));
  }
  return { [prefix]: value };
}

export function keysetDifference(ru, ro) {
  const left = Object.keys(leafFields(ru)), right = Object.keys(leafFields(ro));
  return { missingRo: left.filter(key => !right.includes(key)), missingRu: right.filter(key => !left.includes(key)) };
}

function unwrap(node) {
  while (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
}

function literal(node) {
  node = unwrap(node);
  if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) return node.text;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText().replace(/^['"]|['"]$/gu, ""), literal(p.initializer)]));
  return { expression: node.getText() };
}

export function readLocaleMessages(file, name) {
  const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  let messages;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText() === name && node.initializer) messages = literal(node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!messages) throw new Error(`Locale resource not found: ${file}:${name}`);
  return messages;
}

// Audit all inline locale dictionaries as well as the central resources.
export function inlineLocaleResources(root = "src") {
  const records = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name).replaceAll("\\", "/");
      if (entry.isDirectory()) { walk(file); continue; }
      if (!/\.tsx?$/u.test(file)) continue;
      const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const add = (node, ru, ro) => records.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart()).line + 1, ru: literal(ru), ro: literal(ro) });
      function visit(node) {
        if (ts.isObjectLiteralExpression(node)) {
          const properties = node.properties.filter(ts.isPropertyAssignment);
          const ru = properties.find(p => p.name.getText().replaceAll('"', "").replaceAll("'", "") === "ru");
          const ro = properties.find(p => p.name.getText().replaceAll('"', "").replaceAll("'", "") === "ro");
          if (ru && ro && ts.isObjectLiteralExpression(unwrap(ru.initializer)) && ts.isObjectLiteralExpression(unwrap(ro.initializer))) add(node, ru.initializer, ro.initializer);
        }
        if (ts.isConditionalExpression(node) && /locale\s*===?\s*["']ro["']/u.test(node.condition.getText()) && ts.isObjectLiteralExpression(unwrap(node.whenTrue)) && ts.isObjectLiteralExpression(unwrap(node.whenFalse))) add(node, node.whenFalse, node.whenTrue);
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
  }
  walk(root);
  return records;
}

export function productFieldStatus(ru, ro, field) {
  if (ru == null && ro == null) return "NEEDS_EDITORIAL_REVIEW";
  if (ro == null || ro === "") return "MISSING_RO";
  if (ru == null || ru === "") return "MISSING_RU";
  if (field === "shortDescription" && [ru, ro].some(value => /…$|\.\.\.$/u.test(value) || (value.length > 175 && !/[.!?]$/u.test(value)))) return "TRUNCATED";
  if (field === "longDescription" && ro.length / ru.length < 0.4) return "SUSPICIOUS_TRANSLATION";
  return "NEEDS_EDITORIAL_REVIEW";
}
