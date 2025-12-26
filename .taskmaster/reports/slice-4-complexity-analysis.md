# Slice 4 Complexity Analysis

**Generated:** December 26, 2025  
**Tasks Analyzed:** 10 (Tasks 47-56)  
**Threshold Score:** 6 (tasks scoring 6+ should be expanded)

---

## Complexity Scores & Recommendations

### Task 47: Implement Recipe Edit Page Component
**Complexity Score:** 8/10  
**Recommended Subtasks:** 4-5  
**Priority:** HIGH

**Reasoning:**
- **High complexity** due to multiple concerns:
  - Dynamic form with ingredient array (add/remove rows)
  - Real-time validation (5+ validation rules)
  - Auto-save draft functionality (30s intervals + beforeunload)
  - State management (isDirty tracking, error states)
  - localStorage draft management
  - Confirmation dialogs for discard
- Reuses existing patterns but adds significant complexity
- Error-prone areas: async auto-save, form validation, state synchronization

**Expansion Recommendation:**
1. Create form structure and basic rendering
2. Implement dynamic ingredient rows (add/remove)
3. Add validation logic and error display
4. Implement auto-save and draft management

**Risk Factors:**
- Form state can get out of sync with drafts
- BeforeUnload can be tricky across browsers
- Validation timing (on change vs on blur vs on submit)

---

### Task 48: Implement Recipe Update Storage Pattern
**Complexity Score:** 5/10  
**Recommended Subtasks:** 2  
**Priority:** HIGH

**Reasoning:**
- **Moderate complexity**:
  - Core CRUD operation with specific requirements
  - Must preserve recipeId (critical for meal references)
  - Timestamp management
  - Error handling for not found
- Relatively straightforward but critical for data integrity
- Single responsibility, well-defined scope

**Expansion Recommendation:**
1. Implement core update function with ID preservation
2. Add comprehensive error handling and validation

**Risk Factors:**
- Accidentally changing recipeId would break meal references
- Race conditions if multiple updates happen simultaneously

---

### Task 49: Enhance API for Single Day Regeneration
**Complexity Score:** 7/10  
**Recommended Subtasks:** 3-4  
**Priority:** HIGH

**Reasoning:**
- **Medium-high complexity**:
  - API parameter enhancement (backward compatibility needed)
  - System prompt modification (complex logic for day-specific generation)
  - Recipe duplication avoidance logic
  - SSE streaming modifications
  - Date-to-day mapping
- Builds on existing API but adds significant conditional logic
- Must maintain compatibility with full week generation

**Expansion Recommendation:**
1. Add and validate new API parameters
2. Enhance system prompt for single-day generation
3. Implement recipe duplication avoidance
4. Test backward compatibility with full week generation

**Risk Factors:**
- Breaking existing full week generation
- AI not respecting the "don't duplicate" constraints
- Date/day mismatch issues

---

### Task 50: Implement Regenerate Day UI Components
**Complexity Score:** 6/10  
**Recommended Subtasks:** 3  
**Priority:** MEDIUM

**Reasoning:**
- **Moderate complexity**:
  - Multiple UI components (buttons in 2 locations, modal, progress)
  - Confirmation dialog with dynamic content
  - Navigation logic (context-aware return)
  - Integration with existing components
- Well-scoped but touches multiple files
- Follows established patterns from full week generation

**Expansion Recommendation:**
1. Add regenerate buttons to MealPlanView and DayView
2. Create confirmation modal with dynamic content
3. Implement progress indicator and navigation logic

**Risk Factors:**
- Modal state management across different entry points
- Navigation context preservation

---

### Task 51: Implement Single Day Regeneration Logic
**Complexity Score:** 8/10  
**Recommended Subtasks:** 4-5  
**Priority:** HIGH

**Reasoning:**
- **High complexity**:
  - Multi-step async workflow
  - Data filtering and replacement logic
  - Meal plan update with partial changes
  - Orphaned recipe cleanup
  - Shopping list recalculation
  - Error handling and rollback
- Most complex task in Slice 4
- Critical for data integrity

**Expansion Recommendation:**
1. Implement meal filtering by date
2. Create API call with proper parameters
3. Implement meal replacement logic
4. Add shopping list update and orphaned recipe cleanup
5. Implement error handling and rollback

