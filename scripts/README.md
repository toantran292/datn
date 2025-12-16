# Demo Data Scripts

Scripts to seed demo data for all services (except PM).

## Prerequisites

- Node.js 18+
- Docker containers running (PostgreSQL, MongoDB)

## Installation

```bash
cd scripts
npm install
```

## Usage

### Seed All Demo Data

```bash
npm run seed:all
```

This will seed:
- **Identity Service**: Users, Organizations, Memberships, Role Bindings
- **Chat Service**: Rooms, Messages, Reactions, Members, AI Configs
- **Notification Service**: Notifications
- **Tenant-BFF Service**: Reports (MongoDB)

### Seed Individual Services

```bash
# PostgreSQL services (Identity, Chat, Notification)
npm run seed

# MongoDB service (Reports)
npm run seed:reports
```

### Clear All Demo Data

```bash
npm run clear
```

## Demo Users

| Email | Display Name | Password |
|-------|--------------|----------|
| admin@demo.com | Admin User | Demo@123 |
| nguyen.van.a@demo.com | Nguyen Van A | Demo@123 |
| tran.thi.b@demo.com | Tran Thi B | Demo@123 |
| le.van.c@demo.com | Le Van C | Demo@123 |
| pham.thi.d@demo.com | Pham Thi D | Demo@123 |

## Demo Organizations

| Slug | Display Name |
|------|--------------|
| acme-corp | ACME Corporation |
| tech-startup | Tech Startup Inc |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| POSTGRES_HOST | localhost | PostgreSQL host |
| POSTGRES_PORT | 41000 | PostgreSQL port |
| POSTGRES_USER | uts | PostgreSQL user |
| POSTGRES_PASSWORD | uts_dev_pw | PostgreSQL password |
| IDENTITY_DB | identity | Identity database name |
| CHAT_DB | chat_db | Chat database name |
| NOTIFICATION_DB | notification_db | Notification database name |
| MONGODB_URI | mongodb://localhost:27017 | MongoDB connection string |
| MONGODB_DB | tenant_bff | MongoDB database name |

## What Gets Created

### Identity Service
- 5 demo users with verified emails
- 2 organizations (ACME Corp, Tech Startup)
- All users added to both organizations
- Role bindings (OWNER for admin, MEMBER for others)

### Chat Service
- 5 channels per organization (general, engineering, marketing, leadership, random)
- All users added as room members
- 50-150 messages with realistic timestamps
- Thread replies and reactions
- DM rooms between users
- AI configs for engineering and general channels

### Notification Service
- 10-15 notifications per user
- Mixed types: org invitations, mentions, system announcements
- Some read, some unread

### Tenant-BFF (Reports)
- 6 sample reports with different types and statuses
- SUMMARY, ANALYSIS, EXTRACTION, COMPARISON, CUSTOM types
- PENDING, PROCESSING, COMPLETED, FAILED statuses
