export const state = {
    localStream: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    animationFrameId: null,
    transport: null,
    isMuted: false,
    appState: "disconnected",
    currentTargetUser: null,
    pendingOffer: null,
    selectedFriend: null,
    transportMode: document.querySelector('input[name="transportMode"]:checked')?.value, // "p2p" or "sfu"
};