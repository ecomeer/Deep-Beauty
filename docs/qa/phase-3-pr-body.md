# Phase 3 PR Summary

## What changed

- unified dashboard and statistics revenue rules;
- used Kuwait-local date boundaries for reporting;
- prevented delayed payment events from moving orders backwards;
- recorded paid/confirmed timestamps;
- cancelled and restocked only explicit terminal payment failures;
- moved push delivery to the shared server helper;
- made Resend sender/configuration errors visible;
- added focused unit tests and CI coverage for the branch.

## Validation required before merge

- unit tests;
- ESLint;
- TypeScript;
- production build;
- Vercel Preview;
- Preview E2E.

This change must remain Draft and must not be merged into `main` directly.
