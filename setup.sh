#!/bin/bash

# Sentarr Setup Script
# This script helps you configure the Sentarr container

set -e

echo "=================================================="
echo "   Plex Log Monitor - Setup Wizard"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}Warning: .env file already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Aborting setup."
        exit 0
    fi
fi

# Create .env file
cp .env.example .env

echo ""
echo "=== Step 1: Plex Log Path ==="
echo ""
echo "Please enter the path to your Plex logs on the host system."
echo "This is typically where your Plex config is mounted."
echo ""
echo "Examples:"
echo "  - /opt/plex/config"
echo "  - /mnt/user/appdata/plex"
echo "  - ~/plex/config"
echo ""
read -p "Enter Plex config path: " plex_config

# Validate path
if [ ! -d "$plex_config" ]; then
    echo -e "${RED}Warning: Directory does not exist: $plex_config${NC}"
    read -p "Continue anyway? (y/N): " continue
    if [[ ! $continue =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update docker-compose.yml
LOG_PATH="${plex_config}/Library/Application Support/Plex Media Server/Logs"
echo ""
echo "Will mount: $LOG_PATH"
echo ""

# Use sed to update docker-compose.yml
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|/path/to/plex/config/Library/Application Support/Plex Media Server/Logs|${LOG_PATH}|g" docker-compose.yml
else
    # Linux
    sed -i "s|/path/to/plex/config/Library/Application Support/Plex Media Server/Logs|${LOG_PATH}|g" docker-compose.yml
fi

echo ""
echo "=== Step 2: Alert Configuration ==="
echo ""
echo "Which notification method would you like to use?"
echo "1) Email (SMTP)"
echo "2) Discord"
echo "3) Slack"
echo "4) Custom Webhook (Home Assistant, ntfy, etc.)"
echo "5) Multiple methods"
echo "6) Configure manually later"
echo ""
read -p "Select option (1-6): " notif_choice

configure_email() {
    echo ""
    echo "--- Email Configuration ---"
    read -p "SMTP Server (e.g., smtp.gmail.com): " smtp_server
    read -p "SMTP Port (default 587): " smtp_port
    smtp_port=${smtp_port:-587}
    read -p "SMTP Username: " smtp_user
    read -s -p "SMTP Password (hidden): " smtp_pass
    echo ""
    read -p "From Email: " email_from
    read -p "To Email: " email_to
    
    sed -i'' -e "s/EMAIL_ENABLED=false/EMAIL_ENABLED=true/" .env
    sed -i'' -e "s|SMTP_SERVER=.*|SMTP_SERVER=$smtp_server|" .env
    sed -i'' -e "s|SMTP_PORT=.*|SMTP_PORT=$smtp_port|" .env
    sed -i'' -e "s|SMTP_USER=.*|SMTP_USER=$smtp_user|" .env
    sed -i'' -e "s|SMTP_PASSWORD=.*|SMTP_PASSWORD=$smtp_pass|" .env
    sed -i'' -e "s|EMAIL_FROM=.*|EMAIL_FROM=$email_from|" .env
    sed -i'' -e "s|EMAIL_TO=.*|EMAIL_TO=$email_to|" .env
    
    echo -e "${GREEN}Email configuration saved!${NC}"
}

configure_discord() {
    echo ""
    echo "--- Discord Configuration ---"
    echo "To create a Discord webhook:"
    echo "1. Go to Server Settings > Integrations > Webhooks"
    echo "2. Create a new webhook"
    echo "3. Copy the webhook URL"
    echo ""
    read -p "Discord Webhook URL: " discord_url
    
    sed -i'' -e "s/DISCORD_ENABLED=false/DISCORD_ENABLED=true/" .env
    sed -i'' -e "s|DISCORD_WEBHOOK_URL=.*|DISCORD_WEBHOOK_URL=$discord_url|" .env
    
    echo -e "${GREEN}Discord configuration saved!${NC}"
}

configure_slack() {
    echo ""
    echo "--- Slack Configuration ---"
    echo "To create a Slack webhook:"
    echo "1. Go to https://api.slack.com/apps"
    echo "2. Create an app or select existing"
    echo "3. Enable Incoming Webhooks"
    echo "4. Copy the webhook URL"
    echo ""
    read -p "Slack Webhook URL: " slack_url
    
    sed -i'' -e "s/SLACK_ENABLED=false/SLACK_ENABLED=true/" .env
    sed -i'' -e "s|SLACK_WEBHOOK_URL=.*|SLACK_WEBHOOK_URL=$slack_url|" .env
    
    echo -e "${GREEN}Slack configuration saved!${NC}"
}

configure_webhook() {
    echo ""
    echo "--- Custom Webhook Configuration ---"
    echo "Examples:"
    echo "  - Home Assistant: http://homeassistant.local:8123/api/webhook/plex_alert"
    echo "  - ntfy.sh: https://ntfy.sh/your-topic"
    echo "  - Gotify: https://gotify.example.com/message?token=TOKEN"
    echo ""
    read -p "Webhook URL: " webhook_url
    
    sed -i'' -e "s/WEBHOOK_ENABLED=false/WEBHOOK_ENABLED=true/" .env
    sed -i'' -e "s|CUSTOM_WEBHOOK_URL=.*|CUSTOM_WEBHOOK_URL=$webhook_url|" .env
    
    echo -e "${GREEN}Webhook configuration saved!${NC}"
}

case $notif_choice in
    1)
        configure_email
        ;;
    2)
        configure_discord
        ;;
    3)
        configure_slack
        ;;
    4)
        configure_webhook
        ;;
    5)
        echo ""
        echo "Configure each method you want to use:"
        read -p "Configure Email? (y/N): " email
        [[ $email =~ ^[Yy]$ ]] && configure_email
        
        read -p "Configure Discord? (y/N): " discord
        [[ $discord =~ ^[Yy]$ ]] && configure_discord
        
        read -p "Configure Slack? (y/N): " slack
        [[ $slack =~ ^[Yy]$ ]] && configure_slack
        
        read -p "Configure Webhook? (y/N): " webhook
        [[ $webhook =~ ^[Yy]$ ]] && configure_webhook
        ;;
    6)
        echo "Skipping notification configuration."
        echo "Edit .env file manually to configure notifications."
        ;;
    *)
        echo "Invalid option. Skipping notification configuration."
        ;;
