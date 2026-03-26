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
    transportMode: "p2p", // or "sfu"
};