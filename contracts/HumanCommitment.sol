// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HumanCommitment {
    struct Commitment {
        bytes32 hash;
        address owner;
        uint256 timestamp;
        bool isBurned;
    }

    address public admin;

    mapping(bytes32 => Commitment) public commitments;
    
    event CommitmentRegistered(bytes32 indexed hash, address indexed owner, uint256 timestamp);
    event CommitmentBurned(bytes32 indexed hash, address indexed owner, uint256 timestamp);

    constructor() {
        admin = msg.sender;
    }

    function registerCommitment(bytes32 _hash) public {
        require(commitments[_hash].timestamp == 0, "Commitment already exists");
        
        commitments[_hash] = Commitment({
            hash: _hash,
            owner: msg.sender,
            timestamp: block.timestamp,
            isBurned: false
        });

        emit CommitmentRegistered(_hash, msg.sender, block.timestamp);
    }

    function burnCommitment(bytes32 _hash) public {
        require(commitments[_hash].timestamp != 0, "Commitment does not exist");
        require(commitments[_hash].owner == msg.sender || msg.sender == admin, "Not authorized");
        require(!commitments[_hash].isBurned, "Already burned");

        commitments[_hash].isBurned = true;
        
        emit CommitmentBurned(_hash, msg.sender, block.timestamp);
    }

    function isVerified(bytes32 _hash) public view returns (bool) {
        return commitments[_hash].timestamp != 0 && !commitments[_hash].isBurned;
    }
}
