# Proof-of-Human CAPTCHA using One-Time Blockchain Commitments

A decentralized CAPTCHA verification framework for Web3 applications, designed to prevent Sybil attacks, automated bot participation, and mempool-based front-running through one-time cryptographic blockchain commitments.

---

## Project Overview

Decentralized applications (dApps) operate in an open and permissionless environment. While this transparency enables trustless participation, it also creates a major attack surface for automated bot-nets capable of executing high-frequency transactions.

In environments such as DeFi platforms, NFT minting, and decentralized governance systems, bots can overwhelm smart contract resources, crowd out legitimate human users, and exploit mempool visibility.

Traditional CAPTCHA systems fail in blockchain ecosystems due to two major limitations:

1. Reliance on centralized verification servers, contradicting decentralization.
2. Exposure of CAPTCHA solutions in the public transaction mempool, enabling solution hijacking and front-running.

This project introduces a novel Proof-of-Human (PoH) framework using a one-time commit–reveal protocol that binds CAPTCHA solutions to a specific wallet identity before the answer is revealed.

---

## Authors
 
Tarun S S  
Department of Computer Science and Engineering  
Saveetha Engineering College, Chennai, India  
Email: tarunsenthil69@gmail.com  

Prakasam P  
Department of Computer Science and Engineering  
Saveetha Engineering College, Chennai, India  
Email: prakasamprofessional@gmail.com  

Kishore M  
Department of Computer Science and Engineering  
Saveetha Engineering College, Chennai, India  
Email: mkishore12a3@gmail.com 
---

## Abstract

As decentralized applications scale, they become primary targets for automated bot-nets capable of executing Sybil attacks, front-running transactions, and exhausting smart contract resources. Traditional CAPTCHA mechanisms fail in the Web3 ecosystem because they rely on centralized verification and remain vulnerable to mempool answer-sniping.

This work proposes a Proof-of-Human (PoH) framework utilizing One-Time Blockchain Commitments. By employing a two-phase commit–reveal protocol, the system links a user’s wallet address to a specific CAPTCHA solution before the answer is revealed. This ensures that bots cannot replicate or front-run human solutions.

Evaluation results indicate that the framework significantly raises the economic cost for bot operators while maintaining low gas overhead for legitimate users.

---

## Index Terms

Blockchain, CAPTCHA, Proof-of-Human, Sybil Resistance, Cryptographic Commitments, Smart Contracts, Bot Mitigation

---

## Motivation

Blockchain networks are designed for openness and transparency. However, these properties are frequently exploited by automated adversaries.

Bots can:

- Submit thousands of transactions per second
- Front-run legitimate user interactions
- Manipulate NFT mints and token launches
- Spam governance voting systems
- Exhaust smart contract execution limits

Existing CAPTCHA solutions such as Google reCAPTCHA or Cloudflare Turnstile require centralized servers, creating a decentralization paradox in Web3.

More critically, if CAPTCHA solutions are submitted directly on-chain, they are exposed in the Ethereum mempool, allowing bots to copy valid answers and execute higher-gas transactions to be processed first.

---

## Related Work

### Sybil Attacks in Blockchain

Sybil attacks occur when an adversary generates multiple fake identities to gain disproportionate influence. While Proof-of-Work and Proof-of-Stake attach cost to participation, they do not verify whether the participant is human.

### Limitations of Standard CAPTCHA

Traditional CAPTCHA systems rely on secret keys held by centralized authorities. This creates a single point of failure, introduces censorship risk, and raises privacy concerns regarding user tracking.

### Commitment Schemes

Cryptographic commitment schemes allow a user to commit to a value while keeping it hidden, with the ability to reveal it later. This work adapts Keccak256-based commitments for Ethereum Virtual Machine constraints.

---

## Proposed System Architecture

The framework consists of three stages:

1. Challenge Generation  
2. Commitment Phase  
3. Reveal and Verification Phase  

---

## Challenge Generation

A CAPTCHA challenge `C` is generated off-chain through either:

- A decentralized oracle network
- A trusted execution environment (TEE)

Each challenge includes:

- A unique challenge identifier `IDc`
- A timestamp `T`

---

## Commitment Phase (Phase 1)

To prevent front-running, the user does not submit the CAPTCHA answer directly. Instead, they compute a one-time cryptographic commitment.

Commitment computation:

K = keccak256(A || s || msg.sender)

Where:

- A is the CAPTCHA solution
- s is a randomly generated salt
- msg.sender is the user’s wallet address

The commitment hash `K` is submitted to the smart contract via:

commit(K)

The contract stores:

- Commitment hash
- Block number
- Challenge identifier

At this stage, the solution remains hidden while being cryptographically bound to the user.

---

## Reveal Phase (Phase 2)

After a minimum delay of `N` blocks (ensuring transaction finality), the user reveals:

- The clear CAPTCHA answer `A`
- The salt `s`

reveal(A, s)

The contract recomputes:

K' = keccak256(A || s || msg.sender)

The solution is accepted if and only if:

- K' equals the stored commitment K
- block.number is greater than or equal to commit.block + N

---

## Security Properties

### Binding

Once the commitment is submitted, the user cannot change the answer or salt without producing a different hash.

### Hiding

Given only K, an adversary cannot recover A due to:

- One-way Keccak256 hashing
- High entropy salt values

---

## Resistance to Front-Running

An adversary observing a reveal transaction cannot reuse the answer because the commitment includes the wallet address.

If attacker B submits the same reveal:

TestK = keccak256(A || s || B.address)

Since B.address differs from the original user:

TestK ≠ K

The contract rejects the transaction.

Thus, bots cannot hijack human proofs.

---

## Implementation and Performance

### Gas Overhead

Test deployment on Ethereum testnet shows:

- commit() consumes approximately 45,000 gas
- reveal() consumes approximately 30,000 gas

While this introduces a two-transaction workflow, it remains feasible for high-value operations such as:

- NFT mint access control
- DAO voting participation
- DeFi anti-bot gating

### Latency

The system introduces a delay of N blocks (approximately 12 seconds per block on Ethereum mainnet). For human-centric interactions, this overhead is negligible.

---

## Optimization Strategies

To improve feasibility for retail users, the smart contract uses:

- bytes32 commitment storage
- Packed commitment structs
- Reduced SSTORE operations

This decreases commit-phase gas cost by approximately 15 percent.

---

## Economic Cost to Bot Operators

Bots must pay gas twice per attempt. Combined with CAPTCHA solving uncertainty, this increases the cost of automated exploitation beyond practical profitability.

Additional defense mechanisms include:

- Minimum salt entropy enforcement
- Cooldowns or slashing for repeated failures

---

## Conclusion

This project demonstrates that One-Time Blockchain Commitments provide an effective decentralized defense against bot-net participation in Web3 environments.

By binding CAPTCHA solutions to cryptographic wallet identity, the protocol eliminates mempool solution hijacking and increases Sybil resistance without centralized verification.

---

## Future Work

Future extensions include:

- Zero-Knowledge Proof integration to validate solutions without revealing them
- Decentralized CAPTCHA hosting through IPFS
- Further MEV-resistant transaction structuring
- Adaptive difficulty and rate-limiting mechanisms
