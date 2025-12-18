/**
 * Seed RAG Embeddings
 *
 * Creates demo document embeddings in the RAG service database.
 * This enables semantic search and AI report generation (UC16).
 *
 * The RAG service uses:
 * - PostgreSQL with vector columns for embeddings
 * - OpenAI text-embedding-3-small (1536 dimensions)
 *
 * Prerequisites:
 * - RAG service must be running
 * - OPENAI_API_KEY must be set
 */

import { Pool } from 'pg';
import {
  USER_IDS,
  ORG_IDS,
  ROOM_IDS,
  DOCUMENT_IDS,
  RAG_MESSAGE_IDS,
  DB_CONFIG,
} from './seed-constants';

// RAG service database config
const RAG_DB_CONFIG = {
  host: DB_CONFIG.POSTGRES.host,
  port: DB_CONFIG.POSTGRES.port,
  user: DB_CONFIG.POSTGRES.user,
  password: DB_CONFIG.POSTGRES.password,
  database: DB_CONFIG.POSTGRES.databases.rag,
};

// RAG API URL for embedding generation
const RAG_API_URL = process.env.RAG_SERVICE_URL || 'http://localhost:41600';

// Sample documents to embed (simulating file contents)
interface DocumentToEmbed {
  namespaceId: string;
  namespaceType: 'workspace' | 'room' | 'project';
  orgId: string;
  sourceType: 'file' | 'document' | 'message';
  sourceId: string;
  content: string;
  metadata: Record<string, any>;
}

