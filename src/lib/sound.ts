export const playSound = (path: string) => {
  try {
    const audio = new Audio(path);
    audio.volume = 0.5;
    audio.play().catch(e => {
        // Handle auto-play policies or missing files silently
        console.warn('Audio play prevented or file missing:', path);
    });
  } catch (err) {
    console.error('Audio playback error', err);
  }
};
