# EIP-7702 Transaction Analysis

This repository contains an analysis of an EIP-7702 transaction on Base, demonstrating how account abstraction enables batch token transfers from an EOA.

## Overview

EIP-7702 allows Externally Owned Accounts (EOAs) to temporarily set code, enabling smart contract functionality without deploying a new contract. This analysis examines a real transaction that executes 91 ERC-20 token transfers in a single transaction.

## Transaction Details

- **Transaction Hash**: [`0x02c197f056402ea45852f432d0b3e26425a9737f5ebb7a7836e706bc2db1abea`](https://basescan.org/tx/0x02c197f056402ea45852f432d0b3e26425a9737f5ebb7a7836e706bc2db1abea)
- **Network**: Base
- **Wallet**: `0x77130abfcc6e99aeb8c72fa4a1bf1c71c8821fb5`
- **Delegated Implementation**: `0x000100abaad02f1cfc8bbe32bd5a564817339e72` (Coinbase Smart Account)

## Files

- [`findings.md`](./findings.md) - Detailed analysis findings and technical explanation
- [`repro.md`](./repro.md) - Step-by-step instructions to reproduce the analysis
- [`README.md`](./README.md) - This file

## Quick Start

To verify the findings yourself, you'll need:
1. Foundry installed (for `cast` commands)
2. Access to a Base RPC endpoint

Run the verification:
```bash
# Set RPC URL
export RPC_URL="https://api.developer.coinbase.com/rpc/v1/base/REDACT"

# Check EIP-7702 delegation
cast code 0x77130abfcc6e99aeb8c72fa4a1bf1c71c8821fb5 --rpc-url $RPC_URL

# Trace the transaction
cast run 0x02c197f056402ea45852f432d0b3e26425a9737f5ebb7a7836e706bc2db1abea \
  --rpc-url $RPC_URL --quick
```

## Key Insights

1. **EIP-7702 in Production**: This transaction demonstrates EIP-7702 account abstraction working on Base mainnet
2. **Batch Operations**: 91 token transfers executed in a single transaction
3. **Gas Efficiency**: Significant gas savings compared to individual transactions
4. **User Experience**: Users sign once for multiple operations
5. **No Address Change**: EOA keeps its original address while gaining smart contract capabilities

## How EIP-7702 Works

### Delegation Bytecode Structure
When an EOA uses EIP-7702, its code is set to a special format:
```
0xef0100[20-byte-address]
```

Example from this transaction:
```
0xef0100000100abaad02f1cfc8bbe32bd5a564817339e72
└─┬──┘└────────────────┬──────────────────┘
  │                     │
  │                     └── Contract: 0x000100abaad02f1cfc8bbe32bd5a564817339e72
  └── EIP-7702 prefix (always 0xef0100)
```

### Execution Flow
```
EOA with delegation bytecode (0xef0100 + implementation address)
    ↓
EVM detects delegation and executes implementation code
    ↓
Smart Account Implementation processes the transaction
    ↓
Batch execution of multiple operations
```

## Resources

- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [Coinbase Developer Platform - EIP-7702 FAQs](https://docs.cdp.coinbase.com/paymaster/need-to-knows/eip-7702-faqs)
- [Base Network](https://base.org/)

## License

This analysis is provided for educational purposes.

## Contributing

Feel free to open issues or submit PRs with additional findings or corrections.
