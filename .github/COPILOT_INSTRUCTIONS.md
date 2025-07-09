# COPILOT_INSTRUCTIONS.md

---

## Quick Reference & Table of Contents
- [Purpose](#purpose)
- [Changelog Policy](#changelog-policy)
- [Documentation Policy](#documentation-policy)
- [Code Quality & Security](#code-quality--security)
- [Workflow](#workflow)
- [Organization Policy](#organization-policy)
- [Reviewer Policy](#reviewer-policy)
- [Testing Policy](#testing-policy)
- [Logging Policy](#logging-policy)
- [Testing Steps Policy](#testing-steps-policy)
- [How to Use](#how-to-use)

---

## Purpose
Defines persistent workflow and documentation instructions for GitHub Copilot and other AI coding assistants. Reference this file in prompts to ensure consistent practices.

---

## Changelog Policy
- **Every code or documentation change must be accompanied by an entry in CHANGELOG.md.**
- Summarize all significant changes: new features, bug fixes, refactors, documentation updates.
- Use established versioning and formatting style (see CHANGELOG.md for examples).
- Follow VERSIONING.md for versioning guidelines (major, minor, patch releases).
- Avoid "Unreleased" style; add to the next version's dev list. Only start a new dev version when the previous is marked as pushed.
- API change summary policy: see VERSIONING.md §API Change Summary.

## Documentation Policy
- Update all relevant documentation files (README.md, FEATURES.md, ROADMAP.md, DEPLOYMENT.md, docs/architecture.md, etc.) when features, APIs, or workflows change.
- Add usage examples and security notes where appropriate.
- Keep documentation thorough, clear, and up to date.
- Add docs in the `docs/` directory as needed for any changes or new features.
- API usage examples and endpoint documentation should be in docs/API.md (not README.md). Reference docs/API.md from README.md if needed.

## Code Quality & Security
- Follow best practices for security (never commit secrets, always validate input, use constant-time password checks).
- Add comments and logging for important logic and error handling.
- Never push sensitive information (API keys, passwords, etc.) to the repository.

## Workflow
- Prefer explicitness and clarity in code and documentation.
- If a change affects multiple files, update all relevant places in one commit.
- If unsure about a workflow, check here or ask for clarification.
- Stay within the scope of the request. If something needs additional changes or explanations outside its initial scope, document it and ask—do not make changes outside the request scope without confirmation.
- Progression is incremental and associated with the ROADMAP.md.

## Organization Policy
- **Prioritize code and documentation organization:** Place related helper functions, models, and logic together in a consistent, logical order. Always consider and improve file/project organization for clarity and maintainability.

## Reviewer Policy
- **ONLY WHEN ASKED FOR A REVIEW DOES THIS POLICY APPLY:**
  - Understand the context and scope of the changes.
  - Provide a clear, itemized list of review responses for each file/area reviewed.
  - Any requested changes must be accompanied by a clear explanation of why and what the change is doing.
  - If simply acknowledging good changes, indicate that clearly.
  - Clearly indicate whether a review response is requesting changes or simply describing good changes.
  - Include even minor change suggestions to help improve code quality and maintainability.
  - Ensure all changes are documented in the appropriate documentation files (CHANGELOG.md, API.md, ROADMAP.md, etc.).
  - Always check for adherence to:
    - Best practices (security, code quality, maintainability, explicit error handling, etc.)
    - Code and documentation organization (helper functions, models, and logic grouped logically and consistently)
    - Documentation policy (all changes reflected in docs/API.md, ROADMAP.md, etc.)
    - Changelog policy (all changes reflected in CHANGELOG.md, with dev versions being detailed and stable versions summarized)
    - Workflow and scope (changes are incremental, within scope, and documented)
    - No sensitive information is committed
    - Consistency with project conventions and naming
  - Also:
    - Suggest improvements for clarity, maintainability, or security where possible
    - Note any missing or outdated documentation
    - Confirm that all endpoints, models, and features are documented and versioned
    - Add any additional reviewer rules here as the workflow evolves.
  - **If Specified as a end of a version review:**
    - At the end of a version, before a stable release, perform an extra thorough review of the entire codebase to ensure stability with all features added and changes made. This review should check for regressions, incomplete features, missing documentation, and overall readiness for release.
    - This DOES NOT mean to ignore the previously stated review policy, but rather to perform an additional review of the entire codebase to ensure that all features are complete and ready for release. Still use the same review policy, but be extra thorough in checking for any issues that may have been missed in previous reviews and widen the scope to target the entire codebase.

## Testing Policy
- All features and functions must have automated tests created and passing before any version (including dev versions) is pushed.
- Exception: tests for current features will be implemented in v0.5.0-dev13. This policy is now required for all future development.

## Logging Policy
- All functions and major advancements within functions must include logging statements. Logging should be widespread and thorough throughout the codebase, covering all features, endpoints, and important logic branches. This ensures traceability, easier debugging, and better maintainability.

## Testing Steps Policy
- With any and all changes or change suggestions (normal, NOT reviews), practical testing steps must be provided or additional automated tests must be included to ensure the feature or change works correctly. This applies to all new features, bug fixes, and refactors and not to changes or suggestions within reviews, reviews have their own policies.

## How to Use
- Reference this file in your prompt: "Follow the workflow in COPILOT_INSTRUCTIONS.md."
- You may add or update instructions here as your workflow evolves.

---

**This file is for internal workflow guidance. Update as needed to reflect your evolving best practices.**
