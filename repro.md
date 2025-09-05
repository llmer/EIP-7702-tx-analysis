# Reproduction Steps - EIP-7702 Transaction Analysis

## Prerequisites
- Foundry installed (`cast` command available)
- Access to Base RPC endpoint

## RPC Endpoint
```bash
RPC_URL="https://api.developer.coinbase.com/rpc/v1/base/REDACT"
```

## Step-by-Step Verification

### 1. Fetch Transaction Details
```bash
cast tx 0x02c197f056402ea45852f432d0b3e26425a9737f5ebb7a7836e706bc2db1abea \
  --rpc-url $RPC_URL \
  --json | jq '.'
```
This shows the transaction structure, including the `to` address (the EOA itself) and the input data.

### 2. Check for EIP-7702 Delegation
```bash
cast code 0x77130abfcc6e99aeb8c72fa4a1bf1c71c8821fb5 \
  --rpc-url $RPC_URL
```
**Expected Output**: `0xef0100000100abaad02f1cfc8bbe32bd5a564817339e72`

The `0xef0100` prefix confirms EIP-7702 delegation.

### 3. Extract Delegated Address
The bytecode has a specific structure:
- Bytes 0-3 (`0xef0100`): EIP-7702 delegation prefix
- Bytes 4-23 (40 hex chars): The delegated contract address

```bash
# Method 1: Using cut and sed
echo "0xef0100000100abaad02f1cfc8bbe32bd5a564817339e72" | cut -c 9- | sed 's/^/0x/'

# Method 2: Using bash string manipulation
BYTECODE="0xef0100000100abaad02f1cfc8bbe32bd5a564817339e72"
echo "0x${BYTECODE:8}"

# Method 3: Visual breakdown
# 0xef0100 | 000100abaad02f1cfc8bbe32bd5a564817339e72
# └─prefix─┘ └──────────delegated address──────────┘
```
**Expected Output**: `0x000100abaad02f1cfc8bbe32bd5a564817339e72`

**Understanding the structure:**
```
0xef0100000100abaad02f1cfc8bbe32bd5a564817339e72
└─┬──┘└────────────────┬──────────────────┘
  │                     │
  │                     └── 20 bytes: Contract address
  └── 3 bytes: EIP-7702 prefix (always 0xef0100)
```

### 4. Verify Implementation Contract Exists
```bash
cast code 0x000100abaad02f1cfc8bbe32bd5a564817339e72 \
  --rpc-url $RPC_URL | head -c 200
```
This should return bytecode starting with `0x6080604052...`, confirming the implementation contract exists.

### 5. Decode Function Selectors
```bash
# The batch execution function
cast 4byte-decode 0x34fcd5be
```
This will likely return "No signatures found" as it's a custom function.

```bash
# The transferFrom function used in each call
cast 4byte 0x23b872dd
```
**Expected Output**: `transferFrom(address,address,uint256)`

### 6. Trace Transaction Execution
```bash
cast run 0x02c197f056402ea45852f432d0b3e26425a9737f5ebb7a7836e706bc2db1abea \
  --rpc-url $RPC_URL \
  --quick
```
This shows the full execution trace, revealing:
- The `executeBatch` function call
- 91 individual `transferFrom` calls to different token contracts
- Gas usage for each operation

### 7. Count the Batch Operations
```bash
# Count the number of transferFrom calls in the trace
cast run 0x02c197f056402ea45852f432d0b3e26425a9737f5ebb7a7836e706bc2db1abea \
  --rpc-url $RPC_URL \
  --quick 2>/dev/null | grep -c "transferFrom"
```
**Expected Output**: `91`

### 8. Analyze Input Data Structure
```bash
# Get just the input data
cast tx 0x02c197f056402ea45852f432d0b3e26425a9737f5ebb7a7836e706bc2db1abea \
  --rpc-url $RPC_URL \
  --json | jq -r '.input' | cut -c 1-200
```
This shows the function selector `0x34fcd5be` followed by the encoded array of calls.

## Optional Verification

### Check Implementation Contract Functions
```bash
# Try to call common functions (these may fail if not present)
cast call 0x000100abaad02f1cfc8bbe32bd5a564817339e72 \
  "implementation()(address)" \
  --rpc-url $RPC_URL 2>/dev/null || echo "Not a proxy pattern"
```

### Decode a Single Transfer
```bash
# Extract and decode one of the transferFrom calls
echo "0x23b872dd000000000000000000000000bb367d00000f5e37ac702aab769725c299be2fc3000000000000000000000000ec3f238777625bf001622c8e7089ba070492aeb300000000000000000000000000000000000000000000001043561a8829300000" | \
  cast calldata-decode "transferFrom(address,address,uint256)"
```

## Summary
These commands verify:
1. ✅ The wallet uses EIP-7702 delegation
2. ✅ It delegates to Coinbase's Smart Account at `0x000100...`
3. ✅ The transaction executes 91 token transfers in a single batch
4. ✅ Each transfer is a standard ERC-20 `transferFrom` operation
5. ✅ The execution is atomic - all succeed or all fail together
