# Insurance CRM - Theme System Guide

## Overview

The Insurance CRM application now supports both **Light** and **Dark** themes with a comprehensive theming system built on top of Tailwind CSS and CSS custom properties.

## Features

### ✅ Complete Theme Support
- **Light Theme**: Clean, professional white background with blue accents
- **Dark Theme**: Modern dark background with blue accents
- **System Theme**: Automatically follows user's OS preference
- **Theme Persistence**: User's theme choice is saved and restored

### ✅ Theme Toggle Options
- **Dropdown Menu**: Full theme selector (Light/Dark/System)
- **Simple Toggle**: Quick switch between Light/Dark
- **Keyboard Accessible**: Full keyboard navigation support

### ✅ Comprehensive Component Coverage
- All UI components are theme-aware
- Consistent color scheme across the application
- Proper contrast ratios for accessibility
- Smooth transitions between themes

## Implementation Details

### Theme Provider Setup

The theme system uses `next-themes` for theme management:

```tsx
// In app/layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### CSS Custom Properties

Themes are defined using CSS custom properties in `globals.css`:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.396 0.115 252.417);
  /* ... more properties */
}

.dark {
  --background: oklch(0.09 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.708 0.15 252.417);
  /* ... more properties */
}
```

### Component Usage

Components use semantic color tokens:

```tsx
// Instead of hardcoded colors
<div className="bg-white text-gray-900">

// Use semantic tokens
<div className="bg-background text-foreground">
```

## Color Palette

### Light Theme
- **Background**: Pure white (`oklch(1 0 0)`)
- **Foreground**: Dark gray (`oklch(0.145 0 0)`)
- **Primary**: Blue (`oklch(0.396 0.115 252.417)`)
- **Secondary**: Light gray (`oklch(0.97 0 0)`)
- **Muted**: Light gray (`oklch(0.97 0 0)`)
- **Border**: Light gray (`oklch(0.922 0 0)`)

### Dark Theme
- **Background**: Very dark gray (`oklch(0.09 0 0)`)
- **Foreground**: Near white (`oklch(0.985 0 0)`)
- **Primary**: Light blue (`oklch(0.708 0.15 252.417)`)
- **Secondary**: Dark gray (`oklch(0.205 0 0)`)
- **Muted**: Dark gray (`oklch(0.205 0 0)`)
- **Border**: Medium gray (`oklch(0.269 0 0)`)

## Theme Toggle Components

### Full Theme Selector
```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle"

<ThemeToggle />
```

### Simple Toggle
```tsx
import { ThemeToggleSimple } from "@/components/ui/theme-toggle"

<ThemeToggleSimple />
```

## Updated Components

### Layout Components
- ✅ **Header**: Theme toggle, semantic colors
- ✅ **Sidebar**: Theme-aware navigation, proper contrast
- ✅ **DashboardLayout**: Background color updates

### UI Components
- ✅ **Button**: All variants support themes
- ✅ **Input**: Border and background colors
- ✅ **Card**: Background and border colors
- ✅ **Badge**: Theme-aware variants
- ✅ **DropdownMenu**: Proper theming
- ✅ **Alert**: Semantic color usage

### Page Components
- ✅ **Login Page**: Full theme support with toggle
- ✅ **Dashboard**: Theme-aware colors
- ✅ **Policies Page**: Full theme support
- ✅ **All other pages**: Semantic color usage

## Accessibility

### Contrast Ratios
- Light theme: Exceeds WCAG AA standards
- Dark theme: Optimized for readability
- Focus indicators: High contrast in both themes

### Keyboard Navigation
- Theme toggle is keyboard accessible
- Focus management preserved across themes
- Screen reader friendly

## Best Practices

### For Developers

1. **Use Semantic Tokens**
   ```tsx
   // ✅ Good
   className="bg-background text-foreground"
   
   // ❌ Avoid
   className="bg-white text-black dark:bg-gray-900 dark:text-white"
   ```

2. **Test Both Themes**
   - Always test components in both light and dark themes
   - Verify contrast ratios
   - Check for proper hover/focus states

3. **Use Theme-Aware Components**
   ```tsx
   // ✅ Use theme-aware components
   <Button variant="outline">Click me</Button>
   
   // ❌ Avoid hardcoded styles
   <button className="bg-blue-500 text-white">Click me</button>
   ```

### Color Usage Guidelines

- **Primary**: Main actions, links, active states
- **Secondary**: Secondary actions, less important elements
- **Muted**: Subtle text, placeholders, disabled states
- **Destructive**: Errors, delete actions, warnings
- **Border**: Dividers, input borders, card outlines

## Theme Customization

To add new themes or modify existing ones:

1. **Update CSS Variables** in `globals.css`
2. **Add Theme Definition** in `lib/themes.ts`
3. **Test Components** across all themes
4. **Update Documentation** as needed

## Browser Support

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile browsers
- ✅ Respects `prefers-color-scheme`

## Performance

- **Zero Runtime Cost**: Themes use CSS custom properties
- **No Flash**: `suppressHydrationWarning` prevents theme flash
- **Smooth Transitions**: Optional transition animations
- **Lightweight**: Minimal JavaScript overhead

## Troubleshooting

### Common Issues

1. **Theme Flash on Load**
   - Ensure `suppressHydrationWarning` is set on `<html>`
   - Check ThemeProvider configuration

2. **Colors Not Updating**
   - Verify CSS custom property usage
   - Check for hardcoded color classes

3. **Accessibility Issues**
   - Test with screen readers
   - Verify keyboard navigation
   - Check contrast ratios

### Debug Tools

```tsx
// Check current theme
import { useTheme } from "next-themes"

function DebugTheme() {
  const { theme, systemTheme, resolvedTheme } = useTheme()
  
  return (
    <div>
      <p>Theme: {theme}</p>
      <p>System: {systemTheme}</p>
      <p>Resolved: {resolvedTheme}</p>
    </div>
  )
}
```

## Future Enhancements

- [ ] Custom theme builder
- [ ] High contrast mode
- [ ] Color blind friendly variants
- [ ] Theme animations
- [ ] Per-component theme overrides

---

**Note**: This theme system provides a solid foundation for the Insurance CRM application with excellent user experience and accessibility standards.