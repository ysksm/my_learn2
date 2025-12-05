//! Auto-generated binary protocol types
//! Generated from: src/schema/commands.tsp
//! Generated at: 2025-12-05T14:13:04.015Z

#![allow(dead_code)]
#![allow(unused_imports)]

use std::io::{self, Read, Write, Cursor};
use byteorder::{LittleEndian, ReadBytesExt, WriteBytesExt};

/// Serialization/Deserialization error
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

pub type Result<T> = std::result::Result<T, ProtocolError>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Endian {
    Little = 0,
    Big = 1,
}

impl TryFrom<u8> for Endian {
    type Error = ProtocolError;

    fn try_from(value: u8) -> Result<Self> {
        match value {
            0 => Ok(Endian::Little),
            1 => Ok(Endian::Big),
            _ => Err(ProtocolError::InvalidEnumValue(value)),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum DeviceStatus {
    Offline = 0,
    Online = 1,
    Busy = 2,
    Error = 3,
}

impl TryFrom<u8> for DeviceStatus {
    type Error = ProtocolError;

    fn try_from(value: u8) -> Result<Self> {
        match value {
            0 => Ok(DeviceStatus::Offline),
            1 => Ok(DeviceStatus::Online),
            2 => Ok(DeviceStatus::Busy),
            3 => Ok(DeviceStatus::Error),
            _ => Err(ProtocolError::InvalidEnumValue(value)),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum ErrorCode {
    None = 0,
    InvalidCommand = 1,
    InvalidParameter = 2,
    Timeout = 3,
    DeviceError = 4,
    Unknown = 255,
}

impl TryFrom<u8> for ErrorCode {
    type Error = ProtocolError;

    fn try_from(value: u8) -> Result<Self> {
        match value {
            0 => Ok(ErrorCode::None),
            1 => Ok(ErrorCode::InvalidCommand),
            2 => Ok(ErrorCode::InvalidParameter),
            3 => Ok(ErrorCode::Timeout),
            4 => Ok(ErrorCode::DeviceError),
            255 => Ok(ErrorCode::Unknown),
            _ => Err(ProtocolError::InvalidEnumValue(value)),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ProtocolHeader {
    pub magic: u16,
    pub version: u8,
    pub command_id: u8,
    pub payload_length: u32,
    pub sequence_id: u32,
    pub checksum: u16,
}

/// Command ID: 0x01
#[derive(Debug, Clone)]
pub struct PingCommand {
    pub timestamp: u64,
}

impl PingCommand {
    pub const COMMAND_ID: u8 = 0x01;
}

/// Command ID: 0x81
#[derive(Debug, Clone)]
pub struct PingResponse {
    pub request_timestamp: u64,
    pub response_timestamp: u64,
}

impl PingResponse {
    pub const COMMAND_ID: u8 = 0x81;
}

/// Command ID: 0x02
#[derive(Debug, Clone)]
pub struct GetDeviceInfoCommand {
    pub include_details: bool,
}

impl GetDeviceInfoCommand {
    pub const COMMAND_ID: u8 = 0x02;
}

/// Command ID: 0x82
#[derive(Debug, Clone)]
pub struct DeviceInfoResponse {
    pub status: DeviceStatus,
    pub device_name: [u8; 32],
    pub firmware_version: [u8; 16],
    pub uptime_seconds: u32,
    pub temperature: i16,
    pub battery_level: u8,
}

impl DeviceInfoResponse {
    pub const COMMAND_ID: u8 = 0x82;
}

/// Command ID: 0x03
#[derive(Debug, Clone)]
pub struct SendDataCommand {
    pub channel: u8,
    pub priority: u8,
    pub data: Vec<u8>,
}

impl SendDataCommand {
    pub const COMMAND_ID: u8 = 0x03;
}

/// Command ID: 0x83
#[derive(Debug, Clone)]
pub struct SendDataResponse {
    pub success: bool,
    pub error_code: ErrorCode,
    pub bytes_written: u32,
}

impl SendDataResponse {
    pub const COMMAND_ID: u8 = 0x83;
}

/// Command ID: 0x04
#[derive(Debug, Clone)]
pub struct SetConfigCommand {
    pub config_id: u8,
    pub value_type: u8,
    pub value: Vec<u8>,
}

impl SetConfigCommand {
    pub const COMMAND_ID: u8 = 0x04;
}

/// Command ID: 0x84
#[derive(Debug, Clone)]
pub struct SetConfigResponse {
    pub success: bool,
    pub error_code: ErrorCode,
}

impl SetConfigResponse {
    pub const COMMAND_ID: u8 = 0x84;
}

/// Command ID: 0x10
#[derive(Debug, Clone)]
pub struct BatchCommand {
    pub command_count: u8,
    pub commands: Vec<u8>,
}

impl BatchCommand {
    pub const COMMAND_ID: u8 = 0x10;
}

/// Command ID: 0x90
#[derive(Debug, Clone)]
pub struct BatchResponse {
    pub success_count: u8,
    pub failure_count: u8,
    pub results: Vec<u8>,
}

impl BatchResponse {
    pub const COMMAND_ID: u8 = 0x90;
}

#[derive(Debug, Clone)]
pub struct Vector3D {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[derive(Debug, Clone)]
pub struct SensorData {
    pub timestamp: u64,
    pub sensor_id: u8,
    pub position: Vector3D,
    pub temperature: f32,
    pub humidity: f32,
}

/// Command ID: 0x85
#[derive(Debug, Clone)]
pub struct SensorDataResponse {
    pub sensor_count: u8,
    pub sensors: Vec<SensorData>,
}

impl SensorDataResponse {
    pub const COMMAND_ID: u8 = 0x85;
}

/// Trait for binary serialization
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
}

impl BinarySerialize for ProtocolHeader {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u16::<LittleEndian>(self.magic)?;
        buf.write_u8(self.version)?;
        buf.write_u8(self.command_id)?;
        buf.write_u32::<LittleEndian>(self.payload_length)?;
        buf.write_u32::<LittleEndian>(self.sequence_id)?;
        buf.write_u16::<LittleEndian>(self.checksum)?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            magic: cursor.read_u16::<LittleEndian>()?,
            version: cursor.read_u8()?,
            command_id: cursor.read_u8()?,
            payload_length: cursor.read_u32::<LittleEndian>()?,
            sequence_id: cursor.read_u32::<LittleEndian>()?,
            checksum: cursor.read_u16::<LittleEndian>()?,
        })
    }
}

impl BinarySerialize for PingCommand {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u64::<LittleEndian>(self.timestamp)?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            timestamp: cursor.read_u64::<LittleEndian>()?,
        })
    }
}

impl BinarySerialize for PingResponse {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u64::<LittleEndian>(self.request_timestamp)?;
        buf.write_u64::<LittleEndian>(self.response_timestamp)?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            request_timestamp: cursor.read_u64::<LittleEndian>()?,
            response_timestamp: cursor.read_u64::<LittleEndian>()?,
        })
    }
}

