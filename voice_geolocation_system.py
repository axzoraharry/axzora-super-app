#!/usr/bin/env python3
"""
Voice and Geolocation Transfer System for Satyug Universe
Enables voice control and location-aware services
"""

import os
import asyncio
import json
from typing import Dict, Optional, Tuple, List
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

# Twilio
from twilio.rest import Client as TwilioClient
from twilio.twiml.voice_response import VoiceResponse, Gather

# Geolocation
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import geocoder

# FastAPI for webhooks
from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse
import uvicorn

logger = logging.getLogger('VoiceGeoSystem')

@dataclass
class GeolocationData:
    """Geolocation information"""
    latitude: float
    longitude: float
    accuracy: float
    altitude: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None
    timestamp: str = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()
    
    @property
    def coordinates(self) -> Tuple[float, float]:
        return (self.latitude, self.longitude)
    
    def distance_to(self, other: 'GeolocationData') -> float:
        """Calculate distance to another location in kilometers"""
        return geodesic(self.coordinates, other.coordinates).kilometers
    
    def to_dict(self) -> Dict:
        return asdict(self)

@dataclass
class VoiceCall:
    """Voice call information"""
    call_sid: str
    from_number: str
    to_number: str
    status: str
    duration: Optional[int] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()

class VoiceGeolocationSystem:
    """
    Voice and Geolocation Transfer System
    
    Features:
    - Voice calls via Twilio
    - Speech-to-text transcription
    - Text-to-speech synthesis
    - Geolocation tracking
    - Location-aware automation
    - Geofencing
    - Voice-activated location services
    """
    
    def __init__(self):
        # Twilio configuration
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('FROM_NUMBER')
        self.app_number = os.getenv('APP_NUMBER')
        self.your_number = os.getenv('YOUR_NUMBER')
        
        # Initialize Twilio client
        self.twilio_client = TwilioClient(
            self.twilio_account_sid,
            self.twilio_auth_token
        )
        
        # Geolocation
        self.geolocator = Nominatim(user_agent="satyug_universe")
        self.current_location = None
        self.location_history = []
        self.geofences = []
        
        # FastAPI app for webhooks
        self.app = FastAPI(title="Voice & Geolocation System")
        self.setup_routes()
        
        logger.info("🎤📍 Voice & Geolocation System initialized")
    
    def setup_routes(self):
        """Setup FastAPI webhook routes"""
        
        @self.app.post("/voice/incoming")
        async def handle_incoming_call(request: Request):
            """Handle incoming voice calls"""
            form_data = await request.form()
            logger.info(f"📞 Incoming call from: {form_data.get('From')}")
            
            response = VoiceResponse()
            gather = Gather(
                input='speech',
                action='/voice/process',
                language='hi-IN',  # Hindi
                timeout=5,
                speech_timeout='auto'
            )
            gather.say(
                "नमस्ते, मैं मिस्टर हैप्पी हूं। आप क्या करना चाहते हैं?",
                language='hi-IN',
                voice='woman'
            )
            response.append(gather)
            
            return PlainTextResponse(str(response), media_type='text/xml')
        
        @self.app.post("/voice/process")
        async def process_voice_command(request: Request):
            """Process voice command from user"""
            form_data = await request.form()
            speech_result = form_data.get('SpeechResult', '')
            
            logger.info(f"🗣️ Voice command: {speech_result}")
            
            # Process command with Mr. Happy
            # (Integration with mr-happy-core.py)
            response_text = await self.process_command(speech_result)
            
            response = VoiceResponse()
            response.say(response_text, language='hi-IN', voice='woman')
            
            # Ask if they want to do anything else
            gather = Gather(
                input='speech',
                action='/voice/process',
                language='hi-IN',
                timeout=5
            )
            gather.say("और कुछ?", language='hi-IN', voice='woman')
            response.append(gather)
            
            return PlainTextResponse(str(response), media_type='text/xml')
        
        @self.app.post("/location/update")
        async def update_location(request: Request):
            """Update user location"""
            data = await request.json()
            
            location = GeolocationData(
                latitude=data['latitude'],
                longitude=data['longitude'],
                accuracy=data.get('accuracy', 0),
                altitude=data.get('altitude'),
                speed=data.get('speed'),
                heading=data.get('heading')
            )
            
            # Reverse geocode to get address
            await self.reverse_geocode(location)
            
            # Update current location
            self.current_location = location
            self.location_history.append(location)
            
            # Check geofences
            triggered_fences = await self.check_geofences(location)
            
            logger.info(f"📍 Location updated: {location.city}, {location.country}")
            
            return {
                "success": True,
                "location": location.to_dict(),
                "triggered_geofences": triggered_fences
            }
        
        @self.app.get("/location/current")
        async def get_current_location():
            """Get current location"""
            if self.current_location:
                return {
                    "success": True,
                    "location": self.current_location.to_dict()
                }
            return {"success": False, "message": "No location data available"}
        
        @self.app.post("/geofence/create")
        async def create_geofence(request: Request):
            """Create a geofence"""
            data = await request.json()
            
            geofence = {
                "id": len(self.geofences) + 1,
                "name": data['name'],
                "latitude": data['latitude'],
                "longitude": data['longitude'],
                "radius": data['radius'],  # in meters
                "actions": data.get('actions', []),
                "enabled": True
            }
            
            self.geofences.append(geofence)
            logger.info(f"🔒 Geofence created: {geofence['name']}")
            
            return {"success": True, "geofence": geofence}
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint"""
            return {
                "status": "healthy",
                "twilio": "connected" if self.twilio_client else "disconnected",
                "current_location": self.current_location is not None,
                "geofences": len(self.geofences)
            }
    
    async def process_command(self, command: str) -> str:
        """
        Process voice command
        
        Args:
            command: Voice command text
            
        Returns:
            Response text
        """
        command_lower = command.lower()
        
        # Location commands
        if "मेरा लोकेशन" in command_lower or "location" in command_lower:
            if self.current_location:
                return f"आप {self.current_location.city}, {self.current_location.country} में हैं"
            return "मुझे आपका लोकेशन नहीं मिल रहा है"
        
        # Home control commands
        elif "लाइट" in command_lower or "light" in command_lower:
            if "चालू" in command_lower or "on" in command_lower:
                return "लाइट चालू कर रहा हूं"
            elif "बंद" in command_lower or "off" in command_lower:
                return "लाइट बंद कर रहा हूं"
        
        # Weather commands
        elif "मौसम" in command_lower or "weather" in command_lower:
            if self.current_location:
                return f"{self.current_location.city} में मौसम अच्छा है"
            return "मौसम की जानकारी के लिए लोकेशन चाहिए"
        
        # Default response
        return "मैं आपकी मदद करने की कोशिश कर रहा हूं"
    
    async def make_call(self, to_number: str, message: str) -> VoiceCall:
        """
        Make an outbound voice call
        
        Args:
            to_number: Phone number to call
            message: Message to speak
            
        Returns:
            VoiceCall object
        """
        try:
            # Create TwiML for the call
            twiml = VoiceResponse()
            twiml.say(message, language='hi-IN', voice='woman')
            
            # Make the call
            call = self.twilio_client.calls.create(
                twiml=str(twiml),
                to=to_number,
                from_=self.from_number
            )
            
            voice_call = VoiceCall(
                call_sid=call.sid,
                from_number=self.from_number,
                to_number=to_number,
                status=call.status
            )
            
            logger.info(f"📞 Call initiated: {call.sid}")
            return voice_call
            
        except Exception as e:
            logger.error(f"❌ Call error: {e}")
            raise
    
    async def send_sms(self, to_number: str, message: str) -> bool:
        """
        Send SMS message
        
        Args:
            to_number: Phone number
            message: SMS text
            
        Returns:
            Success status
        """
        try:
            message = self.twilio_client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"📱 SMS sent: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"❌ SMS error: {e}")
            return False
    
    async def reverse_geocode(self, location: GeolocationData):
        """
        Convert coordinates to address
        
        Args:
            location: GeolocationData object to update
        """
        try:
            location_obj = self.geolocator.reverse(
                (location.latitude, location.longitude),
                language='en'
            )
            
            if location_obj:
                address = location_obj.raw.get('address', {})
                location.address = location_obj.address
                location.city = address.get('city') or address.get('town') or address.get('village')
                location.country = address.get('country')
                
                logger.info(f"📍 Geocoded: {location.city}, {location.country}")
                
        except Exception as e:
            logger.error(f"❌ Geocoding error: {e}")
    
    async def get_location_from_termux(self) -> Optional[GeolocationData]:
        """
        Get location from Termux API (for Android)
        
        Returns:
            GeolocationData or None
        """
        try:
            import subprocess
            
            # Use Termux API to get location
            result = subprocess.run(
                ['termux-location', '-p', 'gps'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                
                location = GeolocationData(
                    latitude=data['latitude'],
                    longitude=data['longitude'],
                    accuracy=data.get('accuracy', 0),
                    altitude=data.get('altitude'),
                    speed=data.get('speed'),
                    heading=data.get('bearing')
                )
                
                await self.reverse_geocode(location)
                
                logger.info(f"📱 Termux location: {location.coordinates}")
                return location
                
        except Exception as e:
            logger.error(f"❌ Termux location error: {e}")
        
        return None
    
    async def check_geofences(self, location: GeolocationData) -> List[Dict]:
        """
        Check if location triggers any geofences
        
        Args:
            location: Current location
            
        Returns:
            List of triggered geofences
        """
        triggered = []
        
        for fence in self.geofences:
            if not fence['enabled']:
                continue
            
            fence_location = GeolocationData(
                latitude=fence['latitude'],
                longitude=fence['longitude'],
                accuracy=0
            )
            
            distance = location.distance_to(fence_location) * 1000  # Convert to meters
            
            if distance <= fence['radius']:
                triggered.append(fence)
                logger.info(f"🔔 Geofence triggered: {fence['name']}")
                
                # Execute actions
                for action in fence.get('actions', []):
                    await self.execute_geofence_action(action, location)
        
        return triggered
    
    async def execute_geofence_action(self, action: Dict, location: GeolocationData):
        """
        Execute geofence action
        
        Args:
            action: Action configuration
            location: Current location
        """
        action_type = action.get('type')
        
        if action_type == 'notification':
            message = action.get('message', 'Geofence triggered')
            await self.send_sms(self.your_number, message)
        
        elif action_type == 'call':
            message = action.get('message', 'You have entered a geofence')
            await self.make_call(self.your_number, message)
        
        elif action_type == 'home_assistant':
            # Trigger Home Assistant automation
            # (Integration with Home Assistant)
            pass
        
        elif action_type == 'custom':
            # Execute custom action
            # (Integration with Mr. Happy)
            pass
    
    def run(self, host: str = "0.0.0.0", port: int = 8000):
        """
        Run the FastAPI server
        
        Args:
            host: Server host
            port: Server port
        """
        logger.info(f"🚀 Starting Voice & Geolocation System on {host}:{port}")
        uvicorn.run(self.app, host=host, port=port)

# Main execution
async def main():
    """Main entry point"""
    system = VoiceGeolocationSystem()
    
    # Example: Get location from Termux
    location = await system.get_location_from_termux()
    if location:
        logger.info(f"📍 Current location: {location.city}, {location.country}")
    
    # Example: Create a geofence
    # await system.app.post("/geofence/create", json={
    #     "name": "Home",
    #     "latitude": 28.6139,
    #     "longitude": 77.2090,
    #     "radius": 100,
    #     "actions": [
    #         {"type": "notification", "message": "Welcome home!"}
    #     ]
    # })
    
    # Run the server
    system.run()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
