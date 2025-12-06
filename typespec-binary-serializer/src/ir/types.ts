/**
 * 中間表現 (Intermediate Representation) の型定義
 * TypeSpecスキーマをパースした結果をこの形式で保持し、
 * 各言語のコードジェネレーターに渡す
 */

/**
 * プリミティブ型
 */
export type PrimitiveType =
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'uint64'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'int64'
  | 'float32'
  | 'float64'
  | 'bool'
  | 'string'
  | 'bytes';

/**
 * 型情報
 */
export interface TypeInfo {
  kind: 'primitive' | 'enum' | 'model' | 'array';
  name: string;
  /** 配列の場合の要素型 */
  elementType?: TypeInfo;
}

/**
 * フィールドサイズ情報
 */
export interface SizeInfo {
  /** 固定サイズ（バイト数） */
  fixedSize?: number;
  /** 長さプレフィックス型 */
  lengthPrefixType?: PrimitiveType;
}

/**
 * デコレータ情報
 */
export interface Decorator {
  name: string;
  args: (string | number | boolean)[];
}

/**
 * フィールド定義
 */
export interface FieldDefinition {
  /** フィールド名 */
  name: string;
  /** 型情報 */
  type: TypeInfo;
  /** サイズ情報 */
  size: SizeInfo;
  /** デコレータ一覧 */
  decorators: Decorator[];
  /** ドキュメントコメント */
  doc?: string;
  /** フィールドのオフセット（計算後） */
  offset?: number;
}

/**
 * 列挙値定義
 */
export interface EnumMember {
  /** メンバー名 */
  name: string;
  /** 値 */
  value: number;
  /** ドキュメントコメント */
  doc?: string;
}

/**
 * 列挙型定義
 */
export interface EnumDefinition {
  kind: 'enum';
  /** 列挙型名 */
  name: string;
  /** 列挙値一覧 */
  members: EnumMember[];
  /** デコレータ一覧 */
  decorators: Decorator[];
  /** ドキュメントコメント */
  doc?: string;
  /** 基底型（デフォルトは uint8） */
  baseType: PrimitiveType;
}

/**
 * モデル（構造体）定義
 */
export interface ModelDefinition {
  kind: 'model';
  /** モデル名 */
  name: string;
  /** フィールド一覧 */
  fields: FieldDefinition[];
  /** デコレータ一覧 */
  decorators: Decorator[];
  /** ドキュメントコメント */
  doc?: string;
  /** コマンドID（コマンドの場合） */
  commandId?: number;
  /** 固定サイズ（計算後、可変長の場合はundefined） */
  fixedSize?: number;
  /** 可変長フィールドを含むか */
  hasVariableLength: boolean;
}

/**
 * 名前空間定義
 */
export interface NamespaceDefinition {
  /** 名前空間名 */
  name: string;
  /** 列挙型定義 */
  enums: EnumDefinition[];
  /** モデル定義 */
  models: ModelDefinition[];
}

/**
 * スキーマ全体の中間表現
 */
export interface SchemaIR {
  /** 名前空間 */
  namespace: string;
  /** 列挙型定義 */
  enums: EnumDefinition[];
  /** モデル定義 */
  models: ModelDefinition[];
  /** メタ情報 */
  metadata: SchemaMetadata;
}

/**
 * スキーマのメタ情報
 */
export interface SchemaMetadata {
  /** ソースファイルパス */
  sourceFile: string;
  /** パース日時 */
  parsedAt: string;
  /** プロトコルバージョン */
  protocolVersion?: string;
}

/**
 * プリミティブ型のサイズマッピング
 */
export const PRIMITIVE_SIZES: Record<PrimitiveType, number | undefined> = {
  uint8: 1,
  uint16: 2,
  uint32: 4,
  uint64: 8,
  int8: 1,
  int16: 2,
  int32: 4,
  int64: 8,
  float32: 4,
  float64: 8,
  bool: 1,
  string: undefined, // 可変長または固定長
  bytes: undefined,  // 可変長または固定長
};

/**
 * 型がプリミティブ型かどうかを判定
 */
export function isPrimitiveType(typeName: string): typeName is PrimitiveType {
  return typeName in PRIMITIVE_SIZES;
}

/**
 * モデルが固定サイズかどうかを判定
 */
export function isFixedSizeModel(model: ModelDefinition): boolean {
  return !model.hasVariableLength && model.fixedSize !== undefined;
}

/**
 * フィールドが固定サイズかどうかを判定
 */
export function isFixedSizeField(field: FieldDefinition): boolean {
  return field.size.fixedSize !== undefined && field.size.lengthPrefixType === undefined;
}

/**
 * デコレータから特定の値を取得
 */
export function getDecoratorValue<T>(
  decorators: Decorator[],
  decoratorName: string,
  defaultValue: T
): T {
  const decorator = decorators.find(d => d.name === decoratorName);
  if (decorator && decorator.args.length > 0) {
    return decorator.args[0] as T;
  }
  return defaultValue;
}
