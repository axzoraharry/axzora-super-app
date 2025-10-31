#!/usr/bin/env python3
"""
Mr. Happy Master Orchestrator
Auto-connects and manages all Satyug Universe components
"""

import os
import sys
import asyncio
import subprocess
import logging
from typing import Dict, List, Optional
from datetime import datetime
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('MrHappyOrchestrator')

class SystemComponent:
    """Base class for system components"""
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.status = "stopped"
        self.process = None
    
    async def start(self):
        """Start the component"""
        raise NotImplementedError
    
    async def stop(self):
        """Stop the component"""
        raise NotImplementedError
    
    async def health_check(self) -> bool:
        """Check if component is healthy"""
        raise NotImplementedError

class MumbleServer(SystemComponent):
    """Mumble Voice Server"""
    def __init__(self):
        super().__init__("Mumble Server", "Voice communication server")
        self.port = 12847
        self.config_path = "/etc/mumble-server.ini"
    
    async def start(self):
        logger.info(f"🎤 Starting {self.name}...")
        try:
            # Check if already running
            result = subprocess.run(
                ["systemctl", "is-active", "mumble-server"],
                capture_output=True,
                text=True
            )
            
            if result.stdout.strip() == "active":
                logger.info(f"✅ {self.name} already running")
                self.status = "running"
                return True
            
            # Start the service
            subprocess.run(["sudo", "systemctl", "start", "mumble-server"], check=True)
            self.status = "running"
            logger.info(f"✅ {self.name} started on port {self.port}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to start {self.name}: {e}")
            self.status = "error"
            return False
    
    async def stop(self):
        try:
            subprocess.run(["sudo", "systemctl", "stop", "mumble-server"], check=True)
            self.status = "stopped"
            logger.info(f"🛑 {self.name} stopped")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to stop {self.name}: {e}")
            return False
    
    async def health_check(self) -> bool:
        try:
            result = subprocess.run(
                ["systemctl", "is-active", "mumble-server"],
                capture_output=True,
                text=True
            )
            return result.stdout.strip() == "active"
        except:
            return False

class HomeAssistant(SystemComponent):
    """Home Assistant Smart Home System"""
    def __init__(self):
        super().__init__("Home Assistant", "Smart home automation")
        self.port = 8123
    
    async def start(self):
        logger.info(f"🏠 Starting {self.name}...")
        try:
            # Start via Docker Compose
            subprocess.run(
                ["docker-compose", "up", "-d", "homeassistant"],
                cwd="/home/ubuntu",
                check=True
            )
            self.status = "running"
            logger.info(f"✅ {self.name} started on port {self.port}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to start {self.name}: {e}")
            self.status = "error"
            return False
    
    async def stop(self):
        try:
            subprocess.run(
                ["docker-compose", "stop", "homeassistant"],
                cwd="/home/ubuntu",
                check=True
            )
            self.status = "stopped"
            return True
        except Exception as e:
            logger.error(f"❌ Failed to stop {self.name}: {e}")
            return False
    
    async def health_check(self) -> bool:
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://localhost:{self.port}/api/", timeout=5) as resp:
                    return resp.status == 200
        except:
            return False

class OdooERP(SystemComponent):
    """Odoo Enterprise Resource Planning"""
    def __init__(self):
        super().__init__("Odoo ERP", "Business management system")
        self.port = 8069
    
    async def start(self):
        logger.info(f"📊 Starting {self.name}...")
        try:
            subprocess.run(
                ["docker-compose", "up", "-d", "odoo", "odoo-db"],
                cwd="/home/ubuntu",
                check=True
            )
            self.status = "running"
            logger.info(f"✅ {self.name} started on port {self.port}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to start {self.name}: {e}")
            self.status = "error"
            return False
    
    async def stop(self):
        try:
            subprocess.run(
                ["docker-compose", "stop", "odoo", "odoo-db"],
                cwd="/home/ubuntu",
                check=True
            )
            self.status = "stopped"
            return True
        except Exception as e:
            logger.error(f"❌ Failed to stop {self.name}: {e}")
            return False
    
    async def health_check(self) -> bool:
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://localhost:{self.port}/web/database/selector", timeout=5) as resp:
                    return resp.status == 200
        except:
            return False