esac

echo ""
echo "=== Step 3: Alert Thresholds ==="
echo ""
read -p "Error threshold (default 5): " threshold
threshold=${threshold:-5}
read -p "Time window in minutes (default 5): " time_window
time_window=${time_window:-5}
read -p "Alert cooldown in minutes (default 15): " cooldown
cooldown=${cooldown:-15}

sed -i'' -e "s/ERROR_THRESHOLD=.*/ERROR_THRESHOLD=$threshold/" .env
sed -i'' -e "s/TIME_WINDOW_MINUTES=.*/TIME_WINDOW_MINUTES=$time_window/" .env
sed -i'' -e "s/ALERT_COOLDOWN_MINUTES=.*/ALERT_COOLDOWN_MINUTES=$cooldown/" .env

echo ""
echo "=================================================="
echo "   Setup Complete!"
echo "=================================================="
echo ""
echo "Configuration summary:"
echo "  - Plex logs: $LOG_PATH"
echo "  - Error threshold: $threshold errors in $time_window minutes"
echo "  - Alert cooldown: $cooldown minutes"
echo ""
echo "Next steps:"
echo "  1. Review .env file: nano .env"
echo "  2. Build container: docker-compose build"
echo "  3. Start monitor: docker-compose up -d"
echo "  4. View logs: docker-compose logs -f sentarr"
echo ""
echo -e "${GREEN}Happy monitoring!${NC}"
