#!/bin/bash

# Sentarr - Testing & Validation Script
# Tests notifications, configuration, and log monitoring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if .env exists
check_env() {
    print_header "Configuration Check"
    
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        echo "Run './setup.sh' or copy .env.example to .env"
        exit 1
    fi
    print_success ".env file exists"
    
    # Load .env
    export $(cat .env | grep -v '^#' | xargs)
    
    # Check at least one notification is enabled
    if [[ "$EMAIL_ENABLED" != "true" ]] && \
       [[ "$DISCORD_ENABLED" != "true" ]] && \
       [[ "$SLACK_ENABLED" != "true" ]] && \
       [[ "$WEBHOOK_ENABLED" != "true" ]]; then
        print_warning "No notification methods enabled!"
        echo "Enable at least one notification method in .env"
    else
        print_success "At least one notification method is enabled"
    fi
}

# Test Docker setup
test_docker() {
    print_header "Docker Setup Check"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed!"
        exit 1
    fi
    print_success "docker-compose is installed"
    
    # Check if Dockerfile exists
    if [ ! -f Dockerfile ]; then
        print_error "Dockerfile not found!"
        exit 1
    fi
    print_success "Dockerfile exists"
    
    # Check if docker-compose.yml exists
    if [ ! -f docker-compose.yml ]; then
        print_error "docker-compose.yml not found!"
        exit 1
    fi
    print_success "docker-compose.yml exists"
}

# Test Discord webhook
test_discord() {
    print_header "Discord Webhook Test"
    
    if [[ "$DISCORD_ENABLED" != "true" ]]; then
        print_warning "Discord is not enabled"
        return
    fi
    
    if [ -z "$DISCORD_WEBHOOK_URL" ]; then
        print_error "DISCORD_WEBHOOK_URL is not set"
        return
    fi
    
    print_info "Sending test message to Discord..."
    
    PAYLOAD=$(cat <<EOF
{
  "embeds": [{
    "title": "Sentarr - Test Alert",
    "description": "This is a test notification from Sentarr setup",
    "color": 3447003,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "footer": {
      "text": "Sentarr Test"
    },
    "fields": [
      {
        "name": "Status",
        "value": "Testing",
        "inline": true
      },
      {
        "name": "Result",
        "value": "If you see this, it works!",
        "inline": true
      }
    ]
  }]
}
EOF
)
    
    if curl -X POST "$DISCORD_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        --silent --output /dev/null --fail; then
        print_success "Discord webhook test successful!"
        echo "Check your Discord channel for the test message"
    else
        print_error "Discord webhook test failed!"
        echo "Check your webhook URL and try again"
    fi
}

# Test Slack webhook
test_slack() {
    print_header "Slack Webhook Test"
    
    if [[ "$SLACK_ENABLED" != "true" ]]; then
        print_warning "Slack is not enabled"
        return
    fi
    
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        print_error "SLACK_WEBHOOK_URL is not set"
        return
    fi
    
    print_info "Sending test message to Slack..."
    
    PAYLOAD=$(cat <<EOF
{
  "attachments": [{
    "fallback": "Sentarr - Test Alert",
    "color": "good",
    "title": "Sentarr - Test Alert",
    "text": "This is a test notification from Sentarr setup",
    "fields": [
      {
        "title": "Status",
        "value": "Testing",
        "short": true
      },
      {
        "title": "Result",
        "value": "If you see this, it works!",
        "short": true
      }
    ],
    "footer": "Sentarr Test",
    "ts": $(date +%s)
  }]
}
EOF
)
    
    if curl -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        --silent --output /dev/null --fail; then
        print_success "Slack webhook test successful!"
        echo "Check your Slack channel for the test message"
    else
        print_error "Slack webhook test failed!"
        echo "Check your webhook URL and try again"
    fi
}

# Test custom webhook
test_webhook() {
    print_header "Custom Webhook Test"
    
    if [[ "$WEBHOOK_ENABLED" != "true" ]]; then
        print_warning "Custom webhook is not enabled"
        return
    fi
    
    if [ -z "$CUSTOM_WEBHOOK_URL" ]; then
        print_error "CUSTOM_WEBHOOK_URL is not set"
        return
    fi
    
    print_info "Sending test message to custom webhook..."
    
    PAYLOAD=$(cat <<EOF
{
  "title": "Sentarr - Test Alert",
  "message": "This is a test notification from Sentarr setup",
  "severity": "info",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000000)",
  "details": {
    "Status": "Testing",
    "Result": "If you see this, it works!"
  }
}
EOF
)
    
    if curl -X POST "$CUSTOM_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        --silent --output /dev/null --fail; then
        print_success "Custom webhook test successful!"
        echo "Check your webhook receiver for the test message"
    else
        print_error "Custom webhook test failed!"
        echo "Check your webhook URL and receiver configuration"
    fi
}

