# Versioning & Release Documentation Strategy

This project uses a streamlined versioning and documentation process to keep development rewarding, organized, and easy to track. Every milestone is celebrated with clear, actionable records.

## Versioning Format

- **vX.Y.Z** (e.g., v0.1.0, v0.12.0, v1.0.0)
  - **X:** Major version (breaking changes, big upgrades)
  - **Y:** Minor version (focused feature sets, UI/UX improvements, new modules)
  - **Z:** Patch version (bug fixes, small tweaks)
- **Pre-release tags:** Use `-alpha`, `-beta` for early releases (e.g., v0.13.0-beta). Avoid cluttering with dev tags—track partial progress in personal docs or checklists.

## File Responsibilities

- **ROADMAP.md:** High-level version plan and checklist. Each version milestone is a focused, bite-sized release. Mark progress here and keep the roadmap actionable and celebratory.
- **end-of-version-checklist.md (or versioned checklist files):** Actionable checklist for each release, used to track completion of all required tasks before merging and releasing. Archive or split old checklists as needed.
- **CHANGELOG.md:** The public-facing changelog. For each release, centralize all changes in a single, categorized section. Use clear subheaders for major/minor releases (see below). Place the newest release at the top.
- **docs/personal-docs/vX.Y.Z-change-tracking.md:** Personal, granular change tracking and progress notes. Use this for in-depth documentation, partial progress, and development checklists. When ready to release, summarize the completed work in CHANGELOG.md.

## Changelog Structure

- For **major/minor releases**, use categorized subheaders to organize changes. Recommended categories:
  - **UI/UX & Design**
  - **Authentication & Security**
  - **Error Handling**
  - **Notifications**
  - **Accessibility**
  - **Testing & Coverage**
  - **Backend & API**
  - **Features & Improvements**
  - **Breaking Changes & Migration Notes**
- Summarize changes under each subheader with concise bullet points. Centralize all changes for the release in one section—avoid scattered notes and checklists.
- For **patch releases**, use a simple bullet list of fixes and tweaks.

### Example (Major/Minor Release)

```
## [v1.0.0] - 2025-08-01
### UI/UX & Design
- New dashboard view
- Google Drive integration
### Backend & API
- Added Google Drive file picker endpoints
### Fixed
- Login bug on mobile
### Breaking Changes & Migration Notes
- Updated authentication flow, requires re-login
```

## Release Workflow

1. Plan the next milestone in `ROADMAP.md`.
2. Create and maintain an actionable end-of-version checklist (e.g., `end-of-version-checklist.md` or versioned checklist files) to track all required tasks for the release. Use development checklists in personal docs for granular progress.
3. Track granular changes and progress in `docs/personal-docs/vX.Y.Z-change-tracking.md`, including development checklists and notes.
4. When ready to release, summarize and centralize all changes in `CHANGELOG.md` using the categorized format above.
5. Place the newest release at the top of `CHANGELOG.md`.
6. Archive or split old checklists and personal docs as needed.

## Best Practices

- Always add new entries above previous ones in `CHANGELOG.md`.
- Centralize all changes for each release—avoid scattered notes and checklists.
- Document every meaningful change as its own bullet point, even for small tweaks or fixes.
- Use personal docs for partial progress, granular notes, and checklists. Only summarize in the public changelog when ready to release.
- Celebrate every milestone!

## API Change Summary Requirement

- For every stable, alpha, or beta release, summarize all API changes (new endpoints, deleted endpoints, changes to endpoints, etc.) in the changelog, even if they were already documented in personal docs. This ensures the release notes provide a complete overview of API evolution for each version.
