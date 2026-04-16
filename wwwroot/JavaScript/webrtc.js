import { state } from "./state.js";
import { connection } from "./signaling.js";
import * as Audio from "./audio.js";
import * as UI from "./ui.js";

class RTCTransport {
    constructor(targetUser) {
        this.targetUser = targetUser;
        this.pc = null;
    }

    async initialize(stream) {
        this.pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" },
                { urls: "turn:turn.diffie.net:3478", username: "diffie", credential: "d9F3kPq8zLxW2aV6mT1sR0yH7uJ4bN5cQ8eXkZp3YwU=" }
            ]
        });

        stream.getTracks().forEach(track => {
            this.pc.addTrack(track, stream);
        });

        this.pc.onicecandidate = (e) => {
            if (e.candidate) {
                connection.invoke("SendIceCandidateToUser", this.targetUser, e.candidate);
            }
        };

        this.pc.ontrack = (e) => {
            const audio = document.getElementById("remoteAudio");
            audio.srcObject = e.streams[0];
            audio.play().catch(() => {});
        };
    }

    async createAndSendOffer() {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        await connection.invoke("SendOfferToUser", this.targetUser,
             {offer: offer, mode: state.transportMode}
            );
    }

    async handleOffer(offer) {
        await this.pc.setRemoteDescription(offer);

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        await connection.invoke("SendAnswerToUser", this.targetUser, answer);
    }

    async handleAnswer(answer) {
        await this.pc.setRemoteDescription(answer);
    }

    async handleIceCandidate(candidate) {
        await this.pc.addIceCandidate(candidate);
    }

    async close() {
        this.pc?.close();
    }
}

export async function startCall(username) {

    if (!state.localStream) await Audio.startAudioStream();

    state.currentTargetUser = username;

    state.transport = new RTCTransport(username);
    await state.transport.initialize(state.localStream);
    await state.transport.createAndSendOffer();

    connection.invoke("SendMuteState", state.currentTargetUser, state.isMuted);

    state.appState = "in-call";
}

export async function acceptCall() {
    if (!state.localStream) await Audio.startAudioStream();

    if (state.transportMode === "p2p") {
        connection.invoke("SendMuteState", state.currentTargetUser, state.isMuted);
        state.transport = new RTCTransport(state.currentTargetUser);
    } else if (state.transportMode === "sfu") {
        console.warn("SFU mode not implemented yet");
        return;
    }

    const offer = state.pendingOffer;
    state.pendingOffer = null;

    await state.transport.initialize(state.localStream);
    await state.transport.handleOffer(offer);

    for (const candidate of state.pendingIceCandidates) {
        await state.transport.handleIceCandidate(candidate);
    }
    state.pendingIceCandidates = [];

    state.appState = "in-call";
}

export async function rejectCall(){
    const target = state.currentTargetUser;
    state.pendingOffer = null;
    state.pendingIceCandidates = [];
    state.currentTargetUser = null;
    UI.hideIncomingCall();
    if (target) connection.invoke("RejectCallToUser", target);
}

export async function endCall() {
    if (state.transport) {
        await connection.invoke("NotifyCallEnded", state.currentTargetUser);
        await state.transport.close();
        state.transport = null;
    }

    await Audio.stopAudioStream();
    state.currentTargetUser = null;
    state.appState = "connected";
}