**Risk Factors:**
- Data corruption if replacement partially fails
- Orphaned recipe cleanup accidentally removing favorites
- Shopping list inconsistencies
- Race conditions with concurrent operations

---

### Task 52: Create Meal Plan History Pages
**Complexity Score:** 6/10  
**Recommended Subtasks:** 3  
**Priority:** MEDIUM

**Reasoning:**
- **Moderate complexity**:
  - Two page components (list + detail)
  - Read-only view architecture
  - Snapshot data structure handling
  - Empty state management
  - Routing with parameters
- Standard CRUD view but with snapshot complexity
- Follows existing component patterns

**Expansion Recommendation:**
1. Create history list page with card layout
2. Implement historical plan detail page (read-only)
3. Add routing and navigation between pages

**Risk Factors:**
- Snapshot data might be incomplete or corrupted
- Large history causing performance issues

---

### Task 53: Implement Meal Plan Auto-Archive System
**Complexity Score:** 7/10  
**Recommended Subtasks:** 3-4  
**Priority:** MEDIUM

**Reasoning:**
- **Medium-high complexity**:
  - Auto-trigger on new plan creation
  - Snapshot creation (meals + recipes)
  - History array management
  - Cleanup logic with configurable retention
  - Storage quota consideration
- Critical for not losing user data
- Must be reliable and tested thoroughly

**Expansion Recommendation:**
1. Implement snapshot creation (meals + recipes)
2. Create auto-archive trigger on new plan
3. Implement history cleanup with retention settings
4. Add storage quota checks and warnings

**Risk Factors:**
- Snapshot missing data if not captured correctly
- Cleanup accidentally removing wrong plans
- Storage quota exceeded during archival
- Race conditions with concurrent plan generations

---

### Task 54: Implement History Retention Settings
**Complexity Score:** 4/10  
**Recommended Subtasks:** 0-2  
**Priority:** LOW

**Reasoning:**
- **Low-moderate complexity**:
  - Settings UI additions
  - Configuration persistence
  - Manual cleanup trigger
  - Storage usage display
- Straightforward settings integration
- Builds on existing Settings page infrastructure

**Expansion Recommendation:**
Optional expansion if needed:
1. Add retention setting UI to Settings page
2. Implement manual cleanup with confirmation

**Risk Factors:**
- User accidentally setting retention too low
- Cleanup removing plans user wanted to keep

---

### Task 55: Create Recipe Import API Endpoint
**Complexity Score:** 9/10  
**Recommended Subtasks:** 5-6  
**Priority:** HIGH

**Reasoning:**
- **High complexity** (highest in Slice 4):
  - AI extraction with unpredictable inputs
  - System prompt engineering for extraction
  - Input validation (length, format)
  - JSON parsing with error handling
  - Confidence score calculation
  - Multiple error types and messages
  - Edge cases (not a recipe, malformed text, etc.)
- Similar complexity to meal plan generation
- High potential for edge cases and failures

**Expansion Recommendation:**
1. Implement input validation (length, format)
2. Create system prompt for extraction
3. Integrate AI model call with error handling
4. Implement JSON parsing and validation
5. Add confidence score calculation
6. Comprehensive error handling for all cases

**Risk Factors:**
- AI extraction accuracy varies with input quality
- Unexpected text formats breaking parser
- Metric conversion errors
- Ingredient categorization mistakes
- Cost from AI calls on invalid inputs

---

### Task 56: Implement Recipe Import Modal and UI
**Complexity Score:** 7/10  
**Recommended Subtasks:** 3-4  
**Priority:** MEDIUM

**Reasoning:**
- **Medium-high complexity**:
  - Multi-step modal (3 steps)
  - State machine for step progression
  - Async API integration
  - Editable preview form
  - Error state handling
  - Character counter
  - Loading states
- Similar to other multi-step flows
- Integrates with Task 55 (API)

**Expansion Recommendation:**
1. Create modal structure with 3 steps
2. Implement paste text step with character counter
3. Create preview/edit step with form
4. Add API integration and error handling

**Risk Factors:**
- Step transition logic getting complex
- Preview form validation overlapping with main edit form
- Modal state cleanup on close
- User closing modal mid-extraction

---

## Summary Statistics

### Complexity Distribution
- **Very High (9-10):** 1 task (Task 55)
- **High (7-8):** 4 tasks (Tasks 47, 49, 51, 53, 56)
- **Moderate (5-6):** 3 tasks (Tasks 48, 50, 52)
- **Low (3-4):** 2 tasks (Tasks 54)