# Test email (basic SMTP connection)
test_email() {
    print_header "Email Configuration Test"
    
    if [[ "$EMAIL_ENABLED" != "true" ]]; then
        print_warning "Email is not enabled"
        return
    fi
    
    if [ -z "$SMTP_SERVER" ] || [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASSWORD" ]; then
        print_error "Email configuration incomplete"
        echo "Required: SMTP_SERVER, SMTP_USER, SMTP_PASSWORD"
        return
    fi
    
    print_info "Testing SMTP connection to $SMTP_SERVER:$SMTP_PORT..."
    
    # Try to connect to SMTP server
    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$SMTP_SERVER/$SMTP_PORT" 2>/dev/null; then
        print_success "SMTP server is reachable"
        print_info "To fully test email, start the container and trigger an alert"
    else
        print_error "Cannot connect to SMTP server"
        echo "Check SMTP_SERVER and SMTP_PORT settings"
    fi
}

# Check volume mount
check_volume() {
    print_header "Volume Mount Check"
    
    # Extract volume path from docker-compose.yml
    VOLUME_PATH=$(grep -A 1 "volumes:" docker-compose.yml | grep -v "volumes:" | awk -F: '{print $1}' | sed 's/^[[:space:]]*//' | sed 's/- //' | head -n 1)
    
    if [ -z "$VOLUME_PATH" ]; then
        print_error "Could not extract volume path from docker-compose.yml"
        return
    fi
    
    print_info "Checking volume mount: $VOLUME_PATH"
    
    if [ ! -d "$VOLUME_PATH" ]; then
        print_error "Volume path does not exist!"
        echo "Path: $VOLUME_PATH"
        echo "Update docker-compose.yml with correct Plex log path"
        return
    fi
    
    print_success "Volume path exists"
    
    # Check if log files exist
    if ls "$VOLUME_PATH"/*.log 1> /dev/null 2>&1; then
        LOG_COUNT=$(ls "$VOLUME_PATH"/*.log | wc -l)
        print_success "Found $LOG_COUNT log file(s)"
    else
        print_warning "No .log files found in volume path"
        echo "Plex may not be generating logs, or path may be incorrect"
    fi
}

# Build test
test_build() {
    print_header "Docker Build Test"
    
    print_info "Building Docker image..."
    
    if docker-compose build --no-cache 2>&1 | tee /tmp/docker-build.log; then
        print_success "Docker image built successfully!"
    else
        print_error "Docker build failed!"
        echo "Check /tmp/docker-build.log for details"
        exit 1
    fi
}

# Container test
test_container() {
    print_header "Container Runtime Test"
    
    print_info "Starting container in test mode..."
    
    # Stop existing container if running
    docker-compose down 2>/dev/null || true
    
    # Start container
    if docker-compose up -d; then
        print_success "Container started"
        
        # Wait for container to initialize
        sleep 3
        
        # Check if container is still running
        if docker-compose ps | grep -q "Up"; then
            print_success "Container is running"
            
            # Show last 20 lines of logs
            echo ""
            print_info "Recent container logs:"
            docker-compose logs --tail=20 sentarr
            
        else
            print_error "Container stopped unexpectedly"
            echo ""
            echo "Container logs:"
            docker-compose logs sentarr
            exit 1
        fi
    else
        print_error "Failed to start container"
        exit 1
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Sentarr Testing Menu"
    echo "========================="
    echo ""
    echo "1) Run all tests"
    echo "2) Test configuration"
    echo "3) Test Docker setup"
    echo "4) Test Discord webhook"
    echo "5) Test Slack webhook"
    echo "6) Test custom webhook"
    echo "7) Test email (connection only)"
    echo "8) Check volume mount"
    echo "9) Build Docker image"
    echo "10) Test container runtime"
    echo "0) Exit"
    echo ""
    read -p "Select option: " choice
    
    case $choice in
        1)
            check_env
            test_docker
            check_volume
            test_discord
            test_slack
            test_webhook
            test_email
            test_build
            test_container
            ;;
        2) check_env ;;
        3) test_docker ;;
        4) check_env && test_discord ;;
        5) check_env && test_slack ;;
        6) check_env && test_webhook ;;
        7) check_env && test_email ;;
        8) check_volume ;;
        9) test_build ;;
        10) test_container ;;
        0) exit 0 ;;
        *) echo "Invalid option" ;;
    esac
    
    show_menu
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    show_menu
else
    case $1 in
        all)
            check_env
            test_docker
            check_volume
            test_discord
            test_slack
            test_webhook
            test_email
            test_build
            test_container
            ;;
        config) check_env ;;
        docker) test_docker ;;
        discord) check_env && test_discord ;;
        slack) check_env && test_slack ;;
        webhook) check_env && test_webhook ;;
        email) check_env && test_email ;;
        volume) check_volume ;;
        build) test_build ;;
        container) test_container ;;
        *)
            echo "Usage: $0 [all|config|docker|discord|slack|webhook|email|volume|build|container]"
            echo "Or run without arguments for interactive menu"
            exit 1
            ;;
    esac
fi
