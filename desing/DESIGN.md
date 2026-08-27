---
name: Calle Larga Public Safety System
colors:
  surface: '#faf9f9'
  surface-dim: '#dadada'
  surface-bright: '#faf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#41484a'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f0f1'
  outline: '#72787a'
  outline-variant: '#c1c7ca'
  surface-tint: '#46636b'
  primary: '#000e13'
  on-primary: '#ffffff'
  primary-container: '#06262d'
  on-primary-container: '#718e97'
  inverse-primary: '#adccd5'
  secondary: '#b40067'
  on-secondary: '#ffffff'
  secondary-container: '#de1482'
  on-secondary-container: '#fffbff'
  tertiary: '#070f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#172700'
  on-tertiary-container: '#679800'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e8f1'
  primary-fixed-dim: '#adccd5'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#2f4b53'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#ffb0cb'
  on-secondary-fixed: '#3e0020'
  on-secondary-fixed-variant: '#8d0050'
  tertiary-fixed: '#b5f64a'
  tertiary-fixed-dim: '#9ad92e'
  on-tertiary-fixed: '#121f00'
  on-tertiary-fixed-variant: '#334f00'
  background: '#faf9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e3e2e2'
typography:
  headline-xl:
    fontFamily: Public Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  grid-margin: 24px
  grid-gutter: 16px
---

## Brand & Style

The visual identity of the design system is anchored in **Professionalism, Trust, and Operational Clarity**. Designed for the Public Safety Department of Calle Larga, the system balances the solemnity of a government institution with the modern efficiency of a tech-forward public service.

The design style is **Corporate Modern with a Focus on Utility**. It employs a structured, high-contrast interface to ensure legibility for field officers on tablets under varying light conditions, while maintaining a sophisticated aesthetic for administrative dashboards. The emotional response is one of reliability and rapid response—communicating that public safety is both disciplined and accessible.

## Colors

The palette is engineered for hierarchy and immediate status recognition:
- **Primary (Deep Navy):** Used for core navigation, headers, and authoritative text. It provides the "Institutional" weight.
- **Secondary (Vibrant Pink):** Reserved for critical actions, alerts, and "Pendiente" (Pending) status indicators to ensure high visibility against the dark primary.
- **Accent 1 (Lime Green):** Denotes "Realizado" (Completed) and positive reinforcement. It is highly visible in outdoor environments.
- **Accent 2 (Teal):** Used for "En Proceso" (In Progress) and secondary information nodes, offering a calm contrast to the more urgent pink.

Neutral tones should lean toward cool greys to maintain the professional atmosphere without appearing stark.

## Typography

The typography uses **Public Sans**, an institutional typeface designed for legibility and accessibility. 
- **Headlines:** Use heavy weights (700) for section titles to establish a clear hierarchy.
- **Body:** Standardized at 16px for desktop and 18px for mobile/tablet to ensure officers can read incident reports quickly.
- **Labels:** Uppercase bold labels are used for status indicators and form headers to differentiate from user input.
- **Operational Data:** Numbers and timestamps should always use `label-bold` for maximum clarity.

## Layout & Spacing

This design system utilizes a **Fluid Grid** with fixed constraints for readability.
- **Desktop Dashboards:** 12-column grid with a maximum content width of 1440px.
- **Field Tablets:** 8-column grid with increased tap targets and generous 24px margins to prevent accidental touches near screen edges.
- **Spacing Rhythm:** Based on an 8px linear scale. Internal card padding should be `lg` (24px) for data-heavy views to prevent visual clutter.

## Elevation & Depth

To maintain a "serious" public service aesthetic while remaining modern, the system uses **Tonal Layering** and **Subtle Ambient Shadows**:
- **Background:** The base surface is a very light grey or white.
- **Containers:** Cards and modules use a white surface with a thin 1px border in a soft neutral tone (`#E2E8F0`).
- **Active State:** On-hover or active elements use a diffused, low-opacity shadow (10% opacity of the Primary color) to suggest interactability without appearing "game-like."
- **High Importance:** Critical alerts or modals use a slightly higher elevation with a 15% opacity primary-tinted shadow to draw immediate focus.

## Shapes

The shape language is **Rounded (0.5rem)**. This provides a modern, approachable feel while maintaining the structural integrity expected of a government body. 
- **Buttons and Inputs:** Use a 0.5rem (8px) radius.
- **Status Chips:** Use a full pill-shape (rounded-xl) to distinguish them from actionable buttons.
- **Data Containers:** Large dashboards use the 0.5rem radius to soften the high volume of information.

## Components

### Buttons
- **Primary:** Deep Navy background with White text. Used for "Submit," "Save," or "Call for Backup."
- **Secondary:** Transparent background with Deep Navy 2px border. Used for "Cancel" or "View Details."
- **Urgent:** Vibrant Pink background with White text. Reserved for emergency overrides or "Pendiente" actions.

### Status Indicators (Chips)
- **Realizado:** Lime Green background with Primary text (for contrast) or White text.
- **En Proceso:** Teal background with White text.
- **Pendiente:** Vibrant Pink background with White text.
*All chips should be pill-shaped and include a small icon (Checkmark, Clock, or Alert) for accessibility.*

### Input Fields
Inputs must have a minimum height of 48px to accommodate gloved or rapid touch input on tablets. They use a 1px neutral border that thickens and changes to the Teal (Accent 2) on focus.

### Cards
Cards are the primary vessel for incident reports. They should feature a "Header Strip" using the color of the current status (e.g., a 4px green top border if the status is "Realizado").

### Additional Components
- **Data Tables:** High-contrast rows with alternating subtle grey fills for easy scanning.
- **Procedure Map:** A specialized component using the Primary Navy for UI controls and Accent colors for location pins.