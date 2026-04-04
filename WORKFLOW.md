# Development Workflow

This document records the mandatory workflow to be followed for each new version of the project.

## Fixed Workflow

1. Propose the next implementable features
2. Wait for user feedback
3. Implement the selected changes based on user feedback
4. Use Git-based versioning for the new version
5. Build the project and create the next versioned executable
6. Test the changes with relevant checks
7. If errors or regressions are found, fix them, rebuild, and retest until resolved
8. Update `DEVELOPMENT_LOG.md`
9. Update `FEATURES.md`
10. Stage and commit the changes in Git
11. Push the branch to GitHub

## Notes

- Version history will be maintained through Git commits, branches, and optional tags
- Source-code copies for each version will not be used as the main versioning method
- Versioned executables such as `myshell_v2.exe`, `myshell_v3.exe`, and later builds may be kept as milestone artifacts
- Documentation must stay aligned with the implemented features for each version
