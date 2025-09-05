const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Sets up EIP-7702 delegation for an EOA
 * This allows the EOA to act as a smart contract wallet
 */
async function setupDelegation() {
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
    
    const IMPLEMENTATION = process.env.SMART_ACCOUNT_IMPLEMENTATION || '0x000100abaad02f1cfc8bbe32bd5a564817339e72';
    const chainId = process.env.CHAIN_ID || '84532'; // Base Sepolia by default

    console.log('Setting up EIP-7702 delegation...');
    console.log('EOA Address:', wallet.address);
    console.log('Delegating to:', IMPLEMENTATION);
    console.log('Chain ID:', chainId);

    try {
        // Check current code at the EOA
        const currentCode = await provider.getCode(wallet.address);
        
        if (currentCode !== '0x') {
            console.log('Current code:', currentCode);
            
            // Check if already delegated to the same implementation
            if (currentCode.toLowerCase() === `0xef0100${IMPLEMENTATION.slice(2).toLowerCase()}`) {
                console.log('✅ Already delegated to this implementation!');
                return;
            }
        }

        // Create EIP-7702 authorization
        const authorization = {
            chainId: BigInt(chainId),
            address: IMPLEMENTATION,
            nonce: await provider.getTransactionCount(wallet.address),
        };

        // Sign the authorization
        const signature = await signAuthorization(wallet, authorization);

        // Create EIP-7702 transaction
        const tx = {
            type: 0x04, // EIP-7702 transaction type
            to: wallet.address, // Send to self
            value: 0,
            data: '0x', // No data needed for delegation setup
            authorizationList: [{
                ...authorization,
                ...signature
            }],
            gasLimit: 100000,
        };

        console.log('\nSending EIP-7702 transaction...');
        const txResponse = await wallet.sendTransaction(tx);
        
        console.log('Transaction hash:', txResponse.hash);
        console.log('Waiting for confirmation...');
        
        const receipt = await txResponse.wait();
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

        // Verify delegation
        const newCode = await provider.getCode(wallet.address);
        const expectedCode = `0xef0100${IMPLEMENTATION.slice(2).toLowerCase()}`;
        
        if (newCode.toLowerCase() === expectedCode) {
            console.log('✅ Successfully delegated to smart account!');
            console.log('Your EOA can now execute batch transactions.');
        } else {
            console.log('⚠️ Unexpected code after delegation:', newCode);
        }

    } catch (error) {
        console.error('❌ Error setting up delegation:', error);
        if (error.code === 'UNSUPPORTED_OPERATION') {
            console.log('\n⚠️ Note: Your RPC provider may not support EIP-7702 transactions yet.');
            console.log('Consider using Base Sepolia or Base mainnet with a compatible RPC.');
        }
    }
}

/**
 * Sign an EIP-7702 authorization
 */
async function signAuthorization(wallet, auth) {
    // Create the authorization hash according to EIP-7702
    const authHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'address', 'uint256'],
            [auth.chainId, auth.address, auth.nonce]
        )
    );

    // Sign the hash
    const signature = await wallet.signMessage(ethers.getBytes(authHash));
    const sig = ethers.Signature.from(signature);

    return {
        yParity: sig.yParity,
        r: sig.r,
        s: sig.s,
    };
}

// Run the setup
setupDelegation().catch(console.error);