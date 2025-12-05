/**
 * Auto-generated binary protocol types
 * Generated from: src/schema/commands.tsp
 * Generated at: 2025-12-05T14:13:04.015Z
 */

export enum Endian {
    Little = 0,
    Big = 1,
}

export enum DeviceStatus {
    Offline = 0,
    Online = 1,
    Busy = 2,
    Error = 3,
}

export enum ErrorCode {
    None = 0,
    InvalidCommand = 1,
    InvalidParameter = 2,
    Timeout = 3,
    DeviceError = 4,
    Unknown = 255,
}

export interface ProtocolHeader {
    magic: number;
    version: number;
    command_id: number;
    payload_length: number;
    sequence_id: number;
    checksum: number;
}
// Fixed size: 14 bytes

export interface PingCommand {
    timestamp: bigint;
}
// Fixed size: 8 bytes
// Command ID: 0x01

export interface PingResponse {
    request_timestamp: bigint;
    response_timestamp: bigint;
}
// Fixed size: 16 bytes
// Command ID: 0x81

export interface GetDeviceInfoCommand {
    include_details: boolean;
}
// Fixed size: 1 bytes
// Command ID: 0x02

export interface DeviceInfoResponse {
    status: DeviceStatus;
    device_name: string;
    firmware_version: string;
    uptime_seconds: number;
    temperature: number;
    battery_level: number;
}
// Fixed size: 56 bytes
// Command ID: 0x82

export interface SendDataCommand {
    channel: number;
    priority: number;
    data: Uint8Array;
}
// Command ID: 0x03

export interface SendDataResponse {
    success: boolean;
    error_code: ErrorCode;
    bytes_written: number;
}
// Fixed size: 6 bytes
// Command ID: 0x83

export interface SetConfigCommand {
    config_id: number;
    value_type: number;
    value: Uint8Array;
}
// Command ID: 0x04

export interface SetConfigResponse {
    success: boolean;
    error_code: ErrorCode;
}
// Fixed size: 2 bytes
// Command ID: 0x84

export interface BatchCommand {
    command_count: number;
    commands: Uint8Array;
}
// Command ID: 0x10

export interface BatchResponse {
    success_count: number;
    failure_count: number;
    results: Uint8Array;
}
// Command ID: 0x90

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}
// Fixed size: 12 bytes

export interface SensorData {
    timestamp: bigint;
    sensor_id: number;
    position: Vector3D;
    temperature: number;
    humidity: number;
}
// Fixed size: 29 bytes

export interface SensorDataResponse {
    sensor_count: number;
    sensors: SensorData[];
}
// Command ID: 0x85

/**
 * Command ID to type mapping
 */
export const CommandIds = {
    PingCommand: 0x01,
    PingResponse: 0x81,
    GetDeviceInfoCommand: 0x02,
    DeviceInfoResponse: 0x82,
    SendDataCommand: 0x03,
    SendDataResponse: 0x83,
    SetConfigCommand: 0x04,
    SetConfigResponse: 0x84,
    BatchCommand: 0x10,
    BatchResponse: 0x90,
    SensorDataResponse: 0x85,
} as const;

export type CommandId = typeof CommandIds[keyof typeof CommandIds];