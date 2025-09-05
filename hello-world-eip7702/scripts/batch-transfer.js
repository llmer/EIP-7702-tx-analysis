const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Execute batch transfers using the delegated EOA
 */
async function executeBatchTransfer() {
    // Validate environment
    if (!process.env.PRIVATE_KEY) {
        throw new Error('Please set PRIVATE_KEY in .env file');
    }
    if (!process.env.RPC_URL) {
        throw new Error('Please set RPC_URL in .env file');
    }

    // Connect to network
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log('Executing batch transfer...');
    console.log('EOA Address:', wallet.address);

    try {
        // Check if EOA is delegated
        const code = await provider.getCode(wallet.address);
        if (!code.startsWith('0xef0100')) {
            console.error('❌ EOA is not delegated. Run setup-delegation.js first.');
            return;
        }

        // Example batch transfer data
        // In production, these would come from your application logic
        const transfers = [
            {
                token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
                from: '0xYourAddress1',
                to: '0xRecipient1',
                amount: ethers.parseUnits('10', 6) // 10 USDC
            },
            {
                token: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // WETH on Base
                from: '0xYourAddress2',
                to: '0xRecipient2',
                amount: ethers.parseUnits('0.01', 18) // 0.01 WETH
            },
            // Add more transfers as needed
        ];

        // Encode transfer calls
        const calls = transfers.map(transfer => ({
            target: transfer.token,
            value: 0,
            data: encodeTransferFrom(transfer.from, transfer.to, transfer.amount)
        }));

        // Encode the batch execution call
        const batchInterface = new ethers.Interface([
            'function executeBatch(tuple(address target, uint256 value, bytes data)[] calls)'
        ]);

        const batchData = batchInterface.encodeFunctionData('executeBatch', [calls]);

        // Send the transaction to the delegated EOA
        const tx = {
            to: wallet.address, // Send to self (delegated EOA)
            data: batchData,
            gasLimit: 1000000, // Adjust based on number of transfers
        };

        console.log(`\nExecuting ${calls.length} transfers in batch...`);
        const txResponse = await wallet.sendTransaction(tx);
        
        console.log('Transaction hash:', txResponse.hash);
        console.log('Waiting for confirmation...');
        
        const receipt = await txResponse.wait();
        console.log('✅ Batch transfer confirmed in block:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed.toString());
        
        // Calculate gas per transfer
        const gasPerTransfer = Number(receipt.gasUsed) / calls.length;
        console.log(`Average gas per transfer: ${gasPerTransfer.toFixed(0)}`);

    } catch (error) {
        console.error('❌ Error executing batch transfer:', error);
        if (error.reason) {
            console.log('Reason:', error.reason);
        }
        if (error.data) {
            console.log('Error data:', error.data);
        }
    }
}

/**
 * Encode a transferFrom call
 */
function encodeTransferFrom(from, to, amount) {
    const transferInterface = new ethers.Interface([
        'function transferFrom(address from, address to, uint256 amount)'
    ]);
    
    return transferInterface.encodeFunctionData('transferFrom', [from, to, amount]);
}

// Example: Execute a test batch transfer with mock data
async function testBatchTransfer() {
    console.log('\n📝 Note: This is a test example with mock addresses.');
    console.log('For real transfers, update the transfer array with actual token addresses and approved accounts.\n');
    
    // For testing, you would need:
    // 1. Deploy test tokens (or use existing ones)
    // 2. Have users approve your delegated EOA
    // 3. Update the transfers array with real addresses
    
    await executeBatchTransfer();
}

// Run the test
testBatchTransfer().catch(console.error);