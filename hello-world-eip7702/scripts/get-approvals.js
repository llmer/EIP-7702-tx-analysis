const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Helper script to get token approvals from users
 * Users need to approve the delegated EOA to transfer their tokens
 */
async function getApprovals() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    // The delegated EOA that needs approval
    const DELEGATED_EOA = '0xYourDelegatedEOAAddress';
    
    // Example users who need to approve
    // In production, these would be your actual users
    const users = [
        {
            privateKey: '0xUserPrivateKey1',
            tokens: [
                {
                    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
                    amount: ethers.parseUnits('100', 6), // Approve 100 USDC
                    symbol: 'USDC'
                }
            ]
        },
        // Add more users as needed
    ];

    console.log('Getting token approvals...');
    console.log('Delegated EOA:', DELEGATED_EOA);
    console.log('');

    for (const userData of users) {
        const userWallet = new ethers.Wallet(userData.privateKey, provider);
        console.log(`User: ${userWallet.address}`);

        for (const token of userData.tokens) {
            try {
                // Create token contract instance
                const tokenContract = new ethers.Contract(
                    token.address,
                    [
                        'function approve(address spender, uint256 amount) returns (bool)',
                        'function allowance(address owner, address spender) view returns (uint256)',
                        'function balanceOf(address account) view returns (uint256)'
                    ],
                    userWallet
                );

                // Check current allowance
                const currentAllowance = await tokenContract.allowance(
                    userWallet.address,
                    DELEGATED_EOA
                );

                // Check balance
                const balance = await tokenContract.balanceOf(userWallet.address);
                console.log(`  ${token.symbol} Balance: ${ethers.formatUnits(balance, 6)}`);

                if (currentAllowance >= token.amount) {
                    console.log(`  ✅ ${token.symbol} already approved: ${ethers.formatUnits(currentAllowance, 6)}`);
                    continue;
                }

                // Send approval transaction
                console.log(`  Approving ${ethers.formatUnits(token.amount, 6)} ${token.symbol}...`);
                const tx = await tokenContract.approve(DELEGATED_EOA, token.amount);
                
                console.log(`  Transaction: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`  ✅ Approved in block ${receipt.blockNumber}`);

            } catch (error) {
                console.error(`  ❌ Error approving ${token.symbol}:`, error.message);
            }
        }
        console.log('');
    }

    console.log('✅ Approval process complete!');
    console.log('The delegated EOA can now transfer approved tokens using batch execution.');
}

/**
 * Interactive approval process
 * This is a more user-friendly version for getting approvals
 */
async function interactiveApproval() {
    console.log('=================================');
    console.log('EIP-7702 Batch Transfer Approvals');
    console.log('=================================\n');

    console.log('To use batch transfers, users need to approve the delegated EOA.\n');
    
    console.log('Steps for users:');
    console.log('1. Import their wallet using private key');
    console.log('2. Approve the delegated EOA for each token');
    console.log('3. The delegated EOA can then batch transfer on their behalf\n');

    console.log('Example approval transaction:');
    console.log('```');
    console.log('token.approve(delegatedEOA, amount)');
    console.log('```\n');

    console.log('Security notes:');
    console.log('- Only approve trusted delegated EOAs');
    console.log('- Approve only the amount you want to transfer');
    console.log('- Revoke approvals when no longer needed\n');

    // In a real application, you would:
    // 1. Connect to user's wallet (MetaMask, WalletConnect, etc.)
    // 2. Request approval for specific amounts
    // 3. Track approvals in your backend
    // 4. Execute batch transfers when ready
}

// Run the interactive guide
interactiveApproval().catch(console.error);

// Uncomment to run actual approvals
// getApprovals().catch(console.error);