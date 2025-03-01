
# Booko-DAV - Self-Hosted WebDAV for eBook Management

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Joshuajrodrigues/bookodav)

## Features

- Cloudflare global network implementation  
- 10GB free storage tier with R2  
- Native KOReader WebDAV compatibility  
- Basic authentication protection  
- Serverless architecture with minimal maintenance  
- Cross-platform WebDAV client support  

## Dashboard
![Screenshot 2025-03-01 at 14-57-13 BOOKO-DAV - Instructions](https://github.com/user-attachments/assets/4d52b438-2796-48be-b9a9-a2de587716ca)
![Screenshot 2025-03-01 at 14-57-25 BOOKO-DAV - Upload](https://github.com/user-attachments/assets/b6c4d827-eb6e-4b9a-b45c-e006069badef)
![Screenshot 2025-03-01 at 14-57-34 BOOKO-DAV - List](https://github.com/user-attachments/assets/86c602b9-1122-436b-832d-c202e0a169d9)


## Implementation Overview

```plaintext
┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│   Client    │ HTTP   │ Cloudflare   │  R2 API │  R2 Storage │
│ (KOReader)  │◄──────►│   Worker     │◄───────►│  (bookodav) │
└─────────────┘        └──────────────┘        └─────────────┘
```

## Setup

1. Create Cloudflare R2 bucket named `bookodav`  
2. Deploy worker bookodav-worker with required environment variables:  
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
## License

GNU General Public License v3.0 (GPL-3.0)

This means:  
- You may use, modify, and distribute this software  
- Any derivative work must be open source under same license  
- Commercial use requires source code availability  

Full license text: [LICENSE](LICENSE)

## Cost Structure (Cloudflare)

| Service         | Free Tier       | Paid Tier          |
|-----------------|-----------------|--------------------|
| R2 Storage      | 10GB            | $0.015/GB-month    |
| Requests        | 100,000/day     | $0.15/million      |
| Data Transfer   | 1GB/day         | $0.09/GB           |

## Development

Open to contributions and new features.
Contributions must maintain GPL-3.0 compliance. 

Copyright (c) [year] Joshua Rodrigues - Provided under GNU GPLv3
