#!/usr/bin/env python3
"""
HuskyLens Integration for Satyug Universe
Provides computer vision capabilities to Mr. Happy
"""

import serial
import time
import struct
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger('HuskyLens')

class HuskyLensCommand(Enum):
    """HuskyLens protocol commands"""
    REQUEST = 0x20
    REQUEST_BLOCKS = 0x21
    REQUEST_ARROWS = 0x22
    REQUEST_LEARNED = 0x23
    REQUEST_BLOCKS_LEARNED = 0x24
    REQUEST_ARROWS_LEARNED = 0x25
    REQUEST_BY_ID = 0x26
    REQUEST_BLOCKS_BY_ID = 0x27
    REQUEST_ARROWS_BY_ID = 0x28
    RETURN_INFO = 0x29
    RETURN_BLOCK = 0x2A
    RETURN_ARROW = 0x2B
    REQUEST_KNOCK = 0x2C
    REQUEST_ALGORITHM = 0x2D
    RETURN_OK = 0x2E
    REQUEST_CUSTOM_NAMES = 0x2F
    REQUEST_PHOTO = 0x30
    REQUEST_SEND_KNOWLEDGES = 0x32
    REQUEST_RECEIVE_KNOWLEDGES = 0x33
    REQUEST_CUSTOM_TEXT = 0x34
    REQUEST_CLEAR_TEXT = 0x35
    REQUEST_LEARN = 0x36
    REQUEST_FORGET = 0x37
    REQUEST_SCREENSHOT = 0x39

class HuskyLensAlgorithm(Enum):
    """HuskyLens AI algorithms"""
    FACE_RECOGNITION = 0
    OBJECT_TRACKING = 1
    OBJECT_RECOGNITION = 2
    LINE_TRACKING = 3
    COLOR_RECOGNITION = 4
    TAG_RECOGNITION = 5
    OBJECT_CLASSIFICATION = 6

@dataclass
class HuskyLensBlock:
    """Represents a detected block (object)"""
    x: int
    y: int
    width: int
    height: int
    id: int
    
    @property
    def center(self) -> Tuple[int, int]:
        return (self.x + self.width // 2, self.y + self.height // 2)
    
    def to_dict(self) -> Dict:
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "id": self.id,
            "center": self.center
        }

@dataclass
class HuskyLensArrow:
    """Represents a detected arrow (direction)"""
    x_origin: int
    y_origin: int
    x_target: int
    y_target: int
    id: int
    
    @property
    def angle(self) -> float:
        import math
        dx = self.x_target - self.x_origin
        dy = self.y_target - self.y_origin
        return math.atan2(dy, dx) * 180 / math.pi
    
    def to_dict(self) -> Dict:
        return {
            "origin": (self.x_origin, self.y_origin),
            "target": (self.x_target, self.y_target),
            "id": self.id,
            "angle": self.angle
        }

