// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBatchExecutor {
    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    function executeBatch(Call[] calldata calls) external payable;
}