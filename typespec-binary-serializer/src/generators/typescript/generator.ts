/**
 * TypeScriptコードジェネレーター
 */

import {
  SchemaIR,
  ModelDefinition,
  EnumDefinition,
  FieldDefinition,
  TypeInfo,
  PrimitiveType,
} from '../../ir/types.js';
import { BaseGenerator, GeneratedFile, GeneratorOptions } from '../base.js';

export class TypeScriptGenerator extends BaseGenerator {
  protected getLanguageName(): string {
    return 'TypeScript';
  }

  generate(): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // 型定義ファイル
    files.push({
      filename: 'types.ts',
      content: this.generateTypes(),
    });

    // シリアライザーファイル
    files.push({
      filename: 'serializer.ts',
      content: this.generateSerializer(),
    });

    // インデックスファイル
    files.push({
      filename: 'index.ts',
      content: this.generateIndex(),
    });

    return files;
  }

  private generateTypes(): string {
    const lines: string[] = [];

    lines.push('/**');
    lines.push(' * Auto-generated binary protocol types');
    lines.push(` * Generated from: ${this.ir.metadata.sourceFile}`);
    lines.push(` * Generated at: ${this.ir.metadata.parsedAt}`);
    lines.push(' */');
    lines.push('');

    // 列挙型
    for (const enumDef of this.ir.enums) {
      lines.push(this.generateEnum(enumDef));
      lines.push('');
    }

    // モデル
    for (const model of this.ir.models) {
      lines.push(this.generateModel(model));
      lines.push('');
    }

    // コマンドIDマッピング
    lines.push(this.generateCommandIdMap());

    return lines.join('\n');
  }

  private generateEnum(enumDef: EnumDefinition): string {
    const lines: string[] = [];

    if (enumDef.doc) {
      lines.push(this.generateDocComment(enumDef.doc, ''));
    }

    lines.push(`export enum ${enumDef.name} {`);

    for (const member of enumDef.members) {
      if (member.doc) {
        lines.push(this.generateDocComment(member.doc, this.indent(1)));
      }
      lines.push(`${this.indent(1)}${member.name} = ${member.value},`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  private generateModel(model: ModelDefinition): string {
    const lines: string[] = [];

    if (model.doc) {
      lines.push(this.generateDocComment(model.doc, ''));
    }

    lines.push(`export interface ${model.name} {`);

    for (const field of model.fields) {
      if (field.doc) {
        lines.push(this.generateDocComment(field.doc, this.indent(1)));
      }
      const tsType = this.mapTypeToTypeScript(field.type);
      lines.push(`${this.indent(1)}${field.name}: ${tsType};`);
    }

    lines.push('}');

    // 固定サイズ情報をコメントで追加
    if (model.fixedSize !== undefined) {
      lines.push(`// Fixed size: ${model.fixedSize} bytes`);
    }
    if (model.commandId !== undefined) {
      lines.push(`// Command ID: 0x${model.commandId.toString(16).toUpperCase().padStart(2, '0')}`);
    }

    return lines.join('\n');
  }

  private generateCommandIdMap(): string {
    const commands = this.ir.models.filter(m => m.commandId !== undefined);

    const lines: string[] = [];
    lines.push('/**');
    lines.push(' * Command ID to type mapping');
    lines.push(' */');
    lines.push('export const CommandIds = {');

    for (const model of commands) {
      lines.push(`${this.indent(1)}${model.name}: 0x${model.commandId!.toString(16).toUpperCase().padStart(2, '0')},`);
    }

    lines.push('} as const;');
    lines.push('');
    lines.push('export type CommandId = typeof CommandIds[keyof typeof CommandIds];');

    return lines.join('\n');
  }

  private mapTypeToTypeScript(typeInfo: TypeInfo): string {
    if (typeInfo.kind === 'array') {
      const elementType = this.mapTypeToTypeScript(typeInfo.elementType!);
      return `${elementType}[]`;
    }

    switch (typeInfo.name) {
      case 'uint8':
      case 'uint16':
      case 'uint32':
      case 'int8':
      case 'int16':
      case 'int32':
      case 'float32':
      case 'float64':
        return 'number';
      case 'uint64':
      case 'int64':
        return 'bigint';
      case 'bool':
        return 'boolean';
      case 'string':
        return 'string';
      case 'bytes':
        return 'Uint8Array';
      default:
        return typeInfo.name;
    }
  }

  private generateSerializer(): string {
    const lines: string[] = [];

    lines.push('/**');
    lines.push(' * Auto-generated binary serializer/deserializer');
    lines.push(' */');
    lines.push('');
    lines.push("import * as Types from './types.js';");
    lines.push('');

    // BinaryWriter クラス
    lines.push(this.generateBinaryWriter());
    lines.push('');

    // BinaryReader クラス
    lines.push(this.generateBinaryReader());
    lines.push('');

    // 各モデルのシリアライザー
    for (const model of this.ir.models) {
      lines.push(this.generateModelSerializer(model));
      lines.push('');
      lines.push(this.generateModelDeserializer(model));
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateBinaryWriter(): string {
    return `/**
 * Binary data writer
 */
export class BinaryWriter {
    private buffer: number[] = [];

    writeUint8(value: number): void {
        this.buffer.push(value & 0xFF);
    }

    writeUint16(value: number): void {
        this.buffer.push(value & 0xFF);
        this.buffer.push((value >> 8) & 0xFF);
    }

    writeUint32(value: number): void {
        this.buffer.push(value & 0xFF);
        this.buffer.push((value >> 8) & 0xFF);
        this.buffer.push((value >> 16) & 0xFF);
        this.buffer.push((value >> 24) & 0xFF);
    }

    writeUint64(value: bigint): void {
        for (let i = 0; i < 8; i++) {
            this.buffer.push(Number((value >> BigInt(i * 8)) & BigInt(0xFF)));
        }
    }

    writeInt8(value: number): void {
        this.writeUint8(value < 0 ? value + 256 : value);
    }

    writeInt16(value: number): void {
        this.writeUint16(value < 0 ? value + 65536 : value);
    }

    writeInt32(value: number): void {
        this.writeUint32(value < 0 ? value + 4294967296 : value);
    }

    writeInt64(value: bigint): void {
        this.writeUint64(value < 0n ? value + BigInt('18446744073709551616') : value);
    }

    writeFloat32(value: number): void {
        const view = new DataView(new ArrayBuffer(4));
        view.setFloat32(0, value, true);
        for (let i = 0; i < 4; i++) {
            this.buffer.push(view.getUint8(i));
        }
    }

    writeFloat64(value: number): void {
        const view = new DataView(new ArrayBuffer(8));
        view.setFloat64(0, value, true);
        for (let i = 0; i < 8; i++) {
            this.buffer.push(view.getUint8(i));
        }
    }

    writeBool(value: boolean): void {
        this.writeUint8(value ? 1 : 0);
    }

    writeFixedString(value: string, size: number): void {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(value);
        for (let i = 0; i < size; i++) {
            this.buffer.push(i < bytes.length ? bytes[i] : 0);
        }
    }

    writeBytes(value: Uint8Array): void {
        for (let i = 0; i < value.length; i++) {
            this.buffer.push(value[i]);
        }
    }

    writeLengthPrefixedBytes(value: Uint8Array, prefixType: 'uint8' | 'uint16' | 'uint32'): void {
        switch (prefixType) {
            case 'uint8':
                this.writeUint8(value.length);
                break;
            case 'uint16':
                this.writeUint16(value.length);
                break;
            case 'uint32':
                this.writeUint32(value.length);
                break;
        }
        this.writeBytes(value);
    }

    toUint8Array(): Uint8Array {
        return new Uint8Array(this.buffer);
    }

    get length(): number {
        return this.buffer.length;
    }
}`;
  }

  private generateBinaryReader(): string {
    return `/**
 * Binary data reader
 */
export class BinaryReader {
    private view: DataView;
    private offset: number = 0;

    constructor(buffer: Uint8Array) {
        this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }

    readUint8(): number {
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }

    readUint16(): number {
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readUint32(): number {
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUint64(): bigint {
        let value = BigInt(0);
        for (let i = 0; i < 8; i++) {
            value |= BigInt(this.view.getUint8(this.offset + i)) << BigInt(i * 8);
        }
        this.offset += 8;
        return value;
    }

    readInt8(): number {
        const value = this.view.getInt8(this.offset);
        this.offset += 1;
        return value;
    }

    readInt16(): number {
        const value = this.view.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readInt32(): number {
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readInt64(): bigint {
        let value = this.readUint64();
        if (value >= BigInt('9223372036854775808')) {
            value -= BigInt('18446744073709551616');
        }
        return value;
    }

    readFloat32(): number {
        const value = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readFloat64(): number {
        const value = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return value;
    }

    readBool(): boolean {
        return this.readUint8() !== 0;
    }

    readFixedString(size: number): string {
        const bytes = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            bytes[i] = this.view.getUint8(this.offset + i);
        }
        this.offset += size;

        // NULL終端を探す
        let end = bytes.indexOf(0);
        if (end === -1) end = size;

        const decoder = new TextDecoder();
        return decoder.decode(bytes.subarray(0, end));
    }

    readBytes(length: number): Uint8Array {
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = this.view.getUint8(this.offset + i);
        }
        this.offset += length;
        return bytes;
    }

    readLengthPrefixedBytes(prefixType: 'uint8' | 'uint16' | 'uint32'): Uint8Array {
        let length: number;
        switch (prefixType) {
            case 'uint8':
                length = this.readUint8();
                break;
            case 'uint16':
                length = this.readUint16();
                break;
            case 'uint32':
                length = this.readUint32();
                break;
        }
        return this.readBytes(length);
    }

    get position(): number {
        return this.offset;
    }

    get remaining(): number {
        return this.view.byteLength - this.offset;
    }
}`;
  }

  private generateModelSerializer(model: ModelDefinition): string {
    const lines: string[] = [];

    lines.push(`/**`);
    lines.push(` * Serialize ${model.name} to binary`);
    lines.push(` */`);
    lines.push(`export function serialize${model.name}(data: Types.${model.name}): Uint8Array {`);
    lines.push(`${this.indent(1)}const writer = new BinaryWriter();`);

    for (const field of model.fields) {
      lines.push(this.generateFieldSerializer(field));
    }

    lines.push(`${this.indent(1)}return writer.toUint8Array();`);
    lines.push('}');

    return lines.join('\n');
  }

  private generateFieldSerializer(field: FieldDefinition): string {
    const accessor = `data.${field.name}`;

    // 長さプレフィックス付きバイト列
    if (field.size.lengthPrefixType) {
      return `${this.indent(1)}writer.writeLengthPrefixedBytes(${accessor}, '${field.size.lengthPrefixType}');`;
    }

    // 固定長文字列
    if (field.type.name === 'string' && field.size.fixedSize) {
      return `${this.indent(1)}writer.writeFixedString(${accessor}, ${field.size.fixedSize});`;
    }

    // プリミティブ型
    switch (field.type.name) {
      case 'uint8':
        return `${this.indent(1)}writer.writeUint8(${accessor});`;
      case 'uint16':
        return `${this.indent(1)}writer.writeUint16(${accessor});`;
      case 'uint32':
        return `${this.indent(1)}writer.writeUint32(${accessor});`;
      case 'uint64':
        return `${this.indent(1)}writer.writeUint64(${accessor});`;
      case 'int8':
        return `${this.indent(1)}writer.writeInt8(${accessor});`;
      case 'int16':
        return `${this.indent(1)}writer.writeInt16(${accessor});`;
      case 'int32':
        return `${this.indent(1)}writer.writeInt32(${accessor});`;
      case 'int64':
        return `${this.indent(1)}writer.writeInt64(${accessor});`;
      case 'float32':
        return `${this.indent(1)}writer.writeFloat32(${accessor});`;
      case 'float64':
        return `${this.indent(1)}writer.writeFloat64(${accessor});`;
      case 'bool':
        return `${this.indent(1)}writer.writeBool(${accessor});`;
      case 'bytes':
        if (field.size.fixedSize) {
          return `${this.indent(1)}writer.writeBytes(${accessor}.slice(0, ${field.size.fixedSize}));`;
        }
        return `${this.indent(1)}writer.writeBytes(${accessor});`;
      default:
        // 列挙型
        if (this.ir.enums.find(e => e.name === field.type.name)) {
          return `${this.indent(1)}writer.writeUint8(${accessor});`;
        }
        // ネストしたモデル
        if (this.ir.models.find(m => m.name === field.type.name)) {
          return `${this.indent(1)}writer.writeBytes(serialize${field.type.name}(${accessor}));`;
        }
        return `${this.indent(1)}// TODO: serialize ${field.name}`;
    }
  }

  private generateModelDeserializer(model: ModelDefinition): string {
    const lines: string[] = [];

    lines.push(`/**`);
    lines.push(` * Deserialize ${model.name} from binary`);
    lines.push(` */`);
    lines.push(`export function deserialize${model.name}(buffer: Uint8Array): Types.${model.name} {`);
    lines.push(`${this.indent(1)}const reader = new BinaryReader(buffer);`);
    lines.push(`${this.indent(1)}return {`);

    for (const field of model.fields) {
      lines.push(`${this.indent(2)}${field.name}: ${this.generateFieldDeserializer(field)},`);
    }

    lines.push(`${this.indent(1)}};`);
    lines.push('}');

    return lines.join('\n');
  }

  private generateFieldDeserializer(field: FieldDefinition): string {
    // 長さプレフィックス付きバイト列
    if (field.size.lengthPrefixType) {
      return `reader.readLengthPrefixedBytes('${field.size.lengthPrefixType}')`;
    }

    // 固定長文字列
    if (field.type.name === 'string' && field.size.fixedSize) {
      return `reader.readFixedString(${field.size.fixedSize})`;
    }

    // プリミティブ型
    switch (field.type.name) {
      case 'uint8':
        return 'reader.readUint8()';
      case 'uint16':
        return 'reader.readUint16()';
      case 'uint32':
        return 'reader.readUint32()';
      case 'uint64':
        return 'reader.readUint64()';
      case 'int8':
        return 'reader.readInt8()';
      case 'int16':
        return 'reader.readInt16()';
      case 'int32':
        return 'reader.readInt32()';
      case 'int64':
        return 'reader.readInt64()';
      case 'float32':
        return 'reader.readFloat32()';
      case 'float64':
        return 'reader.readFloat64()';
      case 'bool':
        return 'reader.readBool()';
      case 'bytes':
        if (field.size.fixedSize) {
          return `reader.readBytes(${field.size.fixedSize})`;
        }
        return 'reader.readBytes(0)';
      default:
        // 列挙型
        if (this.ir.enums.find(e => e.name === field.type.name)) {
          return `reader.readUint8() as Types.${field.type.name}`;
        }
        // ネストしたモデル - 簡易版
        if (this.ir.models.find(m => m.name === field.type.name)) {
          const nestedModel = this.ir.models.find(m => m.name === field.type.name)!;
          if (nestedModel.fixedSize) {
            return `deserialize${field.type.name}(reader.readBytes(${nestedModel.fixedSize}))`;
          }
        }
        return `undefined as any /* TODO: deserialize ${field.name} */`;
    }
  }

  protected generateDocComment(doc: string | undefined, indent: string): string {
    if (!doc) return '';

    const lines = doc.split('\n');
    if (lines.length === 1) {
      return `${indent}/** ${doc} */`;
    }

    return [
      `${indent}/**`,
      ...lines.map(line => `${indent} * ${line}`),
      `${indent} */`,
    ].join('\n');
  }

  private generateIndex(): string {
    return `export * from './types.js';
export * from './serializer.js';
`;
  }
}
