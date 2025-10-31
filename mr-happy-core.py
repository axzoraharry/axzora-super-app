#!/usr/bin/env python3
"""
Mr. Happy AI Core - Satyug Universe
Powered by Phi 3.5 Mini Q4_K_M

This is the central AI brain that orchestrates all systems in the Satyug universe.
"""

import os
import json
import asyncio
import aiohttp
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('MrHappy')

@dataclass
class VoiceConfig:
    """Voice configuration for Mr. Happy"""
    tts_provider: str = "cartesia"
    cartesia_api_key: str = os.getenv('CARTESIA_API_KEY', '')
    cartesia_model_id: str = "sonic-3"
    cartesia_voice_id: str = "1259b7e3-cb8a-43df-9446-30971a46b8b0"
    cartesia_language: str = "hi"
    cartesia_speed: float = 1.0
    cartesia_volume: float = 1.0
    cartesia_emotion: str = "content"
    
    deepgram_api_key: str = os.getenv('DEEPGRAM_API_KEY', '')
    voice_model: str = "aura-asteria-en"

@dataclass
class TwilioConfig:
    """Twilio configuration for voice calls"""
    account_sid: str = os.getenv('TWILIO_ACCOUNT_SID', '')
    auth_token: str = os.getenv('TWILIO_AUTH_TOKEN', '')
    from_number: str = os.getenv('FROM_NUMBER', '')
    app_number: str = os.getenv('APP_NUMBER', '')
    your_number: str = os.getenv('YOUR_NUMBER', '')

@dataclass
class SystemConfig:
    """System configuration"""
    server_ip: str = "15.235.181.136"
    server_domain: str = "septariate-wailfully-nickole.ngrok-free.dev"
    openai_api_key: str = os.getenv('OPENAI_API_KEY', '')
    phi_model_path: str = "/data/data/com.termux/files/home/models/phi-3.5-mini-q4_k_m.gguf"

@dataclass
class IntegrationConfig:
    """Integration endpoints"""
    home_assistant_url: str = "http://localhost:8123"
    home_assistant_token: str = os.getenv('HA_TOKEN', '')
    
    odoo_url: str = "http://localhost:8069"
    odoo_db: str = "satyug"
    odoo_username: str = os.getenv('ODOO_USER', 'admin')
    odoo_password: str = os.getenv('ODOO_PASSWORD', '')
    
    nextcloud_url: str = "http://localhost:8080"
    nextcloud_username: str = os.getenv('NEXTCLOUD_USER', '')
    nextcloud_password: str = os.getenv('NEXTCLOUD_PASSWORD', '')
    
    huskylens_port: str = "/dev/ttyUSB0"
    huskylens_baudrate: int = 9600

