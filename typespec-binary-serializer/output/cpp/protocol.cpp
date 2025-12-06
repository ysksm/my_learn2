/**
 * Auto-generated binary protocol implementation
 */

#include "protocol.hpp"

namespace binaryprotocol {

// BinaryWriter implementation
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
}

// BinaryReader implementation
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
}

std::vector<uint8_t> serialize(const ProtocolHeader& data) {
    BinaryWriter writer;
    writer.writeUint16(data.magic);
    writer.writeUint8(data.version);
    writer.writeUint8(data.command_id);
    writer.writeUint32(data.payload_length);
    writer.writeUint32(data.sequence_id);
    writer.writeUint16(data.checksum);
    return writer.data();
}

ProtocolHeader deserializeProtocolHeader(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    ProtocolHeader result{};
    result.magic = reader.readUint16();
    result.version = reader.readUint8();
    result.command_id = reader.readUint8();
    result.payload_length = reader.readUint32();
    result.sequence_id = reader.readUint32();
    result.checksum = reader.readUint16();
    return result;
}

std::vector<uint8_t> serialize(const PingCommand& data) {
    BinaryWriter writer;
    writer.writeUint64(data.timestamp);
    return writer.data();
}

PingCommand deserializePingCommand(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    PingCommand result{};
    result.timestamp = reader.readUint64();
    return result;
}

std::vector<uint8_t> serialize(const PingResponse& data) {
    BinaryWriter writer;
    writer.writeUint64(data.request_timestamp);
    writer.writeUint64(data.response_timestamp);
    return writer.data();
}

PingResponse deserializePingResponse(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    PingResponse result{};
    result.request_timestamp = reader.readUint64();
    result.response_timestamp = reader.readUint64();
    return result;
}

std::vector<uint8_t> serialize(const GetDeviceInfoCommand& data) {
    BinaryWriter writer;
    writer.writeBool(data.include_details);
    return writer.data();
}

GetDeviceInfoCommand deserializeGetDeviceInfoCommand(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    GetDeviceInfoCommand result{};
    result.include_details = reader.readBool();
    return result;
}

std::vector<uint8_t> serialize(const DeviceInfoResponse& data) {
    BinaryWriter writer;
    writer.writeUint8(static_cast<uint8_t>(data.status));
    writer.writeFixedString(data.device_name);
    writer.writeFixedString(data.firmware_version);
    writer.writeUint32(data.uptime_seconds);
    writer.writeInt16(data.temperature);
    writer.writeUint8(data.battery_level);
    return writer.data();
}

DeviceInfoResponse deserializeDeviceInfoResponse(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    DeviceInfoResponse result{};
    result.status = static_cast<DeviceStatus>(reader.readUint8());
    result.device_name = reader.readFixedString<32>();
    result.firmware_version = reader.readFixedString<16>();
    result.uptime_seconds = reader.readUint32();
    result.temperature = reader.readInt16();
    result.battery_level = reader.readUint8();
    return result;
}

std::vector<uint8_t> serialize(const SendDataCommand& data) {
    BinaryWriter writer;
    writer.writeUint8(data.channel);
    writer.writeUint8(data.priority);
    writer.writeLengthPrefixedBytes<uint16_t>(data.data);
    return writer.data();
}

SendDataCommand deserializeSendDataCommand(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    SendDataCommand result{};
    result.channel = reader.readUint8();
    result.priority = reader.readUint8();
    result.data = reader.readLengthPrefixedBytes<uint16_t>();
    return result;
}

std::vector<uint8_t> serialize(const SendDataResponse& data) {
    BinaryWriter writer;
    writer.writeBool(data.success);
    writer.writeUint8(static_cast<uint8_t>(data.error_code));
    writer.writeUint32(data.bytes_written);
    return writer.data();
}

