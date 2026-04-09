# Azure Deployment Plan

## Project Overview

| Property | Value |
|----------|-------|
| **Project Name** | Deep Beauty |
| **Type** | Next.js 16 Full-Stack Web Application |
| **Mode** | NEW (First-time deployment) |
| **Recipe** | AZD (Azure Developer CLI) |

## Application Architecture

### Frontend
- **Framework**: Next.js 16.2.2 with App Router
- **UI**: React 19 + Tailwind CSS v4 + Framer Motion
- **Icons**: Heroicons + Lucide React

### Backend/Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payment Gateway**: MyFatoorah

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
MYFATOORAH_API_URL=
MYFATOORAH_TOKEN=
```

## Azure Resources

| Resource | Tier | Purpose |
|----------|------|---------|
| Container Apps | Standard | Host Next.js application |
| Container Registry | Basic | Store Docker images |

## Deployment Strategy

1. **Build**: Docker multi-stage build for Next.js
2. **Host**: Azure Container Apps
3. **CDN**: Azure Front Door (optional for production)

## Plan Status

**Status**: `Draft` - Pending user approval

## Steps to Execute

### Phase 1: Preparation
1. Generate Dockerfile for Next.js
2. Create azure.yaml configuration
3. Create Bicep infrastructure templates

### Phase 2: Deployment
1. Build and push Docker image to ACR
2. Deploy Container App
3. Configure environment variables

---

**Approval Required**: Review this plan and confirm to proceed with deployment preparation.
