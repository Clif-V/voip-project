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

export async function startAudioStream(){
    if (state.localStream != null)
    {
        console.log("Audio stream already active");
        return;
    }

    try {
        state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        UI.setMicStatus("Mic: Access granted");
        setupAudioAnalysis(state.localStream);
    } catch (err) {
        UI.setMicStatus("Mic: Access denied");
        console.error(err);
    }
}

export async function stopAudioStream() {
    if (state.localStream) {
        state.localStream.getTracks().forEach(t => t.stop());
        state.localStream = null;
        UI.setMicStatus("Mic: Stopped");
    }
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
        console.log("Sending mute state:", state.isMuted);
        connection.invoke("SendMuteState", state.currentTargetUser, state.isMuted);
    }
}