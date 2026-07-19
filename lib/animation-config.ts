export const SPRING = {
  press: { damping: 14, stiffness: 200 },     // Snappy, organic button press feedback
  bounce: { damping: 8, stiffness: 300 },     // Highly bouncy elements (badges, active tabs)
  gentle: { damping: 18, stiffness: 120 },    // Smooth, slower transitions
  snappy: { damping: 12, stiffness: 250 },    // Quick morphing/state-changes (e.g., ADD stepper buttons)
};

export const SCALE = {
  press: 0.96,        // Standard button scale
  cardPress: 0.97,    // Large cards, catalog banners scale
  addButton: 0.90,    // Compact Add CTA buttons
  tabIcon: 0.85,      // Tab bar active state scale
};
