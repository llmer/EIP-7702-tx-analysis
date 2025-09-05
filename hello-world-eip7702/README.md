# EIP-7702 Hello World - Batch Transfer System

A simple example demonstrating how to:
1. Set up an EOA with EIP-7702 delegation
2. Get token approvals from users
3. Execute batch transfers

## Overview

This example shows how to upgrade an EOA to use Coinbase's Smart Account implementation for batch transfers.

## Prerequisites

- Node.js & npm
- Foundry (for deployment and testing)
- A wallet with some ETH on Base or Base Sepolia
- Access to Base RPC

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment:
```bash
cp .env.example .env
# Edit .env with your private key and RPC URL
```

3. Deploy test tokens (optional for testing):
```bash
forge script script/DeployTestTokens.s.sol --rpc-url $RPC_URL --broadcast
```

4. Run the example:
```bash
# Set up EIP-7702 delegation
npm run setup-delegation

# Execute batch transfers
npm run batch-transfer
```

## How It Works

### 1. EIP-7702 Setup
The EOA delegates to Coinbase's Smart Account implementation at `0x000100abaad02f1cfc8bbe32bd5a564817339e72`

### 2. User Approvals
Users approve the EOA to transfer their tokens using standard ERC-20 `approve()`

### 3. Batch Execution
The delegated EOA can now call `executeBatch()` to transfer multiple tokens in one transaction

## Project Structure

```
├── contracts/
│   ├── TestToken.sol         # Simple ERC-20 for testing
│   └── IBatchExecutor.sol    # Interface for batch execution
├── scripts/
│   ├── setup-delegation.js   # Set up EIP-7702 delegation
│   ├── batch-transfer.js     # Execute batch transfers
│   └── get-approvals.js      # Helper to get user approvals
├── test/
│   └── BatchTransfer.t.sol   # Foundry tests
└── package.json
```

## Security Notes

⚠️ **IMPORTANT**: 
- Only delegate to trusted smart account implementations
- Users should understand they're approving a delegated EOA
- Always verify the implementation contract before delegating
- This is example code - audit before production use

## License

MIT