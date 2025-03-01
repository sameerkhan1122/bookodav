
# Booko-DAV - Self-Hosted WebDAV for eBook Management

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Joshuajrodrigues/bookodav)

## Features

- Cloudflare global network implementation  
- 10GB free storage tier with R2  
- Native KOReader WebDAV compatibility  
- Basic authentication protection  
- Serverless architecture with minimal maintenance  
- Cross-platform WebDAV client support  

## License

GNU General Public License v3.0 (GPL-3.0)

This means:  
- You may use, modify, and distribute this software  
- Any derivative work must be open source under same license  
- Commercial use requires source code availability  

Full license text: [LICENSE](LICENSE)

## Implementation Overview

```plaintext
┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│   Client    │ HTTP   │ Cloudflare   │  R2 API │  R2 Storage │
│ (KOReader)  │◄──────►│   Worker     │◄───────►│  (bookodav) │
└─────────────┘        └──────────────┘        └─────────────┘
```

## Setup

1. Create Cloudflare R2 bucket named `bookodav`  
2. Deploy worker with required environment variables:  
   - `USERNAME`: Authentication username  
   - `PASSWORD`: Authentication password  


## Integration

KOReader Configuration:

```yaml
WebDAV:
  URL: https://[worker-subdomain].workers.dev
  Username: [your-username]
  Password: [your-password]
```

## Cost Structure (Cloudflare)

| Service         | Free Tier       | Paid Tier          |
|-----------------|-----------------|--------------------|
| R2 Storage      | 10GB            | $0.015/GB-month    |
| Requests        | 100,000/day     | $0.15/million      |
| Data Transfer   | 1GB/day         | $0.09/GB           |

## Development

Contributions must maintain GPL-3.0 compliance. 

Copyright (c) [year] Joshua Rodrigues - Provided under GNU GPLv3
