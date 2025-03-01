
# Booko-DAV - Self-Deployable WebDAV for eBook Management

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Joshuajrodrigues/bookodav)

## Features
 
- 10GB free storage tier with R2  
- Native KOReader WebDAV compatibility  
- Basic authentication protection  
- Serverless architecture with minimal maintenance  
- Cross-platform WebDAV client support  

## Dashboard
![Screenshot 2025-03-01 at 15-01-01 BOOKO-DAV - Instructions](https://github.com/user-attachments/assets/92c9f242-6e8a-4236-b9a0-45b1a77cc3b6)
![Screenshot 2025-03-01 at 15-01-17 BOOKO-DAV - Upload](https://github.com/user-attachments/assets/5f02ea04-4d8b-4d92-bde3-6387acb16209)
![Screenshot 2025-03-01 at 15-01-30 BOOKO-DAV - List](https://github.com/user-attachments/assets/18288766-1395-4851-9bb5-c7d516160959)



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
## Cost Structure (Cloudflare)

| Service         | Free Tier       | Paid Tier          |
|-----------------|-----------------|--------------------|
| R2 Storage      | 10GB            | $0.015/GB-month    |
| Requests        | 100,000/day     | $0.15/million      |

## Development

Open to contributions and new features.
Contributions must maintain GPL-3.0 compliance. 


