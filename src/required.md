# Server Message Format Requirements

This document outlines the required message format for the tunnel server to ensure proper communication with the Pori proxy client.

## Current Issue

The proxy client is failing to parse incoming messages because required fields are missing from the server's message format.

**Error encountered:**

```
missing field 'version' at line 1 column 190
```

## Required Message Structure

All messages sent from the server must include the following structure:

### Complete Message Format

```json
{
  "envelope": {
    "tunnel_id": "tunnel_1752411737413",
    "client_id": "client_msg_e262b1fcd5f749a7"
  },
  "message": {
    "metadata": {
      "id": "msg_e262b1fcd5f749a7",
      "message_type": "http_request",
      "version": "1.0.0",
      "timestamp": 1752411737413,
      "priority": "normal",
      "delivery_mode": "at_least_once",
      "encoding": "json"
    },
    "payload": {
      "type": "Http",
      "data": {
        "type": "Request",
        "method": "GET",
        "url": "/hh",
        "headers": {
          "connection": "upgrade",
          "host": "pay.vpu.world"
        },
        "body": null,
        "requestId": "R0X39398B820AB9"
      }
    }
  }
}
```

## Missing Fields in Current Server Implementation

The server is currently NOT sending these required fields:

### 1. Message Metadata Fields

| Field | Type | Required | Description | Example Value |
|-------|------|----------|-------------|---------------|
| `version` | string | **YES** | Protocol version | `"1.0.0"` |
| `priority` | string | **YES** | Message priority | `"normal"` |
| `delivery_mode` | string | **YES** | Delivery guarantee | `"at_least_once"` |
| `encoding` | string | **YES** | Message encoding format | `"json"` |

### 2. Valid Enum Values

#### Priority Values

- `"low"`
- `"normal"` *(recommended default)*
- `"high"`
- `"critical"`

#### Delivery Mode Values

- `"fire_and_forget"`
- `"at_most_once"`
- `"at_least_once"` *(recommended default)*
- `"exactly_once"`

#### Encoding Values

- `"json"` *(recommended default)*
- `"binary"`
- `"compressed"`

## Server Implementation Changes Required

### Before (Current - Failing)

```json
{
  "envelope": {
    "tunnel_id": "tunnel_1752411737413",
    "client_id": "client_msg_e262b1fcd5f749a7"
  },
  "message": {
    "metadata": {
      "id": "msg_e262b1fcd5f749a7",
      "message_type": "http_request",
      "timestamp": 1752411737413
    },
    "payload": {
      "type": "Http",
      "data": {
        "type": "Request",
        "method": "GET",
        "url": "/hh",
        "headers": { /* ... */ },
        "body": null,
        "requestId": "R0X39398B820AB9"
      }
    }
  }
}
```

### After (Required - Working)

```json
{
  "envelope": {
    "tunnel_id": "tunnel_1752411737413",
    "client_id": "client_msg_e262b1fcd5f749a7"
  },
  "message": {
    "metadata": {
      "id": "msg_e262b1fcd5f749a7",
      "message_type": "http_request",
      "version": "1.0.0",
      "timestamp": 1752411737413,
      "priority": "normal",
      "delivery_mode": "at_least_once",
      "encoding": "json"
    },
    "payload": {
      "type": "Http",
      "data": {
        "type": "Request",
        "method": "GET",
        "url": "/hh",
        "headers": { /* ... */ },
        "body": null,
        "requestId": "R0X39398B820AB9"
      }
    }
  }
}
```

## Message Types That Need Updates

All message types sent by the server require these metadata fields:

1. **HTTP Request Messages** (`message_type: "http_request"`)
2. **Authentication Messages** (`message_type: "auth"`)
3. **Control Messages** (`message_type: "control"`)
4. **Error Messages** (`message_type: "error"`)

## Recommended Server Code Changes

### Metadata Template (Language Agnostic)

```javascript
// Example in JavaScript/Node.js
const createMessageMetadata = (messageId, messageType) => ({
  id: messageId,
  message_type: messageType,
  version: "1.0.0",
  timestamp: Date.now(),
  priority: "normal",
  delivery_mode: "at_least_once",
  encoding: "json"
});

// Usage
const metadata = createMessageMetadata("msg_123", "http_request");
```

```python
# Example in Python
def create_message_metadata(message_id, message_type):
    return {
        "id": message_id,
        "message_type": message_type,
        "version": "1.0.0",
        "timestamp": int(time.time() * 1000),
        "priority": "normal",
        "delivery_mode": "at_least_once",
        "encoding": "json"
    }

# Usage
metadata = create_message_metadata("msg_123", "http_request")
```

## Testing

Once the server includes these fields, the proxy client should successfully:

1. Parse incoming messages without errors
2. Log `INCOMING REQUEST: GET /hh` for HTTP requests
3. Process and forward requests to the local server
4. Send responses back through the tunnel

## Priority

This is a **blocking issue** that prevents the proxy from functioning. The server must include these required metadata fields for the tunnel communication to work.

## Contact

If you have questions about this message format, please refer to:

- `docs/protocol.md` - Complete protocol documentation
- `docs/proxy.md` - Proxy server implementation guide
- `src/protocol/messages.rs` - Message structure definitions
