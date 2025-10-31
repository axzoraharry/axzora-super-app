> **Project Satyug**: Lavalink Integration for Advanced Audio Streaming

# Lavalink Integration: Music & Audio for Mr. Happy

This document details the integration of the **Lavalink audio streaming server** into the Satyug Universe. This upgrade gives Mr. Happy powerful new capabilities for music playback, audio processing, and advanced voice synthesis.

---

## 🎵 What is Lavalink?

Lavalink is a high-performance, standalone audio sending node built for applications that require audio streaming. It offloads the resource-intensive work of audio playback and processing, allowing Mr. Happy to remain responsive while managing complex audio tasks.

### Key Features Added

- **Multi-Source Music Playback**: Stream music and audio from major platforms:
  - YouTube
  - SoundCloud
  - Bandcamp
  - Spotify (via search)
  - Twitch streams
- **Advanced Audio Control**: Full control over playback, including play, pause, stop, seek, and volume.
- **Queue Management**: Add multiple tracks to a queue for continuous playback.
- **Audio Effects**: Apply real-time audio filters like **bass boost** and **nightcore**.
- **High Performance**: Lavalink is written in Java and is highly optimized for audio streaming, ensuring smooth, low-latency playback.

---

## 🎤 New Voice Commands for Mr. Happy

With Lavalink integrated, you can now use the following voice commands to control music playback. You can issue these commands via a phone call (Twilio) or any other interface connected to Mr. Happy.

| Command (Example) | Action |
| :--- | :--- |
| "Play lofi hip hop beats" | Searches for the query and starts playing the first result. | 
| "Pause music" | Pauses the current track. | 
| "Resume music" | Resumes playback. | 
| "Stop music" | Stops playback and clears the current track. | 
| "Skip track" | Plays the next song in the queue. | 
| "Set volume to 50" | Adjusts the player volume (0-100). | 
| "What's playing?" | Gets information about the currently playing song. | 
| "Show the queue" | Lists the tracks waiting to be played. | 
| "Apply bass boost" | Adds a bass boost filter to the audio. | 
| "Apply nightcore effect"| Applies a nightcore (speed/pitch up) filter. | 
| "Clear audio effects" | Removes all active audio filters. | 

**Example Conversation:**

> **You**: "Hey Mr. Happy, play some relaxing rain sounds."
> 
> **Mr. Happy**: "Certainly. Playing 'Relaxing Rain Sounds for Sleep' now."
> 
> **You**: "Set the volume to 30."
> 
> **Mr. Happy**: "Volume has been set to 30%."

---

## ⚙️ Technical Implementation

### 1. **Lavalink Integration Module** (`lavalink_integration.py`)

A new Python module has been created to provide a high-level interface to the Lavalink server. It handles:
- Connection and authentication.
- Searching for tracks.
- Player management (play, pause, stop, etc.).
- Queue management.
- Applying audio filters.

### 2. **Mr. Happy Core Update** (`mr-happy-core.py`)

The core AI has been updated to:
- Initialize the `MrHappyAudioSystem` on startup.
- Add a new `audio` action handler to `execute_action`.
- Expose the new music capabilities to the AI's decision-making process.

### 3. **Docker Compose** (`docker-compose.yml`)

A new `lavalink` service has been added to the Docker environment. It is configured to:
- Use the official `ghcr.io/lavalink-devs/lavalink:4` image.
- Run on port `2333`.
- Use a pre-configured `application.yml` for settings.
- Persist logs to a Docker volume.

### 4. **Orchestrator Update** (`mr_happy_orchestrator.py`)

The master orchestrator now includes Lavalink in its management cycle:
- It is added to the startup and shutdown sequences.
- Its health is monitored, and the service is automatically restarted if it fails.

---

## 🔧 Configuration

The Lavalink server is configured via the `/lavalink/application.yml` file. The default settings are optimized for general use.

**Key Settings:**

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "youshallnotpass" # This must match the password in your code
    sources:
      youtube: true
      soundcloud: true
      # Enable/disable sources as needed
```

The password is set to `youshallnotpass` by default. This is an internal password for communication between Mr. Happy and Lavalink and does not need to be changed unless you have specific security requirements.

---

## 🚀 How to Use

1.  **Deploy the Universe**: The `deploy_satyug.sh` script will automatically pull the Lavalink image and start the service.
2.  **Start Talking**: Once the system is running, you can immediately start using the new music voice commands.

Mr. Happy now has a fully featured audio backend, making the Satyug Universe an even more immersive and capable ecosystem.