### Subtask Recommendations
- **Tasks needing expansion (score ≥6):** 8 out of 10 (80%)
- **Total recommended subtasks:** 27-34 subtasks across all tasks
- **Average subtasks per task:** 3-4

### Priority Breakdown
- **HIGH Priority + High Complexity:** Tasks 47, 49, 51, 55 (requires careful planning)
- **MEDIUM Priority + Moderate Complexity:** Tasks 50, 52, 56 (can proceed with current structure)
- **LOW Priority + Low Complexity:** Task 54 (can implement as-is)

---

## Implementation Recommendations

### Phase 1: Foundations (Week 1)
Start with Tasks 47-48 (Recipe Editing):
- **Task 47** is complex but foundational - expand into 4-5 subtasks
- **Task 48** is straightforward but must be rock-solid
- These two enable all recipe management features

### Phase 2: Single Day Regeneration (Week 2)
Tackle Tasks 49-51 in sequence:
- **Task 49** (API) is critical - expand into 3-4 subtasks
- **Task 51** (Logic) is most complex - expand into 5 subtasks
- **Task 50** (UI) can proceed with 3 subtasks
- High dependency between these three

### Phase 3: History System (Week 3)
Implement Tasks 52-54:
- **Task 53** (Auto-archive) is most critical - expand into 4 subtasks
- **Task 52** (Pages) follows existing patterns - 3 subtasks
- **Task 54** (Settings) is simple - can implement as-is
- Test thoroughly for data integrity

### Phase 4: Recipe Import (Week 4)
Complete with Tasks 55-56:
- **Task 55** (API) is highest complexity - expand into 5-6 subtasks
- **Task 56** (UI) depends on Task 55 - expand into 3-4 subtasks
- Budget extra time for AI extraction testing
- Have fallback manual entry ready (Slice 5)

---

## Risk Mitigation Strategies

### High-Risk Tasks (9-10 complexity)
**Task 55** (Recipe Import API):
- Create extensive test suite with real recipe samples
- Implement confidence threshold (reject if <70%)
- Add manual entry fallback immediately
- Monitor AI costs during testing

### Medium-High Risk (7-8 complexity)
**Tasks 47, 49, 51, 53, 56:**
- Expand all into subtasks before starting
- Implement comprehensive error handling
- Add unit tests for critical logic
- Create rollback mechanisms for data operations

### Data Integrity Critical
**Tasks 48, 51, 53:**
- Test with real user data scenarios
- Implement atomic operations where possible
- Add data validation before and after operations
- Create backup/restore mechanisms

---

## Estimated Effort

### Original Estimate (from PRD)
- 3-4 weeks total

### Revised Estimate (based on complexity)
- **Week 1:** Tasks 47-48 (Recipe Editing)
  - 5-6 days of work
- **Week 2:** Tasks 49-51 (Regenerate Day)
  - 5-6 days of work
- **Week 3:** Tasks 52-54 (History)
  - 4-5 days of work
- **Week 4:** Tasks 55-56 (Import)
  - 6-7 days of work

**Total:** 20-24 days of actual work (4-5 weeks with testing/polish)

---

## Next Steps

1. **Expand High-Complexity Tasks:**
   - Task 55 (Recipe Import API) - expand into 5-6 subtasks
   - Task 51 (Single Day Logic) - expand into 5 subtasks
   - Task 47 (Recipe Edit Page) - expand into 4-5 subtasks
   - Task 53 (Auto-Archive) - expand into 4 subtasks

2. **Create Test Plans:**
   - Recipe editing with various edge cases
   - Single day regeneration scenarios
   - History archival and cleanup
   - Recipe import with diverse text formats

3. **Set Up Development Environment:**
   - Ensure dev presets work for testing
   - Prepare sample data for each feature
   - Configure API keys for testing

4. **Begin Implementation:**
   - Start with Task 47 (Recipe Edit Page)
   - Break into subtasks first
   - Implement one subtask at a time
   - Test thoroughly before moving to next task

---

**Complexity Analysis Complete** ✅

This analysis provides a realistic view of the work ahead for Slice 4. The expanded subtask recommendations will help ensure each feature is properly broken down and easier to implement incrementally.

