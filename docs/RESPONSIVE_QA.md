# Responsive QA contract

Status: automated and enforced in Playwright  
Implementation: `tests/e2e/responsive-matrix.spec.ts`

## Required viewport matrix

| Profile | CSS viewport |
| --- | ---: |
| Compact mobile | 320 × 844 |
| Mobile | 375 × 812 |
| Large mobile | 430 × 932 |
| Tablet portrait | 768 × 1024 |
| Tablet / small desktop | 1024 × 768 |
| Desktop | 1440 × 900 |
| Wide desktop | 1920 × 1080 |
| Mobile landscape | 844 × 390 |
| 200% zoom equivalent | 640 × 450 |

The 640 px profile is the CSS viewport equivalent of a 1280 px browser at
200% page zoom. It verifies reflow and access to the primary actions; it does
not attempt to emulate browser chrome.

## Functional coverage

Every required width verifies:

- header, primary navigation, mobile menu and footer;
- Home hero and its primary informational content;
- catalogue search, category and sorting controls;
- catalogue cards and their 44 × 44 px selection actions;
- a product title and all available product accordions;
- empty catalogue, empty selection and controlled bad-request states;
- selection state after adding a product;
- the contact conversion panel and its three honest contact actions;
- simulated long Romanian headings, descriptions and control labels.

The Romanian strings are deliberately injected by the test while the
production Romanian locale is blocked by `P0-LOCALE`. This checks layout
resilience without presenting an incomplete Romanian interface to users.

The contact check targets the current conversion panel rather than a fake form.
The form remains unavailable until an approved server-side transport exists,
as required by QA-001.

## Geometry and accessibility assertions

The suite fails when it detects:

- document-level horizontal scrolling;
- important text clipped by `hidden` or `clip` overflow;
- intersecting visible actions;
- an action clipped by an overflow ancestor;
- a visible action smaller than 44 × 44 px at touch widths;
- controls or content extending outside the usable viewport;
- loss of Home, catalogue or menu actions at the 200% zoom equivalent.

Animations and transitions are disabled only for screenshot stability.
Content, font and image loading complete before geometry is measured.

## Visual regression

Full-page catalogue baselines are versioned for all seven required widths in:

`tests/e2e/responsive-matrix.spec.ts-snapshots/`

Playwright compares the current render with these baselines during
`npm run test:e2e`. Baseline filenames are platform-neutral so the same
evidence is used locally and in CI. A baseline update must accompany an
intentional design change and be visually reviewed at compact mobile, tablet
and desktop sizes.

Run only this contract:

```powershell
npx.cmd playwright test tests/e2e/responsive-matrix.spec.ts
```

Regenerate baselines only after an approved visual change:

```powershell
npx.cmd playwright test tests/e2e/responsive-matrix.spec.ts `
  --project=chromium-desktop `
  --grep "visual catalogue baseline" `
  --update-snapshots
```

## Current responsive corrections

The initial matrix exposed and the implementation corrected:

1. A long Romanian catalogue heading expanded the document at 1024 px because
   desktop no-wrap typography started too early.
2. Catalogue selection controls were clipped in dense 4- and 5-column grids.
   Narrow cards now use a compact 44 × 44 px heart control.
3. The third Halo science point extended beyond its visual container at
   1024 px; its desktop position now stays within the section boundary.

