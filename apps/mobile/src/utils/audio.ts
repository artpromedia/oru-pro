import { Audio } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

const SUCCESS_TONE = "https://assets.mixkit.co/sfx/download/mixkit-achievement-bell-600.wav";
const ERROR_TONE = "https://assets.mixkit.co/sfx/download/mixkit-failure-electric-alert-240.wav";

async function playTone(uri: string) {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => null);
      }
    });
  } catch (error) {
    console.warn("Audio playback error", error);
  }
}

export const playSuccessTone = () => playTone(SUCCESS_TONE);
export const playErrorTone = () => playTone(ERROR_TONE);
