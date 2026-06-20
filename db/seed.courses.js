const { getPool } = require('./pool');

const courses = [
  {
    id: 'crs_crypto_basics', slug: 'crypto-fundamentals', title: 'Crypto Fundamentals',
    summary: 'Bitcoin, Ethereum, and how blockchain works. Perfect starting point for beginners.',
    category: 'crypto', level: 'beginner', minutes: 90,
    lessons: [
      { title: 'What is Bitcoin?', content: '# What is Bitcoin?\n\nBitcoin is a decentralized digital currency created in 2009 by Satoshi Nakamoto.\n\n## Key Concepts\n- **Blockchain**: A distributed ledger of all transactions\n- **Mining**: Process of validating transactions\n- **Wallets**: Software to store and send Bitcoin\n- **Private Keys**: Your secret password to access funds\n\n## Why Bitcoin Matters\nBitcoin introduced trustless, peer-to-peer transactions without banks.' },
      { title: 'How Blockchain Works', content: '# How Blockchain Works\n\n## Blocks and Chains\nEach block contains:\n1. Transaction data\n2. Timestamp\n3. Previous block hash\n4. Nonce (proof of work)\n\n## Consensus Mechanisms\n- **Proof of Work (PoW)**: Miners compete to solve puzzles\n- **Proof of Stake (PoS)**: Validators stake coins as collateral\n\n## Immutability\nOnce recorded, data cannot be altered without redoing all subsequent blocks.' },
      { title: 'Ethereum & Smart Contracts', content: '# Ethereum & Smart Contracts\n\n## What is Ethereum?\nEthereum is a programmable blockchain enabling decentralized applications.\n\n## Smart Contracts\n```solidity\ncontract SimpleStorage {\n  uint256 public value;\n  function set(uint256 v) public { value = v; }\n}\n```\n\n## Gas Fees\nComputation costs paid in ETH to incentivize validators.' },
      { title: 'Crypto Wallets & Security', content: '# Crypto Wallets & Security\n\n## Types of Wallets\n- **Hot wallets**: MetaMask, Trust Wallet\n- **Cold wallets**: Ledger, Trezor\n- **Paper wallets**: Printed private keys\n\n## Seed Phrases\n12-24 words that recover your wallet. Never share them!\n\n## Best Practices\n1. Use hardware wallets for large amounts\n2. Enable 2FA everywhere\n3. Verify addresses before sending\n4. Beware of phishing sites' },
    ]
  },
  {
    id: 'crs_web3_dev', slug: 'web3-development', title: 'Web3 Development',
    summary: 'Build decentralized applications with Solidity, ethers.js, and modern Web3 tools.',
    category: 'web3', level: 'intermediate', minutes: 180,
    lessons: [
      { title: 'Introduction to Web3', content: '# Introduction to Web3\n\n## Web Evolution\n- **Web1**: Read-only static pages\n- **Web2**: Centralized platforms (Google, Facebook)\n- **Web3**: Decentralized, user-owned internet\n\n## Web3 Stack\n- Ethereum / EVM chains\n- IPFS for storage\n- ENS for naming\n- MetaMask for authentication' },
      { title: 'Solidity Basics', content: '# Solidity Basics\n\n```solidity\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract HelloWeb3 {\n    string public greeting = "Hello, Web3!";\n    address public owner;\n    constructor() { owner = msg.sender; }\n    function setGreeting(string memory _g) public {\n        require(msg.sender == owner, "Not owner");\n        greeting = _g;\n    }\n}\n```\n\n## Key Concepts\n- `msg.sender`: Caller address\n- `require()`: Conditional checks\n- `public/private`: Access modifiers' },
      { title: 'Building with ethers.js', content: '# Building with ethers.js\n\n## Connect Wallet\n```javascript\nimport { ethers } from "ethers";\nconst provider = new ethers.BrowserProvider(window.ethereum);\nconst signer = await provider.getSigner();\nconst address = await signer.getAddress();\n```\n\n## Read & Write Contracts\n```javascript\nconst contract = new ethers.Contract(ADDRESS, ABI, provider);\nconst value = await contract.getValue();\nconst tx = await contract.connect(signer).setValue(42);\nawait tx.wait();\n```' },
      { title: 'DeFi Protocols', content: '# DeFi Protocols\n\n## Key Protocols\n- **Uniswap**: Decentralized exchange\n- **Aave**: Lending and borrowing\n- **Compound**: Yield farming\n- **MakerDAO**: Stablecoin (DAI)\n\n## Liquidity Pools\n1. Deposit token pair (ETH/USDC)\n2. Receive LP tokens\n3. Earn trading fees\n4. Withdraw anytime\n\n## Risks\n- Smart contract bugs\n- Impermanent loss\n- Liquidation risk' },
    ]
  },
  {
    id: 'crs_ai_basics', slug: 'ai-fundamentals', title: 'AI & Machine Learning Fundamentals',
    summary: 'Understand how AI works, from neural networks to large language models like GPT.',
    category: 'ai', level: 'beginner', minutes: 120,
    lessons: [
      { title: 'What is Artificial Intelligence?', content: '# What is AI?\n\n## Types of AI\n- **Narrow AI**: Specific tasks (chess, image recognition)\n- **General AI**: Human-level reasoning (future)\n- **Super AI**: Beyond human intelligence (theoretical)\n\n## Real-World Applications\n- ChatGPT / Claude (language)\n- Midjourney (images)\n- GitHub Copilot (code)\n- Tesla Autopilot (driving)' },
      { title: 'Neural Networks Explained', content: '# Neural Networks\n\n## Architecture\n```\nInput Layer → Hidden Layers → Output Layer\n[Image pixels] → [Features] → [Cat or Dog?]\n```\n\n## Training Process\n1. Forward pass through network\n2. Calculate prediction error\n3. Backpropagation adjusts weights\n4. Repeat millions of times\n\n## Key Terms\n- **Parameters**: Adjustable weights\n- **Epochs**: Training cycles\n- **Learning rate**: Speed of adjustment' },
      { title: 'Large Language Models', content: '# Large Language Models\n\n## Famous LLMs\n- **GPT-4** (OpenAI) — Powers ChatGPT\n- **Claude** (Anthropic) — Safety-focused\n- **Gemini** (Google) — Multimodal\n- **LLaMA** (Meta) — Open source\n\n## Prompt Engineering\nClear prompts get better results:\n- Bad: "Write about crypto"\n- Good: "Write a 3-paragraph beginner explanation of Bitcoin mining for a Nigerian audience"' },
      { title: 'AI in Web3 & Crypto', content: '# AI in Web3 & Crypto\n\n## Use Cases\n- **Smart contract auditing**: AI detects vulnerabilities\n- **Trading bots**: ML predicts price movements\n- **NFT generation**: AI creates unique art\n- **Fraud detection**: Identify suspicious transactions\n\n## AI Tokens\n- **FET** (Fetch.ai): Autonomous agents\n- **OCEAN**: Data marketplace\n- **GRT** (The Graph): Data indexing\n\n## Building AI + Web3\nCombine OpenAI API with smart contracts for on-chain AI apps.' },
    ]
  },
  {
    id: 'crs_business_crypto', slug: 'crypto-business', title: 'Crypto Business & Entrepreneurship',
    summary: 'Launch and grow a Web3 business. Tokenomics, fundraising, marketing, and scaling.',
    category: 'business', level: 'intermediate', minutes: 150,
    lessons: [
      { title: 'Web3 Business Models', content: '# Web3 Business Models\n\n## Revenue Models\n- **Protocol fees**: % of each transaction\n- **Token appreciation**: Value grows with adoption\n- **NFT royalties**: Earn on secondary sales\n- **SaaS + Token**: Hybrid model\n\n## CCWEB Model\nLearn-to-earn: Users gain skills AND earn rewards, creating a virtuous growth cycle.' },
      { title: 'Tokenomics Design', content: '# Tokenomics Design\n\n## Key Components\n1. **Total Supply**: How many tokens exist?\n2. **Distribution**: Who gets tokens and when?\n3. **Utility**: What can tokens be used for?\n4. **Vesting**: Lock-up periods\n\n## Example Distribution\n- 40% Community rewards\n- 20% Team (2yr vesting)\n- 15% Investors (1yr lock)\n- 15% Treasury\n- 10% Ecosystem' },
      { title: 'Web3 Marketing', content: '# Web3 Marketing\n\n## Key Channels\n- **Twitter/X**: Crypto announcements\n- **Discord**: Community hub\n- **Telegram**: Fast updates\n- **YouTube**: Education\n\n## Growth Strategies\n1. Airdrop campaigns\n2. Ambassador programs\n3. Strategic partnerships\n4. Content marketing\n\n## CCWEB Growth Loop\nUsers learn → earn credits → invite friends → friends learn → repeat' },
      { title: 'Fundraising in Web3', content: '# Fundraising in Web3\n\n## Funding Stages\n1. Bootstrapping: $0-50K\n2. Angel round: $50K-500K\n3. Seed round: $500K-5M\n4. Series A: $5M+\n\n## Web3-Specific Options\n- **IDO**: Initial DEX Offering\n- **Grants**: Ethereum/Solana Foundation\n- **Hackathons**: Prize money + visibility\n\n## What Investors Look For\n- Strong team\n- Working product\n- Growing community\n- Sustainable tokenomics' },
    ]
  },
];

