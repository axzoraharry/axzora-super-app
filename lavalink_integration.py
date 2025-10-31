#!/usr/bin/env python3
"""
Lavalink Integration for Mr. Happy AI
Provides audio streaming, music playback, and advanced audio processing
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import json

logger = logging.getLogger('LavalinkIntegration')

class TrackEndReason(Enum):
    """Track end reasons"""
    FINISHED = "finished"
    LOAD_FAILED = "loadFailed"
    STOPPED = "stopped"
    REPLACED = "replaced"
    CLEANUP = "cleanup"

@dataclass
class Track:
    """Represents an audio track"""
    encoded: str
    info: Dict[str, Any]
    
    @property
    def title(self) -> str:
        return self.info.get('title', 'Unknown')
    
    @property
    def author(self) -> str:
        return self.info.get('author', 'Unknown')
    
    @property
    def duration(self) -> int:
        """Duration in milliseconds"""
        return self.info.get('length', 0)
    
    @property
    def uri(self) -> str:
        return self.info.get('uri', '')
    
    @property
    def is_stream(self) -> bool:
        return self.info.get('isStream', False)
    
    def to_dict(self) -> Dict:
        return {
            "title": self.title,
            "author": self.author,
            "duration": self.duration,
            "uri": self.uri,
            "is_stream": self.is_stream
        }

@dataclass
class PlayerState:
    """Current player state"""
    time: int
    position: int
    connected: bool
    ping: int

class LavalinkPlayer:
    """
    Lavalink Audio Player
    Manages audio playback for a single session
    """
    
    def __init__(self, session_id: str, lavalink_client: 'LavalinkClient'):
        self.session_id = session_id
        self.client = lavalink_client
        self.current_track: Optional[Track] = None
        self.queue: List[Track] = []
        self.volume = 100
        self.paused = False
        self.position = 0
        self.filters = {}
        
        logger.info(f"🎵 Player created for session: {session_id}")
    
    async def play(self, track: Track, start_time: int = 0):
        """
        Play a track
        
        Args:
            track: Track to play
            start_time: Start position in milliseconds
        """
        payload = {
            "encodedTrack": track.encoded,
            "position": start_time
        }
        
        await self.client._send_player_update(self.session_id, payload)
        self.current_track = track
        self.paused = False
        
        logger.info(f"▶️ Playing: {track.title} by {track.author}")
    
    async def pause(self, paused: bool = True):
        """Pause or resume playback"""
        payload = {"paused": paused}
        await self.client._send_player_update(self.session_id, payload)
        self.paused = paused
        
        logger.info(f"{'⏸️ Paused' if paused else '▶️ Resumed'}")
    
    async def stop(self):
        """Stop playback"""
        payload = {"encodedTrack": None}
        await self.client._send_player_update(self.session_id, payload)
        self.current_track = None
        self.paused = False
        
        logger.info("⏹️ Stopped")
    
    async def seek(self, position: int):
        """
        Seek to position
        
        Args:
            position: Position in milliseconds
        """
        payload = {"position": position}
        await self.client._send_player_update(self.session_id, payload)
        self.position = position
        
        logger.info(f"⏩ Seeked to: {position}ms")
    
    async def set_volume(self, volume: int):
        """
        Set volume (0-1000)
        
        Args:
            volume: Volume level (0-1000, 100 = normal)
        """
        volume = max(0, min(1000, volume))
        payload = {"volume": volume}
        await self.client._send_player_update(self.session_id, payload)
        self.volume = volume
        
        logger.info(f"🔊 Volume set to: {volume}")
    
    async def set_filters(self, filters: Dict[str, Any]):
        """
        Apply audio filters
        
        Args:
            filters: Filter configuration
        """
        payload = {"filters": filters}
        await self.client._send_player_update(self.session_id, payload)
        self.filters = filters
        
        logger.info(f"🎛️ Filters applied: {list(filters.keys())}")
    
    def add_to_queue(self, track: Track):
        """Add track to queue"""
        self.queue.append(track)
        logger.info(f"➕ Added to queue: {track.title}")
    
    async def play_next(self):
        """Play next track in queue"""
        if self.queue:
            track = self.queue.pop(0)
            await self.play(track)
            return True
        return False
    
    def clear_queue(self):
        """Clear the queue"""
        self.queue.clear()
        logger.info("🗑️ Queue cleared")

class LavalinkClient:
    """
    Lavalink Client for Mr. Happy AI
    
    Provides:
    - Music playback from YouTube, Spotify, SoundCloud, etc.
    - Audio streaming
    - Audio filters (equalizer, karaoke, timescale, etc.)
    - Queue management
    - Multiple player sessions
    """
    
    def __init__(self, host: str = "localhost", port: int = 2333, password: str = "youshallnotpass"):
        """
        Initialize Lavalink client
        
        Args:
            host: Lavalink server host
            port: Lavalink server port
            password: Lavalink server password
        """
        self.host = host
        self.port = port
        self.password = password
        self.base_url = f"http://{host}:{port}"
        
        self.session: Optional[aiohttp.ClientSession] = None
        self.players: Dict[str, LavalinkPlayer] = {}
        
        logger.info(f"🎵 Lavalink client initialized: {self.base_url}")
    
    async def connect(self):
        """Establish connection to Lavalink server"""
        self.session = aiohttp.ClientSession(headers={
            "Authorization": self.password,
            "User-Id": "mr-happy-ai",
            "Client-Name": "MrHappy/1.0"
        })
        
        # Test connection
        try:
            async with self.session.get(f"{self.base_url}/version") as resp:
                if resp.status == 200:
                    version = await resp.text()
                    logger.info(f"✅ Connected to Lavalink {version}")
                    return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to Lavalink: {e}")
            return False
    
    async def disconnect(self):
        """Close connection"""
        if self.session:
            await self.session.close()
            logger.info("👋 Disconnected from Lavalink")
    
    def get_player(self, session_id: str) -> LavalinkPlayer:
        """Get or create a player for a session"""
        if session_id not in self.players:
            self.players[session_id] = LavalinkPlayer(session_id, self)
        return self.players[session_id]
    
    async def search(self, query: str, source: str = "ytsearch") -> List[Track]:
        """
        Search for tracks
        
        Args:
            query: Search query
            source: Source identifier (ytsearch, scsearch, spsearch, etc.)
            
        Returns:
            List of tracks
        """
        if not query.startswith("http"):
            query = f"{source}:{query}"
        
        params = {"identifier": query}
        
        try:
            async with self.session.get(
                f"{self.base_url}/v4/loadtracks",
                params=params
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    
                    load_type = data.get('loadType')
                    
                    if load_type == 'track':
                        track_data = data['data']
                        return [Track(track_data['encoded'], track_data['info'])]
                    
                    elif load_type == 'playlist':
                        tracks_data = data['data']['tracks']
                        return [Track(t['encoded'], t['info']) for t in tracks_data]
                    
                    elif load_type == 'search':
                        tracks_data = data['data']
                        return [Track(t['encoded'], t['info']) for t in tracks_data]
                    
                    else:
                        logger.warning(f"No tracks found for: {query}")
                        return []
        except Exception as e:
            logger.error(f"❌ Search error: {e}")
            return []
    
    async def _send_player_update(self, session_id: str, payload: Dict[str, Any]):
        """Send player update to Lavalink"""
        try:
            async with self.session.patch(
                f"{self.base_url}/v4/sessions/{session_id}/players/{session_id}",
                json=payload
            ) as resp:
                if resp.status not in [200, 204]:
                    logger.error(f"❌ Player update failed: {resp.status}")
        except Exception as e:
            logger.error(f"❌ Player update error: {e}")
    
    async def decode_track(self, encoded: str) -> Optional[Track]:
        """Decode a track from encoded string"""
        try:
            async with self.session.get(
                f"{self.base_url}/v4/decodetrack",
                params={"encodedTrack": encoded}
            ) as resp:
                if resp.status == 200:
                    info = await resp.json()
                    return Track(encoded, info)
        except Exception as e:
            logger.error(f"❌ Decode error: {e}")
        return None
    
    async def get_player_info(self, session_id: str) -> Optional[Dict]:
        """Get player information"""
        try:
            async with self.session.get(
                f"{self.base_url}/v4/sessions/{session_id}/players/{session_id}"
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
        except Exception as e:
            logger.error(f"❌ Get player info error: {e}")
        return None

class MrHappyAudioSystem:
    """
    Mr. Happy Audio System
    High-level audio interface for Mr. Happy AI
    """
    
    def __init__(self, lavalink_host: str = "localhost", lavalink_port: int = 2333):
        self.lavalink = LavalinkClient(lavalink_host, lavalink_port)
        self.default_session = "mr-happy-main"
        
        logger.info("🎵 Mr. Happy Audio System initialized")
    
    async def start(self):
        """Start the audio system"""
        await self.lavalink.connect()
    
    async def stop(self):
        """Stop the audio system"""
        await self.lavalink.disconnect()
    
    async def play_music(self, query: str, session_id: Optional[str] = None) -> bool:
        """
        Play music from query
        
        Args:
            query: Search query or URL
            session_id: Session identifier (uses default if None)
            
        Returns:
            Success status
        """
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        
        # Search for tracks
        tracks = await self.lavalink.search(query)
        
        if not tracks:
            logger.warning(f"No tracks found for: {query}")
            return False
        
        # Play first track
        await player.play(tracks[0])
        
        # Add rest to queue
        for track in tracks[1:]:
            player.add_to_queue(track)
        
        return True
    
    async def pause_music(self, session_id: Optional[str] = None):
        """Pause music"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        await player.pause(True)
    
    async def resume_music(self, session_id: Optional[str] = None):
        """Resume music"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        await player.pause(False)
    
    async def stop_music(self, session_id: Optional[str] = None):
        """Stop music"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        await player.stop()
    
    async def skip_track(self, session_id: Optional[str] = None) -> bool:
        """Skip to next track"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        return await player.play_next()
    
    async def set_volume(self, volume: int, session_id: Optional[str] = None):
        """Set volume (0-100)"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        await player.set_volume(volume)
    
    async def apply_nightcore_filter(self, session_id: Optional[str] = None):
        """Apply nightcore effect"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        
        filters = {
            "timescale": {
                "speed": 1.3,
                "pitch": 1.3,
                "rate": 1.0
            }
        }
        
        await player.set_filters(filters)
    
    async def apply_bass_boost(self, session_id: Optional[str] = None):
        """Apply bass boost"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        
        filters = {
            "equalizer": [
                {"band": 0, "gain": 0.2},
                {"band": 1, "gain": 0.15},
                {"band": 2, "gain": 0.1}
            ]
        }
        
        await player.set_filters(filters)
    
    async def clear_filters(self, session_id: Optional[str] = None):
        """Clear all filters"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        await player.set_filters({})
    
    async def get_now_playing(self, session_id: Optional[str] = None) -> Optional[Dict]:
        """Get currently playing track info"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        
        if player.current_track:
            return player.current_track.to_dict()
        return None
    
    async def get_queue(self, session_id: Optional[str] = None) -> List[Dict]:
        """Get queue"""
        session_id = session_id or self.default_session
        player = self.lavalink.get_player(session_id)
        
        return [track.to_dict() for track in player.queue]

# Example usage
async def main():
    """Example usage"""
    logging.basicConfig(level=logging.INFO)
    
    # Initialize audio system
    audio = MrHappyAudioSystem(lavalink_host="localhost", lavalink_port=2333)
    await audio.start()
    
    # Play music
    await audio.play_music("Lofi hip hop beats")
    
    # Wait a bit
    await asyncio.sleep(10)
    
    # Apply bass boost
    await audio.apply_bass_boost()
    
    # Get now playing
    now_playing = await audio.get_now_playing()
    print(f"Now playing: {now_playing}")
    
    # Stop
    await audio.stop_music()
    await audio.stop()

if __name__ == "__main__":
    asyncio.run(main())
