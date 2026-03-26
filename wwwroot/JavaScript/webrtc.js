import { state } from "./state.js";
import { connection } from "./signaling.js";

class P2PTransport {
    constructor(targetUser) {
        this.targetUser = targetUser;
        this.pc = null;
    }

    async initialize(stream) {
        this.pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
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

class SFUTransport {
    // Placeholder for SFU transport implementation
    constructor(targetUser) {
        this.targetUser = targetUser;
    }
}

export async function startCall(username) {
    if (!state.localStream) return;

    state.currentTargetUser = username;

    if (state.transportMode === "p2p") {
        state.transport = new P2PTransport(username);
    } else if (state.transportMode === "sfu") {
        // Placeholder for SFU transport
        console.warn("SFU mode not implemented yet");
        return;
    }
    await state.transport.initialize(state.localStream);
    await state.transport.createAndSendOffer();

    state.appState = "in-call";
}

export async function acceptCall() {
    if (!state.localStream) return;

    if (state.transportMode === "p2p") {
        state.transport = new P2PTransport(state.currentTargetUser);
    } else if (state.transportMode === "sfu") {
        // Placeholder for SFU transport
        console.warn("SFU mode not implemented yet");
        return;
    }

    await state.transport.initialize(state.localStream);
    await state.transport.handleOffer(state.pendingOffer);

    state.appState = "in-call";
}

export async function endCall() {
    if (state.transport) {
        await state.transport.close();
        state.transport = null;
    }

    state.appState = "connected";
}