class Nextcloud(SystemComponent):
    """Nextcloud File Storage"""
    def __init__(self):
        super().__init__("Nextcloud", "File storage and collaboration")
        self.port = 8080
    
    async def start(self):
        logger.info(f"☁️ Starting {self.name}...")
        try:
            subprocess.run(
                ["docker-compose", "up", "-d", "nextcloud", "nextcloud-db"],
                cwd="/home/ubuntu",
                check=True
            )
            self.status = "running"
            logger.info(f"✅ {self.name} started on port {self.port}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to start {self.name}: {e}")
            self.status = "error"
            return False
    
    async def stop(self):
        try:
            subprocess.run(
                ["docker-compose", "stop", "nextcloud", "nextcloud-db"],
                cwd="/home/ubuntu",
                check=True
            )
            self.status = "stopped"
            return True
        except Exception as e:
            logger.error(f"❌ Failed to stop {self.name}: {e}")
            return False
    
    async def health_check(self) -> bool:
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://localhost:{self.port}/status.php", timeout=5) as resp:
                    return resp.status == 200
        except:
            return False

class MrHappyCore(SystemComponent):
    """Mr. Happy AI Core"""
    def __init__(self):
        super().__init__("Mr. Happy AI", "Central AI brain")
        self.port = 8000
    
    async def start(self):
        logger.info(f"🤖 Starting {self.name}...")
        try:
            subprocess.run(
                ["docker-compose", "up", "-d", "mr-happy"],
                cwd="/home/ubuntu",
                check=True
            )
            self.status = "running"
            logger.info(f"✅ {self.name} started on port {self.port}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to start {self.name}: {e}")
            self.status = "error"
            return False
    
    async def stop(self):
        try:
            subprocess.run(
                ["docker-compose", "stop", "mr-happy"],
                cwd="/home/ubuntu",
                check=True
            )
            self.status = "stopped"
            return True
        except Exception as e:
            logger.error(f"❌ Failed to stop {self.name}: {e}")
            return False
    
    async def health_check(self) -> bool:
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://localhost:{self.port}/health", timeout=5) as resp:
                    return resp.status == 200
        except:
            return False

