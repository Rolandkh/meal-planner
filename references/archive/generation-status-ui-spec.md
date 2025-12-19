# Generation Status UI Component Specification

**Version:** 1.0  
**Created:** December 2025  
**Purpose:** Reusable specification for AI generation progress indicator with stage completion messages

---

## Overview

This component provides visual feedback during asynchronous AI generation processes, displaying real-time progress through multiple stages with a progress bar, percentage indicator, elapsed time counter, and contextual status messages.

### Visual Preview

```
┌─────────────────────────────────────────┐
│  [Generate Meal Plan] ← Hidden          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │          ✨                      │   │
│  │  Creating Monday meals...       │   │
│  │  45% (8s)                       │   │
│  │  [████████░░░░] 45%             │   │
│  │  Using Claude Haiku for fast   │   │
│  │  generation                     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## UI Components

### 1. Container Card
- **Background:** White or light themed
- **Padding:** 16px
- **Border Radius:** 8-12px
- **Text Align:** Center
- **Display:** Initially hidden (`display: none`), shown when generation starts

### 2. Loading Icon
- **Character:** ✨ (sparkles emoji)
- **Font Size:** 1.5rem (24px)
- **Margin Bottom:** 12px
- **Purpose:** Visual attention grabber

### 3. Progress Text
- **ID:** `progress-text`
- **Content Format:** `[Stage message]... [percentage]% ([elapsed]s)`
- **Example:** `"Creating Monday meals... 45% (8s)"`
- **Font Weight:** 600 (semi-bold)
- **Color:** #718096 (medium gray)
- **Margin Bottom:** 12px

### 4. Progress Bar Container
- **Background:** #e5e7eb (light gray)
- **Height:** 8px
- **Border Radius:** 999px (pill shape)
- **Overflow:** hidden
- **Margin Bottom:** 8px

### 5. Progress Bar Fill
- **ID:** `progress-bar`
- **Height:** 100% of container
- **Width:** Dynamic 0-100% (updated via JavaScript)
- **Background:** `linear-gradient(90deg, #667eea, #764ba2)` (purple gradient)
- **Transition:** `width 0.3s ease` (smooth animation)

### 6. Subtext
- **Content:** Contextual information about generation process
- **Example:** `"Using Claude Haiku for faster generation"`
- **Font Size:** 0.85rem
- **Color:** #a0aec0 (lighter gray)

---

## Behavior & Interaction

### State Transitions

#### Initial State (Before Generation)
```html
<button id="generate-btn" style="display: flex;">
  ✨ Generate Meal Plan →
</button>
<div id="loading-indicator" style="display: none;">
  <!-- Progress UI -->
</div>
```

#### Active State (During Generation)
```html
<button id="generate-btn" style="display: none;">
  <!-- Hidden -->
</button>
<div id="loading-indicator" style="display: block;">
  <div>✨</div>
  <div id="progress-text">Creating Monday meals... 45% (8s)</div>
  <div class="progress-container">
    <div id="progress-bar" style="width: 45%;"></div>
  </div>
  <div>Using Claude Haiku for fast generation</div>
</div>
```

#### Complete State (Success)
```html
<div id="loading-indicator" style="display: block;">
  <div>✨</div>
  <div id="progress-text">Complete!</div>
  <div class="progress-container">
    <div id="progress-bar" style="width: 100%;"></div>
  </div>
  <div>Using Claude Haiku for fast generation</div>
</div>
<!-- Auto-navigate after 500ms delay -->
```

#### Error State (Failure)
```html
<button id="generate-btn" style="display: flex;">
  ✨ Generate Meal Plan →
</button>
<div id="loading-indicator" style="display: none;">
  <!-- Hidden again -->
</div>
<div id="error-message" style="display: block;">
  Failed to generate. Please try again.
</div>
```

---

## Stage Messages

### Purpose
Stage messages provide context about what the AI is currently working on, helping users understand the generation process and feel reassured during longer operations.

### Message Sequence (Example: Meal Plan Generation)
```javascript
const sections = [
  'Connecting to AI...',           // 0-9%
  'Planning shopping list...',     // 10-18%
  'Creating Sunday meals...',      // 19-27%
  'Creating Monday meals...',      // 28-36%
  'Creating Tuesday meals...',     // 37-45%
  'Creating Wednesday meals...',   // 46-54%
  'Creating Thursday meals...',    // 55-63%
  'Creating Friday meals...',      // 64-72%
  'Creating Saturday meals...',    // 73-81%
  'Adding recipes...',             // 82-90%
  'Finalizing plan...'             // 91-100%
];
```

### Message Update Logic
- Messages are tied to progress percentage ranges
- Each message covers approximately 9% of total progress
- Messages advance automatically as progress increases
- Current message is determined by: `Math.floor(progress / 9)`

### Customization Guidelines
**For Different Use Cases:**

**Document Generation:**
```javascript
const sections = [
  'Connecting to AI...',
  'Analyzing content...',
  'Structuring outline...',
  'Writing introduction...',
  'Generating body sections...',
  'Adding examples...',
  'Creating conclusion...',
  'Finalizing document...'
];
```

**Image Generation:**
```javascript
const sections = [
  'Connecting to AI...',
  'Understanding prompt...',
  'Composing scene...',
  'Rendering details...',
  'Applying styles...',
  'Finalizing image...'
];
```

**Code Generation:**
```javascript
const sections = [
  'Connecting to AI...',
  'Analyzing requirements...',
  'Planning architecture...',
  'Writing components...',
  'Adding documentation...',
  'Optimizing code...',
  'Finalizing...'
];
```

---

## Progress Calculation

### Simulated Progress (Recommended Approach)
**Use Case:** When actual progress cannot be measured (non-streaming API calls)

```javascript
let progress = 0;
let sectionIndex = 0;

const progressInterval = setInterval(() => {
  // Slower at start, faster in middle, slower at end (S-curve)
  const increment = progress < 30 ? 2 
                  : progress < 60 ? 3 
                  : progress < 80 ? 2 
                  : 1;
  
  // Add randomness for natural feel
  progress = Math.min(92, progress + increment + Math.random() * 2);
  
  // Update section based on progress
  const newSectionIndex = Math.min(
    sections.length - 1, 
    Math.floor(progress / 9)
  );
  if (newSectionIndex > sectionIndex) {
    sectionIndex = newSectionIndex;
  }
  
  // Update UI
  onProgress(Math.round(progress), sections[sectionIndex]);
}, 500); // Update every 500ms
```

**Key Features:**
- Never reaches 100% automatically (stops at 92%)
- Last 8% reserved for actual completion
- Variable speed creates realistic feel
- Random jitter adds naturalness
- Section messages update automatically

### Real Progress (Alternative Approach)
**Use Case:** When actual progress can be measured (streaming APIs, known steps)

```javascript
const totalSteps = 7; // e.g., 7 days of meals
let completedSteps = 0;

function updateProgress(stepName) {
  completedSteps++;
  const percent = (completedSteps / totalSteps) * 100;
  const message = `Creating ${stepName}...`;
  onProgress(percent, message);
}

// During generation:
updateProgress('Sunday meals');  // 14%
updateProgress('Monday meals');  // 28%
// ... etc
```

---

## Implementation Code

### HTML Structure
```html
<!-- Generation Button (visible initially) -->
<button 
  id="generate-btn"
  class="btn" 
  style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;margin-top:8px"
  onclick="handleGenerate()"
>
  <span>✨ Generate [Content Type]</span>
  <span>→</span>
</button>

<!-- Loading Indicator (hidden initially) -->
<div 
  id="loading-indicator" 
  style="display:none;text-align:center;padding:16px;color:#718096"
>
  <div style="font-size:1.5rem;margin-bottom:12px">✨</div>
  <div 
    id="progress-text" 
    style="font-weight:600;margin-bottom:12px"
  >
    Generating...
  </div>
  <div 
    style="background:#e5e7eb;border-radius:999px;height:8px;overflow:hidden;margin-bottom:8px"
  >
    <div 
      id="progress-bar" 
      style="height:100%;width:0%;background:linear-gradient(90deg, #667eea, #764ba2);transition:width 0.3s ease"
    ></div>
  </div>
  <div style="font-size:0.85rem;color:#a0aec0">
    [Contextual subtext]
  </div>
</div>

<!-- Error Message (hidden initially) -->
<div 
  id="error-message" 
  style="display:none;background:#fee;border:2px solid #fcc;color:#c33;padding:12px;border-radius:8px;margin-top:12px"
></div>
```

### JavaScript Handler
```javascript
async function handleGenerate() {
  // Get UI elements
  const generateBtn = document.getElementById('generate-btn');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('progress-bar');
  
  // Show loading state
  if (generateBtn) generateBtn.style.display = 'none';
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';
  
  const startTime = Date.now();
  
  try {
    // Progress callback
    const onProgress = (percent, section) => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (progressText) {
        progressText.textContent = section 
          ? `${section}... ${Math.round(percent)}% (${elapsed}s)`
          : `Generating... ${Math.round(percent)}% (${elapsed}s)`;
      }
      if (progressBar) {
        progressBar.style.width = `${percent}%`;
      }
    };
    
    // Call generation function with progress callback
    const result = await generateContent(onProgress);
    
    // Update to complete
    if (progressText) progressText.textContent = 'Complete!';
    if (progressBar) progressBar.style.width = '100%';
    
    // Brief delay to show completion, then proceed
    setTimeout(() => {
      // Navigate or show result
      handleSuccess(result);
    }, 500);
    
  } catch (error) {
    console.error('Generation error:', error);
    
    // Show error state
    if (generateBtn) generateBtn.style.display = 'flex';
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (errorMessage) {
      errorMessage.textContent = error.message || 'Generation failed';
      errorMessage.style.display = 'block';
    }
  }
}
```

### Generation Function with Progress
```javascript
async function generateContent(onProgress = null) {
  // Define stages
  const sections = [
    'Connecting to AI...',
    'Analyzing input...',
    'Creating content...',
    'Adding details...',
    'Finalizing...'
  ];
  
  // Start simulated progress
  let progressInterval = null;
  let progress = 0;
  let sectionIndex = 0;
  
  if (onProgress) {
    progressInterval = setInterval(() => {
      // Variable speed progression
      const increment = progress < 30 ? 2 
                      : progress < 60 ? 3 
                      : progress < 80 ? 2 
                      : 1;
      progress = Math.min(92, progress + increment + Math.random() * 2);
      
      // Update section
      const newSectionIndex = Math.min(
        sections.length - 1, 
        Math.floor(progress / (100 / sections.length))
      );
      if (newSectionIndex > sectionIndex) {
        sectionIndex = newSectionIndex;
      }
      
      onProgress(Math.round(progress), sections[sectionIndex]);
    }, 500);
  }
  
  try {
    // Actual API call or generation logic
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* params */ })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Complete progress
    if (onProgress) onProgress(100, 'Complete!');
    
    return result;
    
  } finally {
    // Clean up interval
    if (progressInterval) clearInterval(progressInterval);
  }
}
```

---

## Styling Guidelines

### Colors

**Progress Bar Gradient:**
```css
background: linear-gradient(90deg, #667eea, #764ba2);
```
- Start: `#667eea` (soft blue-purple)
- End: `#764ba2` (deeper purple)
- Direction: Left to right (90deg)

**Alternative Color Schemes:**

**Success/Green:**
```css
background: linear-gradient(90deg, #48bb78, #38a169);
```

**Warning/Amber:**
```css
background: linear-gradient(90deg, #fbbf24, #f59e0b);
```

**Info/Blue:**
```css
background: linear-gradient(90deg, #3b82f6, #2563eb);
```

**Text Colors:**
- Primary text: `#718096` (medium gray)
- Subtext: `#a0aec0` (lighter gray)
- Error text: `#c33` or `#dc2626` (red)

### Responsive Adjustments

**Mobile (< 640px):**
```css
#loading-indicator {
  padding: 12px;
}

#progress-text {
  font-size: 0.9rem;
}

.progress-bar-container {
  height: 6px; /* Slightly thinner */
}
```

**Desktop (> 640px):**
- Default styling sufficient
- Consider max-width on container (600px)

---

## Accessibility

### ARIA Attributes
```html
<div 
  id="loading-indicator"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <div aria-hidden="true">✨</div>
  <div id="progress-text">
    Creating Monday meals... 45% (8s)
  </div>
  <!-- Progress bar -->
  <div 
    role="progressbar"
    aria-valuenow="45"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Generation progress"
  >
    <div id="progress-bar" style="width: 45%;"></div>
  </div>
  <div aria-hidden="true">Using Claude Haiku...</div>
</div>
```

### Screen Reader Support
- Progress updates announced via `aria-live="polite"`
- Progress bar has proper `role="progressbar"` and `aria-value*` attributes
- Decorative emoji marked with `aria-hidden="true"`
- Status text is atomic (read as complete unit)

### Keyboard Navigation
```javascript
// Ensure button is focusable
<button id="generate-btn" tabindex="0">
  ✨ Generate
</button>

// Add focus styles
.btn:focus {
  outline: 2px solid #3182ce;
  outline-offset: 2px;
}
```

---

## UX Best Practices

### Timing
- **Update Frequency:** 500ms (twice per second)
  - Fast enough to feel responsive
  - Not too fast to cause animation jitter
  
- **Minimum Display Time:** 1 second
  - Prevents flashing for fast operations
  - Users should see at least one stage message

- **Completion Delay:** 500ms at 100%
  - Shows "Complete!" briefly before transitioning
  - Provides psychological closure

### Progress Psychology
- **Start Fast:** Initial 0-30% feels quick (user engagement)
- **Middle Steady:** 30-60% maintains steady pace (confidence)
- **End Slower:** 60-92% gradually slows (realistic expectation)
- **Jump to 100%:** When complete, instant jump (satisfaction)

### Error Handling
```javascript
// Provide helpful error messages
const errorMessages = {
  network: "Network error. Please check your connection.",
  timeout: "Generation took too long. Please try again.",
  api_key: "API key not configured. Please check settings.",
  rate_limit: "Too many requests. Please wait a moment.",
  default: "Something went wrong. Please try again."
};

function showError(errorType) {
  const message = errorMessages[errorType] || errorMessages.default;
  // Display error...
}
```

---

## Testing Checklist

### Visual Tests
- [ ] Progress bar animates smoothly
- [ ] Percentage updates correctly
- [ ] Stage messages change appropriately
- [ ] Elapsed time increments accurately
- [ ] Completion state shows briefly before transition
- [ ] Error state displays correctly

### Functional Tests
- [ ] Button hides when generation starts
- [ ] Loading indicator shows immediately
- [ ] Progress starts from 0%
- [ ] Progress reaches 100% on completion
- [ ] Stage messages match progress percentage
- [ ] Timer starts when generation begins
- [ ] Cleanup happens on completion/error

### Edge Cases
- [ ] Very fast completion (< 1 second)
- [ ] Very slow completion (> 30 seconds)
- [ ] Network timeout
- [ ] API error response
- [ ] User navigates away mid-generation
- [ ] Multiple rapid clicks on generate button

### Accessibility Tests
- [ ] Screen reader announces progress updates
- [ ] Keyboard navigation works correctly
- [ ] Focus management is logical
- [ ] Color contrast meets WCAG AA standards
- [ ] Works without JavaScript (graceful degradation)

---

## Customization Examples

### Example 1: Simple Progress (3 Stages)
```javascript
const sections = [
  'Starting...',
  'Processing...',
  'Finishing...'
];
```

### Example 2: Detailed Progress (10+ Stages)
```javascript
const sections = [
  'Initializing AI...',
  'Loading context...',
  'Analyzing requirements...',
  'Planning structure...',
  'Generating section 1...',
  'Generating section 2...',
  'Generating section 3...',
  'Adding formatting...',
  'Reviewing content...',
  'Optimizing output...',
  'Finalizing...'
];
```

### Example 3: Progress with Sub-stages
```javascript
function onProgress(percent, section, subsection = null) {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const text = subsection 
    ? `${section}: ${subsection} - ${percent}% (${elapsed}s)`
    : `${section} - ${percent}% (${elapsed}s)`;
  progressText.textContent = text;
}

// Usage:
onProgress(45, 'Creating meals', 'Monday breakfast');
```

---

## Integration Checklist

To integrate this component into your application:

1. [ ] **Copy HTML structure** to your generation page
2. [ ] **Add CSS styles** to your stylesheet (or inline)
3. [ ] **Implement handleGenerate()** function
4. [ ] **Add progress callback** to your generation function
5. [ ] **Define stage messages** appropriate for your use case
6. [ ] **Configure timing** (update frequency, delays)
7. [ ] **Add error handling** with user-friendly messages
8. [ ] **Test all states** (loading, success, error)
9. [ ] **Verify accessibility** (ARIA, screen reader, keyboard)
10. [ ] **Test responsive behavior** on mobile and desktop

---

## Summary

This generation status UI component provides:

✅ **Visual Progress Feedback** - Users see what's happening  
✅ **Stage Completion Messages** - Clear context about current step  
✅ **Elapsed Time Display** - Manages expectations  
✅ **Smooth Animations** - Professional feel  
✅ **Error Handling** - Graceful failure states  
✅ **Accessibility** - Screen reader and keyboard support  
✅ **Customizable** - Easy to adapt for different use cases  
✅ **Psychology-Informed** - Timing creates positive UX  

The component strikes a balance between technical accuracy and user experience, providing enough information to keep users informed without overwhelming them with technical details.

---

*End of Specification*
