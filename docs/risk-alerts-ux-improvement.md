# Risk Alerts UX Improvement Document

## Mục đích tài liệu

Tài liệu này phân tích các vấn đề UX hiện tại của tính năng Risk Alerts và đề xuất các cải thiện để làm cho tính năng này dễ sử dụng, trực quan và có giá trị thực tế hơn cho người dùng.

---

## 1. Phân tích vấn đề hiện tại

### 1.1. Các vấn đề chính được xác định

#### **A. Thiếu Context và Hướng dẫn**

- ❌ Người dùng không hiểu Risk Alerts là gì và tại sao cần dùng nó
- ❌ Không có onboarding hoặc tooltip giải thích các khái niệm
- ❌ Không rõ khi nào nên dùng "Detect Risks" vs "Làm mới"
- ❌ Không giải thích ý nghĩa của các severity levels (Nghiêm Trọng, Trung Bình, Thấp)

#### **B. Information Overload**

- ❌ Quá nhiều thông tin được hiển thị cùng lúc
- ❌ Phân tích chi tiết chỉ hữu ích cho power users, nhưng được hiển thị mặc định
- ❌ Các số liệu (velocity, capacity, blocked issues) thiếu visualization
- ❌ Không có priority/hierarchy rõ ràng về thông tin nào quan trọng nhất

#### **C. Workflow không rõ ràng**

- ❌ Không rõ hành động tiếp theo sau khi detect risks
- ❌ Các nút "Xác nhận", "Đã giải quyết", "Bỏ qua" không giải thích rõ hậu quả
- ❌ Không có guided flow để xử lý risks theo priority
- ❌ Thiếu feedback về impact của actions (ví dụ: apply recommendation sẽ làm gì?)

#### **D. Visual Design Issues**

- ❌ Quá nhiều màu sắc và borders làm giao diện rối mắt
- ❌ Các card risks trông giống nhau, khó phân biệt độ nghiêm trọng
- ❌ Không có visual hierarchy (severity, urgency, impact)
- ❌ Empty state chưa đủ hấp dẫn để khuyến khích người dùng thử

---

## 2. Đề xuất cải thiện UX

### 2.1. Cải thiện Onboarding & Context

#### **Thêm Educational Components**

```tsx
// Thêm một info panel có thể collapse ở đầu dashboard
<InfoPanel collapsible defaultExpanded={isFirstTimeUser}>
  <h3>Risk Alerts là gì?</h3>
  <p>
    Risk Alerts tự động phân tích sprint của bạn và cảnh báo các vấn đề tiềm ẩn
    có thể ảnh hưởng đến tiến độ, giúp bạn chủ động xử lý sớm.
  </p>

  <h4>Khi nào nên sử dụng?</h4>
  <ul>
    <li>✅ Đầu sprint: Kiểm tra capacity và commitment</li>
    <li>✅ Giữa sprint: Phát hiện blocked issues và dependencies</li>
    <li>✅ Cuối sprint: Đánh giá progress và plan cho sprint sau</li>
  </ul>

  <h4>4 loại rủi ro được phát hiện:</h4>
  <div className="grid grid-cols-2 gap-3">
    <RiskTypeCard
      icon="⚠️"
      title="Overcommitment"
      description="Sprint commit quá nhiều điểm so với velocity trung bình"
      severity="CRITICAL"
    />
    <RiskTypeCard
      icon="🚫"
      title="Blocked Issues"
      description="Công việc bị chặn, không thể tiếp tục"
      severity="MEDIUM"
    />
    <RiskTypeCard
      icon="⏸️"
      title="Zero Progress"
      description="Công việc không có tiến triển trong nhiều ngày"
      severity="MEDIUM"
    />
    <RiskTypeCard
      icon="❓"
      title="Missing Estimates"
      description="Issues chưa có story points, khó track tiến độ"
      severity="LOW"
    />
  </div>
</InfoPanel>
```

#### **Thêm Tooltips & Contextual Help**

```tsx
// Thêm tooltip cho các khái niệm
<Tooltip content="Velocity là số điểm trung bình team hoàn thành mỗi sprint">
  <span className="underline-dashed">Velocity trung bình</span>
</Tooltip>

// Thêm help icon cho các actions
<Button variant="primary">
  Detect Risks
  <HelpIcon tooltip="Phân tích sprint và tìm các rủi ro tiềm ẩn. Nên chạy mỗi 2-3 ngày." />
</Button>
```

---

### 2.2. Đơn giản hóa Information Architecture

#### **Sử dụng Progressive Disclosure**

