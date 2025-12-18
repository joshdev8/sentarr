# Home Assistant Integration for Sentarr

## Setup Instructions

### 1. Create Webhook Automation

Add this to your Home Assistant configuration or create via UI:

**File: `config/automations.yaml`** (or create via UI)

```yaml
# Basic webhook handler
- alias: Sentarr Alert
  description: Handle alerts from Plex Log Monitor
  trigger:
    - platform: webhook
      allowed_methods:
        - POST
      local_only: false
      webhook_id: plex_alert
  action:
    - service: persistent_notification.create
      data:
        title: "{{ trigger.json.title }}"
        message: "{{ trigger.json.message }}"
        notification_id: plex_alert

# Advanced: Mobile notification with dynamic priority
- alias: Sentarr - Mobile Alert
  description: Send mobile notification based on severity
  trigger:
    - platform: webhook
      allowed_methods:
        - POST
      local_only: false
      webhook_id: plex_alert
  action:
    - service: notify.mobile_app_your_phone
      data:
        title: "{{ trigger.json.title }}"
        message: "{{ trigger.json.message }}"
        data:
          priority: >
            {% if trigger.json.severity == 'critical' %}
              high
            {% elif trigger.json.severity == 'error' %}
              high
            {% else %}
              normal
            {% endif %}
          ttl: 0
          importance: high
          notification_icon: mdi:plex
          group: plex-alerts
          tag: "{{ trigger.json.details.Pattern | default('plex-alert') }}"

# Create sensor to track alerts
- alias: Sentarr - Update Sensor
  description: Track Plex error counts
  trigger:
    - platform: webhook
      allowed_methods:
        - POST
      local_only: false
      webhook_id: plex_alert
  action:
    - service: input_number.set_value
      target:
        entity_id: input_number.plex_error_count
      data:
        value: "{{ states('input_number.plex_error_count') | int + 1 }}"
```

### 2. Create Input Helpers (Optional)

For tracking error counts and status:

**File: `config/configuration.yaml`**

```yaml
input_number:
  plex_error_count:
    name: Plex Error Count
    initial: 0
    min: 0
    max: 1000
    step: 1
    icon: mdi:alert-circle

input_text:
  plex_last_error:
    name: Plex Last Error
    initial: "No errors"
    max: 255
    icon: mdi:alert

input_datetime:
  plex_last_alert:
    name: Plex Last Alert Time
    has_date: true
    has_time: true
```

### 3. Configure Sentarr

In your Sentarr `.env` file:

```env
WEBHOOK_ENABLED=true
CUSTOM_WEBHOOK_URL=http://homeassistant.local:8123/api/webhook/plex_alert
```

**Note:** Replace `homeassistant.local` with your Home Assistant IP address if DNS doesn't work.

### 4. Create Dashboard Card

Add this to your Lovelace dashboard:

```yaml
type: vertical-stack
cards:
  - type: entities
    title: Sentarr Status
    entities:
      - entity: input_number.plex_error_count
        name: Total Errors Today
      - entity: input_text.plex_last_error
        name: Last Error
      - entity: input_datetime.plex_last_alert
        name: Last Alert
    
  - type: history-graph
    title: Plex Error History
    hours_to_show: 24
    entities:
      - entity: input_number.plex_error_count

  - type: button
    name: Reset Error Count
    tap_action:
      action: call-service
      service: input_number.set_value
      service_data:
        entity_id: input_number.plex_error_count
        value: 0
```

### 5. Advanced: Conditional Notifications

Only notify during certain hours or for specific error types:

```yaml
- alias: Sentarr - Conditional Alert
  trigger:
    - platform: webhook
      allowed_methods:
        - POST
      local_only: false
      webhook_id: plex_alert
  condition:
    - condition: or
      conditions:
        # Only critical errors at night
        - condition: and
          conditions:
            - condition: time
              after: "22:00:00"
              before: "08:00:00"
            - condition: template
              value_template: "{{ trigger.json.severity == 'critical' }}"
        
        # All errors during daytime
        - condition: time
          after: "08:00:00"
          before: "22:00:00"
  action:
    - service: notify.mobile_app_your_phone
      data:
        title: "{{ trigger.json.title }}"
        message: "{{ trigger.json.message }}"
```

### 6. Integration with Other Services

#### Send to Telegram

```yaml
action:
  - service: notify.telegram
    data:
      title: "{{ trigger.json.title }}"
      message: "{{ trigger.json.message }}"
```

#### Create Persistent Notification

```yaml
action:
  - service: persistent_notification.create
    data:
      title: "{{ trigger.json.title }}"
      message: "{{ trigger.json.message }}"
      notification_id: "plex_{{ now().timestamp() | int }}"
```

#### Log to File

```yaml
action:
  - service: notify.file
    data:
      message: "{{ now() }} - {{ trigger.json.severity }} - {{ trigger.json.title }}: {{ trigger.json.message }}"
      target: /config/plex_alerts.log
```

### 7. Testing

Test your webhook from the command line:

```bash
curl -X POST "http://homeassistant.local:8123/api/webhook/plex_alert" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Alert",
    "message": "This is a test from Sentarr",
    "severity": "info",
    "timestamp": "2025-12-18T10:00:00",
    "details": {
      "Pattern": "test",
      "Count": 1
    }
  }'
```

## Webhook Payload Reference

The Sentarr sends this JSON structure:

```json
{
  "title": "Multiple Stream Errors Detected",
  "message": "Detected 5 errors in the last 5 minutes",
  "severity": "error",
  "timestamp": "2025-12-18T10:30:00.000000",
  "details": {
    "Pattern": "stream_error",
    "Count": 5,
    "Time Window": "5 minutes",
    "Latest Error": "ERROR - Playback error: ..."
  }
}
```

### Available Severity Levels

- `critical` - System-critical errors
- `error` - Standard errors exceeding threshold
- `warning` - Warning conditions
- `info` - Informational messages (startup, etc.)

### Available Patterns

- `stream_error`
- `database_error`
- `network_error`
- `auth_error`
- `scanner_error`
- `disk_error`
- `transcoding_warning`
- `performance_warning`
- `permission_warning`

## Troubleshooting

### Webhook not receiving data

1. Check Home Assistant logs
2. Verify webhook URL is correct
3. Test with curl command above
4. Check firewall settings

### Automation not triggering

1. Verify automation is enabled
2. Check automation traces in Home Assistant
3. Test webhook manually
4. Review Home Assistant logs

## Advanced Examples

### Create Binary Sensor for Plex Health

```yaml
binary_sensor:
  - platform: template
    sensors:
      plex_healthy:
        friendly_name: "Plex Server Healthy"
        value_template: >
          {{ (now() - states.input_datetime.plex_last_alert.last_changed).total_seconds() > 3600 }}
        device_class: problem
```

### Alert when Plex is unhealthy

```yaml
- alias: Plex Unhealthy Alert
  trigger:
    - platform: state
      entity_id: binary_sensor.plex_healthy
      to: 'off'
      for:
        minutes: 15
  action:
    - service: notify.mobile_app_your_phone
      data:
        title: "Plex Server Issues"
        message: "Plex has been experiencing errors for 15+ minutes"
```

## Tips

1. Use `local_only: false` if Sentarr runs in different Docker network
2. Consider using authentication tokens for security
3. Create separate webhooks for different severity levels
4. Use Home Assistant's built-in alerting for SMS/email if needed
5. Set up proper logging to track alert history
