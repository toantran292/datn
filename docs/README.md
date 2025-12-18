# Documentation - Tài Liệu Hệ Thống

Chào mừng đến với tài liệu kỹ thuật của hệ thống quản lý dự án (Project Management System).

---

## Tài Liệu AI Features

### 1. [AI Auto Task Creation](./AI_AUTO_TASK_CREATION_FEATURE.md) ⭐ MỚI
**Tự động tạo công việc từ Text/Document Input**

Tính năng cho phép tạo tasks tự động từ:
- Text input - Nhập mô tả ngắn gọn, AI tạo task hoàn chỉnh
- Issue breakdown - Phân tách Epic/Story thành sub-tasks
- Story points estimation - Ước lượng độ phức tạp tự động

**Nội dung:**
- ✅ Kiến trúc hệ thống với streaming SSE
- ✅ 3 chức năng chính: Refine, Breakdown, Estimate
- ✅ RAG (Vector similarity search)
- ✅ File upload infrastructure
- ✅ Code examples & API reference
- ✅ Future roadmap: Document parsing

**Đối tượng:** Developers, Product Owners, Technical Leads

---

### 2. [AI Refine Description](./AI_REFINE_DESCRIPTION_FEATURE.md)
**Tinh chỉnh mô tả Issue tự động**

Chi tiết implementation của tính năng refine description:
- Standard issue templates theo loại (Story, Bug, Task, Epic)
- UI/UX design với streaming support
- Technical architecture (NestJS + OpenAI)
- Deployment guide & testing strategy

**Nội dung:**
- Issue templates with best practices
- Streaming API implementation
- Frontend React hooks
- Performance optimization với caching

**Đối tượng:** Frontend & Backend Developers

---

### 3. [AI Estimate Story Points](./AI_ESTIMATE_STORY_POINTS_FEATURE.md)
**Ước lượng Story Points tự động**

Hệ thống AI estimation với Fibonacci scale:
- Confidence scoring (0.0 - 1.0)
- Multi-factor analysis
- Alternative scenarios
- Historical data integration

**Nội dung:**
- Estimation algorithms
- Confidence calculation logic
- Integration with issue creation flow
- API specifications

**Đối tượng:** Scrum Masters, Developers, Product Owners

---

### 4. [AI Smart Issue Breakdown](./AI_SMART_ISSUE_BREAKDOWN_FEATURE.md)
**Phân tách Epic/Story thành Sub-tasks**

Tự động breakdown với:
- Dependency graph generation
- Parallelization analysis
- Technical layer classification
- Story points distribution

**Nội dung:**
- Breakdown algorithms
- Dependency resolution
- Task type classification
- Validation metrics

**Đối tượng:** Tech Leads, Architects, Scrum Masters

---

### 5. [AI Risk Detector & Sprint Health Monitor](./AI_RISK_DETECTOR_SPRINT_HEALTH_MONITOR_FEATURE.md)
**Phát hiện rủi ro và theo dõi sức khỏe Sprint**

Real-time monitoring với:
- Velocity tracking
- Burndown anomaly detection
- Team health indicators
- Proactive risk alerts

**Nội dung:**
- Risk detection algorithms
- Health score calculation
- Alert system design
- Dashboard visualization

**Đối tượng:** Scrum Masters, Project Managers

---

### 6. [AI Risk Detector - How It Works](./AI_RISK_DETECTOR_HOW_IT_WORKS.md)
**Cơ chế hoạt động của Risk Detector**

Deep dive vào:
- ML models used
- Data preprocessing
- Feature engineering
- Prediction algorithms

**Nội dung:**
- Technical implementation details
- Model training process
- Performance metrics
- Continuous learning

**Đối tượng:** Data Scientists, ML Engineers

---

## Tài Liệu RAG (Retrieval-Augmented Generation)

### 7. [RAG Approach](./RAG_APPROACH.md)
**Kiến trúc Vector Search với PostgreSQL pgvector**

Comprehensive guide về RAG implementation:
- Vector embedding with OpenAI text-embedding-ada-002
- PostgreSQL pgvector setup
- Similarity search algorithms
- Performance optimization

**Nội dung:**
- Database schema design
- Embedding generation pipeline
- Cosine similarity search
- Index optimization (IVFFlat)

**Đối tượng:** Backend Developers, Database Engineers

---

### 8. [RAG Quick Start](./RAG_QUICK_START.md)
**Hướng dẫn nhanh triển khai RAG**

Step-by-step setup guide:
- Install pgvector extension
- Configure embedding service
- Run first similarity search
- Troubleshooting common issues

**Nội dung:**
- Installation commands
- Configuration examples
- Sample queries
- Best practices

**Đối tượng:** DevOps, Backend Developers

---

## Tài Liệu Implementation Plans

### 9. [AI Refine Implementation Plan](./AI_REFINE_IMPLEMENTATION_PLAN.md)
**Kế hoạch triển khai Refine Description**

Project planning document:
- Timeline & milestones
- Resource allocation
- Risk assessment
- Success criteria

**Nội dung:**
- Phase breakdown
- Task dependencies
- Team responsibilities
- QA checklist

