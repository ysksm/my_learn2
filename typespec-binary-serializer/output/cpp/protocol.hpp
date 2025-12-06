/**
 * Auto-generated binary protocol types
 * Generated from: src/schema/commands.tsp
 * Generated at: 2025-12-05T14:13:04.015Z
 */

#ifndef BINARY_PROTOCOL_HPP
#define BINARY_PROTOCOL_HPP

#include <cstdint>
#include <cstring>
#include <string>
#include <vector>
#include <array>
#include <stdexcept>

namespace binaryprotocol {

enum class Endian : uint8_t {
    Little = 0,
    Big = 1,
};

enum class DeviceStatus : uint8_t {
    Offline = 0,
    Online = 1,
    Busy = 2,
    Error = 3,
};

enum class ErrorCode : uint8_t {
    None = 0,
    InvalidCommand = 1,
    InvalidParameter = 2,
    Timeout = 3,
    DeviceError = 4,
    Unknown = 255,
};

struct ProtocolHeader;
struct PingCommand;
struct PingResponse;
struct GetDeviceInfoCommand;
struct DeviceInfoResponse;
struct SendDataCommand;
struct SendDataResponse;
struct SetConfigCommand;
struct SetConfigResponse;
struct BatchCommand;
struct BatchResponse;
struct Vector3D;
struct SensorData;
struct SensorDataResponse;

#pragma pack(push, 1)
struct ProtocolHeader {
    uint16_t magic;
    uint8_t version;
    uint8_t command_id;
    uint32_t payload_length;
    uint32_t sequence_id;
    uint16_t checksum;
};
#pragma pack(pop)
static_assert(sizeof(ProtocolHeader) == 14, "Size mismatch for ProtocolHeader");

// Command ID: 0x01
#pragma pack(push, 1)
struct PingCommand {
    uint64_t timestamp;

    static constexpr uint8_t COMMAND_ID = 0x01;
};
#pragma pack(pop)
static_assert(sizeof(PingCommand) == 8, "Size mismatch for PingCommand");

// Command ID: 0x81
#pragma pack(push, 1)
struct PingResponse {
    uint64_t request_timestamp;
    uint64_t response_timestamp;

    static constexpr uint8_t COMMAND_ID = 0x81;
};
#pragma pack(pop)
static_assert(sizeof(PingResponse) == 16, "Size mismatch for PingResponse");

// Command ID: 0x02
#pragma pack(push, 1)
struct GetDeviceInfoCommand {
    bool include_details;

    static constexpr uint8_t COMMAND_ID = 0x02;
};
#pragma pack(pop)
static_assert(sizeof(GetDeviceInfoCommand) == 1, "Size mismatch for GetDeviceInfoCommand");

// Command ID: 0x82
#pragma pack(push, 1)
struct DeviceInfoResponse {
    DeviceStatus status;
    std::array<char, 32> device_name;
    std::array<char, 16> firmware_version;
    uint32_t uptime_seconds;
    int16_t temperature;
    uint8_t battery_level;

    static constexpr uint8_t COMMAND_ID = 0x82;
};
#pragma pack(pop)
static_assert(sizeof(DeviceInfoResponse) == 56, "Size mismatch for DeviceInfoResponse");

// Command ID: 0x03
#pragma pack(push, 1)
struct SendDataCommand {
    uint8_t channel;
    uint8_t priority;
    std::vector<uint8_t> data;

    static constexpr uint8_t COMMAND_ID = 0x03;
};
#pragma pack(pop)

// Command ID: 0x83
#pragma pack(push, 1)
struct SendDataResponse {
    bool success;
    ErrorCode error_code;
    uint32_t bytes_written;

    static constexpr uint8_t COMMAND_ID = 0x83;
};
#pragma pack(pop)
static_assert(sizeof(SendDataResponse) == 6, "Size mismatch for SendDataResponse");

// Command ID: 0x04
#pragma pack(push, 1)
struct SetConfigCommand {
    uint8_t config_id;
    uint8_t value_type;
    std::vector<uint8_t> value;

    static constexpr uint8_t COMMAND_ID = 0x04;
};
#pragma pack(pop)

// Command ID: 0x84
#pragma pack(push, 1)
struct SetConfigResponse {
    bool success;
    ErrorCode error_code;

    static constexpr uint8_t COMMAND_ID = 0x84;
};
#pragma pack(pop)
static_assert(sizeof(SetConfigResponse) == 2, "Size mismatch for SetConfigResponse");

// Command ID: 0x10
#pragma pack(push, 1)
struct BatchCommand {
    uint8_t command_count;
    std::vector<uint8_t> commands;

    static constexpr uint8_t COMMAND_ID = 0x10;
};
#pragma pack(pop)

// Command ID: 0x90
#pragma pack(push, 1)
struct BatchResponse {
    uint8_t success_count;
    uint8_t failure_count;
    std::vector<uint8_t> results;

    static constexpr uint8_t COMMAND_ID = 0x90;
};
#pragma pack(pop)

#pragma pack(push, 1)
struct Vector3D {
    float x;
    float y;
    float z;
};
#pragma pack(pop)
static_assert(sizeof(Vector3D) == 12, "Size mismatch for Vector3D");

#pragma pack(push, 1)
struct SensorData {
    uint64_t timestamp;
    uint8_t sensor_id;
    Vector3D position;
    float temperature;
    float humidity;
};
#pragma pack(pop)
static_assert(sizeof(SensorData) == 29, "Size mismatch for SensorData");

// Command ID: 0x85
#pragma pack(push, 1)
struct SensorDataResponse {
    uint8_t sensor_count;
    std::vector<SensorData> sensors;

    static constexpr uint8_t COMMAND_ID = 0x85;
};
#pragma pack(pop)

/**
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
};

/**
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
};

std::vector<uint8_t> serialize(const ProtocolHeader& data);
ProtocolHeader deserializeProtocolHeader(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const PingCommand& data);
PingCommand deserializePingCommand(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const PingResponse& data);
PingResponse deserializePingResponse(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const GetDeviceInfoCommand& data);
GetDeviceInfoCommand deserializeGetDeviceInfoCommand(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const DeviceInfoResponse& data);
DeviceInfoResponse deserializeDeviceInfoResponse(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const SendDataCommand& data);
SendDataCommand deserializeSendDataCommand(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const SendDataResponse& data);
SendDataResponse deserializeSendDataResponse(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const SetConfigCommand& data);
SetConfigCommand deserializeSetConfigCommand(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const SetConfigResponse& data);
SetConfigResponse deserializeSetConfigResponse(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const BatchCommand& data);
BatchCommand deserializeBatchCommand(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const BatchResponse& data);
BatchResponse deserializeBatchResponse(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const Vector3D& data);
Vector3D deserializeVector3D(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const SensorData& data);
SensorData deserializeSensorData(const uint8_t* data, size_t size);
std::vector<uint8_t> serialize(const SensorDataResponse& data);
SensorDataResponse deserializeSensorDataResponse(const uint8_t* data, size_t size);

} // namespace binaryprotocol

#endif // BINARY_PROTOCOL_HPP