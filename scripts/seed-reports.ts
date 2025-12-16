/**
 * Seed Reports for Tenant-BFF Service
 *
 * Creates demo reports in MongoDB
 *
 * Usage:
 *   npx ts-node scripts/seed-reports.ts
 *
 * Environment variables:
 *   MONGODB_URI - MongoDB connection string (default: mongodb://localhost:27017)
 *   MONGODB_DB - Database name (default: tenant_bff)
 */

import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';

const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  database: process.env.MONGODB_DB || 'tenant_bff',
};

// Get user and org IDs from the seed-demo-data script or use defaults
const DEMO_USER_ID = process.env.DEMO_USER_ID || randomUUID();
const DEMO_ORG_ID = process.env.DEMO_ORG_ID || randomUUID();

const reportTypes = ['SUMMARY', 'ANALYSIS', 'EXTRACTION', 'COMPARISON', 'CUSTOM'] as const;
const reportStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;
const llmProviders = ['OPENAI', 'ANTHROPIC', 'GOOGLE'] as const;

const sampleReports = [
  {
    name: 'Q4 Sales Summary',
    description: 'Summary of Q4 2024 sales performance',
    type: 'SUMMARY',
    status: 'COMPLETED',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    content: `# Q4 2024 Sales Summary

## Overview
The fourth quarter of 2024 showed strong performance across all regions.

## Key Highlights
- **Total Revenue**: $2.5M (+15% YoY)
- **New Customers**: 150 (+25% QoQ)
- **Customer Retention**: 92%

## Regional Performance
1. North Region: $1.2M
2. South Region: $800K
3. Central Region: $500K

## Recommendations
- Expand marketing efforts in Central region
- Focus on enterprise customers in Q1 2025`,
    tokenUsage: { promptTokens: 1500, completionTokens: 800, totalTokens: 2300 },
  },
  {
    name: 'Market Analysis Report',
    description: 'Comprehensive market analysis for new product launch',
    type: 'ANALYSIS',
    status: 'COMPLETED',
    llmProvider: 'ANTHROPIC',
    llmModel: 'claude-3-sonnet',
    content: `# Market Analysis Report

## Executive Summary
This analysis examines market conditions for the upcoming product launch.

## Market Size
- Total Addressable Market: $10B
- Serviceable Addressable Market: $2B
- Target Market Share: 5%

## Competitive Landscape
| Competitor | Market Share | Strength |
|------------|--------------|----------|
| Company A | 35% | Brand recognition |
| Company B | 25% | Price leadership |
| Company C | 15% | Innovation |

## Opportunities
- Growing demand in Southeast Asia
- Untapped SMB segment
- Partnership opportunities`,
    tokenUsage: { promptTokens: 2000, completionTokens: 1200, totalTokens: 3200 },
  },
  {
    name: 'Contract Data Extraction',
    description: 'Extract key terms from vendor contracts',
    type: 'EXTRACTION',
    status: 'COMPLETED',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o-mini',
    content: `# Contract Data Extraction

## Extracted Terms

### Contract 1: Vendor ABC
- **Start Date**: January 1, 2024
- **End Date**: December 31, 2025
- **Value**: $50,000/year
- **Auto-Renewal**: Yes
- **Notice Period**: 60 days

### Contract 2: Vendor XYZ
- **Start Date**: March 15, 2024
- **End Date**: March 14, 2026
- **Value**: $75,000/year
- **Auto-Renewal**: No
- **Notice Period**: 90 days`,
    tokenUsage: { promptTokens: 800, completionTokens: 400, totalTokens: 1200 },
  },
  {
    name: 'Document Comparison',
    description: 'Compare two versions of the policy document',
    type: 'COMPARISON',
    status: 'PROCESSING',
    llmProvider: 'GOOGLE',
    llmModel: 'gemini-pro',
    content: null,
    tokenUsage: null,
  },
  {
    name: 'Weekly Team Report',
    description: 'Generate weekly team status report',
    type: 'CUSTOM',
    status: 'PENDING',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    prompt: 'Generate a weekly status report summarizing team activities, blockers, and next week priorities.',
    content: null,
    tokenUsage: null,
  },
  {
    name: 'Failed Report Example',
    description: 'Example of a failed report',
    type: 'ANALYSIS',
    status: 'FAILED',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4',
    content: null,
    errorMessage: 'Rate limit exceeded. Please try again later.',
    tokenUsage: null,
  },
];

async function main() {
  console.log('📊 Seeding Reports for Tenant-BFF Service...');
  console.log(`   MongoDB: ${config.mongoUri}`);
  console.log(`   Database: ${config.database}`);

  const client = new MongoClient(config.mongoUri);

  try {
    await client.connect();
    const db = client.db(config.database);
    const reportsCollection = db.collection('reports');

    // Clear existing reports
    await reportsCollection.deleteMany({});
    console.log('  Cleared existing reports');

    // Insert demo reports
    const now = new Date();
    const reports = sampleReports.map((report, index) => ({
      _id: randomUUID(),
      orgId: DEMO_ORG_ID,
      createdBy: DEMO_USER_ID,
      name: report.name,
      description: report.description,
      type: report.type,
      status: report.status,
      llmProvider: report.llmProvider,
      llmModel: report.llmModel,
      prompt: report.prompt || null,
      content: report.content || null,
      errorMessage: report.errorMessage || null,
      fileIds: [],
      config: {},
      tokenUsage: report.tokenUsage || null,
      createdAt: new Date(now.getTime() - (index + 1) * 3600000), // 1 hour apart
      startedAt: report.status !== 'PENDING' ? new Date(now.getTime() - (index + 1) * 3600000 + 1000) : null,
      completedAt: report.status === 'COMPLETED' || report.status === 'FAILED'
        ? new Date(now.getTime() - (index + 1) * 3600000 + 60000)
        : null,
    }));

    await reportsCollection.insertMany(reports);
    console.log(`  ✓ Created ${reports.length} demo reports`);

    // Create indexes
    await reportsCollection.createIndex({ orgId: 1 });
    await reportsCollection.createIndex({ createdBy: 1 });
    await reportsCollection.createIndex({ status: 1 });
    await reportsCollection.createIndex({ createdAt: -1 });
    console.log('  ✓ Created indexes');

    console.log('\n✅ Reports seeded successfully!');
    console.log('\n📝 Demo Reports:');
    for (const report of sampleReports) {
      console.log(`   - ${report.name} (${report.type}, ${report.status})`);
    }
  } catch (error) {
    console.error('\n❌ Error seeding reports:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
