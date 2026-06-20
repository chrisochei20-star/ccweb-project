const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const courses = [
  // CRYPTO TRACK
  {
    id: 'crs_crypto_basics', slug: 'crypto-fundamentals', title: 'Crypto Fundamentals',
    summary: 'Bitcoin, Ethereum, and how blockchain works. Perfect starting point for beginners.',
    category: 'crypto', level: 'beginner', minutes: 90,
    lessons: [
      { title: 'What is Bitcoin?', content: '# What is Bitcoin?\n\nBitcoin is a decentralized digital currency created in 2009 by Satoshi Nakamoto.\n\n## Key Concepts\n- **Blockchain**: A distributed ledger of all transactions\n- **Mining**: Process of validating transactions\n- **Wallets**: Software to store and send Bitcoin\n- **Private Keys**: Your secret password to access funds\n\n## Why Bitcoin Matters\nBitcoin introduced the concept of trustless, peer-to-peer transactions without banks.' },
      { title: 'How Blockchain Works', content: '# How Blockchain Works\n\n## Blocks and Chains\nEach block contains:\n1. Transaction data\n2. Timestamp\n3. Previous block hash\n4. Nonce (proof of work)\n\n## Consensus Mechanisms\n- **Proof of Work (PoW)**: Miners compete to solve puzzles\n- **Proof of Stake (PoS)**: Validators stake coins as collateral\n\n## Immutability\nOnce recorded, data cannot be altered without redoing all subsequent blocks.' },
      { title: 'Ethereum & Smart Contracts', content: '# Ethereum & Smart Contracts\n\n## What is Ethereum?\nEthereum is a programmable blockchain that enables decentralized applications (dApps).\n\n## Smart Contracts\nSelf-executing code that runs when conditions are met:\n```solidity\ncontract SimpleStorage {\n  uint256 public value;\n  function set(uint256 v) public { value = v; }\n}\n```\n\n## Gas Fees\nComputation costs paid in ETH to incentivize validators.' },
      { title: 'Crypto Wallets & Security', content: '# Crypto Wallets & Security\n\n## Types of Wallets\n- **Hot wallets**: Connected to internet (MetaMask, Trust Wallet)\n- **Cold wallets**: Offline storage (Ledger, Trezor)\n- **Paper wallets**: Printed private keys\n\n## Seed Phrases\n12-24 words that recover your wallet. Never share them!\n\n## Best Practices\n1. Use hardware wallets for large amounts\n2. Enable 2FA everywhere\n3. Verify addresses before sending\n4. Beware of phishing sites' },
    ]
  },
  // WEB3 TRACK  
  {
    id: 'crs_web3_dev', slug: 'web3-development', title: 'Web3 Development',
    summary: 'Build decentralized applications with Solidity, ethers.js, and modern Web3 tools.',
    category: 'web3', level: 'intermediate', minutes: 180,
    lessons: [
      { title: 'Introduction to Web3', content: '# Introduction to Web3\n\n## Web Evolution\n- **Web1**: Read-only static pages\n- **Web2**: Interactive, centralized platforms (Google, Facebook)\n- **Web3**: Decentralized, user-owned internet\n\n## Core Web3 Concepts\n- **Decentralization**: No single point of control\n- **Token economics**: Incentive alignment\n- **Self-sovereignty**: You own your data and assets\n\n## Web3 Stack\n- Ethereum / EVM chains\n- IPFS for storage\n- ENS for naming\n- MetaMask for authentication' },
      { title: 'Solidity Basics', content: '# Solidity Basics\n\n## Your First Contract\n```solidity\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract HelloWeb3 {\n    string public greeting = "Hello, Web3!";\n    address public owner;\n    \n    constructor() {\n        owner = msg.sender;\n    }\n    \n    function setGreeting(string memory _g) public {\n        require(msg.sender == owner, "Not owner");\n        greeting = _g;\n    }\n}\n```\n\n## Key Concepts\n- `msg.sender`: Address calling the function\n- `require()`: Conditional checks\n- `public/private`: Access modifiers' },
      { title: 'Building with ethers.js', content: '# Building with ethers.js\n\n## Connect to Wallet\n```javascript\nimport { ethers } from "ethers";\n\nasync function connect() {\n  const provider = new ethers.BrowserProvider(window.ethereum);\n  const signer = await provider.getSigner();\n  const address = await signer.getAddress();\n  console.log("Connected:", address);\n}\n```\n\n## Read Contract Data\n```javascript\nconst contract = new ethers.Contract(ADDRESS, ABI, provider);\nconst value = await contract.getValue();\n```\n\n## Send Transaction\n```javascript\nconst tx = await contract.connect(signer).setValue(42);\nawait tx.wait(); // Wait for confirmation\n```' },
      { title: 'DeFi Protocols', content: '# DeFi Protocols\n\n## What is DeFi?\nDecentralized Finance replaces traditional financial services with smart contracts.\n\n## Key Protocols\n- **Uniswap**: Decentralized exchange (DEX)\n- **Aave**: Lending and borrowing\n- **Compound**: Yield farming\n- **MakerDAO**: Decentralized stablecoin (DAI)\n\n## Liquidity Pools\nProvide tokens to earn trading fees:\n1. Deposit token pair (e.g., ETH/USDC)\n2. Receive LP tokens\n3. Earn % of trading fees\n4. Withdraw anytime\n\n## Risks\n- Smart contract bugs\n- Impermanent loss\n- Liquidation risk' },
    ]
  },
  // AI TRACK
  {
    id: 'crs_ai_basics', slug: 'ai-fundamentals', title: 'AI & Machine Learning Fundamentals',
    summary: 'Understand how AI works, from neural networks to large language models like GPT.',
    category: 'ai', level: 'beginner', minutes: 120,
    lessons: [
      { title: 'What is Artificial Intelligence?', content: '# What is Artificial Intelligence?\n\n## Definition\nAI is the simulation of human intelligence by machines — learning, reasoning, and self-correction.\n\n## Types of AI\n- **Narrow AI**: Specific tasks (chess, image recognition)\n- **General AI**: Human-level reasoning (future)\n- **Super AI**: Beyond human intelligence (theoretical)\n\n## Machine Learning vs AI\nML is a subset of AI where machines learn from data without explicit programming.\n\n## Real-World AI Applications\n- ChatGPT / Claude (language)\n- Midjourney (images)\n- GitHub Copilot (code)\n- Tesla Autopilot (driving)' },
      { title: 'Neural Networks Explained', content: '# Neural Networks Explained\n\n## How the Brain Inspired AI\nNeural networks mimic biological neurons — interconnected nodes that process signals.\n\n## Architecture\n```\nInput Layer → Hidden Layers → Output Layer\n[Image pixels] → [Features] → [Cat or Dog?]\n```\n\n## Training Process\n1. **Forward pass**: Input flows through network\n2. **Loss calculation**: How wrong was the prediction?\n3. **Backpropagation**: Adjust weights to reduce error\n4. **Repeat**: Millions of iterations\n\n## Key Terms\n- **Parameters**: Adjustable weights\n- **Epochs**: Training cycles\n- **Learning rate**: Speed of adjustment' },
      { title: 'Large Language Models (LLMs)', content: '# Large Language Models\n\n## What are LLMs?\nLLMs are trained on massive text datasets to predict and generate human-like text.\n\n## Famous LLMs\n- **GPT-4** (OpenAI) — Powers ChatGPT\n- **Claude** (Anthropic) — Safety-focused AI\n- **Gemini** (Google) — Multimodal AI\n- **LLaMA** (Meta) — Open source\n\n## How They Work\n1. Tokenize text into numbers\n2. Transformer architecture processes context\n3. Attention mechanism weighs word relationships\n4. Generate next most likely token\n\n## Prompt Engineering\nClear, specific prompts get better results:\n- Bad: "Write about crypto"\n- Good: "Write a 3-paragraph beginner explanation of Bitcoin mining"' },
      { title: 'AI in Web3 & Crypto', content: '# AI in Web3 & Crypto\n\n## The Convergence\nAI and blockchain are merging to create powerful new applications.\n\n## Use Cases\n- **Smart contract auditing**: AI detects vulnerabilities\n- **Trading bots**: ML predicts price movements\n- **NFT generation**: AI creates unique digital art\n- **Fraud detection**: Identify suspicious transactions\n- **DeFi optimization**: Auto-rebalance portfolios\n\n## AI Tokens\n- **FET** (Fetch.ai): Autonomous AI agents\n- **OCEAN**: Data marketplace for AI\n- **GRT** (The Graph): AI data indexing\n\n## Building AI + Web3\nCombine OpenAI API with smart contracts for on-chain AI applications.' },
    ]
  },
  // BUSINESS TRACK
  {
    id: 'crs_business_crypto', slug: 'crypto-business', title: 'Crypto Business & Entrepreneurship',
    summary: 'Launch and grow a Web3 business. Tokenomics, fundraising, marketing, and scaling.',
    category: 'business', level: 'intermediate', minutes: 150,
    lessons: [
      { title: 'Web3 Business Models', content: '# Web3 Business Models\n\n## Traditional vs Web3\n| Traditional | Web3 |\n|------------|------|\n| Subscriptions | Token access |\n| Advertising | Protocol fees |\n| Data selling | User ownership |\n| Centralized | DAO governance |\n\n## Revenue Models\n- **Protocol fees**: % of each transaction\n- **Token appreciation**: Value grows with adoption\n- **NFT royalties**: Earn on secondary sales\n- **SaaS + Token**: Hybrid model\n\n## CCWEB Model\nLearn-to-earn: Users gain skills AND earn rewards, creating a virtuous cycle of growth.' },
      { title: 'Tokenomics Design', content: '# Tokenomics Design\n\n## What is Tokenomics?\nThe economic system of your token — supply, distribution, and incentives.\n\n## Key Components\n1. **Total Supply**: How many tokens exist?\n2. **Distribution**: Who gets tokens and when?\n3. **Utility**: What can tokens be used for?\n4. **Vesting**: Lock-up periods for team/investors\n\n## Distribution Example\n- 40% Community rewards\n- 20% Team (2yr vesting)\n- 15% Investors (1yr lock)\n- 15% Treasury\n- 10% Ecosystem development\n\n## Inflation vs Deflation\n- Inflationary: New tokens minted (rewards users)\n- Deflationary: Tokens burned (increases scarcity)' },
      { title: 'Web3 Marketing', content: '# Web3 Marketing\n\n## Community-First Approach\nIn Web3, community IS the product. Build it early.\n\n## Key Channels\n- **Twitter/X**: Primary for crypto announcements\n- **Discord**: Community hub and support\n- **Telegram**: Fast updates and trading chat\n- **YouTube**: Education and tutorials\n\n## Growth Strategies\n1. **Airdrop campaigns**: Reward early adopters\n2. **Ambassador programs**: Pay community to spread word\n3. **Partnerships**: Cross-promote with complementary projects\n4. **Content marketing**: Educate your target audience\n\n## CCWEB Growth Loop\nUsers learn → earn credits → invite friends → friends learn → repeat' },
      { title: 'Fundraising in Web3', content: '# Fundraising in Web3\n\n## Funding Stages\n1. **Bootstrapping**: Self-funded (0-$50K)\n2. **Angel round**: Friends, family, angels ($50K-$500K)\n3. **Seed round**: Early VCs ($500K-$5M)\n4. **Series A**: Growth VCs ($5M+)\n\n## Web3-Specific Options\n- **IDO**: Initial DEX Offering (public token sale)\n- **ICO**: Initial Coin Offering\n- **Grants**: Ethereum Foundation, Solana Foundation\n- **Hackathons**: Prize money + visibility\n\n## What Investors Look For\n- Strong founding team\n- Clear problem/solution\n- Working product (not just whitepaper)\n- Growing community\n- Sustainable tokenomics' },
    ]
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    // Ensure categories exist
    const categories = [
      { slug: 'crypto', name: 'Crypto & Blockchain', description: 'Bitcoin, Ethereum, and blockchain fundamentals' },
      { slug: 'web3', name: 'Web3 Development', description: 'Build decentralized applications' },
      { slug: 'ai', name: 'AI & Machine Learning', description: 'Artificial intelligence and ML concepts' },
      { slug: 'business', name: 'Business & Entrepreneurship', description: 'Launch and grow your Web3 business' },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO course_categories (slug, name, description, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name=$2, description=$3`,
        [cat.slug, cat.name, cat.description, categories.indexOf(cat)]
      );
    }
    console.log('Categories seeded');

    for (const course of courses) {
      // Insert course
      await client.query(
        `INSERT INTO courses (id, slug, title, summary, category_slug, level, published, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7::jsonb)
         ON CONFLICT (id) DO UPDATE SET title=$3, summary=$4, published=true`,
        [course.id, course.slug, course.title, course.summary, course.category,
         course.level, JSON.stringify({ estimatedMinutes: course.minutes, ratingHint: "4.8" })]
      );

      // Insert lessons
      for (let i = 0; i < course.lessons.length; i++) {
        const lesson = course.lessons[i];
        const lessonId = `${course.id}_lesson_${i + 1}`;
        await client.query(
          `INSERT INTO course_lessons (id, course_id, title, content, sort_order, published)
           VALUES ($1, $2, $3, $4, $5, true)
           ON CONFLICT (id) DO UPDATE SET title=$3, content=$4`,
          [lessonId, course.id, lesson.title, lesson.content, i + 1]
        );
      }
      console.log(`Seeded: ${course.title} (${course.lessons.length} lessons)`);
    }
    console.log('All courses seeded successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