Thay vì hiển thị tất cả thông tin cùng lúc, chia thành 3 levels:

**Level 1: Overview (Always Visible)**

- Tổng số risks active
- Severity breakdown (Critical/Medium/Low)
- Health score tổng thể (single number: 0-100)
- Quick actions (Detect Risks, View Details)

```tsx
<RiskOverview>
  <HealthScore value={85} />
  <RiskSummary critical={0} medium={0} low={0} />
  <QuickActions>
    <Button onClick={detectRisks}>Scan Sprint</Button>
  </QuickActions>
</RiskOverview>
```

**Level 2: Risk List (Expandable)**

- Danh sách risks với highlight cho critical items
- Sort by priority & impact
- Collapsed by default, expand để xem detail

```tsx
<RiskList>
  {criticalRisks.map((risk) => (
    <RiskCard key={risk.id} severity="CRITICAL" collapsed>
      <RiskHeader>
        <PriorityBadge>🔴 Nghiêm trọng</PriorityBadge>
        <RiskTitle>{risk.title}</RiskTitle>
        <ImpactScore>{risk.impactScore}/10</ImpactScore>
      </RiskHeader>
      {/* Detail chỉ hiện khi expand */}
    </RiskCard>
  ))}
</RiskList>
```

**Level 3: Deep Analytics (Expert Mode)**

- Detailed metrics (velocity, capacity, percentages)
- Historical trends
- Hidden by default, toggle via "Show Analytics"

```tsx
<AnalyticsPanel hidden={!showAnalytics}>
  <VelocityChart data={historicalData} />
  <CapacityBreakdown />
  <TrendAnalysis />
</AnalyticsPanel>
```

---

### 2.3. Cải thiện Workflow & Actions

#### **Guided Action Flow**

Thay vì 3 nút confusing (Xác nhận, Giải quyết, Bỏ qua), tạo một workflow rõ ràng:

```tsx
<RiskActionFlow risk={risk}>
  {/* Step 1: Acknowledge */}
  {risk.status === "ACTIVE" && (
    <ActionCard>
      <h4>Bước 1: Xác nhận rủi ro</h4>
      <p>Đánh dấu bạn đã biết và đang xử lý rủi ro này</p>
      <Button onClick={() => acknowledge(risk.id)}>
        Tôi đã biết, đang xử lý
      </Button>
    </ActionCard>
  )}

  {/* Step 2: Take Action */}
  {risk.status === "ACKNOWLEDGED" && (
    <ActionCard>
      <h4>Bước 2: Chọn hành động</h4>
      <RecommendationList
        recommendations={risk.recommendations}
        onApply={handleApplyRecommendation}
      />
      <Button variant="success" onClick={() => resolve(risk.id)}>
        ✓ Đã xử lý xong
      </Button>
      <Button variant="outline" onClick={() => dismiss(risk.id)}>
        Không áp dụng (Risk không liên quan)
      </Button>
    </ActionCard>
  )}
</RiskActionFlow>
```

#### **Smart Recommendations with Impact Preview**

Khi apply recommendation, show preview trước khi confirm:

```tsx
<RecommendationCard>
  <RecommendationAction>{recommendation.action}</RecommendationAction>

  <Button onClick={() => previewImpact(recommendation.id)}>
    Xem trước kết quả
  </Button>

  {showingPreview && (
    <ImpactPreview>
      <h5>Nếu áp dụng khuyến nghị này:</h5>
      <ul>
        <li>
          ✓ {recommendation.suggestedIssues.length} issues sẽ được di chuyển ra
          backlog
        </li>
        <li>✓ Sprint capacity giảm từ 120% xuống 85%</li>
        <li>✓ Dự kiến tăng 30% khả năng hoàn thành sprint đúng hạn</li>
      </ul>
      <Button variant="primary" onClick={applyRecommendation}>
        Áp dụng ngay
      </Button>
    </ImpactPreview>
  )}
</RecommendationCard>
```

---

### 2.4. Cải thiện Visual Design

#### **Sử dụng Color System có ý nghĩa**

```css
/* Current: Quá nhiều màu rối mắt */
/* Đề xuất: Minimalist approach */

.risk-card {
  /* Chỉ highlight border cho critical risks */
  border-left: 4px solid transparent;
}

.risk-card.critical {
  border-left-color: var(--red-500);
  background: var(--red-50); /* subtle background */
}

.risk-card.medium {
  border-left-color: var(--yellow-500);
  /* No background color for medium */
}

.risk-card.low {
  border-left-color: var(--blue-500);
  /* No background color for low */
}
```

