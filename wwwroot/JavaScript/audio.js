import { state } from "./state.js";
import { connection } from "./signaling.js";
import * as UI from "./ui.js";

export function setupAudioAnalysis(stream) {
    state.audioContext = new AudioContext();

    const source = state.audioContext.createMediaStreamSource(stream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 256;

    state.dataArray = new Uint8Array(state.analyser.frequencyBinCount);

    source.connect(state.analyser);

    detectVolume();
}

function detectVolume() {
    if (!state.analyser) return;

    state.analyser.getByteFrequencyData(state.dataArray);

    let sum = 0;
    for (let i = 0; i < state.dataArray.length; i++) {
        sum += state.dataArray[i];
    }

    const avg = Math.floor(sum / state.dataArray.length);
    UI.setVolume(avg);

    requestAnimationFrame(detectVolume);
}

export function toggleMicrophoneMute() {
    if (!state.localStream) return;

    const track = state.localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;

    state.isMuted = !track.enabled;

    UI.setMicStatus(state.isMuted ? "Mic: Muted" : "Mic: Unmuted");

    if (state.currentTargetUser) {
        connection.invoke("SendMuteState", state.currentTargetUser, state.isMuted);
    }
}