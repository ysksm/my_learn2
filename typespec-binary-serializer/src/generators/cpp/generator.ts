/**
 * C++コードジェネレーター
 */

import {
  SchemaIR,
  ModelDefinition,
  EnumDefinition,
  FieldDefinition,
  TypeInfo,
} from '../../ir/types.js';
import { BaseGenerator, GeneratedFile, GeneratorOptions } from '../base.js';

export class CppGenerator extends BaseGenerator {
  protected getLanguageName(): string {
    return 'C++';
  }

  generate(): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // ヘッダーファイル
    files.push({
      filename: 'protocol.hpp',
      content: this.generateHeader(),
    });

    // 実装ファイル
    files.push({
      filename: 'protocol.cpp',
      content: this.generateImplementation(),
    });

    return files;
  }

  private generateHeader(): string {
    const lines: string[] = [];
    const guardName = 'BINARY_PROTOCOL_HPP';
    const ns = this.ir.namespace.replace(/\./g, '_').toLowerCase() || 'binary_protocol';

    lines.push('/**');
    lines.push(' * Auto-generated binary protocol types');
    lines.push(` * Generated from: ${this.ir.metadata.sourceFile}`);
    lines.push(` * Generated at: ${this.ir.metadata.parsedAt}`);
    lines.push(' */');
    lines.push('');
    lines.push(`#ifndef ${guardName}`);
    lines.push(`#define ${guardName}`);
    lines.push('');
    lines.push('#include <cstdint>');
    lines.push('#include <cstring>');
    lines.push('#include <string>');
    lines.push('#include <vector>');
    lines.push('#include <array>');
    lines.push('#include <stdexcept>');
    lines.push('');
    lines.push(`namespace ${ns} {`);
    lines.push('');

    // 列挙型
    for (const enumDef of this.ir.enums) {
      lines.push(this.generateEnum(enumDef));
      lines.push('');
    }

    // 構造体（前方宣言）
    for (const model of this.ir.models) {
      lines.push(`struct ${model.name};`);
    }
    lines.push('');

    // 構造体定義
    for (const model of this.ir.models) {
      lines.push(this.generateStruct(model));
      lines.push('');
    }

    // BinaryWriter クラス
    lines.push(this.generateBinaryWriterHeader());
    lines.push('');

    // BinaryReader クラス
    lines.push(this.generateBinaryReaderHeader());
    lines.push('');

    // シリアライザー関数宣言
    for (const model of this.ir.models) {
      lines.push(`std::vector<uint8_t> serialize(const ${model.name}& data);`);
      lines.push(`${model.name} deserialize${model.name}(const uint8_t* data, size_t size);`);
    }
    lines.push('');

    lines.push(`} // namespace ${ns}`);
    lines.push('');
    lines.push(`#endif // ${guardName}`);

    return lines.join('\n');
  }

  private generateEnum(enumDef: EnumDefinition): string {
    const lines: string[] = [];

    if (enumDef.doc) {
      lines.push(this.generateDocComment(enumDef.doc, ''));
    }

    lines.push(`enum class ${enumDef.name} : uint8_t {`);

    for (const member of enumDef.members) {
      if (member.doc) {
        lines.push(this.generateDocComment(member.doc, this.indent(1)));
      }
      lines.push(`${this.indent(1)}${member.name} = ${member.value},`);
    }

    lines.push('};');
    return lines.join('\n');
  }

  private generateStruct(model: ModelDefinition): string {
    const lines: string[] = [];

    if (model.doc) {
      lines.push(this.generateDocComment(model.doc, ''));
    }

    // コマンドIDをコメント
    if (model.commandId !== undefined) {
      lines.push(`// Command ID: 0x${model.commandId.toString(16).toUpperCase().padStart(2, '0')}`);
    }

    lines.push('#pragma pack(push, 1)');
    lines.push(`struct ${model.name} {`);

    for (const field of model.fields) {
      if (field.doc) {
        lines.push(this.generateDocComment(field.doc, this.indent(1)));
      }
      const cppType = this.mapTypeToCpp(field);
      lines.push(`${this.indent(1)}${cppType} ${field.name};`);
    }

    // コマンドID定数
    if (model.commandId !== undefined) {
      lines.push('');
      lines.push(`${this.indent(1)}static constexpr uint8_t COMMAND_ID = 0x${model.commandId.toString(16).toUpperCase().padStart(2, '0')};`);
    }

    lines.push('};');
    lines.push('#pragma pack(pop)');

    // サイズ情報
    if (model.fixedSize !== undefined) {
      lines.push(`static_assert(sizeof(${model.name}) == ${model.fixedSize}, "Size mismatch for ${model.name}");`);
    }

    return lines.join('\n');
  }

  private mapTypeToCpp(field: FieldDefinition): string {
    const typeInfo = field.type;

    // 配列型
    if (typeInfo.kind === 'array') {
      const elementType = this.mapPrimitiveTypeToCpp(typeInfo.elementType!.name);
      return `std::vector<${elementType}>`;
    }

    // 固定長文字列
    if (typeInfo.name === 'string' && field.size.fixedSize) {
      return `std::array<char, ${field.size.fixedSize}>`;
    }

    // 可変長バイト列
    if (typeInfo.name === 'bytes') {
      if (field.size.lengthPrefixType) {
        return 'std::vector<uint8_t>';
      }
      if (field.size.fixedSize) {
        return `std::array<uint8_t, ${field.size.fixedSize}>`;
      }
      return 'std::vector<uint8_t>';
    }

    return this.mapPrimitiveTypeToCpp(typeInfo.name);
  }

  private mapPrimitiveTypeToCpp(typeName: string): string {
    switch (typeName) {
      case 'uint8':
        return 'uint8_t';
      case 'uint16':
        return 'uint16_t';
      case 'uint32':
        return 'uint32_t';
      case 'uint64':
        return 'uint64_t';
      case 'int8':
        return 'int8_t';
      case 'int16':
        return 'int16_t';
      case 'int32':
        return 'int32_t';
      case 'int64':
        return 'int64_t';
      case 'float32':
        return 'float';
      case 'float64':
        return 'double';
      case 'bool':
        return 'bool';
      case 'string':
        return 'std::string';
      case 'bytes':
        return 'std::vector<uint8_t>';
      default:
        return typeName;
    }
  }

  private generateBinaryWriterHeader(): string {
    return `/**
 * Binary data writer
 */
class BinaryWriter {
public:
    void writeUint8(uint8_t value);
    void writeUint16(uint16_t value);
    void writeUint32(uint32_t value);
    void writeUint64(uint64_t value);
    void writeInt8(int8_t value);
    void writeInt16(int16_t value);
    void writeInt32(int32_t value);
    void writeInt64(int64_t value);
    void writeFloat32(float value);
    void writeFloat64(double value);
    void writeBool(bool value);

    template<size_t N>
    void writeFixedString(const std::array<char, N>& value) {
        buffer_.insert(buffer_.end(), value.begin(), value.end());
    }

    void writeBytes(const uint8_t* data, size_t size);
    void writeBytes(const std::vector<uint8_t>& data);

    template<size_t N>
    void writeBytes(const std::array<uint8_t, N>& data) {
        buffer_.insert(buffer_.end(), data.begin(), data.end());
    }

    template<typename LengthT>
    void writeLengthPrefixedBytes(const std::vector<uint8_t>& data) {
        if constexpr (sizeof(LengthT) == 1) {
            writeUint8(static_cast<uint8_t>(data.size()));
        } else if constexpr (sizeof(LengthT) == 2) {
            writeUint16(static_cast<uint16_t>(data.size()));
        } else if constexpr (sizeof(LengthT) == 4) {
            writeUint32(static_cast<uint32_t>(data.size()));
        }
        writeBytes(data);
    }

    const std::vector<uint8_t>& data() const { return buffer_; }
    size_t size() const { return buffer_.size(); }

private:
    std::vector<uint8_t> buffer_;
};`;
  }

  private generateBinaryReaderHeader(): string {
    return `/**
 * Binary data reader
 */
class BinaryReader {
public:
    BinaryReader(const uint8_t* data, size_t size);

    uint8_t readUint8();
    uint16_t readUint16();
    uint32_t readUint32();
    uint64_t readUint64();
    int8_t readInt8();
    int16_t readInt16();
    int32_t readInt32();
    int64_t readInt64();
    float readFloat32();
    double readFloat64();
    bool readBool();

    template<size_t N>
    std::array<char, N> readFixedString() {
        std::array<char, N> result{};
        if (offset_ + N > size_) {
            throw std::runtime_error("Buffer underflow");
        }
        std::memcpy(result.data(), data_ + offset_, N);
        offset_ += N;
        return result;
    }

    std::vector<uint8_t> readBytes(size_t length);

    template<size_t N>
    std::array<uint8_t, N> readFixedBytes() {
        std::array<uint8_t, N> result{};
        if (offset_ + N > size_) {
            throw std::runtime_error("Buffer underflow");
        }
        std::memcpy(result.data(), data_ + offset_, N);
        offset_ += N;
        return result;
    }

    template<typename LengthT>
    std::vector<uint8_t> readLengthPrefixedBytes() {
        size_t length;
        if constexpr (sizeof(LengthT) == 1) {
            length = readUint8();
        } else if constexpr (sizeof(LengthT) == 2) {
            length = readUint16();
        } else if constexpr (sizeof(LengthT) == 4) {
            length = readUint32();
        }
        return readBytes(length);
    }

    size_t position() const { return offset_; }
    size_t remaining() const { return size_ - offset_; }

private:
    const uint8_t* data_;
    size_t size_;
    size_t offset_ = 0;
};`;
  }

  private generateImplementation(): string {
    const lines: string[] = [];
    const ns = this.ir.namespace.replace(/\./g, '_').toLowerCase() || 'binary_protocol';

    lines.push('/**');
    lines.push(' * Auto-generated binary protocol implementation');
    lines.push(' */');
    lines.push('');
    lines.push('#include "protocol.hpp"');
    lines.push('');
    lines.push(`namespace ${ns} {`);
    lines.push('');

    // BinaryWriter実装
    lines.push(this.generateBinaryWriterImpl());
    lines.push('');

    // BinaryReader実装
    lines.push(this.generateBinaryReaderImpl());
    lines.push('');

    // 各モデルのシリアライザー
    for (const model of this.ir.models) {
      lines.push(this.generateModelSerializer(model));
      lines.push('');
      lines.push(this.generateModelDeserializer(model));
      lines.push('');
    }

    lines.push(`} // namespace ${ns}`);

    return lines.join('\n');
  }

  private generateBinaryWriterImpl(): string {
    return `// BinaryWriter implementation
void BinaryWriter::writeUint8(uint8_t value) {
    buffer_.push_back(value);
}

void BinaryWriter::writeUint16(uint16_t value) {
    buffer_.push_back(value & 0xFF);
    buffer_.push_back((value >> 8) & 0xFF);
}

void BinaryWriter::writeUint32(uint32_t value) {
    buffer_.push_back(value & 0xFF);
    buffer_.push_back((value >> 8) & 0xFF);
    buffer_.push_back((value >> 16) & 0xFF);
    buffer_.push_back((value >> 24) & 0xFF);
}

void BinaryWriter::writeUint64(uint64_t value) {
    for (int i = 0; i < 8; i++) {
        buffer_.push_back((value >> (i * 8)) & 0xFF);
    }
}

void BinaryWriter::writeInt8(int8_t value) {
    writeUint8(static_cast<uint8_t>(value));
}

void BinaryWriter::writeInt16(int16_t value) {
    writeUint16(static_cast<uint16_t>(value));
}

void BinaryWriter::writeInt32(int32_t value) {
    writeUint32(static_cast<uint32_t>(value));
}

void BinaryWriter::writeInt64(int64_t value) {
    writeUint64(static_cast<uint64_t>(value));
}

void BinaryWriter::writeFloat32(float value) {
    uint32_t bits;
    std::memcpy(&bits, &value, sizeof(bits));
    writeUint32(bits);
}

void BinaryWriter::writeFloat64(double value) {
    uint64_t bits;
    std::memcpy(&bits, &value, sizeof(bits));
    writeUint64(bits);
}

void BinaryWriter::writeBool(bool value) {
    writeUint8(value ? 1 : 0);
}

void BinaryWriter::writeBytes(const uint8_t* data, size_t size) {
    buffer_.insert(buffer_.end(), data, data + size);
}

void BinaryWriter::writeBytes(const std::vector<uint8_t>& data) {
    buffer_.insert(buffer_.end(), data.begin(), data.end());
}`;
  }

  private generateBinaryReaderImpl(): string {
    return `// BinaryReader implementation
BinaryReader::BinaryReader(const uint8_t* data, size_t size)
    : data_(data), size_(size), offset_(0) {}

uint8_t BinaryReader::readUint8() {
    if (offset_ + 1 > size_) throw std::runtime_error("Buffer underflow");
    return data_[offset_++];
}

uint16_t BinaryReader::readUint16() {
    if (offset_ + 2 > size_) throw std::runtime_error("Buffer underflow");
    uint16_t value = data_[offset_] | (data_[offset_ + 1] << 8);
    offset_ += 2;
    return value;
}

uint32_t BinaryReader::readUint32() {
    if (offset_ + 4 > size_) throw std::runtime_error("Buffer underflow");
    uint32_t value = data_[offset_] | (data_[offset_ + 1] << 8) |
                     (data_[offset_ + 2] << 16) | (data_[offset_ + 3] << 24);
    offset_ += 4;
    return value;
}

uint64_t BinaryReader::readUint64() {
    if (offset_ + 8 > size_) throw std::runtime_error("Buffer underflow");
    uint64_t value = 0;
    for (int i = 0; i < 8; i++) {
        value |= static_cast<uint64_t>(data_[offset_ + i]) << (i * 8);
    }
    offset_ += 8;
    return value;
}

int8_t BinaryReader::readInt8() {
    return static_cast<int8_t>(readUint8());
}

int16_t BinaryReader::readInt16() {
    return static_cast<int16_t>(readUint16());
}

int32_t BinaryReader::readInt32() {
    return static_cast<int32_t>(readUint32());
}

int64_t BinaryReader::readInt64() {
    return static_cast<int64_t>(readUint64());
}

float BinaryReader::readFloat32() {
    uint32_t bits = readUint32();
    float value;
    std::memcpy(&value, &bits, sizeof(value));
    return value;
}

double BinaryReader::readFloat64() {
    uint64_t bits = readUint64();
    double value;
    std::memcpy(&value, &bits, sizeof(value));
    return value;
}

bool BinaryReader::readBool() {
    return readUint8() != 0;
}

std::vector<uint8_t> BinaryReader::readBytes(size_t length) {
    if (offset_ + length > size_) throw std::runtime_error("Buffer underflow");
    std::vector<uint8_t> result(data_ + offset_, data_ + offset_ + length);
    offset_ += length;
    return result;
}`;
  }

  private generateModelSerializer(model: ModelDefinition): string {
    const lines: string[] = [];

    lines.push(`std::vector<uint8_t> serialize(const ${model.name}& data) {`);
    lines.push(`${this.indent(1)}BinaryWriter writer;`);

    for (const field of model.fields) {
      lines.push(this.generateFieldSerializerCpp(field));
    }

    lines.push(`${this.indent(1)}return writer.data();`);
    lines.push('}');

    return lines.join('\n');
  }

  private generateFieldSerializerCpp(field: FieldDefinition): string {
    const accessor = `data.${field.name}`;

    // 長さプレフィックス付きバイト列
    if (field.size.lengthPrefixType) {
      const lengthType = this.mapPrimitiveTypeToCpp(field.size.lengthPrefixType);
      return `${this.indent(1)}writer.writeLengthPrefixedBytes<${lengthType}>(${accessor});`;
    }

    // 固定長文字列/バイト配列
    if (field.type.name === 'string' && field.size.fixedSize) {
      return `${this.indent(1)}writer.writeFixedString(${accessor});`;
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
          return `${this.indent(1)}writer.writeBytes(${accessor});`;
        }
        return `${this.indent(1)}writer.writeBytes(${accessor});`;
      default:
        // 列挙型
        if (this.ir.enums.find(e => e.name === field.type.name)) {
          return `${this.indent(1)}writer.writeUint8(static_cast<uint8_t>(${accessor}));`;
        }
        // ネストしたモデル
        if (this.ir.models.find(m => m.name === field.type.name)) {
          return `${this.indent(1)}{\n${this.indent(2)}auto nested = serialize(${accessor});\n${this.indent(2)}writer.writeBytes(nested);\n${this.indent(1)}}`;
        }
        return `${this.indent(1)}// TODO: serialize ${field.name}`;
    }
  }

  private generateModelDeserializer(model: ModelDefinition): string {
    const lines: string[] = [];

    lines.push(`${model.name} deserialize${model.name}(const uint8_t* data, size_t size) {`);
    lines.push(`${this.indent(1)}BinaryReader reader(data, size);`);
    lines.push(`${this.indent(1)}${model.name} result{};`);

    for (const field of model.fields) {
      lines.push(this.generateFieldDeserializerCpp(field));
    }

    lines.push(`${this.indent(1)}return result;`);
    lines.push('}');

    return lines.join('\n');
  }

  private generateFieldDeserializerCpp(field: FieldDefinition): string {
    const accessor = `result.${field.name}`;

    // 長さプレフィックス付きバイト列
    if (field.size.lengthPrefixType) {
      const lengthType = this.mapPrimitiveTypeToCpp(field.size.lengthPrefixType);
      return `${this.indent(1)}${accessor} = reader.readLengthPrefixedBytes<${lengthType}>();`;
    }

    // 固定長文字列
    if (field.type.name === 'string' && field.size.fixedSize) {
      return `${this.indent(1)}${accessor} = reader.readFixedString<${field.size.fixedSize}>();`;
    }

    // プリミティブ型
    switch (field.type.name) {
      case 'uint8':
        return `${this.indent(1)}${accessor} = reader.readUint8();`;
      case 'uint16':
        return `${this.indent(1)}${accessor} = reader.readUint16();`;
      case 'uint32':
        return `${this.indent(1)}${accessor} = reader.readUint32();`;
      case 'uint64':
        return `${this.indent(1)}${accessor} = reader.readUint64();`;
      case 'int8':
        return `${this.indent(1)}${accessor} = reader.readInt8();`;
      case 'int16':
        return `${this.indent(1)}${accessor} = reader.readInt16();`;
      case 'int32':
        return `${this.indent(1)}${accessor} = reader.readInt32();`;
      case 'int64':
        return `${this.indent(1)}${accessor} = reader.readInt64();`;
      case 'float32':
        return `${this.indent(1)}${accessor} = reader.readFloat32();`;
      case 'float64':
        return `${this.indent(1)}${accessor} = reader.readFloat64();`;
      case 'bool':
        return `${this.indent(1)}${accessor} = reader.readBool();`;
      case 'bytes':
        if (field.size.fixedSize) {
          return `${this.indent(1)}${accessor} = reader.readFixedBytes<${field.size.fixedSize}>();`;
        }
        return `${this.indent(1)}// TODO: read variable-length bytes for ${field.name}`;
      default:
        // 列挙型
        if (this.ir.enums.find(e => e.name === field.type.name)) {
          return `${this.indent(1)}${accessor} = static_cast<${field.type.name}>(reader.readUint8());`;
        }
        // ネストしたモデル
        const nestedModel = this.ir.models.find(m => m.name === field.type.name);
        if (nestedModel && nestedModel.fixedSize) {
          return `${this.indent(1)}{\n${this.indent(2)}auto nested = reader.readBytes(${nestedModel.fixedSize});\n${this.indent(2)}${accessor} = deserialize${field.type.name}(nested.data(), nested.size());\n${this.indent(1)}}`;
        }
        return `${this.indent(1)}// TODO: deserialize ${field.name}`;
    }
  }

  protected generateDocComment(doc: string | undefined, indent: string): string {
    if (!doc) return '';

    const lines = doc.split('\n');
    if (lines.length === 1) {
      return `${indent}/// ${doc}`;
    }

    return [
      `${indent}/**`,
      ...lines.map(line => `${indent} * ${line}`),
      `${indent} */`,
    ].join('\n');
  }
}