impl BinarySerialize for GetDeviceInfoCommand {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(if self.include_details { 1 } else { 0 })?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            include_details: cursor.read_u8()? != 0,
        })
    }
}

impl BinarySerialize for DeviceInfoResponse {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(self.status as u8)?;
        buf.extend_from_slice(&self.device_name);
        buf.extend_from_slice(&self.firmware_version);
        buf.write_u32::<LittleEndian>(self.uptime_seconds)?;
        buf.write_i16::<LittleEndian>(self.temperature)?;
        buf.write_u8(self.battery_level)?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            status: DeviceStatus::try_from(cursor.read_u8()?)?,
            device_name: read_fixed_bytes::<_, 32>(&mut cursor)?,
            firmware_version: read_fixed_bytes::<_, 16>(&mut cursor)?,
            uptime_seconds: cursor.read_u32::<LittleEndian>()?,
            temperature: cursor.read_i16::<LittleEndian>()?,
            battery_level: cursor.read_u8()?,
        })
    }
}

impl BinarySerialize for SendDataCommand {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(self.channel)?;
        buf.write_u8(self.priority)?;
        buf.write_u16::<LittleEndian>(self.data.len() as u16)?;
        buf.extend_from_slice(&self.data);
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            channel: cursor.read_u8()?,
            priority: cursor.read_u8()?,
            data: {
                let len = cursor.read_u16::<LittleEndian>()? as usize;
                let mut data = vec![0u8; len];
                cursor.read_exact(&mut data)?;
                data
            },
        })
    }
}

impl BinarySerialize for SendDataResponse {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(if self.success { 1 } else { 0 })?;
        buf.write_u8(self.error_code as u8)?;
        buf.write_u32::<LittleEndian>(self.bytes_written)?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            success: cursor.read_u8()? != 0,
            error_code: ErrorCode::try_from(cursor.read_u8()?)?,
            bytes_written: cursor.read_u32::<LittleEndian>()?,
        })
    }
}