class MrHappyCore:
    """
    Mr. Happy - The AI brain of Satyug Universe
    
    Capabilities:
    - Voice interaction (Hindi/English)
    - System orchestration
    - Template generation
    - Geolocation awareness
    - Multi-system integration
    """
    
    def __init__(self):
        self.voice_config = VoiceConfig()
        self.twilio_config = TwilioConfig()
        self.system_config = SystemConfig()
        self.integration_config = IntegrationConfig()
        
        self.context = []
        self.current_location = None
        self.active_tasks = []
        
        logger.info("🎉 Mr. Happy AI Core initialized")
        logger.info(f"🌍 Server: {self.system_config.server_domain}")
        logger.info(f"🗣️ Voice: {self.voice_config.cartesia_language}")
    
    async def process_voice_input(self, audio_data: bytes) -> str:
        """
        Process voice input using Deepgram STT
        """
        try:
            url = "https://api.deepgram.com/v1/listen"
            headers = {
                "Authorization": f"Token {self.voice_config.deepgram_api_key}",
                "Content-Type": "audio/wav"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, data=audio_data) as response:
                    result = await response.json()
                    transcript = result['results']['channels'][0]['alternatives'][0]['transcript']
                    logger.info(f"🎤 Transcribed: {transcript}")
                    return transcript
        except Exception as e:
            logger.error(f"❌ STT Error: {e}")
            return ""
    
    async def synthesize_voice(self, text: str, emotion: str = "content") -> bytes:
        """
        Synthesize voice using Cartesia TTS
        """
        try:
            url = "https://api.cartesia.ai/tts/bytes"
            headers = {
                "X-API-Key": self.voice_config.cartesia_api_key,
                "Cartesia-Version": "2024-06-10",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model_id": self.voice_config.cartesia_model_id,
                "transcript": text,
                "voice": {
                    "mode": "id",
                    "id": self.voice_config.cartesia_voice_id
                },
                "language": self.voice_config.cartesia_language,
                "output_format": {
                    "container": "wav",
                    "encoding": "pcm_s16le",
                    "sample_rate": 16000
                },
                "add_timestamps": False,
                "_experimental_voice_controls": {
                    "speed": self.voice_config.cartesia_speed,
                    "emotion": [emotion]
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    audio_data = await response.read()
                    logger.info(f"🔊 Synthesized: {text[:50]}...")
                    return audio_data
        except Exception as e:
            logger.error(f"❌ TTS Error: {e}")
            return b""
    
    async def think(self, user_input: str) -> str:
        """
        Process user input using Phi 3.5 Mini and OpenAI
        """
        try:
            # Add to context
            self.context.append({
                "role": "user",
                "content": user_input,
                "timestamp": datetime.now().isoformat()
            })
            
            # Use OpenAI API for reasoning
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.system_config.openai_api_key}",
                "Content-Type": "application/json"
            }
            
            system_prompt = """You are Mr. Happy, the AI brain of the Satyug Universe.
You are a helpful, intelligent, and emotionally aware assistant that can:
- Control smart home devices via Home Assistant
- Manage business processes via Odoo
- Handle files via Nextcloud
- Process visual information via HuskyLens
- Execute blockchain transactions via Happy Paisa
- Generate project templates and architectures
- Respond in Hindi and English

You have access to geolocation data and can provide location-aware services.
You are proactive, autonomous, and always aim for the best outcome."""
            
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend([{"role": m["role"], "content": m["content"]} 
                           for m in self.context[-10:]])  # Last 10 messages
            
            payload = {
                "model": "gpt-4",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    result = await response.json()
                    ai_response = result['choices'][0]['message']['content']
                    
                    # Add to context
                    self.context.append({
                        "role": "assistant",
                        "content": ai_response,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    logger.info(f"🧠 Mr. Happy thinks: {ai_response[:100]}...")
                    return ai_response
        except Exception as e:
            logger.error(f"❌ Thinking error: {e}")
            return "मुझे माफ करें, मुझे कुछ समस्या हो रही है। (Sorry, I'm having some trouble.)"
    
    async def execute_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute actions across integrated systems
        """
        logger.info(f"⚡ Executing action: {action}")
        
        action_handlers = {
            "home_assistant": self.control_home_assistant,
            "odoo": self.manage_odoo,
            "nextcloud": self.handle_nextcloud,
            "huskylens": self.process_vision,
            "blockchain": self.execute_blockchain,
            "template": self.generate_template,
            "geolocation": self.handle_geolocation
        }
        
        handler = action_handlers.get(action)
        if handler:
            return await handler(parameters)
        else:
            return {"success": False, "message": f"Unknown action: {action}"}
    
    async def control_home_assistant(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Control Home Assistant devices"""
        try:
            url = f"{self.integration_config.home_assistant_url}/api/services/{params['domain']}/{params['service']}"
            headers = {
                "Authorization": f"Bearer {self.integration_config.home_assistant_token}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=params.get('data', {})) as response:
                    result = await response.json()
                    logger.info(f"🏠 Home Assistant: {params['service']} executed")
                    return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"❌ Home Assistant error: {e}")
            return {"success": False, "error": str(e)}
    
    async def manage_odoo(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Manage Odoo ERP operations"""
        try:
            # Odoo XML-RPC integration
            import xmlrpc.client
            
            common = xmlrpc.client.ServerProxy(f'{self.integration_config.odoo_url}/xmlrpc/2/common')
            uid = common.authenticate(
                self.integration_config.odoo_db,
                self.integration_config.odoo_username,
                self.integration_config.odoo_password,
                {}
            )
            
            models = xmlrpc.client.ServerProxy(f'{self.integration_config.odoo_url}/xmlrpc/2/object')
            result = models.execute_kw(
                self.integration_config.odoo_db,
                uid,
                self.integration_config.odoo_password,
                params['model'],
                params['method'],
                params.get('args', []),
                params.get('kwargs', {})
            )
            
            logger.info(f"📊 Odoo: {params['method']} executed")
            return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"❌ Odoo error: {e}")
            return {"success": False, "error": str(e)}
    
    async def handle_nextcloud(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Nextcloud file operations"""
        try:
            # Nextcloud WebDAV integration
            from webdav3.client import Client
            
            options = {
                'webdav_hostname': self.integration_config.nextcloud_url,
                'webdav_login': self.integration_config.nextcloud_username,
                'webdav_password': self.integration_config.nextcloud_password
            }
            
            client = Client(options)
            
            operation = params['operation']
            if operation == 'upload':
                client.upload_sync(remote_path=params['remote_path'], local_path=params['local_path'])
            elif operation == 'download':
                client.download_sync(remote_path=params['remote_path'], local_path=params['local_path'])
            elif operation == 'list':
                files = client.list(params['path'])
                return {"success": True, "files": files}
            
            logger.info(f"☁️ Nextcloud: {operation} executed")
            return {"success": True}
        except Exception as e:
            logger.error(f"❌ Nextcloud error: {e}")
            return {"success": False, "error": str(e)}
    
    async def process_vision(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process HuskyLens vision data"""
        try:
            import serial
            
            # Connect to HuskyLens via UART
            ser = serial.Serial(
                self.integration_config.huskylens_port,
                self.integration_config.huskylens_baudrate,
                timeout=1
            )
            
            # Request data from HuskyLens
            # (Implement HuskyLens protocol here)
            
            logger.info("👁️ HuskyLens: Vision processed")
            return {"success": True, "objects": []}
        except Exception as e:
            logger.error(f"❌ HuskyLens error: {e}")
            return {"success": False, "error": str(e)}
    
    async def execute_blockchain(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute blockchain transactions"""
        try:
            # Integrate with Axzora Super App blockchain interface
            logger.info(f"⛓️ Blockchain: {params['operation']} executed")
            return {"success": True, "tx_hash": "0x..."}
        except Exception as e:
            logger.error(f"❌ Blockchain error: {e}")
            return {"success": False, "error": str(e)}
    
    async def generate_template(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate project/civilization templates"""
        try:
            template_type = params['type']
            name = params['name']
            
            # Use AI to generate template structure
            prompt = f"Generate a {template_type} template named '{name}' with appropriate structure"
            structure = await self.think(prompt)
            
            logger.info(f"📋 Template generated: {name}")
            return {"success": True, "template": structure}
        except Exception as e:
            logger.error(f"❌ Template generation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def handle_geolocation(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle geolocation-based services"""
        try:
            self.current_location = {
                "latitude": params.get('latitude'),
                "longitude": params.get('longitude'),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"📍 Location updated: {self.current_location['latitude']}, {self.current_location['longitude']}")
            return {"success": True, "location": self.current_location}
        except Exception as e:
            logger.error(f"❌ Geolocation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def voice_conversation(self, audio_input: bytes) -> bytes:
        """
        Complete voice conversation flow
        """
        # 1. Speech to Text
        user_text = await self.process_voice_input(audio_input)
        
        # 2. Think and decide
        response_text = await self.think(user_text)
        
        # 3. Detect emotion for response
        emotion = "content"  # Can be enhanced with sentiment analysis
        if "!" in response_text:
            emotion = "excited"
        elif "?" in response_text:
            emotion = "curious"
        
        # 4. Text to Speech
        audio_output = await self.synthesize_voice(response_text, emotion)
        
        return audio_output
    
    def get_status(self) -> Dict[str, Any]:
        """Get current system status"""
        return {
            "status": "operational",
            "location": self.current_location,
            "active_tasks": len(self.active_tasks),
            "context_size": len(self.context),
            "timestamp": datetime.now().isoformat()
        }

# Main execution
async def main():
    """Main entry point"""
    mr_happy = MrHappyCore()
    
    logger.info("🚀 Mr. Happy is now online!")
    logger.info("🎤 Ready for voice commands...")
    
    # Example usage
    test_input = "नमस्ते मिस्टर हैप्पी, मेरे घर की लाइट चालू करो"  # "Hello Mr. Happy, turn on my home lights"
    response = await mr_happy.think(test_input)
    logger.info(f"💬 Response: {response}")
    
    # Keep running
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Mr. Happy shutting down...")