const SAMPLE_DOCUMENTS: DocumentToEmbed[] = [
  // ACME Corporation - Project Documentation
  {
    namespaceId: ORG_IDS.ACME,
    namespaceType: 'workspace',
    orgId: ORG_IDS.ACME,
    sourceType: 'document',
    sourceId: DOCUMENT_IDS.ACME_API_DOC,
    content: `
# API Documentation v2.1

## Overview
This document describes the REST API for the E-commerce Platform v2.

## Authentication
All API requests require Bearer token authentication.
- Token expires after 24 hours
- Refresh tokens are valid for 7 days

## Endpoints

### Products API
- GET /api/products - List all products with pagination
- GET /api/products/:id - Get product details
- POST /api/products - Create new product (Admin only)
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product

### Orders API
- GET /api/orders - List user orders
- POST /api/orders - Create new order
- GET /api/orders/:id - Get order details
- PUT /api/orders/:id/status - Update order status

### Users API
- GET /api/users/me - Get current user profile
- PUT /api/users/me - Update profile
- POST /api/users/avatar - Upload avatar

## Error Handling
All errors return JSON with format:
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}

## Rate Limiting
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated requests
    `.trim(),
    metadata: {
      fileName: 'API-Documentation-v2.pdf',
      author: USER_IDS.ACME_DEV_1,
      version: '2.1',
      pages: 45,
    },
  },
  {
    namespaceId: ORG_IDS.ACME,
    namespaceType: 'workspace',
    orgId: ORG_IDS.ACME,
    sourceType: 'document',
    sourceId: DOCUMENT_IDS.ACME_ROADMAP,
    content: `
# Product Roadmap Q1 2025

## Sprint 4 (Jan 6-19)
- Payment gateway integration
- Multi-currency support
- Invoice generation
- Tax calculation module

## Sprint 5 (Jan 20 - Feb 2)
- Mobile app push notifications
- Real-time order tracking
- Customer support chat integration

## Sprint 6 (Feb 3-16)
- Analytics dashboard v2
- A/B testing framework
- Performance optimization

## Sprint 7 (Feb 17 - Mar 2)
- Inventory management system
- Supplier portal
- Automated reordering

## Key Milestones
- Jan 31: Payment system go-live
- Feb 14: Mobile app v2 release
- Mar 1: Analytics dashboard launch

## Dependencies
- Third-party payment provider setup (Stripe)
- Mobile app store approvals
- CDN configuration for assets

## Risks
- Payment provider API changes
- App store review delays
- Team capacity during Tet holiday
    `.trim(),
    metadata: {
      fileName: 'Product-Roadmap-Q1-2025.xlsx',
      author: USER_IDS.ACME_PM_1,
      quarter: 'Q1-2025',
    },
  },
  {
    namespaceId: ORG_IDS.ACME,
    namespaceType: 'workspace',
    orgId: ORG_IDS.ACME,
    sourceType: 'document',
    sourceId: DOCUMENT_IDS.ACME_SPRINT3_REPORT,
    content: `
# Sprint 3 Report

## Summary
Sprint 3 completed successfully with 92% of planned story points delivered.

## Completed Items
1. User authentication system refactoring
2. Product search with Elasticsearch
3. Shopping cart persistence
4. Checkout flow optimization
5. Order confirmation emails

## Carried Over
- Admin dashboard improvements (50% complete)
- Performance profiling (blocked by DevOps)

## Metrics
- Velocity: 45 story points
- Bug count: 12 (8 resolved, 4 minor)
- Code coverage: 78% (+3% from Sprint 2)
- API response time: avg 120ms (-30ms improvement)

## Team Feedback
- Need more time for code reviews
- Design handoff process improved
- Better communication with QA team

## Action Items for Sprint 4
1. Schedule design review meetings
2. Set up automated performance tests
3. Create API documentation standards
    `.trim(),
    metadata: {
      fileName: 'Sprint-3-Report.docx',
      author: USER_IDS.ACME_PM_1,
      sprint: 3,
    },
  },
  {
    namespaceId: ORG_IDS.ACME,
    namespaceType: 'workspace',
    orgId: ORG_IDS.ACME,
    sourceType: 'document',
    sourceId: DOCUMENT_IDS.ACME_ARCHITECTURE,
    content: `
# System Architecture Overview

## High-Level Architecture
The E-commerce platform uses a microservices architecture with the following components:

### Frontend
- Next.js 14 with App Router
- TailwindCSS for styling
- React Query for data fetching
- Zustand for state management

### Backend Services
1. Identity Service (NestJS)
   - User authentication & authorization
   - OAuth2 integration (Google, GitHub)
   - JWT token management

2. Product Service (NestJS)
   - Product catalog management
   - Category hierarchies
   - Inventory tracking

3. Order Service (NestJS)
   - Order processing
   - Payment integration
   - Shipping calculation

4. Notification Service (NestJS)
   - Email notifications
   - Push notifications
   - In-app notifications

### Data Stores
- PostgreSQL: Primary database
- Redis: Caching & sessions
- Elasticsearch: Search engine
- MinIO: File storage

### Infrastructure
- Docker & Kubernetes
- Nginx as reverse proxy
- GitHub Actions CI/CD
- AWS deployment

## Security
- HTTPS everywhere
- API rate limiting
- Input validation
- SQL injection prevention
- XSS protection
    `.trim(),
    metadata: {
      fileName: 'Architecture-Diagram.png',
      author: USER_IDS.ACME_DEV_1,
      type: 'architecture',
    },
  },

  // Tech Startup - MVP Documents
  {
    namespaceId: ORG_IDS.TECH_STARTUP,
    namespaceType: 'workspace',
    orgId: ORG_IDS.TECH_STARTUP,
    sourceType: 'document',
    sourceId: DOCUMENT_IDS.STARTUP_MVP_REQUIREMENTS,
    content: `
# MVP Requirements Document

## Product Vision
A SaaS platform for small businesses to manage customer relationships and sales pipeline.

## Target Users
- Small business owners (1-50 employees)
- Sales teams
- Customer support representatives

## Core Features (MVP)

### 1. Contact Management
- Add/edit/delete contacts
- Import from CSV
- Contact categorization with tags
- Search and filter

### 2. Deal Pipeline
- Kanban board view
- Deal stages customization
- Deal value tracking
- Win/loss analysis

### 3. Activity Tracking
- Log calls, emails, meetings
- Task reminders
- Activity timeline per contact

### 4. Basic Reporting
- Sales pipeline report
- Activity summary
- Team performance metrics

## Non-Functional Requirements
- Response time < 500ms
- 99.9% uptime
- Support 1000 concurrent users
- Mobile responsive design

## Out of Scope (Post-MVP)
- Email integration
- Calendar sync
- Advanced analytics
- API for third-party integrations
    `.trim(),
    metadata: {
      fileName: 'MVP-Requirements.pdf',
      author: USER_IDS.STARTUP_OWNER,
      version: '1.0',
    },
  },
  {
    namespaceId: ORG_IDS.TECH_STARTUP,
    namespaceType: 'workspace',
    orgId: ORG_IDS.TECH_STARTUP,
    sourceType: 'document',
    sourceId: DOCUMENT_IDS.STARTUP_PITCH_DECK,
    content: `
# Pitch Deck - CRM for SMBs

## Problem
- 73% of small businesses don't have a CRM
- Existing solutions are too complex and expensive
- Sales teams waste 40% of time on admin tasks

## Solution
SimpleCRM - An intuitive, affordable CRM designed for small businesses.

## Market Size
- TAM: $120B global CRM market
- SAM: $15B SMB segment
- SOM: $150M (1% in 3 years)

## Business Model
- Freemium with paid tiers
- Free: Up to 100 contacts
- Pro: $29/user/month
- Business: $49/user/month

## Traction
- 500 beta users
- 12% weekly growth
- 4.5/5 average rating
- $5K MRR

## Competition
- Salesforce: Too complex, expensive
- HubSpot: Feature bloat
- Pipedrive: Limited customization

## Our Advantage
- Built by SMB owners for SMB owners
- 5-minute setup
- Vietnamese language support
- Local payment methods

## Team
- CEO: 10 years enterprise sales
- CTO: Ex-Google engineer
- CPO: 8 years product management

## Ask
Raising $500K seed round for:
- Product development (60%)
- Marketing (25%)
- Operations (15%)
    `.trim(),
    metadata: {
      fileName: 'Pitch-Deck-v3.pptx',
      author: USER_IDS.STARTUP_OWNER,
      slides: 20,
    },
  },

  // Innovation Labs - Research Documents
  {
    namespaceId: ORG_IDS.INNOVATION_LABS,
    namespaceType: 'workspace',
    orgId: ORG_IDS.INNOVATION_LABS,
    sourceType: 'document',
    sourceId: DOCUMENT_IDS.LABS_LLM_COMPARISON,
    content: `
# LLM Comparison Report 2024

## Executive Summary
This report compares leading Large Language Models for enterprise use cases.

## Models Evaluated
1. OpenAI GPT-4 Turbo
2. Anthropic Claude 3 Opus
3. Google Gemini Ultra
4. Meta Llama 3 70B
5. Mistral Large

## Evaluation Criteria

### 1. Performance
- Accuracy on benchmarks (MMLU, HumanEval)
- Response quality
- Instruction following

### 2. Cost
- Input token pricing
- Output token pricing
- Total cost per 1M tokens

### 3. Latency
- Time to first token
- Tokens per second
- Batch processing speed

### 4. Context Length
- Maximum context window
- Performance degradation at scale

### 5. Safety
- Content filtering
- Bias mitigation
- Hallucination rate

## Results Summary

| Model | Accuracy | Cost/1M | Latency | Context |
|-------|----------|---------|---------|---------|
| GPT-4 Turbo | 92% | $30 | 1.2s | 128K |
| Claude 3 Opus | 91% | $45 | 1.5s | 200K |
| Gemini Ultra | 89% | $25 | 1.0s | 1M |
| Llama 3 70B | 85% | $5* | 0.8s | 8K |
| Mistral Large | 87% | $8 | 0.6s | 32K |

*Self-hosted cost estimate

## Recommendations
- General use: GPT-4 Turbo (best balance)
- Long documents: Claude 3 Opus (200K context)
- Cost-sensitive: Llama 3 (open source)
- Low latency: Mistral Large
    `.trim(),
    metadata: {
      fileName: 'LLM-Comparison-Report.pdf',
      author: USER_IDS.LABS_LEAD,
      year: 2024,
    },
  },
  {
    namespaceId: ORG_IDS.INNOVATION_LABS,
    namespaceType: 'workspace',
    orgId: ORG_IDS.INNOVATION_LABS,
    sourceType: 'document',
    sourceId: DOCUMENT_IDS.LABS_RAG_ARCHITECTURE,
    content: `
# RAG Pipeline Architecture

## Overview
Retrieval-Augmented Generation (RAG) combines information retrieval with text generation for accurate, up-to-date responses.

## Architecture Components

### 1. Document Ingestion
- File upload API
- Document parsers (PDF, DOCX, TXT)
- Text extraction and cleaning
- Chunking strategies

### 2. Embedding Generation
- Model: text-embedding-3-small
- Dimensions: 1536
- Batch processing support
- Caching for repeated content

### 3. Vector Storage
- PostgreSQL with float arrays
- Cosine similarity search
- Namespace isolation
- Multi-tenancy support

### 4. Retrieval Pipeline
- Query embedding
- Similarity search (top-k)
- Reranking (optional)
- Context assembly

### 5. Generation
- LLM integration (GPT-4, Claude)
- Prompt engineering
- Response streaming
- Source citation

## Chunking Strategy
- Chunk size: 1000 characters
- Overlap: 200 characters
- Separators: paragraphs, sentences
- Metadata preservation

## Search Algorithm
1. Embed user query
2. Find top-k similar chunks
3. Filter by similarity threshold (0.7)
4. Combine context from chunks
5. Generate response with citations

## Performance Metrics
- Indexing: 100 docs/minute
- Search: <100ms for 1M embeddings
- Generation: 2-5s depending on LLM
    `.trim(),
    metadata: {
      fileName: 'RAG-Pipeline-Architecture.png',
      author: USER_IDS.LABS_RESEARCHER_2,
      type: 'architecture',
    },
  },

  // Chat messages for rooms (short texts)
  {
    namespaceId: ROOM_IDS.ACME_ENGINEERING,
    namespaceType: 'room',
    orgId: ORG_IDS.ACME,
    sourceType: 'message',
    sourceId: RAG_MESSAGE_IDS.ACME_ENG_MSG_1,
    content: 'The payment gateway integration is almost complete. We need to test with sandbox credentials before going live.',
    metadata: {
      userId: USER_IDS.ACME_DEV_1,
      roomName: 'Engineering',
    },
  },
  {
    namespaceId: ROOM_IDS.ACME_ENGINEERING,
    namespaceType: 'room',
    orgId: ORG_IDS.ACME,
    sourceType: 'message',
    sourceId: RAG_MESSAGE_IDS.ACME_ENG_MSG_2,
    content: 'Found a critical bug in the checkout flow. When users apply discount codes, the total is not recalculated correctly.',
    metadata: {
      userId: USER_IDS.ACME_DEV_2,
      roomName: 'Engineering',
    },
  },
  {
    namespaceId: ROOM_IDS.ACME_ENGINEERING,
    namespaceType: 'room',
    orgId: ORG_IDS.ACME,
    sourceType: 'message',
    sourceId: RAG_MESSAGE_IDS.ACME_ENG_MSG_3,
    content: 'Performance optimization is done. API response times reduced from 150ms to 120ms average.',
    metadata: {
      userId: USER_IDS.ACME_DEV_3,
      roomName: 'Engineering',
    },
  },
  {
    namespaceId: ROOM_IDS.ACME_PRODUCT,
    namespaceType: 'room',
    orgId: ORG_IDS.ACME,
    sourceType: 'message',
    sourceId: RAG_MESSAGE_IDS.ACME_PROD_MSG_1,
    content: 'Sprint 4 planning meeting scheduled for Monday 9am. Please prepare your estimates.',
    metadata: {
      userId: USER_IDS.ACME_PM_1,
      roomName: 'Product',
    },
  },
  {
    namespaceId: ROOM_IDS.ACME_PRODUCT,
    namespaceType: 'room',
    orgId: ORG_IDS.ACME,
    sourceType: 'message',
    sourceId: RAG_MESSAGE_IDS.ACME_PROD_MSG_2,
    content: 'Customer feedback: They want better filtering options in the product catalog. Adding to backlog.',
    metadata: {
      userId: USER_IDS.ACME_PM_2,
      roomName: 'Product',
    },
  },
];

