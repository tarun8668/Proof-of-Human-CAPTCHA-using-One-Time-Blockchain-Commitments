
#  Proof-of-Human CAPTCHA using One-Time Blockchain Commitments

---

## 1. Introduction

### 1.1 Background

With the rapid expansion of online platforms, cloud services, and decentralized applications, the need for reliable mechanisms to distinguish **human users from automated bots** has become increasingly critical. Bots are widely used for spam generation, fake account creation, credential stuffing, denial-of-service attacks, and large-scale abuse of digital services.

To mitigate these threats, **CAPTCHA systems** (Completely Automated Public Turing Test to Tell Computers and Humans Apart) are commonly deployed as a first line of defense. Traditional CAPTCHA mechanisms rely on distorted text recognition, image selection, or behavioral analysis to verify human presence.

However, advances in **artificial intelligence, deep learning, and automated CAPTCHA-solving services** have significantly reduced the effectiveness of these systems. Modern AI models can solve text- and image-based CAPTCHAs with high accuracy, making traditional approaches unreliable for modern security needs.

---

### 1.2 Limitations of Traditional CAPTCHA Systems

Traditional CAPTCHA systems suffer from several critical limitations:

- **Vulnerability to AI-based attacks**  
  Deep learning models can solve CAPTCHAs at scale with high accuracy.

- **Replay Attacks**  
  Solved CAPTCHA responses can be reused or shared.

- **Centralization**  
  Most CAPTCHA systems rely on third-party providers, creating single points of failure.

- **Privacy Concerns**  
  Behavioral tracking and data collection raise ethical and regulatory issues.

- **Lack of Cryptographic Proof**  
  There is no verifiable proof that a CAPTCHA was solved by a human.

These limitations make traditional CAPTCHA systems unsuitable for **high-security, decentralized, and privacy-sensitive applications**.

---

### 1.3 Project Vision

This project introduces a **Proof-of-Human CAPTCHA system using One-Time Blockchain Commitments**, which provides:

- Cryptographic proof that a CAPTCHA was solved by a human
- Strict one-time usage to prevent replay attacks
- Decentralized, trustless verification using blockchain
- Privacy-preserving human authentication without behavioral tracking

The system combines CAPTCHA interaction with **blockchain immutability and smart contracts** to create a robust and verifiable human authentication mechanism.

---

## 2. Problem Statement

### 2.1 Core Problem Definition

**How can a CAPTCHA system provide verifiable, replay-resistant proof of human participation in a decentralized and trustless manner, while preserving user privacy and resisting modern AI-based attacks?**

---

### 2.2 Key Challenges

1. **AI-Based CAPTCHA Solving**
   - Bots can solve visual and text CAPTCHAs with high accuracy.

2. **Replay and Reuse Attacks**
   - Solved CAPTCHAs can be reused by automated systems.

3. **Centralized Verification**
   - Reliance on third-party CAPTCHA providers introduces trust and availability issues.

4. **Lack of Proof**
   - No cryptographic evidence exists that a CAPTCHA was solved by a human.

5. **Privacy Risks**
   - Behavioral and biometric data collection threatens user privacy.

---

### 2.3 Impact of the Problem

- **Security Risk**: Automated abuse and bot attacks
- **User Trust Erosion**: Frustrating and invasive CAPTCHA systems
- **Barrier to Decentralization**: CAPTCHA unsuitable for blockchain-based platforms

---

## 3. Scope of the Project

### 3.1 Included Scope

- Design of a decentralized Proof-of-Human CAPTCHA architecture
- One-time cryptographic commitment generation
- Smart contract-based verification and invalidation
- Replay attack prevention mechanisms
- Privacy-preserving verification (no personal data)
- Integration with web and decentralized applications

---

### 3.2 Excluded Scope

- Long-term digital identity management
- Biometric authentication
- Full production-scale deployment
- Cross-chain interoperability

---

## 4. Methodology

### 4.1 Research Approach

1. **Literature Review**
   - Traditional CAPTCHA systems
   - AI-based CAPTCHA attacks
   - Blockchain-based verification models

2. **System Design**
   - CAPTCHA + cryptographic commitment model
   - One-time usage enforcement
   - Smart contract verification logic

3. **Prototype Development**
   - CAPTCHA challenge module
   - Commitment generation using cryptographic hashes
   - Blockchain storage and verification

4. **Testing & Evaluation**
   - Replay attack resistance
   - One-time usage validation
   - Performance and scalability analysis

---

### 4.2 Assumptions

- Blockchain consensus is secure
- Cryptographic hash functions are collision-resistant
- Smart contracts execute correctly
- Adversaries cannot control majority of blockchain validators

---

## 5. System Architecture

### 5.1 High-Level Architecture