class HuskyLens:
    """
    HuskyLens AI Camera Interface
    
    Provides computer vision capabilities:
    - Face recognition
    - Object tracking
    - Object recognition
    - Line tracking
    - Color recognition
    - Tag recognition
    - Object classification
    """
    
    HEADER = 0x55
    ADDRESS = 0x11
    
    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 9600):
        """
        Initialize HuskyLens connection
        
        Args:
            port: Serial port (e.g., /dev/ttyUSB0 for Raspberry Pi)
            baudrate: Communication speed (default: 9600)
        """
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.current_algorithm = None
        
        logger.info(f"👁️ Initializing HuskyLens on {port}")
    
    def connect(self) -> bool:
        """Establish connection with HuskyLens"""
        try:
            self.serial = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=1
            )
            time.sleep(0.1)
            
            # Send knock command to verify connection
            if self.knock():
                logger.info("✅ HuskyLens connected successfully")
                return True
            else:
                logger.error("❌ HuskyLens connection failed")
                return False
        except Exception as e:
            logger.error(f"❌ HuskyLens connection error: {e}")
            return False
    
    def disconnect(self):
        """Close connection"""
        if self.serial and self.serial.is_open:
            self.serial.close()
            logger.info("👋 HuskyLens disconnected")
    
    def _calculate_checksum(self, data: bytes) -> int:
        """Calculate checksum for protocol"""
        return sum(data) & 0xFF
    
    def _send_command(self, command: HuskyLensCommand, data: bytes = b'') -> bool:
        """Send command to HuskyLens"""
        if not self.serial or not self.serial.is_open:
            logger.error("❌ Serial port not open")
            return False
        
        length = len(data)
        packet = struct.pack('BBB', self.HEADER, self.ADDRESS, length)
        packet += struct.pack('B', command.value)
        packet += data
        checksum = self._calculate_checksum(packet[1:])
        packet += struct.pack('B', checksum)
        
        self.serial.write(packet)
        return True
    
    def _read_response(self, timeout: float = 1.0) -> Optional[bytes]:
        """Read response from HuskyLens"""
        if not self.serial or not self.serial.is_open:
            return None
        
        start_time = time.time()
        buffer = b''
        
        while time.time() - start_time < timeout:
            if self.serial.in_waiting > 0:
                buffer += self.serial.read(self.serial.in_waiting)
                
                # Check if we have a complete packet
                if len(buffer) >= 5:  # Minimum packet size
                    if buffer[0] == self.HEADER:
                        length = buffer[2]
                        expected_size = 5 + length
                        
                        if len(buffer) >= expected_size:
                            return buffer[:expected_size]
            
            time.sleep(0.01)
        
        return None
    
    def knock(self) -> bool:
        """Verify connection with HuskyLens"""
        self._send_command(HuskyLensCommand.REQUEST_KNOCK)
        response = self._read_response()
        
        if response and len(response) >= 5:
            command = response[3]
            return command == HuskyLensCommand.RETURN_OK.value
        
        return False
    
    def set_algorithm(self, algorithm: HuskyLensAlgorithm) -> bool:
        """
        Set active AI algorithm
        
        Args:
            algorithm: Algorithm to activate
        """
        data = struct.pack('B', algorithm.value)
        self._send_command(HuskyLensCommand.REQUEST_ALGORITHM, data)
        response = self._read_response()
        
        if response and len(response) >= 5:
            command = response[3]
            if command == HuskyLensCommand.RETURN_OK.value:
                self.current_algorithm = algorithm
                logger.info(f"✅ Algorithm set to: {algorithm.name}")
                return True
        
        logger.error(f"❌ Failed to set algorithm: {algorithm.name}")
        return False
    
    def request_blocks(self) -> List[HuskyLensBlock]:
        """
        Request detected blocks (objects)
        
        Returns:
            List of detected blocks
        """
        self._send_command(HuskyLensCommand.REQUEST_BLOCKS)
        response = self._read_response()
        
        blocks = []
        
        if response and len(response) >= 5:
            # Parse blocks from response
            # Format: [x_center, y_center, width, height, id]
            data = response[4:-1]  # Exclude header and checksum
            
            i = 0
            while i + 9 <= len(data):
                x = struct.unpack('<H', data[i:i+2])[0]
                y = struct.unpack('<H', data[i+2:i+4])[0]
                width = struct.unpack('<H', data[i+4:i+6])[0]
                height = struct.unpack('<H', data[i+6:i+8])[0]
                id_val = struct.unpack('<H', data[i+8:i+10])[0]
                
                block = HuskyLensBlock(x, y, width, height, id_val)
                blocks.append(block)
                
                i += 10
        
        logger.info(f"👁️ Detected {len(blocks)} blocks")
        return blocks
    
    def request_arrows(self) -> List[HuskyLensArrow]:
        """
        Request detected arrows (directions)
        
        Returns:
            List of detected arrows
        """
        self._send_command(HuskyLensCommand.REQUEST_ARROWS)
        response = self._read_response()
        
        arrows = []
        
        if response and len(response) >= 5:
            data = response[4:-1]
            
            i = 0
            while i + 9 <= len(data):
                x_origin = struct.unpack('<H', data[i:i+2])[0]
                y_origin = struct.unpack('<H', data[i+2:i+4])[0]
                x_target = struct.unpack('<H', data[i+4:i+6])[0]
                y_target = struct.unpack('<H', data[i+6:i+8])[0]
                id_val = struct.unpack('<H', data[i+8:i+10])[0]
                
                arrow = HuskyLensArrow(x_origin, y_origin, x_target, y_target, id_val)
                arrows.append(arrow)
                
                i += 10
        
        logger.info(f"👁️ Detected {len(arrows)} arrows")
        return arrows
    
    def learn(self, id: int = 1) -> bool:
        """
        Learn current object/face
        
        Args:
            id: ID to assign to learned object
        """
        data = struct.pack('<H', id)
        self._send_command(HuskyLensCommand.REQUEST_LEARN, data)
        response = self._read_response()
        
        if response and len(response) >= 5:
            command = response[3]
            if command == HuskyLensCommand.RETURN_OK.value:
                logger.info(f"✅ Learned object with ID: {id}")
                return True
        
        logger.error(f"❌ Failed to learn object")
        return False
    
    def forget(self) -> bool:
        """Forget all learned objects"""
        self._send_command(HuskyLensCommand.REQUEST_FORGET)
        response = self._read_response()
        
        if response and len(response) >= 5:
            command = response[3]
            if command == HuskyLensCommand.RETURN_OK.value:
                logger.info("✅ Forgot all learned objects")
                return True
        
        logger.error("❌ Failed to forget objects")
        return False
    
    def get_learned_blocks(self) -> List[HuskyLensBlock]:
        """Get only learned/recognized blocks"""
        self._send_command(HuskyLensCommand.REQUEST_BLOCKS_LEARNED)
        response = self._read_response()
        
        # Similar parsing to request_blocks
        # Implementation omitted for brevity
        return []
    
    def recognize_face(self) -> Optional[Dict]:
        """
        Recognize faces in view
        
        Returns:
            Dictionary with face information
        """
        if self.current_algorithm != HuskyLensAlgorithm.FACE_RECOGNITION:
            self.set_algorithm(HuskyLensAlgorithm.FACE_RECOGNITION)
        
        blocks = self.request_blocks()
        
        if blocks:
            faces = []
            for block in blocks:
                faces.append({
                    "id": block.id,
                    "position": block.center,
                    "size": (block.width, block.height),
                    "confidence": 0.95  # HuskyLens doesn't provide confidence
                })
            
            return {
                "detected": True,
                "count": len(faces),
                "faces": faces
            }
        
        return {"detected": False, "count": 0, "faces": []}
    
    def track_object(self, object_id: Optional[int] = None) -> Optional[Dict]:
        """
        Track objects in view
        
        Args:
            object_id: Specific object ID to track (None for all)
        """
        if self.current_algorithm != HuskyLensAlgorithm.OBJECT_TRACKING:
            self.set_algorithm(HuskyLensAlgorithm.OBJECT_TRACKING)
        
        blocks = self.request_blocks()
        
        if object_id is not None:
            blocks = [b for b in blocks if b.id == object_id]
        
        if blocks:
            return {
                "tracking": True,
                "objects": [b.to_dict() for b in blocks]
            }
        
        return {"tracking": False, "objects": []}
    
    def recognize_color(self) -> Optional[Dict]:
        """Recognize colors in view"""
        if self.current_algorithm != HuskyLensAlgorithm.COLOR_RECOGNITION:
            self.set_algorithm(HuskyLensAlgorithm.COLOR_RECOGNITION)
        
        blocks = self.request_blocks()
        
        color_map = {
            1: "red",
            2: "green",
            3: "blue",
            4: "yellow",
            5: "purple"
        }
        
        if blocks:
            colors = []
            for block in blocks:
                colors.append({
                    "color": color_map.get(block.id, "unknown"),
                    "position": block.center,
                    "area": block.width * block.height
                })
            
            return {
                "detected": True,
                "colors": colors
            }
        
        return {"detected": False, "colors": []}

# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Initialize HuskyLens
    huskylens = HuskyLens(port="/dev/ttyUSB0")
    
    if huskylens.connect():
        # Face recognition example
        huskylens.set_algorithm(HuskyLensAlgorithm.FACE_RECOGNITION)
        time.sleep(1)
        
        faces = huskylens.recognize_face()
        print(f"Faces detected: {faces}")
        
        # Object tracking example
        huskylens.set_algorithm(HuskyLensAlgorithm.OBJECT_TRACKING)
        time.sleep(1)
        
        objects = huskylens.track_object()
        print(f"Objects tracked: {objects}")
        
        huskylens.disconnect()
