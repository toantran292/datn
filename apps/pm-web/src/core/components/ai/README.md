# AI Components

This directory contains React components for the AI-powered description refinement feature.

## Components

### AIRefineButton
Main button component that triggers the AI refinement process.

**Usage:**
```tsx
import { AIRefineButton } from "@/core/components/ai";

<AIRefineButton
  issueId="uuid"
  currentDescription="Short description here"
  issueName="Issue title"
  issueType="STORY"
  priority="HIGH"
  projectName="My Project"
  sprintGoal="Sprint goal here"
  onSuccess={(refinedDescription) => {
    // Handle the refined description
    updateIssueDescription(refinedDescription);
  }}
  disabled={false}
/>
```

### AIRefineModal
Modal component that displays the comparison between original and refined descriptions.

**Usage:**
```tsx
import { AIRefineModal } from "@/core/components/ai";

<AIRefineModal
  original="Original description text"
  refined={refinedData}
  onApply={(refinedDescription) => {
    // Apply the changes
  }}
  onCancel={() => {
    // Close modal
  }}
/>
```

### AILoadingState
Loading indicator with different variants for various contexts.

**Usage:**
```tsx
import { AILoadingState } from "@/core/components/ai";

// Inline variant (default)
<AILoadingState message="AI đang xử lý..." />

// Modal variant
<AILoadingState message="AI đang xử lý..." variant="modal" />

// Overlay variant (full screen)
<AILoadingState message="AI đang xử lý..." variant="overlay" />
```

### AIImprovementsList
Displays a list of improvements made by the AI.

**Usage:**
```tsx
import { AIImprovementsList } from "@/core/components/ai";

// Default variant
<AIImprovementsList improvements={improvements} />

// Compact variant
<AIImprovementsList improvements={improvements} variant="compact" />

// Detailed variant with styled boxes
<AIImprovementsList improvements={improvements} variant="detailed" />
```

### AIErrorState
Error display component with retry functionality.

**Usage:**
```tsx
import { AIErrorState } from "@/core/components/ai";

// Inline variant (default)
<AIErrorState
  error="Error message here"
  onRetry={() => handleRetry()}
/>

// Banner variant
<AIErrorState
  error="Error message here"
  variant="banner"
  title="Custom error title"
  onRetry={() => handleRetry()}
/>

// Modal variant
<AIErrorState
  error="Error message here"
  variant="modal"
  onRetry={() => handleRetry()}
/>
```

## Hook

### useAIRefine
React hook for managing AI refinement state.

**Usage:**
```tsx
import { useAIRefine } from "@/core/hooks/use-ai-refine";

const { refine, isRefining, error, reset, lastResult } = useAIRefine();

// Call refine
const result = await refine({
  issueId: "uuid",
  currentDescription: "Description text",
  issueName: "Issue name",
  issueType: "STORY",
  priority: "HIGH",
  context: {
    projectName: "Project name",
    sprintGoal: "Sprint goal"
  }
});

// Handle result
if (result) {
  console.log(result.refinedDescription);
  console.log(result.improvements);
  console.log(result.confidence);
}
```

## Service

### aiService
API client for AI endpoints.

**Usage:**
```tsx
import { aiService } from "@/core/services/ai.service";

const response = await aiService.refineDescription({
  issueId: "uuid",
  currentDescription: "Description",
  issueName: "Issue name",
  issueType: "STORY",
  priority: "HIGH"
});

if (response.success && response.data) {
  console.log(response.data.refinedDescription);
}
```

## Types

All TypeScript types are available in `@/core/types/ai`:

```tsx
import type {
  IssueType,
  IssuePriority,
  RefineDescriptionRequest,
  RefineDescriptionResponse,
  RefineDescriptionData,
  RefineDescriptionContext
} from "@/core/types/ai";
```

## Integration Example

Here's a complete example of integrating the AI Refine button into an issue form:

```tsx
import { useState } from "react";
import { AIRefineButton } from "@/core/components/ai";

const IssueForm = () => {
  const [description, setDescription] = useState("");

  return (
    <div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter issue description..."
      />

      <AIRefineButton
        issueId={issueId}
        currentDescription={description}
        issueName={issueName}
        issueType={issueType}
        priority={priority}
        onSuccess={(refinedDescription) => {
          setDescription(refinedDescription);
        }}
      />
    </div>
  );
};
```

## Environment Setup

Make sure these environment variables are configured:

```env
# Backend (.env)
OPENAI_API_KEY=sk-proj-your-api-key
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Error Handling

The components handle these error scenarios:
- **400**: Invalid input (validation errors)
- **429**: Rate limit exceeded (shows specific message)
- **500**: Server error
- **Network errors**: Connection issues

All errors are displayed in Vietnamese with user-friendly messages.