#### **Thêm Visual Indicators**

Thay vì chỉ hiển thị số, dùng visual elements:

```tsx
// Capacity gauge
<CapacityGauge
  current={120}
  optimal={100}
  warning={110}
  critical={130}
/>

// Progress ring
<ProgressRing
  value={healthScore}
  size="large"
  color={getHealthColor(healthScore)}
/>

// Trend indicators
<TrendIndicator
  current={3}
  previous={5}
  label="Active Risks"
  showDiff
/>
```

---

### 2.5. Cải thiện Empty State & First Run

#### **Empty State với Call-to-Action mạnh**

```tsx
<EmptyState>
  <Illustration src="/illustrations/sprint-health.svg" />

  <Heading>Chưa có phân tích rủi ro</Heading>

  <Description>
    Risk Alerts sẽ giúp bạn phát hiện sớm các vấn đề trong sprint như
    overcommitment, blocked issues, và dependencies.
  </Description>

  <StatsGrid>
    <Stat icon="⚡" label="Phát hiện rủi ro trong 3 giây" />
    <Stat icon="🎯" label="4 loại rủi ro được check" />
    <Stat icon="💡" label="Khuyến nghị hành động cụ thể" />
  </StatsGrid>

  <PrimaryButton size="large" onClick={detectRisks}>
    Phân tích Sprint của tôi
  </PrimaryButton>

  <Link onClick={showDemo}>Xem demo</Link>
</EmptyState>
```

#### **First Run Experience**

```tsx
// Sau lần detect đầu tiên, show tutorial overlay
<TutorialOverlay show={isFirstDetection}>
  <Step target=".risk-card">
    <p>
      Đây là một rủi ro được phát hiện. Click để xem chi tiết và khuyến nghị.
    </p>
  </Step>

  <Step target=".recommendation-button">
    <p>Áp dụng khuyến nghị để tự động xử lý rủi ro.</p>
  </Step>

  <Step target=".health-score">
    <p>Health Score tổng hợp cho biết sprint đang ở trạng thái nào.</p>
  </Step>
</TutorialOverlay>
```

---

## 3. Wireframes & Mock-ups đề xuất

### 3.1. Layout mới - Collapsed State

```
┌─────────────────────────────────────────────────────────────┐
│ 🛡️ Risk Alerts • Sprint 3                        [i] [Scan] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌─────────────┐    ┌──────────────────────────────────┐   │
│   │             │    │  Sprint Health Score             │   │
│   │     85      │    │  ● 0 Critical                    │   │
│   │   /100      │    │  ● 0 Medium                      │   │
│   │             │    │  ● 0 Low                         │   │
│   └─────────────┘    └──────────────────────────────────┘   │
│                                                               │
│   ✓ Sprint đang trong tình trạng tốt!                        │
│   Phân tích lúc: 15:46:28 18/12/2025                         │
│                                                               │
│   [▼ Xem chi tiết phân tích]                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2. Layout mới - Expanded with Risk

```
┌─────────────────────────────────────────────────────────────┐
│ 🛡️ Risk Alerts • Sprint 3                        [i] [Scan] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌─────────────┐    ┌──────────────────────────────────┐   │
│   │             │    │  Sprint Health Score             │   │
│   │     62      │    │  ● 1 Critical  🔴                │   │
│   │   /100      │    │  ● 0 Medium    🟡                │   │
│   │   ⚠️        │    │  ● 0 Low       🔵                │   │
│   └─────────────┘    └──────────────────────────────────┘   │
│                                                               │
│   ⚠️ Phát hiện 1 rủi ro cần xử lý                            │
│   Phân tích lúc: 15:46:28 18/12/2025                         │
│                                                               │
│   [▲ Ẩn chi tiết] [📊 Show Analytics]                        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔴 NGHIÊM TRỌNG  Sprint Overcommitment        Impact: 8/10  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Sprint commit 120 points nhưng velocity trung bình     │  │
│  │ chỉ là 80 points. Overcommit 50%.                      │  │
│  │                                                         │  │
│  │ 💡 Khuyến nghị: Di chuyển 5 issues ít ưu tiên nhất    │  │
│  │    ra backlog để giảm xuống 85 points                  │  │
│  │                                                         │  │
│  │ [▶ Xem trước kết quả]  [✓ Áp dụng khuyến nghị]        │  │
│  │ [Tôi đã biết, đang xử lý]                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)

