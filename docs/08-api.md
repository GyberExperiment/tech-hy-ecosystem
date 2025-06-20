# API Documentation

## Overview

This document describes the main API endpoints for interacting with the TECH HY ecosystem, including token operations, staking, NFT management, and DAO governance.

## Authentication

- Most endpoints require wallet signature authentication (BSC wallet)
- Support for MetaMask and other BSC-compatible wallets
- Rate limiting: 100 requests per minute per IP address
- Some endpoints are public (e.g., fetching token stats)

## Endpoints

### 1. Token Operations

- `GET /api/tokens` — List all ecosystem tokens and their parameters
- `GET /api/tokens/:symbol` — Get detailed info about a specific token
- `POST /api/tokens/transfer` — Transfer tokens between wallets (requires signature)

### 2. Staking

- `GET /api/staking/vc` — Get VC staking stats and user positions
- `POST /api/staking/vc` — Stake VC tokens (requires signature)
- `GET /api/staking/vg` — Get VG staking stats and user positions
- `POST /api/staking/vg` — Stake VG tokens (requires signature)
- `POST /api/staking/unstake` — Unstake tokens (requires signature)

### 3. NFT Management

- `GET /api/nfts` — List all NFTs in the user's wallet
- `GET /api/nfts/:id` — Get NFT metadata and status
- `POST /api/nfts/apply-booster` — Apply NFT booster to staking (requires signature)
- `POST /api/nfts/upgrade` — Upgrade NFT level (requires signature)

### 4. DAO Governance

- `GET /api/dao/proposals` — List all active proposals
- `GET /api/dao/proposals/:id` — Get proposal details
- `POST /api/dao/proposals` — Submit a new proposal (requires signature)
- `POST /api/dao/vote` — Vote on a proposal (requires signature)

### 5. Analytics and Stats

- `GET /api/stats/tokens` — Get token supply, holders, and transaction stats
- `GET /api/stats/staking` — Get staking stats for VC and VG
- `GET /api/stats/nfts` — Get NFT distribution and usage stats

## WebSocket Events

- `ws://api.tech-hy.com/events` — Real-time updates for:
  - Token transfers
  - Staking events
  - NFT upgrades
  - DAO proposals and votes

## Error Handling

- All endpoints return standard HTTP status codes
- Error responses include a JSON object with `error` and `message` fields

## Example Request

```http
POST /api/staking/vg
Content-Type: application/json
Authorization: Bearer <wallet-signature>

{
  "amount": 1000,
  "nft_booster_id": "nft123"
}
```

## Related Documents

- [VC Token Staking and NFT Boosters](./04-vc-staking.md)
- [VG Token Staking](./05-vg-staking.md)
- [Investor's Hand NFT Collection](./04.5-investors-hand-nft.md.md)
- [Governance and DAO](./07-governance.md) 