/**
 * Call RAG API to index document
 */
async function indexDocument(doc: DocumentToEmbed): Promise<boolean> {
  try {
    const isShortText = doc.sourceType === 'message';
    const endpoint = isShortText
      ? '/embeddings/index-short'
      : '/embeddings/index';

    // Build request body - short text doesn't support chunkSize/chunkOverlap
    const body: Record<string, any> = {
      namespaceId: doc.namespaceId,
      namespaceType: doc.namespaceType,
      orgId: doc.orgId,
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
      content: doc.content,
      metadata: doc.metadata,
    };

    // Only add chunking params for long documents
    if (!isShortText) {
      body.chunkSize = 1000;
      body.chunkOverlap = 200;
    }

    const response = await fetch(`${RAG_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ Failed to index ${doc.sourceId}: ${error}`);
      return false;
    }

    const result = await response.json();
    console.log(`  ✅ Indexed ${doc.sourceId}: ${result.chunksCreated || 1} chunks`);
    return true;
  } catch (error: any) {
    console.error(`  ❌ Error indexing ${doc.sourceId}: ${error.message}`);
    return false;
  }
}

/**
 * Check if RAG service is available
 */
async function checkRagService(): Promise<boolean> {
  try {
    const response = await fetch(`${RAG_API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Seed RAG embeddings via API
 */
async function seedRagViaApi() {
  console.log('🌱 Seeding RAG embeddings via API...');
  console.log(`   RAG Service URL: ${RAG_API_URL}`);

  // Check service availability
  const isAvailable = await checkRagService();
  if (!isAvailable) {
    console.log('  ⚠️  RAG service is not available. Skipping embedding generation.');
    console.log('     Make sure RAG service is running and OPENAI_API_KEY is set.');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const doc of SAMPLE_DOCUMENTS) {
    const result = await indexDocument(doc);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ RAG seeding complete: ${success} succeeded, ${failed} failed`);
}

/**
 * Alternative: Direct database seeding (without embeddings)
 * This creates placeholder records that can be embedded later
 */
async function seedRagDirectDb() {
  console.log('🌱 Seeding RAG database directly (no embeddings)...');

  const pool = new Pool(RAG_DB_CONFIG);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'document_embeddings'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('  ⚠️  document_embeddings table does not exist.');
      console.log('     RAG service needs to run migrations first.');
      await client.query('ROLLBACK');
      return;
    }

    // Clear existing data
    await client.query('DELETE FROM document_embeddings');
    console.log('  🗑️  Cleared existing embeddings');

    console.log('  ℹ️  Direct DB seeding requires embeddings. Use API method instead.');
    console.log('     Run: RAG_SERVICE_URL=http://localhost:41600 npx tsx scripts/seeds/seed-rag.ts');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedRag() {
  // Try API method first (recommended - generates real embeddings)
  await seedRagViaApi();
}

// Run if executed directly
if (require.main === module) {
  seedRag()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedRag, SAMPLE_DOCUMENTS };
