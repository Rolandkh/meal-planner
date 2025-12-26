# Vanessa Onboarding Specification

[Full specification content from user's message - saved for implementation]

## Overview

Onboarding is designed to be fast (~3 minutes) while capturing essential information for meal plan generation. The flow uses progressive disclosure - collecting only what's necessary upfront, then offering deeper personalization based on user goals and after the first meal plan.

## Tone

**Warm + Friendly + Task-Oriented + Efficient**
- Nice and considerate but not verbose
- Stays on task
- Redirects user when they get off-track
- One question at a time
- 2-3 sentences max per response

## Onboarding Flow

### Tier 1: Essential (5 questions, ~3 min)
1. Dietary goals
2. Foods to avoid
3. Household members
4. Budget
5. Shopping day

### Conditional: Biometrics
Offered only if goal involves weight/calorie optimization:
- Age, height, weight, activity level
- Calculate TDEE and target calories
- User can decline

### Progressive: Post-First-Plan
After user views their first meal plan:
- Request feedback
- Hint at further customization (cooking time, equipment, etc.)
- Collect Tier 2 preferences over time

## Implementation Status

✅ Specification complete
⏳ Implementation pending (Task 39)
📝 Will be implemented after UI mockups approved

## Next Steps

1. Implement technical foundation (Tasks 42, 43, 46, 37, 45)
2. Create UI mockups for approval
3. Implement Task 39 with this specification





