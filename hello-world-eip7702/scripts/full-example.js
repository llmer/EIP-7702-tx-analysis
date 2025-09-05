const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Complete example showing the full flow:
 * 1. Deploy test tokens
 * 2. Set up EIP-7702 delegation
 * 3. Get user approvals
 * 4. Execute batch transfers
 */
async function fullExample() {
    // Setup
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Create test user wallets
    const user1 = ethers.Wallet.createRandom().connect(provider);
    const user2 = ethers.Wallet.createRandom().connect(provider);
    const recipient1 = ethers.Wallet.createRandom().connect(provider);
    const recipient2 = ethers.Wallet.createRandom().connect(provider);

    console.log('🚀 EIP-7702 Batch Transfer Example\n');
    console.log('Main EOA:', mainWallet.address);
    console.log('User 1:', user1.address);
    console.log('User 2:', user2.address);
    console.log('Recipient 1:', recipient1.address);
    console.log('Recipient 2:', recipient2.address);
    console.log('');

    try {
        // Step 1: Deploy test tokens
        console.log('Step 1: Deploying test tokens...');
        const TokenFactory = new ethers.ContractFactory(
            TOKEN_ABI,
            TOKEN_BYTECODE,
            mainWallet
        );

        const token1 = await TokenFactory.deploy('Test Token 1', 'TEST1');
        await token1.waitForDeployment();
        const token1Address = await token1.getAddress();
        console.log('Token 1 deployed at:', token1Address);

        const token2 = await TokenFactory.deploy('Test Token 2', 'TEST2');
        await token2.waitForDeployment();
        const token2Address = await token2.getAddress();
        console.log('Token 2 deployed at:', token2Address);

        // Fund test users with tokens
        console.log('\nFunding test users...');
        await (await token1.mint(user1.address, ethers.parseEther('100'))).wait();
        await (await token2.mint(user2.address, ethers.parseEther('50'))).wait();
        console.log('✅ Users funded with test tokens\n');

        // Step 2: Set up EIP-7702 delegation
        console.log('Step 2: Setting up EIP-7702 delegation...');
        const IMPLEMENTATION = '0x000100abaad02f1cfc8bbe32bd5a564817339e72';
        
        // Check if already delegated
        const currentCode = await provider.getCode(mainWallet.address);
        if (currentCode.startsWith('0xef0100')) {
            console.log('✅ Already delegated!\n');
        } else {
            // Create and send EIP-7702 transaction
            // Note: This is simplified - actual implementation depends on client support
            console.log('⚠️  EIP-7702 delegation requires client support');
            console.log('   On Base, use the CDP SDK or compatible wallet\n');
        }

        // Step 3: Get approvals from users
        console.log('Step 3: Getting token approvals...');
        
        // User 1 approves Token 1
        const token1Contract = new ethers.Contract(
            token1Address,
            ['function approve(address spender, uint256 amount) returns (bool)'],
            user1
        );
        await (await token1Contract.approve(mainWallet.address, ethers.parseEther('10'))).wait();
        console.log('User 1 approved 10 TEST1');

        // User 2 approves Token 2
        const token2Contract = new ethers.Contract(
            token2Address,
            ['function approve(address spender, uint256 amount) returns (bool)'],
            user2
        );
        await (await token2Contract.approve(mainWallet.address, ethers.parseEther('5'))).wait();
        console.log('User 2 approved 5 TEST2');
        console.log('✅ Approvals complete\n');

        // Step 4: Execute batch transfer
        console.log('Step 4: Executing batch transfer...');
        
        // Prepare batch calls
        const calls = [
            {
                target: token1Address,
                value: 0,
                data: encodeTransferFrom(
                    user1.address,
                    recipient1.address,
                    ethers.parseEther('10')
                )
            },
            {
                target: token2Address,
                value: 0,
                data: encodeTransferFrom(
                    user2.address,
                    recipient2.address,
                    ethers.parseEther('5')
                )
            }
        ];

        // Encode batch execution
        const batchInterface = new ethers.Interface([
            'function executeBatch(tuple(address target, uint256 value, bytes data)[] calls)'
        ]);
        const batchData = batchInterface.encodeFunctionData('executeBatch', [calls]);

        // Send transaction to delegated EOA
        const tx = await mainWallet.sendTransaction({
            to: mainWallet.address, // Send to self
            data: batchData,
            gasLimit: 500000
        });

        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('✅ Batch transfer complete!');
        console.log('Gas used:', receipt.gasUsed.toString());
        console.log('Block:', receipt.blockNumber);

        // Verify transfers
        console.log('\nVerifying transfers...');
        const recipient1Balance = await token1.balanceOf(recipient1.address);
        const recipient2Balance = await token2.balanceOf(recipient2.address);
        console.log('Recipient 1 TEST1 balance:', ethers.formatEther(recipient1Balance));
        console.log('Recipient 2 TEST2 balance:', ethers.formatEther(recipient2Balance));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function encodeTransferFrom(from, to, amount) {
    const iface = new ethers.Interface([
        'function transferFrom(address from, address to, uint256 amount)'
    ]);
    return iface.encodeFunctionData('transferFrom', [from, to, amount]);
}

// Minimal ERC20 ABI and bytecode for testing
const TOKEN_ABI = [
    'constructor(string name, string symbol)',
    'function mint(address to, uint256 amount)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)'
];

// You would need the actual bytecode from compiling TestToken.sol
const TOKEN_BYTECODE = '0x...'; // Add compiled bytecode here

// Note about running this example
console.log('=====================================');
console.log('EIP-7702 Batch Transfer Full Example');
console.log('=====================================\n');
console.log('⚠️  Important Notes:');
console.log('1. This example requires EIP-7702 support from your RPC provider');
console.log('2. Currently works on Base Sepolia and Base mainnet');
console.log('3. You need to compile TestToken.sol to get the bytecode');
console.log('4. Fund the main wallet with ETH for gas fees\n');
console.log('To run the full example:');
console.log('1. Set up your .env file with PRIVATE_KEY and RPC_URL');
console.log('2. Compile contracts: forge build');
console.log('3. Update TOKEN_BYTECODE with compiled bytecode');
console.log('4. Run: node scripts/full-example.js\n');

// Uncomment to run (after setting up bytecode)
// fullExample().catch(console.error);