SendDataResponse deserializeSendDataResponse(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    SendDataResponse result{};
    result.success = reader.readBool();
    result.error_code = static_cast<ErrorCode>(reader.readUint8());
    result.bytes_written = reader.readUint32();
    return result;
}

std::vector<uint8_t> serialize(const SetConfigCommand& data) {
    BinaryWriter writer;
    writer.writeUint8(data.config_id);
    writer.writeUint8(data.value_type);
    writer.writeLengthPrefixedBytes<uint8_t>(data.value);
    return writer.data();
}

SetConfigCommand deserializeSetConfigCommand(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    SetConfigCommand result{};
    result.config_id = reader.readUint8();
    result.value_type = reader.readUint8();
    result.value = reader.readLengthPrefixedBytes<uint8_t>();
    return result;
}

std::vector<uint8_t> serialize(const SetConfigResponse& data) {
    BinaryWriter writer;
    writer.writeBool(data.success);
    writer.writeUint8(static_cast<uint8_t>(data.error_code));
    return writer.data();
}

SetConfigResponse deserializeSetConfigResponse(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    SetConfigResponse result{};
    result.success = reader.readBool();
    result.error_code = static_cast<ErrorCode>(reader.readUint8());
    return result;
}

std::vector<uint8_t> serialize(const BatchCommand& data) {
    BinaryWriter writer;
    writer.writeUint8(data.command_count);
    writer.writeLengthPrefixedBytes<uint16_t>(data.commands);
    return writer.data();
}

BatchCommand deserializeBatchCommand(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    BatchCommand result{};
    result.command_count = reader.readUint8();
    result.commands = reader.readLengthPrefixedBytes<uint16_t>();
    return result;
}

std::vector<uint8_t> serialize(const BatchResponse& data) {
    BinaryWriter writer;
    writer.writeUint8(data.success_count);
    writer.writeUint8(data.failure_count);
    writer.writeLengthPrefixedBytes<uint16_t>(data.results);
    return writer.data();
}

BatchResponse deserializeBatchResponse(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    BatchResponse result{};
    result.success_count = reader.readUint8();
    result.failure_count = reader.readUint8();
    result.results = reader.readLengthPrefixedBytes<uint16_t>();
    return result;
}

std::vector<uint8_t> serialize(const Vector3D& data) {
    BinaryWriter writer;
    writer.writeFloat32(data.x);
    writer.writeFloat32(data.y);
    writer.writeFloat32(data.z);
    return writer.data();
}

Vector3D deserializeVector3D(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    Vector3D result{};
    result.x = reader.readFloat32();
    result.y = reader.readFloat32();
    result.z = reader.readFloat32();
    return result;
}

std::vector<uint8_t> serialize(const SensorData& data) {
    BinaryWriter writer;
    writer.writeUint64(data.timestamp);
    writer.writeUint8(data.sensor_id);
    {
        auto nested = serialize(data.position);
        writer.writeBytes(nested);
    }
    writer.writeFloat32(data.temperature);
    writer.writeFloat32(data.humidity);
    return writer.data();
}

SensorData deserializeSensorData(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    SensorData result{};
    result.timestamp = reader.readUint64();
    result.sensor_id = reader.readUint8();
    {
        auto nested = reader.readBytes(12);
        result.position = deserializeVector3D(nested.data(), nested.size());
    }
    result.temperature = reader.readFloat32();
    result.humidity = reader.readFloat32();
    return result;
}

std::vector<uint8_t> serialize(const SensorDataResponse& data) {
    BinaryWriter writer;
    writer.writeUint8(data.sensor_count);
    writer.writeLengthPrefixedBytes<uint16_t>(data.sensors);
    return writer.data();
}

SensorDataResponse deserializeSensorDataResponse(const uint8_t* data, size_t size) {
    BinaryReader reader(data, size);
    SensorDataResponse result{};
    result.sensor_count = reader.readUint8();
    result.sensors = reader.readLengthPrefixedBytes<uint16_t>();
    return result;
}

} // namespace binaryprotocol