async function seed() {
  const pool = getPool();
  if (!pool) { console.error('No database'); process.exit(1); }
  const client = await pool.connect();
  try {
    const categories = [
      { slug: 'crypto', name: 'Crypto & Blockchain' },
      { slug: 'web3', name: 'Web3 Development' },
      { slug: 'ai', name: 'AI & Machine Learning' },
      { slug: 'business', name: 'Business & Entrepreneurship' },
    ];
    for (const cat of categories) {
      await client.query(
        `INSERT INTO ccweb_course_categories (slug, name) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name=$2`,
        [cat.slug, cat.name]
      );
    }
    console.log('Categories seeded');

    for (const course of courses) {
      await client.query(
        `INSERT INTO ccweb_courses (id, slug, title, summary, category_slug, level, published, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,true,$7::jsonb)
         ON CONFLICT (id) DO UPDATE SET title=$3, summary=$4, published=true`,
        [course.id, course.slug, course.title, course.summary, course.category,
         course.level, JSON.stringify({ estimatedMinutes: course.minutes, ratingHint: "4.8" })]
      );
      for (let i = 0; i < course.lessons.length; i++) {
        const l = course.lessons[i];
        const lid = `${course.id}_lesson_${i+1}`;
        await client.query(
          `INSERT INTO ccweb_lessons (id, course_id, title, content, position)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET title=$3, content=$4`,
          [lid, course.id, l.title, l.content, i+1]
        );
      }
      console.log(`Seeded: ${course.title}`);
    }
    console.log('Done!');
  } finally {
    client.release();
  }
}
seed().catch(console.error);
