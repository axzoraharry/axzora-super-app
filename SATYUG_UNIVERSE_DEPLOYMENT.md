> **Project Satyug**: An integrated, AI-driven ecosystem designed for advanced civilization architecture, powered by the Mr. Happy AI core.

# Satyug Universe: Automated Deployment Guide

This document provides a complete guide to deploying the entire Satyug Universe, a complex, interconnected system orchestrated by the **Mr. Happy AI**. This automated script will set up all necessary components, including voice servers, ERP systems, smart home controls, and the central AI brain.

---

## 🚀 One-Command Deployment

To deploy the entire universe, simply run the master deployment script. This will install all dependencies, configure services, build containers, and start the system.

**Prerequisites:**
- A Linux server (Ubuntu 22.04 recommended) with `sudo` or root access.
- The server should be accessible via the internet.
- Your domain (`zen.lemehost.com`) should point to your server's IP (`15.235.181.136`).

**Execution:**

Open your server terminal and run the following command:

```bash
# Clone the repository
git clone https://github.com/axzoraharry/axzora-super-app.git

# Navigate to the project directory
cd axzora-super-app

# Make the deployment script executable
chmod +x deploy_satyug.sh

# Run the deployment script
sudo ./deploy_satyug.sh
```

This script will take several minutes to complete as it downloads, installs, and configures all services.

---

## ⚙️ Step 1: Critical Configuration (Post-Deployment)

After the deployment script finishes, you **must** configure your secret API keys.

1.  **Edit the Environment File**:
    Open the `.env` file that was created in the `axzora-super-app` directory:

    ```bash
    nano .env
    ```

2.  **Fill in Your API Keys**:
    The file contains placeholders for your secret keys. Replace `your_..._here` with your actual credentials. This is essential for the AI, voice, and notification systems to work.

    ```ini
    # Twilio Configuration
    TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
    TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

    # AI Service API Keys
    OPENAI_API_KEY=your_openai_api_key_here
    DEEPGRAM_API_KEY=your_deepgram_api_key_here
    CARTESIA_API_KEY=your_cartesia_api_key_here

    # Other credentials...
    HA_TOKEN=your_home_assistant_long_lived_access_token_here
    ODOO_PASSWORD=your_odoo_admin_password_here
    NEXTCLOUD_PASSWORD=your_nextcloud_password
    WALLET_PRIVATE_KEY=your_wallet_private_key_here
    ```

3.  **Restart the Universe**:
    For the new settings to take effect, restart the entire system using the orchestrator script:

    ```bash
    python3 mr_happy_orchestrator.py restart
    ```

---

## 🏛️ System Architecture Overview

The Satyug Universe is a microservice-based architecture managed by Docker and orchestrated by the Mr. Happy AI. 

| Component | Role | Access Port |
| :--- | :--- | :--- |
| **Mr. Happy AI** | Central AI Brain & Orchestrator | `8000` |
| **Mumble Server** | Voice Communication | `12847` |
| **Home Assistant** | Smart Home & IoT Control | `8123` |
| **Odoo ERP** | Business & Resource Management | `8069` |
| **Nextcloud** | Private File Storage & Cloud | `8080` |
| **Google Assistant**| External Voice Command Bridge | `3001` |
| **Voice/Geo System**| Twilio Integration & Location | `8001` |
| **Portainer** | Docker Management UI | `9000` |
| **Nginx** | Reverse Proxy | `80`, `443` |

---

## 🛠️ Managing the Satyug Universe

The `mr_happy_orchestrator.py` script is your primary tool for managing the entire system.

### Interactive Menu

For an easy-to-use menu, run the script without any arguments:

```bash
python3 mr_happy_orchestrator.py
```

### Direct Commands

-   **Start All Services**:
    ```bash
    python3 mr_happy_orchestrator.py start
    ```

-   **Stop All Services**:
    ```bash
    python3 mr_happy_orchestrator.py stop
    ```

-   **Restart All Services**:
    ```bash
    python3 mr_happy_orchestrator.py restart
    ```

-   **Check System Health**:
    ```bash
    python3 mr_happy_orchestrator.py health
    ```

-   **View Live Status**:
    ```bash
    python3 mr_happy_orchestrator.py status
    ```

-   **Enable Continuous Monitoring** (restarts failed services):
    ```bash
    python3 mr_happy_orchestrator.py monitor
    ```

---

## 🌐 Accessing Your Services

Once deployed, your services will be available at the following URLs:

-   **Home Assistant**: `http://zen.lemehost.com:8123`
-   **Odoo ERP**: `http://zen.lemehost.com:8069`
-   **Nextcloud**: `http://zen.lemehost.com:8080`
-   **Mr. Happy API**: `http://zen.lemehost.com:8000/docs`
-   **Portainer UI**: `http://zen.lemehost.com:9000`

To connect to the **Mumble Voice Server**, use a client like Mumla (Android) or the official Mumble client with the following details:
-   **Address**: `zen.lemehost.com`
-   **Port**: `12847`
-   **Password**: `SatyugUniverse2024` (as set in the deployment script)

Your Satyug Universe is now deployed and operational. Mr. Happy is online.