- [ ] Thêm info panel với hướng dẫn cơ bản
- [ ] Cải thiện empty state với CTA rõ ràng
- [ ] Thêm tooltips cho các khái niệm khó hiểu
- [ ] Simplify color scheme (chỉ highlight critical)

### Phase 2: Core UX Improvements (3-5 days)

- [ ] Implement progressive disclosure (3 levels)
- [ ] Redesign risk cards với better visual hierarchy
- [ ] Add health score component
- [ ] Improve action flow (guided workflow)

### Phase 3: Advanced Features (5-7 days)

- [ ] Add impact preview for recommendations
- [ ] Implement analytics panel với charts
- [ ] Add tutorial overlay cho first-time users
- [ ] Create demo mode

### Phase 4: Polish & Optimization (2-3 days)

- [ ] Add animations & transitions
- [ ] Implement keyboard shortcuts
- [ ] Add accessibility features (ARIA labels)
- [ ] Performance optimization

---

## 5. Success Metrics

Đo lường hiệu quả của improvements:

### Quantitative Metrics

- **Adoption Rate**: % sprints có ít nhất 1 lần detect risks
- **Engagement**: Average số lần detect per sprint
- **Action Rate**: % risks được acknowledge/resolve
- **Recommendation Acceptance**: % recommendations được apply
- **Time to Action**: Thời gian trung bình từ detect → resolve

### Qualitative Metrics

- **User Surveys**: NPS score cho Risk Alerts feature
- **Support Tickets**: Giảm số câu hỏi về cách dùng Risk Alerts
- **User Feedback**: Tổng hợp feedback từ interviews

### Target Goals (After 1 month)

- ✅ 80% sprints sử dụng Risk Alerts ít nhất 1 lần
- ✅ 60% risks được acknowledge trong vòng 24h
- ✅ 40% recommendations được apply
- ✅ NPS score > 7/10

---

## 6. Technical Notes

### Component Structure đề xuất

```
RiskAlertsDashboard/
├── components/
│   ├── RiskOverview/
│   │   ├── HealthScore.tsx
│   │   ├── RiskSummary.tsx
│   │   └── QuickActions.tsx
│   ├── InfoPanel/
│   │   ├── WhatIsRiskAlerts.tsx
│   │   ├── WhenToUse.tsx
│   │   └── RiskTypeGuide.tsx
│   ├── RiskList/
│   │   ├── RiskCard.tsx (improved)
│   │   ├── RiskActionFlow.tsx (new)
│   │   └── ImpactPreview.tsx (new)
│   ├── AnalyticsPanel/
│   │   ├── VelocityChart.tsx
│   │   ├── CapacityGauge.tsx
│   │   └── TrendAnalysis.tsx
│   └── Onboarding/
│       ├── EmptyState.tsx (improved)
│       ├── TutorialOverlay.tsx (new)
│       └── DemoMode.tsx (new)
└── hooks/
    ├── useRiskDetection.ts
    ├── useFirstTimeUser.ts (new)
    └── useAnalytics.ts (new)
```

### State Management

```typescript
interface RiskAlertsState {
  // Current state
  healthScore: number;
  risks: RiskAlert[];
  detectionResult: DetectionResult | null;

  // UI state
  isDetecting: boolean;
  showAnalytics: boolean;
  showTutorial: boolean;

  // User preferences
  isFirstTimeUser: boolean;
  hasSeenDemo: boolean;
  preferredView: "simple" | "detailed";
}
```

---

## 7. Accessibility Considerations

- [ ] Add ARIA labels for all interactive elements
- [ ] Ensure keyboard navigation works for entire flow
- [ ] Add screen reader announcements for detection results
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Add skip links for lengthy analysis sections
- [ ] Implement focus management for modals/overlays

---

## 8. Mobile Responsiveness

Risk Alerts cần responsive cho mobile:

```tsx
// Mobile view: Stack vertically
<RiskDashboard className="mobile:flex-col">
  <HealthScore size="compact" />
  <RiskList layout="vertical" />
  <AnalyticsPanel hidden /> {/* Hide on mobile */}
</RiskDashboard>
```

---

## Kết luận

Những cải thiện trên sẽ biến Risk Alerts từ một tính năng confusing thành một công cụ thực sự hữu ích, giúp:

1. **Dễ hiểu hơn** - Clear onboarding và contextual help
2. **Dễ dùng hơn** - Guided workflow và progressive disclosure
3. **Có giá trị hơn** - Impact preview và actionable recommendations
4. **Trực quan hơn** - Better visual design và data visualization

Ưu tiên implement theo roadmap từ Phase 1 đến Phase 4 để có impact nhanh nhất.