class VoiceGeolocationSystem(SystemComponent):
    """Voice and Geolocation System"""
    def __init__(self):
        super().__init__("Voice & Geolocation", "Voice control and location services")
        self.port = 8001
    
    async def start(self):
        logger.info(f"🎤📍 Starting {self.name}...")
        try:
            self.process = subprocess.Popen(
                ["python3", "/home/ubuntu/voice_geolocation_system.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.status = "running"
            logger.info(f"✅ {self.name} started")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to start {self.name}: {e}")
            self.status = "error"
            return False
    
    async def stop(self):
        if self.process:
            self.process.terminate()
            self.process.wait()
            self.status = "stopped"
            return True
        return False
    
    async def health_check(self) -> bool:
        return self.process is not None and self.process.poll() is None

class GoogleAssistantBridge(SystemComponent):
    """Google Assistant Integration"""
    def __init__(self):
        super().__init__("Google Assistant", "Voice assistant integration")
        self.port = 3001
    
    async def start(self):
        logger.info(f"🗣️ Starting {self.name}...")
        try:
            self.process = subprocess.Popen(
                ["node", "/home/ubuntu/axzora-super-app/backend/google-assistant-server.js"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.status = "running"
            logger.info(f"✅ {self.name} started on port {self.port}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to start {self.name}: {e}")
            self.status = "error"
            return False
    
    async def stop(self):
        if self.process:
            self.process.terminate()
            self.process.wait()
            self.status = "stopped"
            return True
        return False
    
    async def health_check(self) -> bool:
        return self.process is not None and self.process.poll() is None

class MrHappyOrchestrator:
    """
    Master Orchestrator for Satyug Universe
    Manages all system components
    """
    
    def __init__(self):
        self.components = {
            "mumble": MumbleServer(),
            "homeassistant": HomeAssistant(),
            "odoo": OdooERP(),
            "nextcloud": Nextcloud(),
            "mr_happy": MrHappyCore(),
            "voice_geo": VoiceGeolocationSystem(),
            "google_assistant": GoogleAssistantBridge()
        }
        
        self.startup_order = [
            "mumble",
            "homeassistant",
            "odoo",
            "nextcloud",
            "mr_happy",
            "voice_geo",
            "google_assistant"
        ]
        
        logger.info("🎉 Mr. Happy Orchestrator initialized")
    
    async def start_all(self):
        """Start all components in order"""
        logger.info("🚀 Starting Satyug Universe...")
        
        for component_name in self.startup_order:
            component = self.components[component_name]
            await component.start()
            await asyncio.sleep(2)  # Wait between starts
        
        logger.info("✅ All components started!")
        await self.print_status()
    
    async def stop_all(self):
        """Stop all components"""
        logger.info("🛑 Stopping all components...")
        
        for component_name in reversed(self.startup_order):
            component = self.components[component_name]
            await component.stop()
        
        logger.info("✅ All components stopped!")
    
    async def restart_all(self):
        """Restart all components"""
        await self.stop_all()
        await asyncio.sleep(5)
        await self.start_all()
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all components"""
        results = {}
        
        for name, component in self.components.items():
            is_healthy = await component.health_check()
            results[name] = is_healthy
            
            if is_healthy:
                logger.info(f"✅ {component.name}: Healthy")
            else:
                logger.warning(f"⚠️ {component.name}: Unhealthy")
        
        return results
    
    async def print_status(self):
        """Print status of all components"""
        logger.info("\n" + "="*60)
        logger.info("SATYUG UNIVERSE STATUS")
        logger.info("="*60)
        
        for name, component in self.components.items():
            status_icon = "✅" if component.status == "running" else "❌"
            logger.info(f"{status_icon} {component.name}: {component.status}")
        
        logger.info("="*60 + "\n")
    
    async def monitor(self, interval: int = 60):
        """Monitor all components continuously"""
        logger.info(f"👁️ Starting monitoring (interval: {interval}s)")
        
        while True:
            await asyncio.sleep(interval)
            health = await self.health_check_all()
            
            # Restart unhealthy components
            for name, is_healthy in health.items():
                if not is_healthy:
                    logger.warning(f"⚠️ {name} is unhealthy, restarting...")
                    component = self.components[name]
                    await component.stop()
                    await asyncio.sleep(2)
                    await component.start()
    
    def run_interactive(self):
        """Run interactive menu"""
        while True:
            print("\n" + "="*60)
            print("MR. HAPPY ORCHESTRATOR - SATYUG UNIVERSE")
            print("="*60)
            print("1. Start All Components")
            print("2. Stop All Components")
            print("3. Restart All Components")
            print("4. Check Health")
            print("5. View Status")
            print("6. Start Monitoring")
            print("7. Exit")
            print("="*60)
            
            choice = input("\nEnter your choice (1-7): ").strip()
            
            if choice == "1":
                asyncio.run(self.start_all())
            elif choice == "2":
                asyncio.run(self.stop_all())
            elif choice == "3":
                asyncio.run(self.restart_all())
            elif choice == "4":
                asyncio.run(self.health_check_all())
            elif choice == "5":
                asyncio.run(self.print_status())
            elif choice == "6":
                interval = input("Enter monitoring interval in seconds (default: 60): ").strip()
                interval = int(interval) if interval.isdigit() else 60
                asyncio.run(self.monitor(interval))
            elif choice == "7":
                logger.info("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice!")

async def main():
    """Main entry point"""
    orchestrator = MrHappyOrchestrator()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "start":
            await orchestrator.start_all()
        elif command == "stop":
            await orchestrator.stop_all()
        elif command == "restart":
            await orchestrator.restart_all()
        elif command == "status":
            await orchestrator.print_status()
        elif command == "health":
            await orchestrator.health_check_all()
        elif command == "monitor":
            await orchestrator.monitor()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python mr_happy_orchestrator.py [start|stop|restart|status|health|monitor]")
    else:
        orchestrator.run_interactive()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n👋 Shutting down...")
