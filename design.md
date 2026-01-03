# PEKDIGITALS Website Design Style Guide

## Design Philosophy

### Visual Language
**Modern Professional Minimalism**: Clean, sophisticated design that conveys trust, expertise, and innovation. The aesthetic draws inspiration from leading digital agencies like Pentagram and IDEO, emphasizing clarity, precision, and strategic thinking.

### Color Palette
**Primary Colors:**
- **Deep Navy (#1a2332)**: Primary brand color - conveys trust, stability, and professionalism
- **Warm White (#fafafa)**: Clean background and text areas
- **Charcoal Gray (#2d3748)**: Secondary text and subtle accents

**Accent Colors:**
- **Electric Blue (#3b82f6)**: Call-to-action buttons, links, and interactive elements
- **Soft Gold (#f59e0b)**: Highlights, success states, and premium service indicators
- **Sage Green (#10b981)**: Success messages, positive indicators

**Neutral Grays:**
- **Light Gray (#f7fafc)**: Section backgrounds
- **Medium Gray (#e2e8f0)**: Borders and dividers
- **Dark Gray (#4a5568)**: Body text

### Typography
**Primary Font**: Inter (Sans-serif)
- **Headings**: Inter Bold (700) - Clean, modern, highly readable
- **Subheadings**: Inter Semibold (600) - Professional hierarchy
- **Body Text**: Inter Regular (400) - Excellent readability across devices
- **Captions**: Inter Medium (500) - Subtle emphasis

**Font Hierarchy:**
- **H1**: 3.5rem (56px) - Hero headlines
- **H2**: 2.5rem (40px) - Section headers
- **H3**: 1.875rem (30px) - Subsection headers
- **H4**: 1.25rem (20px) - Card titles
- **Body**: 1rem (16px) - Standard text
- **Small**: 0.875rem (14px) - Captions and metadata

## Visual Effects & Animation

### Used Libraries
- **Anime.js**: Smooth micro-interactions and element animations
- **Typed.js**: Dynamic typewriter effect for hero headlines
- **Splitting.js**: Text reveal animations and stagger effects
- **ECharts.js**: Data visualization for pricing comparisons and analytics
- **Splide.js**: Testimonial carousels and image galleries
- **p5.js**: Subtle background particle effects
- **Pixi.js**: Advanced visual effects for hero sections

### Animation Strategy
**Micro-interactions**: Subtle hover effects, button states, form field focus
**Page Transitions**: Smooth fade-ins and slide-ups for content sections
**Loading States**: Professional skeleton screens and progress indicators
**Scroll Animations**: Parallax effects and reveal animations (limited to 20% viewport)

### Header Effects
**Hero Background**: Subtle particle system using p5.js with navy and gold accents
**Text Effects**: Typewriter animation for main headline using Typed.js
**Image Treatment**: Ken Burns effect on hero images with subtle zoom and pan

### Interactive Elements
**Buttons**: 3D lift effect on hover with shadow expansion
**Cards**: Subtle scale transform (1.02x) with shadow depth increase
**Forms**: Smooth focus states with blue accent borders
**Navigation**: Underline animation with smooth transitions

## Layout & Structure

### Grid System
**Desktop**: 12-column grid with 24px gutters
**Tablet**: 8-column grid with 20px gutters  
**Mobile**: 4-column grid with 16px gutters

### Spacing System
**Base Unit**: 8px
**Common Spacings**: 16px, 24px, 32px, 48px, 64px, 96px, 128px
**Section Padding**: 96px vertical, 24px horizontal
**Container Max-width**: 1200px

### Component Design

#### Navigation Bar
- **Height**: 80px
- **Background**: Semi-transparent navy with backdrop blur
- **Logo**: PEKDIGITALS in Inter Bold
- **Menu Items**: Inter Medium, smooth underline hover effect
- **CTA Button**: Electric blue background with white text

#### Hero Section
- **Height**: 100vh minimum
- **Background**: Navy with subtle particle animation
- **Content**: Left-aligned with typewriter headline
- **CTA Buttons**: Primary (blue) and Secondary (outline)
- **Image**: Right side with masked overlay

#### Service Cards
- **Layout**: 3-column grid on desktop, single column mobile
- **Style**: White background with subtle shadow
- **Hover**: Lift effect with increased shadow depth
- **Icon**: Custom SVG in brand colors

#### Pricing Tables
- **Structure**: Tiered comparison with feature lists
- **Highlight**: Recommended plan with gold accent border
- **CTA**: Prominent blue buttons with hover states
- **Background**: Alternating light gray sections

#### Forms
- **Style**: Clean, minimal with floating labels
- **Focus**: Blue border with subtle glow
- **Validation**: Real-time with green/red indicators
- **Buttons**: Full-width on mobile, auto-width desktop

### Responsive Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1200px
- **Large Desktop**: 1200px+

## Content Strategy

### Imagery Style
**Professional Photography**: High-quality business imagery with consistent lighting
**Illustrations**: Custom SVG icons and graphics in brand colors
**Hero Images**: Abstract digital/tech themes with professional aesthetic
**Service Icons**: Minimalist line art style in navy and gold

### Content Tone
**Professional yet Approachable**: Expert knowledge delivered in accessible language
**Results-Focused**: Emphasis on ROI, growth, and business outcomes
**Trust-Building**: Client testimonials, case studies, and guarantees

### Visual Hierarchy
**Information Architecture**: Clear path from awareness to conversion
**Call-to-Action Strategy**: Multiple touchpoints with consistent messaging
**Trust Signals**: Testimonials, certifications, client logos, guarantees

## Technical Implementation

### Performance Optimization
**Image Optimization**: WebP format with fallbacks
**CSS Optimization**: Critical CSS inlined, non-critical deferred
**JavaScript**: Lazy loading for non-essential scripts
**Animation Performance**: GPU-accelerated transforms only

### Accessibility
**Color Contrast**: Minimum 4.5:1 ratio for all text
**Focus States**: Clear keyboard navigation indicators
**Screen Reader**: Semantic HTML with proper ARIA labels
**Motion**: Respects prefers-reduced-motion settings

### Browser Support
**Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
**Progressive Enhancement**: Core functionality works without JavaScript
**Fallbacks**: Graceful degradation for older browsers

This design system creates a cohesive, professional digital agency website that builds trust, showcases expertise, and drives conversions through strategic use of modern web design principles and subtle, purposeful animations.