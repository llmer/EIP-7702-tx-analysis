// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/TestToken.sol";
import "../contracts/IBatchExecutor.sol";

contract BatchTransferTest is Test {
    TestToken public token1;
    TestToken public token2;
    
    address public eoa = address(0x1234);
    address public user1 = address(0x5678);
    address public user2 = address(0x9ABC);
    address public recipient1 = address(0xDEF0);
    address public recipient2 = address(0x1111);
    
    // Coinbase Smart Account implementation
    address constant IMPLEMENTATION = 0x000100abaad02f1cfc8bbe32bd5a564817339e72;
    
    function setUp() public {
        // Deploy test tokens
        token1 = new TestToken("Test Token 1", "TEST1");
        token2 = new TestToken("Test Token 2", "TEST2");
        
        // Mint tokens to users
        token1.mint(user1, 100 ether);
        token2.mint(user2, 50 ether);
        
        // Set up EIP-7702 delegation (simulated)
        // In reality, this would be done via an EIP-7702 transaction
        vm.etch(eoa, hex"ef0100000100abaad02f1cfc8bbe32bd5a564817339e72");
    }
    
    function testBatchTransfer() public {
        // Users approve the delegated EOA
        vm.prank(user1);
        token1.approve(eoa, 10 ether);
        
        vm.prank(user2);
        token2.approve(eoa, 5 ether);
        
        // Prepare batch calls
        IBatchExecutor.Call[] memory calls = new IBatchExecutor.Call[](2);
        
        calls[0] = IBatchExecutor.Call({
            target: address(token1),
            value: 0,
            data: abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                user1,
                recipient1,
                10 ether
            )
        });
        
        calls[1] = IBatchExecutor.Call({
            target: address(token2),
            value: 0,
            data: abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                user2,
                recipient2,
                5 ether
            )
        });
        
        // Execute batch transfer
        // Note: This would actually call the delegated implementation
        // Here we're testing the concept
        
        // Verify balances after transfer
        vm.prank(eoa);
        for (uint i = 0; i < calls.length; i++) {
            (bool success,) = calls[i].target.call(calls[i].data);
            require(success, "Call failed");
        }
        
        assertEq(token1.balanceOf(recipient1), 10 ether);
        assertEq(token2.balanceOf(recipient2), 5 ether);
        assertEq(token1.balanceOf(user1), 90 ether);
        assertEq(token2.balanceOf(user2), 45 ether);
    }
    
    function testApprovalRequired() public {
        // Try transfer without approval
        IBatchExecutor.Call[] memory calls = new IBatchExecutor.Call[](1);
        
        calls[0] = IBatchExecutor.Call({
            target: address(token1),
            value: 0,
            data: abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                user1,
                recipient1,
                10 ether
            )
        });
        
        // This should fail due to lack of approval
        vm.prank(eoa);
        (bool success,) = calls[0].target.call(calls[0].data);
        assertFalse(success);
    }
    
    function testMultipleTransfersSameToken() public {
        // Approve larger amount
        vm.prank(user1);
        token1.approve(eoa, 30 ether);
        
        // Multiple transfers of same token
        IBatchExecutor.Call[] memory calls = new IBatchExecutor.Call[](3);
        
        calls[0] = IBatchExecutor.Call({
            target: address(token1),
            value: 0,
            data: abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                user1,
                recipient1,
                10 ether
            )
        });
        
        calls[1] = IBatchExecutor.Call({
            target: address(token1),
            value: 0,
            data: abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                user1,
                recipient2,
                10 ether
            )
        });
        
        calls[2] = IBatchExecutor.Call({
            target: address(token1),
            value: 0,
            data: abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                user1,
                address(0x3333),
                10 ether
            )
        });
        
        // Execute all transfers
        vm.startPrank(eoa);
        for (uint i = 0; i < calls.length; i++) {
            (bool success,) = calls[i].target.call(calls[i].data);
            require(success, "Call failed");
        }
        vm.stopPrank();
        
        assertEq(token1.balanceOf(recipient1), 10 ether);
        assertEq(token1.balanceOf(recipient2), 10 ether);
        assertEq(token1.balanceOf(address(0x3333)), 10 ether);
        assertEq(token1.balanceOf(user1), 70 ether);
    }
}