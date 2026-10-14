/**
 * 《多多壽司屋》朗讀入口。實作在共用模組，行為與搬出去之前相同。
 */
export {
  SPEECH_LANG,
  SPEECH_RATE,
  SPEECH_PITCH,
  LEGACY_VOICE_MUTE_STORAGE_KEY,
  cancelSpeech,
  clearLegacyVoiceSetting,
  isSpeaking,
  speakText,
} from "@/lib/games/shared/speech";
export type { SpeakOptions } from "@/lib/games/shared/speech";
