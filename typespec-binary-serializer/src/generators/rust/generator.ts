/**
 * Rustコードジェネレーター
 */

import {
  SchemaIR,
  ModelDefinition,
  EnumDefinition,
  FieldDefinition,
  TypeInfo,
} from '../../ir/types.js';
import { BaseGenerator, GeneratedFile, GeneratorOptions } from '../base.js';

export class RustGenerator extends BaseGenerator {
  protected getLanguageName(): string {
    return 'Rust';
  }

  generate(): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // メインのlib.rsファイル
    files.push({
      filename: 'lib.rs',
      content: this.generateLib(),
    });

    return files;
  }

  private generateLib(): string {
    const lines: string[] = [];

    lines.push('//! Auto-generated binary protocol types');
    lines.push(`//! Generated from: ${this.ir.metadata.sourceFile}`);
    lines.push(`//! Generated at: ${this.ir.metadata.parsedAt}`);
    lines.push('');
    lines.push('#![allow(dead_code)]');
    lines.push('#![allow(unused_imports)]');
    lines.push('');
    lines.push('use std::io::{self, Read, Write, Cursor};');
    lines.push('use byteorder::{LittleEndian, ReadBytesExt, WriteBytesExt};');
    lines.push('');

    // エラー型
    lines.push(this.generateErrorType());
    lines.push('');

    // 列挙型
    for (const enumDef of this.ir.enums) {
      lines.push(this.generateEnum(enumDef));
      lines.push('');
    }

    // 構造体
    for (const model of this.ir.models) {
      lines.push(this.generateStruct(model));
      lines.push('');
    }

    // シリアライズトレイト
    lines.push(this.generateSerializeTrait());
    lines.push('');

    // 各モデルのシリアライズ実装
    for (const model of this.ir.models) {
      lines.push(this.generateSerializeImpl(model));
      lines.push('');
    }

    // コマンドIDモジュール
    lines.push(this.generateCommandIds());

    return lines.join('\n');
  }

  private generateErrorType(): string {
    return `/// Serialization/Deserialization error
#[derive(Debug)]
pub enum ProtocolError {
    IoError(io::Error),
    InvalidData(String),
    BufferTooSmall,
    InvalidEnumValue(u8),
}

impl From<io::Error> for ProtocolError {
    fn from(err: io::Error) -> Self {
        ProtocolError::IoError(err)
    }
}

impl std::fmt::Display for ProtocolError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProtocolError::IoError(e) => write!(f, "IO error: {}", e),
            ProtocolError::InvalidData(msg) => write!(f, "Invalid data: {}", msg),
            ProtocolError::BufferTooSmall => write!(f, "Buffer too small"),
            ProtocolError::InvalidEnumValue(v) => write!(f, "Invalid enum value: {}", v),
        }
    }
}

impl std::error::Error for ProtocolError {}

pub type Result<T> = std::result::Result<T, ProtocolError>;`;
  }

  private generateEnum(enumDef: EnumDefinition): string {
    const lines: string[] = [];

    if (enumDef.doc) {
      lines.push(this.generateDocComment(enumDef.doc, ''));
    }

    lines.push('#[derive(Debug, Clone, Copy, PartialEq, Eq)]');
    lines.push('#[repr(u8)]');
    lines.push(`pub enum ${enumDef.name} {`);

    for (const member of enumDef.members) {
      if (member.doc) {
        lines.push(this.generateDocComment(member.doc, this.indent(1)));
      }
      lines.push(`${this.indent(1)}${member.name} = ${member.value},`);
    }

    lines.push('}');
    lines.push('');

    // TryFrom実装
    lines.push(`impl TryFrom<u8> for ${enumDef.name} {`);
    lines.push(`${this.indent(1)}type Error = ProtocolError;`);
    lines.push('');
    lines.push(`${this.indent(1)}fn try_from(value: u8) -> Result<Self> {`);
    lines.push(`${this.indent(2)}match value {`);

    for (const member of enumDef.members) {
      lines.push(`${this.indent(3)}${member.value} => Ok(${enumDef.name}::${member.name}),`);
    }

    lines.push(`${this.indent(3)}_ => Err(ProtocolError::InvalidEnumValue(value)),`);
    lines.push(`${this.indent(2)}}`);
    lines.push(`${this.indent(1)}}`);
    lines.push('}');

    return lines.join('\n');
  }

  private generateStruct(model: ModelDefinition): string {
    const lines: string[] = [];

    if (model.doc) {
      lines.push(this.generateDocComment(model.doc, ''));
    }

    // コマンドIDをコメント
    if (model.commandId !== undefined) {
      lines.push(`/// Command ID: 0x${model.commandId.toString(16).toUpperCase().padStart(2, '0')}`);
    }

    lines.push('#[derive(Debug, Clone)]');
    lines.push(`pub struct ${model.name} {`);

    for (const field of model.fields) {
      if (field.doc) {
        lines.push(this.generateDocComment(field.doc, this.indent(1)));
      }
      const rustType = this.mapTypeToRust(field);
      lines.push(`${this.indent(1)}pub ${this.toSnakeCase(field.name)}: ${rustType},`);
    }

    lines.push('}');

    // コマンドID定数
    if (model.commandId !== undefined) {
      lines.push('');
      lines.push(`impl ${model.name} {`);
      lines.push(`${this.indent(1)}pub const COMMAND_ID: u8 = 0x${model.commandId.toString(16).toUpperCase().padStart(2, '0')};`);
      lines.push('}');
    }

    return lines.join('\n');
  }

  private mapTypeToRust(field: FieldDefinition): string {
    const typeInfo = field.type;

    // 配列型
    if (typeInfo.kind === 'array') {
      const elementType = this.mapPrimitiveTypeToRust(typeInfo.elementType!.name);
      return `Vec<${elementType}>`;
    }

    // 固定長文字列
    if (typeInfo.name === 'string' && field.size.fixedSize) {
      return `[u8; ${field.size.fixedSize}]`;
    }

    // 可変長バイト列
    if (typeInfo.name === 'bytes') {
      if (field.size.lengthPrefixType) {
        return 'Vec<u8>';
      }
      if (field.size.fixedSize) {
        return `[u8; ${field.size.fixedSize}]`;
      }
      return 'Vec<u8>';
    }

    return this.mapPrimitiveTypeToRust(typeInfo.name);
  }

  private mapPrimitiveTypeToRust(typeName: string): string {
    switch (typeName) {
      case 'uint8':
        return 'u8';
      case 'uint16':
        return 'u16';
      case 'uint32':
        return 'u32';
      case 'uint64':
        return 'u64';
      case 'int8':
        return 'i8';
      case 'int16':
        return 'i16';
      case 'int32':
        return 'i32';
      case 'int64':
        return 'i64';
      case 'float32':
        return 'f32';
      case 'float64':
        return 'f64';
      case 'bool':
        return 'bool';
      case 'string':
        return 'String';
      case 'bytes':
        return 'Vec<u8>';
      default:
        return typeName;
    }
  }

  private generateSerializeTrait(): string {
    return `/// Trait for binary serialization
pub trait BinarySerialize {
    fn serialize(&self) -> Result<Vec<u8>>;
    fn deserialize(data: &[u8]) -> Result<Self> where Self: Sized;
}

/// Helper functions for reading fixed-length strings
fn read_fixed_string<R: Read>(reader: &mut R, size: usize) -> Result<[u8; 32]> {
    let mut buf = [0u8; 32];
    reader.read_exact(&mut buf[..size.min(32)])?;
    Ok(buf)
}

fn read_fixed_bytes<R: Read, const N: usize>(reader: &mut R) -> Result<[u8; N]> {
    let mut buf = [0u8; N];
    reader.read_exact(&mut buf)?;
    Ok(buf)
}`;
  }

  private generateSerializeImpl(model: ModelDefinition): string {
    const lines: string[] = [];

    lines.push(`impl BinarySerialize for ${model.name} {`);

    // serialize
    lines.push(`${this.indent(1)}fn serialize(&self) -> Result<Vec<u8>> {`);
    lines.push(`${this.indent(2)}let mut buf = Vec::new();`);

    for (const field of model.fields) {
      const fieldName = this.toSnakeCase(field.name);
      lines.push(this.generateFieldSerializeRust(field, fieldName));
    }

    lines.push(`${this.indent(2)}Ok(buf)`);
    lines.push(`${this.indent(1)}}`);
    lines.push('');

    // deserialize
    lines.push(`${this.indent(1)}fn deserialize(data: &[u8]) -> Result<Self> {`);
    lines.push(`${this.indent(2)}let mut cursor = Cursor::new(data);`);
    lines.push(`${this.indent(2)}Ok(Self {`);

    for (const field of model.fields) {
      const fieldName = this.toSnakeCase(field.name);
      lines.push(`${this.indent(3)}${fieldName}: ${this.generateFieldDeserializeRust(field)},`);
    }

    lines.push(`${this.indent(2)}})`);
    lines.push(`${this.indent(1)}}`);
    lines.push('}');

    return lines.join('\n');
  }

  private generateFieldSerializeRust(field: FieldDefinition, fieldName: string): string {
    const accessor = `self.${fieldName}`;

    // 長さプレフィックス付きバイト列
    if (field.size.lengthPrefixType) {
      const lines: string[] = [];
      switch (field.size.lengthPrefixType) {
        case 'uint8':
          lines.push(`${this.indent(2)}buf.write_u8(${accessor}.len() as u8)?;`);
          break;
        case 'uint16':
          lines.push(`${this.indent(2)}buf.write_u16::<LittleEndian>(${accessor}.len() as u16)?;`);
          break;
        case 'uint32':
          lines.push(`${this.indent(2)}buf.write_u32::<LittleEndian>(${accessor}.len() as u32)?;`);
          break;
      }
      lines.push(`${this.indent(2)}buf.extend_from_slice(&${accessor});`);
      return lines.join('\n');
    }

    // 固定長文字列/バイト配列
    if ((field.type.name === 'string' || field.type.name === 'bytes') && field.size.fixedSize) {
      return `${this.indent(2)}buf.extend_from_slice(&${accessor});`;
    }

    // プリミティブ型
    switch (field.type.name) {
      case 'uint8':
        return `${this.indent(2)}buf.write_u8(${accessor})?;`;
      case 'uint16':
        return `${this.indent(2)}buf.write_u16::<LittleEndian>(${accessor})?;`;
      case 'uint32':
        return `${this.indent(2)}buf.write_u32::<LittleEndian>(${accessor})?;`;
      case 'uint64':
        return `${this.indent(2)}buf.write_u64::<LittleEndian>(${accessor})?;`;
      case 'int8':
        return `${this.indent(2)}buf.write_i8(${accessor})?;`;
      case 'int16':
        return `${this.indent(2)}buf.write_i16::<LittleEndian>(${accessor})?;`;
      case 'int32':
        return `${this.indent(2)}buf.write_i32::<LittleEndian>(${accessor})?;`;
      case 'int64':
        return `${this.indent(2)}buf.write_i64::<LittleEndian>(${accessor})?;`;
      case 'float32':
        return `${this.indent(2)}buf.write_f32::<LittleEndian>(${accessor})?;`;
      case 'float64':
        return `${this.indent(2)}buf.write_f64::<LittleEndian>(${accessor})?;`;
      case 'bool':
        return `${this.indent(2)}buf.write_u8(if ${accessor} { 1 } else { 0 })?;`;
      default:
        // 列挙型
        if (this.ir.enums.find(e => e.name === field.type.name)) {
          return `${this.indent(2)}buf.write_u8(${accessor} as u8)?;`;
        }
        // ネストしたモデル
        if (this.ir.models.find(m => m.name === field.type.name)) {
          return `${this.indent(2)}buf.extend_from_slice(&${accessor}.serialize()?);`;
        }
        return `${this.indent(2)}// TODO: serialize ${fieldName}`;
    }
  }

  private generateFieldDeserializeRust(field: FieldDefinition): string {
    // 長さプレフィックス付きバイト列
    if (field.size.lengthPrefixType) {
      let lengthReader: string;
      switch (field.size.lengthPrefixType) {
        case 'uint8':
          lengthReader = 'cursor.read_u8()? as usize';
          break;
        case 'uint16':
          lengthReader = 'cursor.read_u16::<LittleEndian>()? as usize';
          break;
        case 'uint32':
          lengthReader = 'cursor.read_u32::<LittleEndian>()? as usize';
          break;
        default:
          lengthReader = '0';
      }
      return `{\n${this.indent(4)}let len = ${lengthReader};\n${this.indent(4)}let mut data = vec![0u8; len];\n${this.indent(4)}cursor.read_exact(&mut data)?;\n${this.indent(4)}data\n${this.indent(3)}}`;
    }

    // 固定長文字列
    if (field.type.name === 'string' && field.size.fixedSize) {
      return `read_fixed_bytes::<_, ${field.size.fixedSize}>(&mut cursor)?`;
    }

    // 固定長バイト列
    if (field.type.name === 'bytes' && field.size.fixedSize) {
      return `read_fixed_bytes::<_, ${field.size.fixedSize}>(&mut cursor)?`;
    }

    // プリミティブ型
    switch (field.type.name) {
      case 'uint8':
        return 'cursor.read_u8()?';
      case 'uint16':
        return 'cursor.read_u16::<LittleEndian>()?';
      case 'uint32':
        return 'cursor.read_u32::<LittleEndian>()?';
      case 'uint64':
        return 'cursor.read_u64::<LittleEndian>()?';
      case 'int8':
        return 'cursor.read_i8()?';
      case 'int16':
        return 'cursor.read_i16::<LittleEndian>()?';
      case 'int32':
        return 'cursor.read_i32::<LittleEndian>()?';
      case 'int64':
        return 'cursor.read_i64::<LittleEndian>()?';
      case 'float32':
        return 'cursor.read_f32::<LittleEndian>()?';
      case 'float64':
        return 'cursor.read_f64::<LittleEndian>()?';
      case 'bool':
        return 'cursor.read_u8()? != 0';
      default:
        // 列挙型
        if (this.ir.enums.find(e => e.name === field.type.name)) {
          return `${field.type.name}::try_from(cursor.read_u8()?)?`;
        }
        // ネストしたモデル
        const nestedModel = this.ir.models.find(m => m.name === field.type.name);
        if (nestedModel && nestedModel.fixedSize) {
          return `{\n${this.indent(4)}let mut data = vec![0u8; ${nestedModel.fixedSize}];\n${this.indent(4)}cursor.read_exact(&mut data)?;\n${this.indent(4)}${field.type.name}::deserialize(&data)?\n${this.indent(3)}}`;
        }
        return `Default::default() /* TODO: deserialize ${field.name} */`;
    }
  }

  private generateCommandIds(): string {
    const commands = this.ir.models.filter(m => m.commandId !== undefined);

    const lines: string[] = [];
    lines.push('/// Command ID constants');
    lines.push('pub mod command_ids {');

    for (const model of commands) {
      lines.push(`${this.indent(1)}pub const ${this.toUpperSnakeCase(model.name)}: u8 = 0x${model.commandId!.toString(16).toUpperCase().padStart(2, '0')};`);
    }

    lines.push('}');

    return lines.join('\n');
  }

  protected generateDocComment(doc: string | undefined, indent: string): string {
    if (!doc) return '';

    const lines = doc.split('\n');
    return lines.map(line => `${indent}/// ${line}`).join('\n');
  }
}
