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

## How to Use
- Reference this file in your prompt: "Follow the workflow in COPILOT_INSTRUCTIONS.md."
- You may add or update instructions here as your workflow evolves.

---

**This file is for internal workflow guidance. Update as needed to reflect your evolving best practices.**
