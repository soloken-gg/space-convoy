// Sound stubs — user will provide audio assets later.
// Each function is a safe no-op; swap body with new Audio(url).play() when assets arrive.

const stub = () => {
  /* silent stub */
};

export const playLock = stub; // selection click
export const playUnlock = stub; // deselection
export const playCorrect = stub; // correct feedback chime
export const playError = stub; // neutral error tone
export const playCue = stub; // cue start tone
export const playEngineHum = stub; // motion-phase hum (loop)
export const stopEngineHum = stub; // stop hum
export const playStreak = stub; // streak celebration
