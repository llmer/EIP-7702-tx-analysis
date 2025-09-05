// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint 1000 tokens to deployer for testing
        _mint(msg.sender, 1000 * 10**18);
    }

    // Allow anyone to mint for testing purposes
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}