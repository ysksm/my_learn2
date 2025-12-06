/**
 * コードジェネレーター基底クラス
 */

import {
  SchemaIR,
  ModelDefinition,
  EnumDefinition,
  FieldDefinition,
  TypeInfo,
  PrimitiveType,
} from '../ir/types.js';

export interface GeneratorOptions {
  outputDir: string;
  namespace?: string;
}

export interface GeneratedFile {
  filename: string;
  content: string;
}

export abstract class BaseGenerator {
  protected ir: SchemaIR;
  protected options: GeneratorOptions;

  constructor(ir: SchemaIR, options: GeneratorOptions) {
    this.ir = ir;
    this.options = options;
  }

  abstract generate(): GeneratedFile[];

  protected abstract getLanguageName(): string;

  /**
   * キャメルケースに変換
   */
  protected toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * パスカルケースに変換
   */
  protected toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * スネークケースに変換
   */
  protected toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * アッパースネークケースに変換
   */
  protected toUpperSnakeCase(str: string): string {
    return this.toSnakeCase(str).toUpperCase();
  }

  /**
   * インデント文字列を生成
   */
  protected indent(level: number, useSpaces: boolean = true): string {
    const unit = useSpaces ? '    ' : '\t';
    return unit.repeat(level);
  }

  /**
   * ドキュメントコメントを生成
   */
  protected abstract generateDocComment(doc: string | undefined, indent: string): string;
}
