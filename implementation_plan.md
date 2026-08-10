# Phase 5: End-of-Year Export & Portfolio

The goal of this phase is to allow parents to generate a formal PDF report and a highlight reel video of a student's academic year for compliance, sharing, or record-keeping.

## User Review Required
> [!IMPORTANT]
> **Video Rendering Constraints:** Rendering video entirely in the browser using `ffmpeg.wasm` can be resource-intensive and may crash on low-end devices or mobile phones if there are many high-res photos. I plan to compress images significantly before handing them to `ffmpeg`, but please let me know if you expect this to work flawlessly on mobile or if desktop usage is acceptable for this specific heavy feature.

## Open Questions
- Do you have a preference for the PDF library? I recommend `@react-pdf/renderer` as it is reliable for React-based server/client rendering and produces high-quality, text-searchable PDFs, rather than a hacky HTML-to-Image-to-PDF approach.

## Proposed Changes

### 1. Export UI (`src/app/export/page.tsx`)
- **[NEW] `src/app/export/page.tsx`**: A dashboard to select the Student and Academic Year.
- **[NEW] `src/app/export/ExportForm.tsx`**: A client component form with checkboxes for:
  - Hours Summary
  - 6-Subject Checklist
  - Standards Coverage
  - Curriculum Completion
  - Confirmed Grades/Transcript (Default unchecked)
  - Portfolio Photos

### 2. PDF Generation
- **[MODIFY] `package.json`**: Install `@react-pdf/renderer`.
- **[NEW] `src/app/export/actions.ts`**: Server actions to query all the requested data from Supabase (transcripts, logs, standards, etc.) and return a structured JSON object.
- **[NEW] `src/app/export/PdfDocument.tsx`**: The declarative React-PDF template that takes the data and renders a beautiful, multi-page document with the school logo, student avatar, and tables.

### 3. Highlight Slideshow Generator
- **[MODIFY] `package.json`**: Install `@ffmpeg/ffmpeg` and `@ffmpeg/util`.
- **[NEW] `src/components/SlideshowGenerator.tsx`**: A heavy client component that takes an array of image URLs (flagged as portfolio samples), fetches the raw bytes, feeds them into `ffmpeg.wasm`'s virtual file system, applies a crossfade filter graph, and returns an `.mp4` blob for download.

## Verification Plan

### Automated Tests
- Run `tsc` to verify strict typings across the complex Supabase joins needed for the export data.

### Manual Verification
- Generate a PDF for Milli's 2026-2027 year and verify all checked sections render correctly across page breaks.
- Generate a Slideshow and verify the output `.mp4` plays correctly in VLC/QuickTime with transitions.