**Đối tượng:** Project Managers, Tech Leads

---

### 10. [AI Refine Implementation Summary](./AI_REFINE_IMPLEMENTATION_SUMMARY.md)
**Tóm tắt kết quả triển khai Refine**

Post-implementation review:
- Lessons learned
- Performance metrics
- User feedback
- Future improvements

**Nội dung:**
- Implementation challenges
- Solutions applied
- Metrics achieved
- Recommendations

**Đối tượng:** All team members

---

### 11. [AI Refine Setup Guide](./AI_REFINE_SETUP_GUIDE.md)
**Hướng dẫn cài đặt môi trường Refine**

Environment setup for developers:
- Prerequisites
- Backend setup (NestJS)
- Frontend setup (Next.js)
- Local testing

**Nội dung:**
- Docker configuration
- Environment variables
- Service dependencies
- Testing commands

**Đối tượng:** New developers, DevOps

---

## Tài Liệu Tích Hợp (Integration Docs)

### 12. [Backend Integration Checklist](../BACKEND_INTEGRATION_CHECKLIST.md)
Backend integration requirements:
- API contracts
- Authentication/Authorization
- Database migrations
- Testing requirements

---

### 13. [Chat API Updates](../CHAT_API_UPDATES.md)
Chat system API documentation:
- WebSocket endpoints
- Message formats
- Event handling
- Error codes

---

### 14. [Chat Separate Endpoints](../CHAT_SEPARATE_ENDPOINTS.md)
Detailed chat endpoint specifications:
- Project chat vs direct messages
- Channel management
- Message threading
- File attachments

---

### 15. [Project Chat Integration Summary](../PROJECT_CHAT_INTEGRATION_SUMMARY.md)
Chat feature integration overview:
- Architecture decisions
- Implementation details
- Frontend components
- Backend services

---

### 16. [Notification System Summary](../NOTIFICATION_SYSTEM_SUMMARY.md)
Real-time notification system:
- Push notifications
- Email notifications
- In-app notifications
- Notification preferences

---

### 17. [PM Implementation Plan](../PM_IMPLEMENTATION_PLAN.md)
Overall project management system plan:
- Feature roadmap
- Sprint planning
- Resource allocation
- Risk management

---

## Cấu Trúc Thư Mục (Folder Structure)

```
docs/
├── README.md (this file)
│
├── AI_AUTO_TASK_CREATION_FEATURE.md ⭐ NEW
├── AI_REFINE_DESCRIPTION_FEATURE.md
├── AI_ESTIMATE_STORY_POINTS_FEATURE.md
├── AI_SMART_ISSUE_BREAKDOWN_FEATURE.md
├── AI_RISK_DETECTOR_SPRINT_HEALTH_MONITOR_FEATURE.md
├── AI_RISK_DETECTOR_HOW_IT_WORKS.md
│
├── RAG_APPROACH.md
├── RAG_QUICK_START.md
│
├── AI_REFINE_IMPLEMENTATION_PLAN.md
├── AI_REFINE_IMPLEMENTATION_SUMMARY.md
└── AI_REFINE_SETUP_GUIDE.md
```

---

## Quick Links

### For New Developers
1. Start with [AI Auto Task Creation](./AI_AUTO_TASK_CREATION_FEATURE.md) for feature overview
2. Read [RAG Quick Start](./RAG_QUICK_START.md) for vector search setup
3. Follow [AI Refine Setup Guide](./AI_REFINE_SETUP_GUIDE.md) for local development

### For Product Managers
1. [AI Auto Task Creation](./AI_AUTO_TASK_CREATION_FEATURE.md) - Feature capabilities
2. [AI Risk Detector](./AI_RISK_DETECTOR_SPRINT_HEALTH_MONITOR_FEATURE.md) - Monitoring features
3. [PM Implementation Plan](../PM_IMPLEMENTATION_PLAN.md) - Overall roadmap

### For Technical Leads
1. [RAG Approach](./RAG_APPROACH.md) - Architecture deep dive
2. [AI Refine Description](./AI_REFINE_DESCRIPTION_FEATURE.md) - Technical implementation
3. [AI Smart Issue Breakdown](./AI_SMART_ISSUE_BREAKDOWN_FEATURE.md) - Breakdown algorithms

---

## Technology Stack

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma
- **AI**: OpenAI API (gpt-4o-mini, text-embedding-ada-002)
- **Caching**: Redis
- **Storage**: MinIO (S3-compatible)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **State Management**: MobX
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: (TBD)
- **Logging**: Pino (structured logging)

---

## Contributing

Khi thêm tài liệu mới:
1. Đặt tên file theo format: `FEATURE_NAME_DESCRIPTION.md`
2. Thêm entry vào README.md này
3. Include Table of Contents
4. Thêm code examples
5. Update Last Updated date

---

## Support & Contact

- **Issues**: GitHub Issue Tracker
- **Email**: dev@example.com
- **Slack**: #pm-system-dev

---

**Last Updated**: 2025-12-16
**Documentation Version**: 2.0.0
**Maintained by**: Development Team