impl BinarySerialize for SetConfigCommand {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(self.config_id)?;
        buf.write_u8(self.value_type)?;
        buf.write_u8(self.value.len() as u8)?;
        buf.extend_from_slice(&self.value);
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            config_id: cursor.read_u8()?,
            value_type: cursor.read_u8()?,
            value: {
                let len = cursor.read_u8()? as usize;
                let mut data = vec![0u8; len];
                cursor.read_exact(&mut data)?;
                data
            },
        })
    }
}

impl BinarySerialize for SetConfigResponse {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(if self.success { 1 } else { 0 })?;
        buf.write_u8(self.error_code as u8)?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            success: cursor.read_u8()? != 0,
            error_code: ErrorCode::try_from(cursor.read_u8()?)?,
        })
    }
}

impl BinarySerialize for BatchCommand {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(self.command_count)?;
        buf.write_u16::<LittleEndian>(self.commands.len() as u16)?;
        buf.extend_from_slice(&self.commands);
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            command_count: cursor.read_u8()?,
            commands: {
                let len = cursor.read_u16::<LittleEndian>()? as usize;
                let mut data = vec![0u8; len];
                cursor.read_exact(&mut data)?;
                data
            },
        })
    }
}

impl BinarySerialize for BatchResponse {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(self.success_count)?;
        buf.write_u8(self.failure_count)?;
        buf.write_u16::<LittleEndian>(self.results.len() as u16)?;
        buf.extend_from_slice(&self.results);
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            success_count: cursor.read_u8()?,
            failure_count: cursor.read_u8()?,
            results: {
                let len = cursor.read_u16::<LittleEndian>()? as usize;
                let mut data = vec![0u8; len];
                cursor.read_exact(&mut data)?;
                data
            },
        })
    }
}

impl BinarySerialize for Vector3D {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_f32::<LittleEndian>(self.x)?;
        buf.write_f32::<LittleEndian>(self.y)?;
        buf.write_f32::<LittleEndian>(self.z)?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            x: cursor.read_f32::<LittleEndian>()?,
            y: cursor.read_f32::<LittleEndian>()?,
            z: cursor.read_f32::<LittleEndian>()?,
        })
    }
}

impl BinarySerialize for SensorData {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u64::<LittleEndian>(self.timestamp)?;
        buf.write_u8(self.sensor_id)?;
        buf.extend_from_slice(&self.position.serialize()?);
        buf.write_f32::<LittleEndian>(self.temperature)?;
        buf.write_f32::<LittleEndian>(self.humidity)?;
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            timestamp: cursor.read_u64::<LittleEndian>()?,
            sensor_id: cursor.read_u8()?,
            position: {
                let mut data = vec![0u8; 12];
                cursor.read_exact(&mut data)?;
                Vector3D::deserialize(&data)?
            },
            temperature: cursor.read_f32::<LittleEndian>()?,
            humidity: cursor.read_f32::<LittleEndian>()?,
        })
    }
}

impl BinarySerialize for SensorDataResponse {
    fn serialize(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();
        buf.write_u8(self.sensor_count)?;
        buf.write_u16::<LittleEndian>(self.sensors.len() as u16)?;
        buf.extend_from_slice(&self.sensors);
        Ok(buf)
    }

    fn deserialize(data: &[u8]) -> Result<Self> {
        let mut cursor = Cursor::new(data);
        Ok(Self {
            sensor_count: cursor.read_u8()?,
            sensors: {
                let len = cursor.read_u16::<LittleEndian>()? as usize;
                let mut data = vec![0u8; len];
                cursor.read_exact(&mut data)?;
                data
            },
        })
    }
}

/// Command ID constants
pub mod command_ids {
    pub const PING_COMMAND: u8 = 0x01;
    pub const PING_RESPONSE: u8 = 0x81;
    pub const GET_DEVICE_INFO_COMMAND: u8 = 0x02;
    pub const DEVICE_INFO_RESPONSE: u8 = 0x82;
    pub const SEND_DATA_COMMAND: u8 = 0x03;
    pub const SEND_DATA_RESPONSE: u8 = 0x83;
    pub const SET_CONFIG_COMMAND: u8 = 0x04;
    pub const SET_CONFIG_RESPONSE: u8 = 0x84;
    pub const BATCH_COMMAND: u8 = 0x10;
    pub const BATCH_RESPONSE: u8 = 0x90;
    pub const SENSOR_DATA_RESPONSE: u8 = 0x85;
}