# Versioning & Development Process

This project uses a custom versioning approach to make every step of development rewarding and easy to track.

## Versioning Format
- **vX.Y.Z** (e.g., v0.1.0, v0.2.0, v0.10.0)
  - **X:** Major version (big or breaking changes)
  - **Y:** Minor version (small, focused, and rewarding feature sets; increments by 1, goes to double digits as needed)
  - **Z:** Patch version (bug fixes or tiny tweaks; can go to double digits as needed)
- **Pre-release/dev tags:**
  - Use tags like `-dev`, `-alpha`, `-beta` for in-progress or pre-release versions (e.g., v0.3.1-dev1, v0.10.0-beta)
  - These tags help document pushes and progress before a main version is ready

## Changelog Formatting Reference
- **[Unreleased]**: Top section for ongoing work not yet released. (Not recommended; see COPILOT_INSTRUCTIONS.md)
- **Preferred:** List all changes under the next dev version (e.g., v0.4.0-dev1, v0.4.0-dev2, etc.). When ready for a stable release, summarize and finalize in a new version header (e.g., v0.4.0) with only the CHANGELOG.md updated.
- **[vX.Y.Z(-tag)] - YYYY-MM-DD**: Header for each version or dev milestone.
  - Place the most recent version (including dev/pre-release) at the top, above older versions.
  - When a final version is released, place it above its dev/pre-release versions for clarity.

### Example Order
```
## [Unreleased]
- Ongoing work

## [v0.3.1] - 2025-07-02
- Google Drive integration complete

## [v0.3.1-dev2] - 2025-07-01
- Added Google Drive file picker

## [v0.3.1-dev1] - 2025-06-30
- Set up Google API authentication
```

### Changelog Subheaders (for Major/Minor Releases)
- For major and minor releases (e.g., v1.0.0, v0.10.0), you can use subheaders to organize changes:
  - **Added**: New features
  - **Changed**: Updates to existing features
  - **Deprecated**: Features soon to be removed
  - **Removed**: Features removed
  - **Fixed**: Bug fixes
  - **Security**: Security improvements
- Example:
```
## [v1.0.0] - 2025-08-01
### Added
- New dashboard view
- Google Drive integration

### Changed
- Updated task scheduling algorithm

### Fixed
- Login bug on mobile
```
- For dev and patch versions, use simple bullet points for each change.

### Changelog Entry Formatting
- **Major/Minor Releases:**
  - Use traditional changelog subheaders (Added, Changed, Fixed, etc.)
  - Summarize changes under each subheader with concise bullet points
- **Dev Versions (and optionally Patch Versions):**
  - Use more detailed, in-depth bullet points
  - Bullets can be longer and more descriptive, documenting your thought process, partial progress, and specific changes
  - This helps you remember exactly what was done at each step, perfect for solo development and learning
- Example:
```
## [v0.3.1-dev2] - 2025-07-01
- Implemented Google Drive file picker UI, including multi-file selection and error handling
- Refactored Google API authentication logic for better reliability
- Documented integration steps in API.md

## [v1.0.0] - 2025-08-01
### Added
- New dashboard view
- Google Drive integration
### Changed
- Updated task scheduling algorithm
### Fixed
- Login bug on mobile
```

### Best Practices
- Always add new entries above the previous ones.
- Use the “Unreleased” section for ongoing work.
- When you “release” a version, move the changes from “Unreleased” to a new version header with the date.
- Place the final version header above any dev/pre-release headers for that version.
- Use dev/pre-release tags for partial progress, and remove them when the version is finalized.
- **Document every meaningful change as its own bullet point, even for small tweaks or fixes.**
  - This helps you track exactly what was changed and when, making it easier to remember and review your progress later.

## How to Use
- Every time you complete a feature or milestone, increment the version in the roadmap and changelog.
- For in-between pushes or partial progress, use a `-dev` tag (e.g., v0.3.1-dev1, v0.3.1-dev2).
- Document each push in the CHANGELOG.md, even if it’s not a full version.
- When a version is “ready,” remove the dev tag and update the changelog with the release date, placing the final version above its dev versions.

This process is designed for solo development and personal celebration—adjust as you see fit!

## API Change Summary Requirement
- For every stable, alpha, or beta release, summarize all API changes (new endpoints, deleted endpoints, changes to endpoints, etc.) in the changelog, even if they were already documented in dev releases. This ensures the release notes provide a complete overview of API evolution for each version.
