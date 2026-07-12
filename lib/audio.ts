let Audio: any = null;
let isAudioAvailable = false;
let popSound: any = null;
let successSound: any = null;
let notificationSound: any = null;

// expo-av has been removed from dependencies to prevent native startup crashes
// (specifically NoClassDefFoundError: Failed resolution of: Lexpo/modules/kotlin/types/LazyKType; in expo-av)
// All audio functions are now safe no-ops.
try {
  Audio = null;
  isAudioAvailable = false;
} catch (error) {
  // fallback
}

async function getPopSound(): Promise<any> {
  if (!isAudioAvailable || !Audio) {
    throw new Error('Audio is not supported in this environment');
  }
  if (!popSound) {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/pop.wav')
    );
    popSound = sound;
  }
  return popSound;
}

async function getSuccessSound(): Promise<any> {
  if (!isAudioAvailable || !Audio) {
    throw new Error('Audio is not supported in this environment');
  }
  if (!successSound) {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/success.wav')
    );
    successSound = sound;
  }
  return successSound;
}

async function getNotificationSound(): Promise<any> {
  if (!isAudioAvailable || !Audio) {
    throw new Error('Audio is not supported in this environment');
  }
  if (!notificationSound) {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/notification.wav')
    );
    notificationSound = sound;
  }
  return notificationSound;
}

/**
 * Play the snappy, satisfying synthesized pop sound on item add
 */
export async function playCartPop() {
  if (!isAudioAvailable) {
    console.log('[Audio] Play Cart Pop (skipped - audio unavailable)');
    return;
  }
  try {
    const sound = await getPopSound();
    await sound.replayAsync();
  } catch (error) {
    console.warn('Audio playback error (playCartPop):', error);
  }
}

/**
 * Play the sweet major-fifth success chime on order confirmation
 */
export async function playSuccessChime() {
  if (!isAudioAvailable) {
    console.log('[Audio] Play Success Chime (skipped - audio unavailable)');
    return;
  }
  try {
    const sound = await getSuccessSound();
    await sound.replayAsync();
  } catch (error) {
    console.warn('Audio playback error (playSuccessChime):', error);
  }
}

/**
 * Play the friendly notification chime for alerts
 */
export async function playNotificationChime() {
  if (!isAudioAvailable) {
    console.log('[Audio] Play Notification Chime (skipped - audio unavailable)');
    return;
  }
  try {
    const sound = await getNotificationSound();
    await sound.replayAsync();
  } catch (error) {
    console.warn('Audio playback error (playNotificationChime):', error);
  }
}

let alertSound: any = null;

/**
 * Play a looped notification alert sound when a new order is received
 */
export async function playOrderAlert() {
  if (!isAudioAvailable || !Audio) {
    console.log('[Audio] Play Order Alert (skipped - audio unavailable)');
    return;
  }
  try {
    if (!alertSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/notification.wav'),
        { shouldLoop: true }
      );
      alertSound = sound;
    }
    await alertSound.setIsLoopingAsync(true);
    await alertSound.playAsync();
  } catch (error) {
    console.warn('Audio playback error (playOrderAlert):', error);
  }
}

/**
 * Stop the looped order alert sound
 */
export async function stopOrderAlert() {
  if (!isAudioAvailable || !alertSound) return;
  try {
    await alertSound.stopAsync();
  } catch (error) {
    console.warn('Audio playback error (stopOrderAlert):', error);
  }
}
