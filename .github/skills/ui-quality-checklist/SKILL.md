---
name: ui-quality-checklist
description: UI quality review checklist. Covers design alignment, accessibility, responsive behaviour, interaction consistency, and component completeness. Use when reviewing UI implementations.
---

# UI Quality Review Checklist

Reference for the **ui-reviewer** agent and any agent evaluating UI implementations in the application.

---

## Design Alignment

- [ ] Component matches the design specification from the **ui-designer** agent
- [ ] Spacing follows the project's design system spacing scale (consistent increments)
- [ ] Typography follows the defined type scale
- [ ] Colors use design tokens (no hardcoded hex/rgb values)
- [ ] Icons are from the project's designated icon set
- [ ] Layout matches the specified grid/flex structure
- [ ] UI component library primitives are used without custom overrides where possible
- [ ] Dark mode variables are properly applied (if applicable)

### Component Hierarchy Check

```
Page → Layout → Section → Card → Content
                                 → Actions
```

- [ ] Components are at the correct level of abstraction
- [ ] No "god components" with too many responsibilities
- [ ] Presentational components are separated from data-fetching logic

---

<!-- Enhanced with patterns from Addy Osmani / accessibility -->
## Accessibility (WCAG 2.1 AA)

All UI must meet WCAG 2.1 Level AA. This is non-negotiable for any professional application.

### Keyboard Navigation

- [ ] All interactive elements are reachable via **Tab** key
- [ ] Tab order follows logical reading order (top-to-bottom, left-to-right)
- [ ] **Escape** closes modals, dropdowns, and popovers
- [ ] **Enter** activates buttons and links
- [ ] **Space** toggles checkboxes and selects options
- [ ] **Arrow keys** navigate within composite widgets (tabs, menus, radio groups)
- [ ] No keyboard traps — user can always Tab away from a component
- [ ] Skip link is provided to bypass navigation and jump to main content
- [ ] Focus is moved to modal when opened, returned to trigger when closed

```typescript
// ✅ Focus management for modal
function DetailModal({ isOpen, onClose, triggerRef }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus(); // Return focus to trigger
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onEscapeKeyDown={onClose}>
        <button ref={closeButtonRef} onClick={onClose} aria-label="Close dialog">
          <X />
        </button>
        {/* ... */}
      </DialogContent>
    </Dialog>
  );
}
```

### Screen Reader Support

- [ ] All images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] Form inputs have associated `<label>` elements (or `aria-label`)
- [ ] Error messages are linked to inputs via `aria-describedby`
- [ ] Dynamic content updates use `aria-live` regions
- [ ] Tables have proper `<th>` with `scope` attributes
- [ ] Navigation landmarks: `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`
- [ ] Headings form a logical hierarchy (no skipping levels)
- [ ] Custom components have appropriate ARIA roles

```typescript
// ✅ Accessible form field
<div>
  <Label htmlFor="item-description">Description</Label>
  <Textarea
    id="item-description"
    aria-describedby="item-description-error item-description-hint"
    aria-invalid={!!errors.description}
  />
  <p id="item-description-hint" className="text-sm text-muted-foreground">
    Provide a detailed description
  </p>
  {errors.description && (
    <p id="item-description-error" role="alert" className="text-sm text-destructive">
      {errors.description.message}
    </p>
  )}
</div>
```

### Color Contrast

- [ ] Normal text (< 18px): minimum **4.5:1** contrast ratio
- [ ] Large text (≥ 18px or ≥ 14px bold): minimum **3:1** contrast ratio
- [ ] UI components and graphical objects: minimum **3:1** contrast ratio
- [ ] Focus indicators: minimum **3:1** contrast against adjacent colors
- [ ] Information is NOT conveyed by color alone (use icons, patterns, or text labels)

```typescript
// ✅ Status badge: color + text + icon (not color alone)
function StatusBadge({ level }: { level: 'ACTIVE' | 'PENDING' | 'WARNING' | 'ERROR' }) {
  const config = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
    WARNING: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertTriangle, label: 'Warning' },
    ERROR: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Error' },
  };
  const { bg, text, icon: Icon, label } = config[level];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${bg} ${text}`} role="status">
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
```

### Focus Management

- [ ] Focus indicator is visible (minimum 2px outline, not just color change)
- [ ] Custom focus styles match the design system
- [ ] Focus is not lost after dynamic content changes (deletion, form submission)
- [ ] Disabled elements are not focusable (use `aria-disabled` if focus is needed for context)

```css
/* ✅ Visible focus indicator */
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Additional A11y Checks

- [ ] Page has a single `<h1>` matching the page title
- [ ] `lang` attribute is set on `<html>` element
- [ ] Link text is descriptive (no "click here")
- [ ] Timeout warnings give users ability to extend time
- [ ] Animations respect `prefers-reduced-motion` media query

---

## Responsive Behaviour

- [ ] Layout adapts correctly at breakpoints: 640px, 768px, 1024px, 1280px
- [ ] No horizontal scrolling at any breakpoint
- [ ] Touch targets are minimum 44×44px on mobile
- [ ] Tables convert to card layout on small screens (or scroll horizontally within container)
- [ ] Navigation collapses to mobile menu below 768px
- [ ] Modals and dialogs are full-screen on mobile
- [ ] Text is readable without zooming (minimum 16px body)

### Responsive Testing Points

| Viewport | Typical Device | Key Checks |
|----------|---------------|------------|
| 375px | iPhone SE | Navigation collapse, touch targets |
| 768px | iPad portrait | Side panel behavior, table layout |
| 1024px | iPad landscape | Full layout visible, no squishing |
| 1280px | Desktop | Maximum content width, whitespace balance |
| 1920px | Large monitor | Content doesn't stretch too wide |

---

## Interaction Consistency

- [ ] All buttons have hover, active, focus, and disabled states
- [ ] Loading states use consistent skeleton or spinner patterns
- [ ] Error states show inline messages (not just toast for form errors)
- [ ] Success feedback is provided for all actions (toast or inline)
- [ ] Destructive actions require confirmation dialog
- [ ] Form submissions show loading state and prevent double-submit
- [ ] Navigation shows active/current state
- [ ] Empty states have helpful messages and CTAs

### State Checklist Per Component

```
Default → Hover → Active → Focus → Disabled
                                  → Loading
                                  → Error
                                  → Empty
                                  → Success
```

- [ ] Transitions are smooth (150-300ms)
- [ ] No layout shift during state changes (use fixed dimensions or skeleton)
- [ ] Toast notifications don't obscure important content
- [ ] Modal backdrop prevents interaction with background

---

## Component Completeness

For each component implementation, verify:

- [ ] All props are typed with TypeScript interfaces
- [ ] Default props are sensible
- [ ] Edge cases handled: empty arrays, null values, long strings (truncation)
- [ ] `data-testid` attributes on key interactive elements
- [ ] Error boundary wraps complex components
- [ ] Loading state implemented (skeleton or spinner)
- [ ] Component is exported from barrel file if reusable
- [ ] Storybook story exists (if component library is set up)

### UI Component Library Usage Check

- [ ] Using UI library primitives (Button, Dialog, Card, Table, etc.) — not custom implementations
- [ ] Variants match the component library's conventions (`variant="destructive"`, `size="sm"`, etc.)
- [ ] No additional UI libraries added beyond the project's chosen component library
- [ ] Theme customization uses design tokens/config, not inline styles
