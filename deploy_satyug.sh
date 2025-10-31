#!/bin/bash

################################################################################
# Satyug Universe - One-Command Deployment Script
# Deploys and configures all components automatically
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo "================================================================"
echo "     SATYUG UNIVERSE - AUTOMATED DEPLOYMENT"
echo "     Powered by Mr. Happy AI"
echo "================================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_warning "This script should be run as root or with sudo"
    log_info "Attempting to use sudo for privileged operations..."
fi

# Step 1: Update system
log_info "Step 1: Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y
log_success "System updated"

# Step 2: Install Docker and Docker Compose
log_info "Step 2: Installing Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    log_success "Docker installed"
else
    log_info "Docker already installed"
fi

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose installed"
else
    log_info "Docker Compose already installed"
fi

# Step 3: Install Mumble Server
log_info "Step 3: Installing Mumble Server..."
if ! command -v murmurd &> /dev/null; then
    sudo apt-get install -y mumble-server
    log_success "Mumble Server installed"
else
    log_info "Mumble Server already installed"
fi

# Configure Mumble Server
log_info "Configuring Mumble Server for port 12847..."
sudo bash -c 'cat > /etc/mumble-server.ini << EOF
# Mumble Server Configuration for Satyug Universe
port=12847
serverpassword=SatyugUniverse2024
welcometext="Welcome to Satyug Universe Voice Server"
bandwidth=130000
users=100
EOF'
log_success "Mumble Server configured"

# Step 4: Install Python dependencies
log_info "Step 4: Installing Python dependencies..."
sudo apt-get install -y python3 python3-pip
pip3 install -r /home/ubuntu/requirements.txt
log_success "Python dependencies installed"

# Step 5: Install Node.js for Google Assistant
log_info "Step 5: Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "Node.js installed"
else
    log_info "Node.js already installed"
fi

# Install Google Assistant dependencies
cd /home/ubuntu/axzora-super-app/backend
npm install express cors body-parser dotenv
log_success "Google Assistant dependencies installed"

# Step 6: Configure environment variables
log_info "Step 6: Configuring environment variables..."
if [ ! -f "/home/ubuntu/.env" ]; then
    cp /home/ubuntu/.env.template /home/ubuntu/.env
    log_warning "Please edit /home/ubuntu/.env with your actual API keys"
else
    log_info ".env file already exists"
fi

# Step 7: Configure firewall
log_info "Step 7: Configuring firewall..."
sudo ufw allow 12847/tcp comment "Mumble Server TCP"
sudo ufw allow 12847/udp comment "Mumble Server UDP"
sudo ufw allow 8123/tcp comment "Home Assistant"
sudo ufw allow 8069/tcp comment "Odoo"
sudo ufw allow 8080/tcp comment "Nextcloud"
sudo ufw allow 8000/tcp comment "Mr. Happy AI"
sudo ufw allow 3001/tcp comment "Google Assistant"
sudo ufw allow 80/tcp comment "HTTP"
sudo ufw allow 443/tcp comment "HTTPS"
log_success "Firewall configured"

# Step 8: Build Docker images
log_info "Step 8: Building Docker images..."
cd /home/ubuntu
docker-compose build
log_success "Docker images built"

# Step 9: Create necessary directories
log_info "Step 9: Creating directories..."
mkdir -p /home/ubuntu/homeassistant/config
mkdir -p /home/ubuntu/odoo/addons
mkdir -p /home/ubuntu/odoo/config
mkdir -p /home/ubuntu/nextcloud/config
mkdir -p /home/ubuntu/nextcloud/custom_apps
mkdir -p /home/ubuntu/nextcloud/data
mkdir -p /home/ubuntu/nginx
mkdir -p /home/ubuntu/models
mkdir -p /home/ubuntu/postgres/init
log_success "Directories created"

# Step 10: Make scripts executable
log_info "Step 10: Making scripts executable..."
chmod +x /home/ubuntu/mr_happy_orchestrator.py
chmod +x /home/ubuntu/mr-happy-core.py
chmod +x /home/ubuntu/voice_geolocation_system.py
chmod +x /home/ubuntu/huskylens_integration.py
log_success "Scripts made executable"

# Step 11: Start Mumble Server
log_info "Step 11: Starting Mumble Server..."
sudo systemctl enable mumble-server
sudo systemctl start mumble-server
log_success "Mumble Server started"

# Step 12: Start Docker services
log_info "Step 12: Starting Docker services..."
cd /home/ubuntu
docker-compose up -d
log_success "Docker services started"

# Step 13: Wait for services to initialize
log_info "Step 13: Waiting for services to initialize (30 seconds)..."
sleep 30

# Step 14: Start Mr. Happy Orchestrator
log_info "Step 14: Starting Mr. Happy Orchestrator..."
python3 /home/ubuntu/mr_happy_orchestrator.py start &
log_success "Mr. Happy Orchestrator started"

# Final status
echo ""
echo "================================================================"
echo "     DEPLOYMENT COMPLETE!"
echo "================================================================"
echo ""
echo "Services Status:"
echo "  🎤 Mumble Server:      zen.lemehost.com:12847"
echo "  🏠 Home Assistant:     http://15.235.181.136:8123"
echo "  📊 Odoo ERP:           http://15.235.181.136:8069"
echo "  ☁️  Nextcloud:          http://15.235.181.136:8080"
echo "  🤖 Mr. Happy AI:       http://15.235.181.136:8000"
echo "  🗣️  Google Assistant:   http://15.235.181.136:3001"
echo "  🐳 Portainer:          http://15.235.181.136:9000"
echo ""
echo "Next Steps:"
echo "  1. Edit /home/ubuntu/.env with your API keys"
echo "  2. Access services using the URLs above"
echo "  3. Connect to Mumble with Mumla app"
echo "  4. Configure IFTTT for Google Assistant"
echo ""
echo "Manage Services:"
echo "  python3 /home/ubuntu/mr_happy_orchestrator.py [start|stop|restart|status]"
echo ""
echo "================================================================"
