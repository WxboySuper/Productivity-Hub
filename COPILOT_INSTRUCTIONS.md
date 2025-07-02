# COPILOT_INSTRUCTIONS.md

## Purpose
This file defines persistent workflow and documentation instructions for GitHub Copilot and other AI coding assistants working in this repository. Reference this file in your prompts to ensure consistent practices.

---

## Changelog Policy
- **Every code or documentation change must be accompanied by an entry in CHANGELOG.md.**
- Summarize all significant changes, including new features, bug fixes, refactors, and documentation updates.
- Use the established versioning and formatting style (see CHANGELOG.md for examples).
- Use VERSIONING.md for versioning guidelines, including major, minor, and patch releases.
- Use of the "Unreleased" style is not encouraged; instead add it to a list of changes in the next version, All changes will be pushed as dev changes, then the stable changes will consist of only the CHANGELOG.md updates after all changes have been made and tested within dev versions.
- Keep the changelog list running until it is expressely noted that the specific dev version has been pushed and you need to start a new dev version (ex. don't start dev9 until it is stated that dev8 has been pushed).
- API change summary policy: (see VERSIONING.md §API Change Summary)

## Documentation Policy
- Update all relevant documentation files (README.md, FEATURES.md, ROADMAP.md, DEPLOYMENT.md, docs/architecture.md, etc.) when features, APIs, or workflows change.
- Add usage examples and security notes where appropriate.
- Keep documentation thorough, clear, and up to date with the codebase.
- Add additional documentation in the `docs/` directory as needed for any changes or new features.
- API usage examples and endpoint documentation should be placed in docs/API.md rather than README.md for clarity and maintainability. Reference docs/API.md from the README.md if needed.

## Code Quality & Security
- Follow best practices for security (e.g., never commit secrets, always validate input, use constant-time password checks).
- Add comments and logging for important logic and error handling.
- Ensure I'm not pushing any sensitive information (like API keys or passwords) to the repository.

## Workflow
- When in doubt, prefer explicitness and clarity in both code and documentation.
- If a new feature or change affects multiple files, update all relevant places in one commit.
- If unsure about a workflow, check for instructions here or ask for clarification.
- Stay within the scope of the request, if something needs additional changes or explanations outside of it's initial scope, document it and ask, do not make changes outside of the request scope without confirmation. Progression is taken gracefully and incrementally associated with the ROADMAP.md.

## Organization Policy
- **Prioritize code and documentation organization:** Place related helper functions, models, and logic together in a consistent, logical order. When adding or recommending code changes, always consider and improve file and project organization for clarity and maintainability.

## Reviewer Policy
- **ONLY WHEN ASKED FOR A REVIEW DOES THIS POLICY APPLY:**
- When asked to review code, ensure you understand the context and scope of the changes.
- When acting as a reviewer, provide a clear, itemized list of review responses for each file or area reviewed.
- Any requested changes should also be accompanied by a clear explanation of why the change is needed or beneficial and explain what the change is doing.
- If a review response is simply acknowledging good changes, indicate that clearly without requesting further changes.
- Clearly indicate whether a review response is requesting changes to any files or is simply describing good changes.
- Include even minor change suggestions in the review response, as they can help improve code quality and maintainability.
- Ensure all changes are correctly documented in the appropriate documentation files (CHANGELOG.md, API.md, ROADMAP.md, etc.).
- When reviewing, always check for adherence to:
  - Best practices (security, code quality, maintainability, explicit error handling, etc.)
  - Code and documentation organization (helper functions, models, and logic grouped logically and consistently)
  - Documentation policy (all changes reflected in docs/API.md, ROADMAP.md, etc.)
  - Changelog policy (all changes reflected in CHANGELOG.md, with dev versions being detailed and stable versions summarized)
  - Workflow and scope (changes are incremental, within scope, and documented)
  - No sensitive information is committed
  - Consistency with project conventions and naming
- When reviewing, also:
  - Suggest improvements for clarity, maintainability, or security where possible
  - Note any missing or outdated documentation
  - Confirm that all endpoints, models, and features are documented and versioned
  - Add any additional reviewer rules here as the workflow evolves.
- **If Specified as a end of a version review**: At the end of a version, before a stable release, perform an extra thorough review of the entire codebase to ensure stability with all features added and changes made. This review should check for regressions, incomplete features, missing documentation, and overall readiness for release.
    - This DOES NOT mean to ignore the previously stated review policy, but rather to perform an additional review of the entire codebase to ensure that all features are complete and ready for release. Still use the same review policy, but be extra thorough in checking for any issues that may have been missed in previous reviews and the widen the scope of the review to target the entire codebase.

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
