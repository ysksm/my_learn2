/**
 * Auto-generated binary serializer/deserializer
 */

import * as Types from './types.js';

/**
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
}

/**
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
}

/**
 * Serialize ProtocolHeader to binary
 */
export function serializeProtocolHeader(data: Types.ProtocolHeader): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint16(data.magic);
    writer.writeUint8(data.version);
    writer.writeUint8(data.command_id);
    writer.writeUint32(data.payload_length);
    writer.writeUint32(data.sequence_id);
    writer.writeUint16(data.checksum);
    return writer.toUint8Array();
}

/**
 * Deserialize ProtocolHeader from binary
 */
export function deserializeProtocolHeader(buffer: Uint8Array): Types.ProtocolHeader {
    const reader = new BinaryReader(buffer);
    return {
        magic: reader.readUint16(),
        version: reader.readUint8(),
        command_id: reader.readUint8(),
        payload_length: reader.readUint32(),
        sequence_id: reader.readUint32(),
        checksum: reader.readUint16(),
    };
}

/**
 * Serialize PingCommand to binary
 */
export function serializePingCommand(data: Types.PingCommand): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint64(data.timestamp);
    return writer.toUint8Array();
}

/**
 * Deserialize PingCommand from binary
 */
export function deserializePingCommand(buffer: Uint8Array): Types.PingCommand {
    const reader = new BinaryReader(buffer);
    return {
        timestamp: reader.readUint64(),
    };
}

/**
 * Serialize PingResponse to binary
 */
export function serializePingResponse(data: Types.PingResponse): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint64(data.request_timestamp);
    writer.writeUint64(data.response_timestamp);
    return writer.toUint8Array();
}

/**
 * Deserialize PingResponse from binary
 */
export function deserializePingResponse(buffer: Uint8Array): Types.PingResponse {
    const reader = new BinaryReader(buffer);
    return {
        request_timestamp: reader.readUint64(),
        response_timestamp: reader.readUint64(),
    };
}

/**
 * Serialize GetDeviceInfoCommand to binary
 */
export function serializeGetDeviceInfoCommand(data: Types.GetDeviceInfoCommand): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeBool(data.include_details);
    return writer.toUint8Array();
}

/**
 * Deserialize GetDeviceInfoCommand from binary
 */
export function deserializeGetDeviceInfoCommand(buffer: Uint8Array): Types.GetDeviceInfoCommand {
    const reader = new BinaryReader(buffer);
    return {
        include_details: reader.readBool(),
    };
}

/**
 * Serialize DeviceInfoResponse to binary
 */
export function serializeDeviceInfoResponse(data: Types.DeviceInfoResponse): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint8(data.status);
    writer.writeFixedString(data.device_name, 32);
    writer.writeFixedString(data.firmware_version, 16);
    writer.writeUint32(data.uptime_seconds);
    writer.writeInt16(data.temperature);
    writer.writeUint8(data.battery_level);
    return writer.toUint8Array();
}

/**
 * Deserialize DeviceInfoResponse from binary
 */
export function deserializeDeviceInfoResponse(buffer: Uint8Array): Types.DeviceInfoResponse {
    const reader = new BinaryReader(buffer);
    return {
        status: reader.readUint8() as Types.DeviceStatus,
        device_name: reader.readFixedString(32),
        firmware_version: reader.readFixedString(16),
        uptime_seconds: reader.readUint32(),
        temperature: reader.readInt16(),
        battery_level: reader.readUint8(),
    };
}

/**
 * Serialize SendDataCommand to binary
 */
export function serializeSendDataCommand(data: Types.SendDataCommand): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint8(data.channel);
    writer.writeUint8(data.priority);
    writer.writeLengthPrefixedBytes(data.data, 'uint16');
    return writer.toUint8Array();
}

/**
 * Deserialize SendDataCommand from binary
 */
export function deserializeSendDataCommand(buffer: Uint8Array): Types.SendDataCommand {
    const reader = new BinaryReader(buffer);
    return {
        channel: reader.readUint8(),
        priority: reader.readUint8(),
        data: reader.readLengthPrefixedBytes('uint16'),
    };
}

/**
 * Serialize SendDataResponse to binary
 */
export function serializeSendDataResponse(data: Types.SendDataResponse): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeBool(data.success);
    writer.writeUint8(data.error_code);
    writer.writeUint32(data.bytes_written);
    return writer.toUint8Array();
}

/**
 * Deserialize SendDataResponse from binary
 */
