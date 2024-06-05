<!-- SPDX-License-Identifier: Apache-2.0 -->

# nats-utilities
Small Utilities Application for NATS Testing

# nats-utilities
 
This application is an HTTP wrapper around Tazama's NATS implementation. At a very high level, this means you can send NATS messages to Tazama processors by sending an HTTP request to this service.
 
```mermaid
graph TD;
    A[Incoming Request] --> B{Parse Request};
    B -->|Success| C[Extract Data];
    C --> D[Log Details];
    D --> E{Configuration};
    E -->|JetStream| F[JetStream Consume];
    E -->|NATS| G[NATS Service Subscribe];
    F --> H[JetStream Publish];
    G --> I[NATS Service Publish];
    H --> J{Return Message};
    I --> J;
    J -->|Success| K[Set Response Status 200];
    K --> L[Respond with Success Message];
    J -->|Error| M[Set Response Status 500];
    M --> N[Respond with Error Message];
```
 
The application has two endpoints. One for NATS, and another for REST.
 
## Endpoints
 
`/` - Accessible with a `GET` method.
        - Provides a health check
`/health` - Accessible with a `GET` method.
        - Provides a health check
 
### NATS
Available on the path `natsPublish`
Unless if working with the TMS-API (this processor expects an HTTP request), this is the endpoint you would use in your requests.
 
 
### REST
Available on the path `restPublish`.
 
Supported method: `POST`
Message body:
 
```json
{
    "transaction": {},
    "endpoint": "",
    "natsConsumer": "",
    "functionName": ""
}
```
 
When targeting the TMS-API, you would want to use this endpoint.