```

User
│
│ Solve CAPTCHA
▼
Web Application
│
│ Generate One-Time Commitment
▼
Commitment Generator
│
│ Store Hash
▼
Blockchain Network
│
│ Verify & Invalidate
▼
Smart Contract
│
│ Result
▼
Access Granted / Denied

```

---

### 5.2 Component Description

**User Interface**
- Displays CAPTCHA challenge
- Collects CAPTCHA response

**Web Application**
- Validates CAPTCHA
- Generates cryptographic commitment

**Commitment Generator**
- Produces unique, one-time hash values

**Blockchain Network**
- Stores immutable commitment hashes

**Smart Contract**
- Verifies commitment authenticity
- Enforces single-use policy

---

## 6. System Flow

### Flow 1: CAPTCHA Verification

```

1. User requests protected resource
2. CAPTCHA challenge displayed
3. User solves CAPTCHA
4. Commitment generated
5. Commitment hash stored on blockchain
6. Smart contract verifies commitment
7. Commitment invalidated
8. Access granted or denied

```

---

### Flow 2: Replay Attack Prevention

```

1. Attacker reuses old commitment
2. Smart contract checks usage status
3. Commitment already marked as used
4. Verification rejected

```

---

## 7. Algorithm Used

### One-Time Blockchain Commitment Algorithm

```

Input: CAPTCHA solution S
Output: One-time verification result

1. Verify CAPTCHA correctness
2. Generate random nonce N
3. Compute commitment C = SHA256(S || N || timestamp)
4. Store hash(C) on blockchain
5. Verify C via smart contract
6. If unused:
   Mark C as used
   Grant access
   Else:
   Reject request

```

---

### Correctness Properties

- **Replay Resistance**: Commitment invalidated after use
- **Integrity**: Blockchain immutability prevents tampering
- **Privacy**: No user data stored
- **Trustlessness**: No central authority required

---

## 8. Functional Requirements

- Display CAPTCHA challenge
- Validate CAPTCHA solution
- Generate one-time commitment
- Store commitment hash on blockchain
- Verify commitment via smart contract
- Invalidate commitment after use
- Grant or deny access

---

## 9. Non-Functional Requirements

- Strong resistance to bots
- Low latency verification
- High scalability
- Privacy preservation
- High availability
- Minimal transaction overhead

---

## 10. Implementation Overview

### Technology Stack

- Blockchain: Ethereum / Local Blockchain
- Smart Contracts: Solidity
- Backend: Node.js
- Cryptography: SHA-256
- Frontend: HTML / JavaScript
- CAPTCHA Engine: Custom / Existing CAPTCHA API

---

## 11. Testing and Results

### Functional Test Cases

| Test Case | Description | Result |
|---------|------------|--------|
| CAPTCHA solved correctly | Valid human input | PASS |
| Replay attack attempt | Reuse commitment | PASS |
| Invalid CAPTCHA | Wrong input | PASS |
| Duplicate verification | Commitment reused | PASS |

---

### Security Evaluation

- Replay attacks successfully prevented
- Commitment reuse rejected
- Blockchain integrity preserved
- No sensitive data exposure

---

## 12. Advantages of the Proposed System

| Traditional CAPTCHA | Proposed System |
|--------------------|----------------|
| Centralized | Decentralized |
| Replay vulnerable | One-time proof |
| No cryptographic proof | Blockchain-backed |
| Privacy invasive | Privacy-preserving |

---

## 13. Conclusion

The Proof-of-Human CAPTCHA using One-Time Blockchain Commitments provides a **secure, decentralized, and replay-resistant human verification mechanism**. By combining CAPTCHA challenges with blockchain immutability and smart contract enforcement, the system overcomes the limitations of traditional CAPTCHA systems.

The proposed approach ensures:
- Verifiable proof of human participation
- Strong resistance to automated attacks
- Preservation of user privacy
- Trustless and transparent verification

This system is well-suited for modern web applications and decentralized platforms requiring robust human authentication.

---

## 14. Future Enhancements

- Zero-knowledge proof-based CAPTCHA verification
- Layer-2 blockchain integration for scalability
- Adaptive CAPTCHA difficulty
- Integration with decentralized identity systems
- Support for multi-chain verification

---

## 15. References

1. Nakamoto, S. *Bitcoin: A Peer-to-Peer Electronic Cash System*, 2008  
2. Buterin, V. *Ethereum Whitepaper*, 2014  
3. Yang et al., *Publicly Verifiable Deletion for Cloud Storage*, IEEE, 2018  
4. Merlec et al., *Decentralized Verification Systems*, 2024  
5. CAPTCHA Security Analysis Reports, ACM Digital Library

---

## Author

**Tarun S S**  
B.E. Computer Science and Engineering  
Saveetha Engineering College  

---
