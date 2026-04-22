// Haptics stub — navigator.vibrate where supported.
// Audio assets TBD by user; these are lightweight hooks only.

export const haptic = (pattern = 15) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    /* noop */
  }
};

export const hapticSelect = () => haptic(15);
export const hapticHit = () => haptic([20, 30, 20]);
export const hapticMiss = () => haptic(40);