export function deserializeSendDataResponse(buffer: Uint8Array): Types.SendDataResponse {
    const reader = new BinaryReader(buffer);
    return {
        success: reader.readBool(),
        error_code: reader.readUint8() as Types.ErrorCode,
        bytes_written: reader.readUint32(),
    };
}

/**
 * Serialize SetConfigCommand to binary
 */
export function serializeSetConfigCommand(data: Types.SetConfigCommand): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint8(data.config_id);
    writer.writeUint8(data.value_type);
    writer.writeLengthPrefixedBytes(data.value, 'uint8');
    return writer.toUint8Array();
}

/**
 * Deserialize SetConfigCommand from binary
 */
export function deserializeSetConfigCommand(buffer: Uint8Array): Types.SetConfigCommand {
    const reader = new BinaryReader(buffer);
    return {
        config_id: reader.readUint8(),
        value_type: reader.readUint8(),
        value: reader.readLengthPrefixedBytes('uint8'),
    };
}

/**
 * Serialize SetConfigResponse to binary
 */
export function serializeSetConfigResponse(data: Types.SetConfigResponse): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeBool(data.success);
    writer.writeUint8(data.error_code);
    return writer.toUint8Array();
}

/**
 * Deserialize SetConfigResponse from binary
 */
export function deserializeSetConfigResponse(buffer: Uint8Array): Types.SetConfigResponse {
    const reader = new BinaryReader(buffer);
    return {
        success: reader.readBool(),
        error_code: reader.readUint8() as Types.ErrorCode,
    };
}

/**
 * Serialize BatchCommand to binary
 */
export function serializeBatchCommand(data: Types.BatchCommand): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint8(data.command_count);
    writer.writeLengthPrefixedBytes(data.commands, 'uint16');
    return writer.toUint8Array();
}

/**
 * Deserialize BatchCommand from binary
 */
export function deserializeBatchCommand(buffer: Uint8Array): Types.BatchCommand {
    const reader = new BinaryReader(buffer);
    return {
        command_count: reader.readUint8(),
        commands: reader.readLengthPrefixedBytes('uint16'),
    };
}

/**
 * Serialize BatchResponse to binary
 */
export function serializeBatchResponse(data: Types.BatchResponse): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint8(data.success_count);
    writer.writeUint8(data.failure_count);
    writer.writeLengthPrefixedBytes(data.results, 'uint16');
    return writer.toUint8Array();
}

/**
 * Deserialize BatchResponse from binary
 */
export function deserializeBatchResponse(buffer: Uint8Array): Types.BatchResponse {
    const reader = new BinaryReader(buffer);
    return {
        success_count: reader.readUint8(),
        failure_count: reader.readUint8(),
        results: reader.readLengthPrefixedBytes('uint16'),
    };
}

/**
 * Serialize Vector3D to binary
 */
export function serializeVector3D(data: Types.Vector3D): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeFloat32(data.x);
    writer.writeFloat32(data.y);
    writer.writeFloat32(data.z);
    return writer.toUint8Array();
}

/**
 * Deserialize Vector3D from binary
 */
export function deserializeVector3D(buffer: Uint8Array): Types.Vector3D {
    const reader = new BinaryReader(buffer);
    return {
        x: reader.readFloat32(),
        y: reader.readFloat32(),
        z: reader.readFloat32(),
    };
}

/**
 * Serialize SensorData to binary
 */
export function serializeSensorData(data: Types.SensorData): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint64(data.timestamp);
    writer.writeUint8(data.sensor_id);
    writer.writeBytes(serializeVector3D(data.position));
    writer.writeFloat32(data.temperature);
    writer.writeFloat32(data.humidity);
    return writer.toUint8Array();
}

/**
 * Deserialize SensorData from binary
 */
export function deserializeSensorData(buffer: Uint8Array): Types.SensorData {
    const reader = new BinaryReader(buffer);
    return {
        timestamp: reader.readUint64(),
        sensor_id: reader.readUint8(),
        position: deserializeVector3D(reader.readBytes(12)),
        temperature: reader.readFloat32(),
        humidity: reader.readFloat32(),
    };
}

/**
 * Serialize SensorDataResponse to binary
 */
export function serializeSensorDataResponse(data: Types.SensorDataResponse): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUint8(data.sensor_count);
    writer.writeLengthPrefixedBytes(data.sensors, 'uint16');
    return writer.toUint8Array();
}

/**
 * Deserialize SensorDataResponse from binary
 */
export function deserializeSensorDataResponse(buffer: Uint8Array): Types.SensorDataResponse {
    const reader = new BinaryReader(buffer);
    return {
        sensor_count: reader.readUint8(),
        sensors: reader.readLengthPrefixedBytes('uint16'),
    };
}
