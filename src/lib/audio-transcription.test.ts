import { describe, expect, it } from "vitest";
import {
  MAX_AUDIO_FILE_BYTES,
  MAX_AUDIO_RECORDING_SECONDS,
  audioExtensionForMime,
  formatAudioDuration,
  normalizeAudioMimeType,
  validateAudioMetadata,
} from "./audio-transcription";

describe("public survey audio transcription helpers", () => {
  it("limits recordings to a short, bounded duration and size", () => {
    expect(MAX_AUDIO_RECORDING_SECONDS).toBe(60);
    expect(MAX_AUDIO_FILE_BYTES).toBe(8 * 1024 * 1024);
  });

  it("normalizes browser codecs and maps supported formats", () => {
    expect(normalizeAudioMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(audioExtensionForMime("audio/webm;codecs=opus")).toBe("webm");
    expect(audioExtensionForMime("audio/mp4")).toBe("mp4");
    expect(audioExtensionForMime("audio/ogg")).toBe("ogg");
    expect(audioExtensionForMime("audio/unknown")).toBeNull();
  });

  it("validates the file before network upload", () => {
    expect(validateAudioMetadata({ size: 0, type: "audio/webm" })).toContain("vazia");
    expect(validateAudioMetadata({ size: MAX_AUDIO_FILE_BYTES + 1, type: "audio/webm" })).toContain("8 MB");
    expect(validateAudioMetadata({ size: 1000, type: "audio/unknown" })).toContain("não é compatível");
    expect(validateAudioMetadata({ size: 1000, type: "audio/webm;codecs=opus" })).toBeNull();
  });

  it("formats recording duration as mm:ss", () => {
    expect(formatAudioDuration(0)).toBe("00:00");
    expect(formatAudioDuration(7)).toBe("00:07");
    expect(formatAudioDuration(60)).toBe("01:00");
    expect(formatAudioDuration(72)).toBe("01:12");
  });
});
