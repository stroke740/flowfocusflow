

# FocusFlow Landing Page — Implementation Plan

This is a large landing page with 6 sections. I'll break it into focused files for maintainability.

## Files to Create/Modify

### 1. Update Design System (`src/index.css`)
- Switch heading font from Space Grotesk to Bricolage Grotesque (Google Fonts)
- Update CSS variables: primary to match #4F46E5 (Indigo 600), add cyan accent, update success/warning/error to spec
- Add custom utility classes for pill buttons, layered shadows, and animations (staggered fade-in, scale hover, strikethrough, navbar blur)

### 2. Update Tailwind Config (`tailwind.config.ts`)
- Add custom keyframes: fade-in-up with stagger support, scale-hover, slide-down, confetti burst
- Add cyan accent color token
- Set max container to 1280px

### 3. Landing Page Components (all new files)

| File | Content |
|------|---------|
| `src/components/landing/Navbar.tsx` | Fixed top nav with logo, links (Features, Pricing, About), CTA button. Blur backdrop on scroll via useEffect + scroll listener |
| `src/components/landing/HeroSection.tsx` | Headline, subheadline, dual CTAs (filled pill + ghost with Play icon), trust signals row, animated product mockup (CSS-only mock of Today view with completing tasks) |
| `src/components/landing/FeaturesSection.tsx` | 3x2 grid of feature cards with icons (Lucide), bold title, description. Intersection Observer for staggered reveal. Hover lift effect |
| `src/components/landing/SocialProofSection.tsx` | 3 testimonial cards with avatar placeholder, name, role, stars. Stats bar. Press logos as text/SVG. App store badges |
| `src/components/landing/PricingSection.tsx` | Monthly/Annual toggle with slide animation. 3 pricing cards (Free, Pro, Team). Savings badge on annual. Highlighted "Pro" as recommended |
| `src/components/landing/Footer.tsx` | 4-column footer grid (Brand, Product, Company, Legal) + bottom bar with copyright |

### 4. Landing Page Assembly (`src/pages/Index.tsx`)
- Import and compose all 6 sections in order
- Alternating background colors (#FFFFFF / #F9FAFB) per section

### 5. Hero Mockup Component (`src/components/landing/HeroMockup.tsx`)
- CSS/Tailwind-based product mockup showing a "Today View" with 3-4 sample tasks
- One task animates a checkmark completion with strikethrough effect on loop
- Desktop frame + smaller mobile frame side by side

## Animation Strategy
- Use framer-motion (already installed) for scroll-triggered reveals, hero text word stagger, and pricing toggle
- CSS transitions for hover effects (card lift, button scale)
- Intersection Observer via framer-motion's `whileInView`

## Estimated New Files: 7 components + updates to 3 existing files

