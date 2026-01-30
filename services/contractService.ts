import { ethers } from "ethers";

// Import the ABI directly from the artifacts
import HumanCommitmentArtifact from '../artifacts/contracts/HumanCommitment.sol/HumanCommitment.json';

const ABI = HumanCommitmentArtifact.abi;

// TODO: Replace with your deployed contract address after running `npx hardhat run scripts/deploy.cjs --network sepolia`
const CONTRACT_ADDRESS = "0xC33486aFbe51eD0868015349dB27321C6341143e"; 

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet() {
    // Fix: Accessing 'ethereum' on window requires casting to any as it is an injected property not defined in the standard Window interface
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error("MetaMask not found");
    this.provider = new ethers.BrowserProvider(ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer = await this.provider.getSigner();
    const network = await this.provider.getNetwork();

    // Switch to Sepolia if not connected
    if (network.chainId !== 11155111n) {
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                // Add Sepolia network (optional, as MetaMask usually has it)
                console.warn("Sepolia network not found in MetaMask");
            }
            throw switchError;
        }
    }
    
    return {
      address: await this.signer.getAddress(),
      chainId: network.chainId.toString()
    };
  }

  async checkConnection() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return null;

    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
        this.provider = new ethers.BrowserProvider(ethereum);
        this.signer = await this.provider.getSigner();
        const network = await this.provider.getNetwork();
        return {
            address: accounts[0],
            chainId: network.chainId.toString()
        };
    }
    return null;
  }

  async getNetwork() {
    if (!this.provider) return null;
    return await this.provider.getNetwork();
  }

  async getContractStats() {
    if (!this.provider) return null;
    
    // If contract not deployed/address invalid, return zeros
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        return { totalVerifications: 0, activeProofs: 0 };
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.provider);
    
    // Get events from the last 10000 blocks or from genesis if possible (simplified here)
    // For better performance in production, we would use an indexer.
    // Here we'll try to get logs.
    
    try {
        const currentBlock = await this.provider.getBlockNumber();
        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : undefined;

        const fromBlock = Math.max(0, currentBlock - 50000); // Look back 50k blocks

        const registeredFilter = contract.filters.CommitmentRegistered();
        const burnedFilter = contract.filters.CommitmentBurned();

        const registeredEvents = await contract.queryFilter(registeredFilter, fromBlock);
        const burnedEvents = await contract.queryFilter(burnedFilter, fromBlock);

        return {
            totalVerifications: registeredEvents.length,
            activeProofs: Math.max(0, registeredEvents.length - burnedEvents.length),
            blockNumber: currentBlock,
            gasPrice: gasPrice
        };
    } catch (error) {
        console.error("Failed to fetch contract stats:", error);
        return { totalVerifications: 0, activeProofs: 0 };
    }
  }

  async getUserCommitments(address: string) {
    if (!this.provider) return [];
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") return [];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.provider);
    
    try {
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 50000);

        // Filter by owner
        const registeredFilter = contract.filters.CommitmentRegistered(null, address);
        const burnedFilter = contract.filters.CommitmentBurned(null, address);

        const registeredEvents = await contract.queryFilter(registeredFilter, fromBlock);
        const burnedEvents = await contract.queryFilter(burnedFilter, fromBlock);

        const burnedHashes = new Set(burnedEvents.map(e => (e as any).args[0]));

        const activeCommitments = registeredEvents
            .map(e => {
                const args = (e as any).args;
                return {
                    hash: args[0],
                    owner: args[1],
                    timestamp: args[2],
                    txHash: e.transactionHash,
                    blockNumber: e.blockNumber
                };
            })
            .filter(c => !burnedHashes.has(c.hash));

        return activeCommitments;
    } catch (error) {
        console.error("Failed to fetch user commitments:", error);
        return [];
    }
  }



  async getAdmin() {
    if (!this.provider) return null;
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.provider);
    try {
        return await contract.admin();
    } catch (e) {
        console.error("Failed to fetch admin:", e);
        return null;
    }
  }

  async getAllActiveCommitments() {
    if (!this.provider) return [];
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.provider);
    
    try {
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 50000);

        const registeredFilter = contract.filters.CommitmentRegistered();
        const burnedFilter = contract.filters.CommitmentBurned();

        const registeredEvents = await contract.queryFilter(registeredFilter, fromBlock);
        const burnedEvents = await contract.queryFilter(burnedFilter, fromBlock);
        
        const burnedHashes = new Set(burnedEvents.map(e => (e as any).args[0]));
        
        return registeredEvents
            .map(e => ({
                hash: (e as any).args[0],
                owner: (e as any).args[1],
                timestamp: (e as any).args[2],
                txHash: e.transactionHash,
                blockNumber: e.blockNumber
            }))
            .filter(c => !burnedHashes.has(c.hash));
    } catch (error) {
        console.error("Failed to fetch all commitments:", error);
        return [];
    }
  }

  async submitCommitment(hash: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    // Ensure we are on Sepolia
    const network = await this.provider?.getNetwork();
    if (network?.chainId !== 11155111n) {
        throw new Error("Please switch to Sepolia network");
    }

    // Convert string hash to bytes32 format for contract
    const bytes32Hash = hash.startsWith('0x') ? hash : `0x${hash}`;
    
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("Contract not deployed. Please run 'npx hardhat run scripts/deploy.cjs --network sepolia' and update CONTRACT_ADDRESS in services/contractService.ts");
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.signer);
    const tx = await contract.registerCommitment(bytes32Hash);
    await tx.wait();
    return tx.hash;
  }

  async burnCommitment(hash: string): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    const bytes32Hash = hash.startsWith('0x') ? hash : `0x${hash}`;
    
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("Contract not deployed. Please update CONTRACT_ADDRESS.");
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.signer);
    const tx = await contract.burnCommitment(bytes32Hash);
    await tx.wait();
    return tx.hash;
  }
}

export const blockchain = new BlockchainService();
