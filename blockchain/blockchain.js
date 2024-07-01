const crypto = require('crypto');
const fs = require('fs');

class Block {
    constructor(index, previousHash, timestamp, data, proof) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.proof = proof;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.index + this.previousHash + this.timestamp + this.data + this.proof)
            .digest('hex');
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.difficulty = 4;
        this.loadBlockchain();
    }

    createGenesisBlock() {
        return new Block(0, "0", Date.now(), "Genesis Block", 0);
    }

    loadBlockchain() {
        if (fs.existsSync('blockchain.json')) {
            const data = fs.readFileSync('blockchain.json');
            const jsonData = JSON.parse(data);
            this.chain = jsonData.map(block => new Block(block.index, block.previousHash, block.timestamp, block.data, block.proof));
        } else {
            this.chain.push(this.createGenesisBlock());
            this.saveBlockchain();
        }
    }

    saveBlockchain() {
        fs.writeFileSync('blockchain.json', JSON.stringify(this.chain, null, 4));
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.proof = this.proofOfWork(newBlock);
        newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);
        this.saveBlockchain();
    }

    proofOfWork(block) {
        let proof = 0;
        while (!this.isValidProof(block, proof)) {
            proof++;
        }
        return proof;
    }

    isValidProof(block, proof) {
        block.proof = proof;
        block.hash = block.calculateHash();
        return block.hash.substring(0, this.difficulty) === Array(this.difficulty + 1).join("0");
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return { valid: false, corruptedBlock: currentBlock };
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return { valid: false, corruptedBlock: currentBlock };
            }
        }
        return { valid: true, corruptedBlock: null };
    }

    checkBlockchain() {
        const result = this.isChainValid();
        if (!result.valid) {
            console.log(`Blockchain is corrupted at block index: ${result.corruptedBlock.index}`);
        } else {
            console.log('Blockchain is valid');
        }
    }
}


const blockchain = new Blockchain();
blockchain.addBlock(new Block(1, blockchain.getLatestBlock().hash, Date.now(), "Block 1 Data", 0));
blockchain.addBlock(new Block(2, blockchain.getLatestBlock().hash, Date.now(), "Block 2 Data", 0));

blockchain.checkBlockchain();
