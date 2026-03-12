# Object Manager Runtime - Tasks

## Phase 1: Conditional Logic Engine
- [ ] Add conditional_rules to FieldConfiguration interface and SELECT_COLS
- [ ] Add conditional_rules to FieldConfigRecord interface and SELECT_COLS
- [ ] Create hooks/useConditionalLogic.ts
- [ ] Build + verify

## Phase 2: Role-based Field Permissions
- [ ] Add permissions to FieldConfiguration interface and SELECT_COLS
- [ ] Add permissions to FieldConfigRecord interface
- [ ] Create hooks/useFieldPermissions.ts
- [ ] Build + verify

## Phase 3: Stage Gating Validation
- [ ] Add required_at_stage, blocks_stage_progression to interfaces
- [ ] Create lib/pipeline/stage-gating.ts
- [ ] Integrate into advanceStageAction
- [ ] Build + verify

## Phase 4: Non-pipeline Visibility Filtering
- [ ] Extend useFieldConfigurations to accept VisibilityContext
- [ ] Build + verify

## Last Updated: 2026-03-12
