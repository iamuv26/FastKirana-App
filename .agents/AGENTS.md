# React Native UI Guidelines

These rules must be followed for all React Native UI and layout changes in this workspace to prevent Android rendering crashes and unstyled custom components:

## Rule 1: No NativeWind `className` on Custom Components
- Never use NativeWind's `className` prop on custom React components (such as `<ScalePressable>`).
- NativeWind does not automatically parse styles for custom components.
- Always use standard inline `style` objects with React Native style properties for custom components.

## Rule 2: No Style Callbacks on Reanimated / Animated Components
- Do not pass dynamic function-style styles like `style={({ pressed }) => ...}` to Reanimated components on Android.
- Reanimated's layout thread ignores function styles, resulting in unstyled or collapsed components.
- Resolve state changes locally in standard components first, or wrap them in standard layout containers.

## Rule 3: Enforce Static Layout Wrappers
- Always wrap interactive elements (like `Pressable` or `ScalePressable`) in a static layout container (`<View style={{ width: '48%', height: 105 }}>`) when styling heights, margins, and flex dimensions inside row containers (`flexDirection: 'row'`).
- This prevents Android from collapsing pressable cards to 0x0 size.

## Rule 4: Always Flatten Custom Styles
- When building custom components that wrap native or animated components, always apply `StyleSheet.flatten()` to the resolved styles before passing them to an animated layout wrapper.
- This ensures all layout properties like height, width, border radius, and padding are flat and readable by the native rendering engine.
