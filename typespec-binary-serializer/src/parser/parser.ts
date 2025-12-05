/**
 * TypeSpec構文解析器 (Parser)
 */

import { Lexer, Token, TokenType } from './lexer.js';
import {
  SchemaIR,
  ModelDefinition,
  EnumDefinition,
  FieldDefinition,
  EnumMember,
  Decorator,
  TypeInfo,
  SizeInfo,
  PrimitiveType,
  isPrimitiveType,
  PRIMITIVE_SIZES,
} from '../ir/types.js';

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;
  private pendingDoc: string | undefined;

  parse(source: string, sourceFile: string): SchemaIR {
    const lexer = new Lexer(source);
    this.tokens = lexer.tokenize();
    this.pos = 0;

    const ir: SchemaIR = {
      namespace: '',
      enums: [],
      models: [],
      metadata: {
        sourceFile,
        parsedAt: new Date().toISOString(),
      },
    };

    while (!this.isAtEnd()) {
      this.parseTopLevel(ir);
    }

    // モデルのサイズを計算
    this.calculateModelSizes(ir);

    return ir;
  }

  private peek(offset: number = 0): Token {
    const index = this.pos + offset;
    if (index >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[index];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      return this.tokens[this.pos++];
    }
    return this.tokens[this.pos];
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private expect(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    const token = this.peek();
    throw new Error(`Parse error at line ${token.line}, column ${token.column}: ${message}, got ${token.type} (${token.value})`);
  }

  private parseTopLevel(ir: SchemaIR): void {
    // ドキュメントコメントをチェック
    if (this.check(TokenType.DocComment)) {
      this.pendingDoc = this.advance().value;
      return;
    }

    // デコレータを収集
    const decorators: Decorator[] = [];
    while (this.check(TokenType.At)) {
      decorators.push(this.parseDecorator());
    }

    // 名前空間
    if (this.check(TokenType.Namespace)) {
      ir.namespace = this.parseNamespace();
      return;
    }

    // 列挙型
    if (this.check(TokenType.Enum)) {
      const enumDef = this.parseEnum(decorators);
      enumDef.doc = this.pendingDoc;
      this.pendingDoc = undefined;
      ir.enums.push(enumDef);
      return;
    }

    // モデル
    if (this.check(TokenType.Model)) {
      const modelDef = this.parseModel(decorators);
      modelDef.doc = this.pendingDoc;
      this.pendingDoc = undefined;
      ir.models.push(modelDef);
      return;
    }

    // 未知のトークンはスキップ
    this.advance();
  }

  private parseDecorator(): Decorator {
    this.expect(TokenType.At, 'Expected @');
    const name = this.expect(TokenType.Identifier, 'Expected decorator name').value;
    const args: (string | number | boolean)[] = [];

    if (this.match(TokenType.LeftParen)) {
      while (!this.check(TokenType.RightParen) && !this.isAtEnd()) {
        if (this.check(TokenType.Number)) {
          const numStr = this.advance().value;
          args.push(numStr.startsWith('0x') ? parseInt(numStr, 16) : parseFloat(numStr));
        } else if (this.check(TokenType.String)) {
          args.push(this.advance().value);
        } else if (this.check(TokenType.Identifier)) {
          const val = this.advance().value;
          if (val === 'true') args.push(true);
          else if (val === 'false') args.push(false);
          else args.push(val);
        } else {
          break;
        }

        if (!this.check(TokenType.RightParen)) {
          this.match(TokenType.Comma);
        }
      }
      this.expect(TokenType.RightParen, 'Expected )');
    }

    return { name, args };
  }

  private parseNamespace(): string {
    this.expect(TokenType.Namespace, 'Expected namespace');
    const parts: string[] = [];
    parts.push(this.expect(TokenType.Identifier, 'Expected namespace name').value);

    // ドット区切りの名前空間をサポート（簡易版）
    while (this.peek().value === '.') {
      this.advance();
      parts.push(this.expect(TokenType.Identifier, 'Expected namespace part').value);
    }

    this.match(TokenType.Semicolon);
    return parts.join('.');
  }

  private parseEnum(decorators: Decorator[]): EnumDefinition {
    this.expect(TokenType.Enum, 'Expected enum');
    const name = this.expect(TokenType.Identifier, 'Expected enum name').value;
    this.expect(TokenType.LeftBrace, 'Expected {');

    const members: EnumMember[] = [];
    let autoValue = 0;
    let memberDoc: string | undefined;

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      // ドキュメントコメント
      if (this.check(TokenType.DocComment)) {
        memberDoc = this.advance().value;
        continue;
      }

      // メンバーのデコレータ
      const memberDecorators: Decorator[] = [];
      while (this.check(TokenType.At)) {
        memberDecorators.push(this.parseDecorator());
      }

      if (this.check(TokenType.Identifier)) {
        const memberName = this.advance().value;
        let value = autoValue;

        // @value デコレータから値を取得
        const valueDecorator = memberDecorators.find(d => d.name === 'value');
        if (valueDecorator && valueDecorator.args.length > 0) {
          value = valueDecorator.args[0] as number;
        }

        members.push({
          name: memberName,
          value,
          doc: memberDoc,
        });

        memberDoc = undefined;
        autoValue = value + 1;
        this.match(TokenType.Comma);
      }
    }

    this.expect(TokenType.RightBrace, 'Expected }');

    return {
      kind: 'enum',
      name,
      members,
      decorators,
      baseType: 'uint8',
    };
  }

  private parseModel(decorators: Decorator[]): ModelDefinition {
    this.expect(TokenType.Model, 'Expected model');
    const name = this.expect(TokenType.Identifier, 'Expected model name').value;
    this.expect(TokenType.LeftBrace, 'Expected {');

    const fields: FieldDefinition[] = [];
    let fieldDoc: string | undefined;

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      // ドキュメントコメント
      if (this.check(TokenType.DocComment)) {
        fieldDoc = this.advance().value;
        continue;
      }

      // フィールドのデコレータ
      const fieldDecorators: Decorator[] = [];
      while (this.check(TokenType.At)) {
        fieldDecorators.push(this.parseDecorator());
      }

      if (this.check(TokenType.Identifier)) {
        const field = this.parseField(fieldDecorators);
        field.doc = fieldDoc;
        fieldDoc = undefined;
        fields.push(field);
      }
    }

    this.expect(TokenType.RightBrace, 'Expected }');

    // コマンドIDを取得
    const commandIdDecorator = decorators.find(d => d.name === 'command_id');
    const commandId = commandIdDecorator?.args[0] as number | undefined;

    return {
      kind: 'model',
      name,
      fields,
      decorators,
      commandId,
      hasVariableLength: false, // 後で計算
    };
  }

  private parseField(decorators: Decorator[]): FieldDefinition {
    const name = this.expect(TokenType.Identifier, 'Expected field name').value;
    this.expect(TokenType.Colon, 'Expected :');

    const typeInfo = this.parseType();

    this.match(TokenType.Semicolon);

    // サイズ情報を構築
    const sizeInfo = this.buildSizeInfo(decorators, typeInfo);

    return {
      name,
      type: typeInfo,
      size: sizeInfo,
      decorators,
    };
  }

  private parseType(): TypeInfo {
    const typeName = this.expect(TokenType.Identifier, 'Expected type name').value;

    // 配列チェック
    if (this.match(TokenType.LeftBracket)) {
      this.expect(TokenType.RightBracket, 'Expected ]');
      return {
        kind: 'array',
        name: typeName + '[]',
        elementType: this.buildTypeInfo(typeName),
      };
    }

    return this.buildTypeInfo(typeName);
  }

  private buildTypeInfo(typeName: string): TypeInfo {
    if (isPrimitiveType(typeName)) {
      return { kind: 'primitive', name: typeName };
    }
    // カスタム型（列挙型またはモデル）
    return { kind: 'model', name: typeName };
  }

  private buildSizeInfo(decorators: Decorator[], typeInfo: TypeInfo): SizeInfo {
    const sizeInfo: SizeInfo = {};

    // @size デコレータ
    const sizeDecorator = decorators.find(d => d.name === 'size');
    if (sizeDecorator && sizeDecorator.args.length > 0) {
      sizeInfo.fixedSize = sizeDecorator.args[0] as number;
    }

    // @length_prefix デコレータ
    const lengthPrefixDecorator = decorators.find(d => d.name === 'length_prefix');
    if (lengthPrefixDecorator && lengthPrefixDecorator.args.length > 0) {
      const prefixType = lengthPrefixDecorator.args[0] as string;
      if (isPrimitiveType(prefixType)) {
        sizeInfo.lengthPrefixType = prefixType;
      }
    }

    // プリミティブ型のデフォルトサイズ
    if (!sizeInfo.fixedSize && typeInfo.kind === 'primitive') {
      const defaultSize = PRIMITIVE_SIZES[typeInfo.name as PrimitiveType];
      if (defaultSize !== undefined) {
        sizeInfo.fixedSize = defaultSize;
      }
    }

    return sizeInfo;
  }

  private calculateModelSizes(ir: SchemaIR): void {
    const modelMap = new Map<string, ModelDefinition>();
    for (const model of ir.models) {
      modelMap.set(model.name, model);
    }

    const enumMap = new Map<string, EnumDefinition>();
    for (const enumDef of ir.enums) {
      enumMap.set(enumDef.name, enumDef);
    }

    for (const model of ir.models) {
      this.calculateModelSize(model, modelMap, enumMap);
    }
  }

  private calculateModelSize(
    model: ModelDefinition,
    modelMap: Map<string, ModelDefinition>,
    enumMap: Map<string, EnumDefinition>
  ): number | undefined {
    let totalSize = 0;
    let hasVariable = false;
    let offset = 0;

    for (const field of model.fields) {
      field.offset = offset;

      if (field.size.lengthPrefixType) {
        hasVariable = true;
        const prefixSize = PRIMITIVE_SIZES[field.size.lengthPrefixType] || 0;
        offset += prefixSize;
        continue;
      }

      if (field.size.fixedSize !== undefined) {
        totalSize += field.size.fixedSize;
        offset += field.size.fixedSize;
        continue;
      }

      // カスタム型の場合
      if (field.type.kind === 'model' || field.type.kind === 'enum') {
        const typeName = field.type.name;

        // 列挙型
        if (enumMap.has(typeName)) {
          const size = 1; // uint8 base
          totalSize += size;
          field.size.fixedSize = size;
          offset += size;
          continue;
        }

        // ネストしたモデル
        if (modelMap.has(typeName)) {
          const nestedModel = modelMap.get(typeName)!;
          const nestedSize = this.calculateModelSize(nestedModel, modelMap, enumMap);
          if (nestedSize !== undefined) {
            totalSize += nestedSize;
            field.size.fixedSize = nestedSize;
            offset += nestedSize;
          } else {
            hasVariable = true;
          }
          continue;
        }
      }

      // 配列
      if (field.type.kind === 'array') {
        hasVariable = true;
      }
    }

    model.hasVariableLength = hasVariable;
    model.fixedSize = hasVariable ? undefined : totalSize;

    return model.fixedSize;
  }
}
