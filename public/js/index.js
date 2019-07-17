const socket = io.connect('/');

const configuration =
        {"iceServers":[{"url": "stun:stun.l.google.com:19302"},
        { "url": "stun:stun.services.mozilla.com" } ]};
const constraints = {audio: true, video: true};
let rtcPconn = null;

const video1 = document.getElementById('video1');
const video2 = document.getElementById('video2');
let isInitiator = false;

let dataChannel = null;
const peerConnection = new RTCPeerConnection(configuration);

socket.on('connect', () => {
    console.log("Socket id: ", socket.id);
    socket.on('message', (message) => {
        console.log(message);
    });

    socket.emit('join', (cb) => {
        start();
        console.log("cb: ", cb);

        isInitiator = cb === 2;
        console.log("isInitiator: ", isInitiator)
        if(isInitiator) {
            sendInitiatorCandidates(socket);
            initiateSignaling(socket, peerConnection);
            
        } else {
            prepareToReceiveOffer(socket, peerConnection);
        }
    });

    
});

peerConnection.onicecandidate = (event) => {
    console.log("onicecandidate (event): ", event.candidate)
    if(event.candidate) {
        socket.emit('send ice candidate', event.candidate);
    }
};



function sendInitiatorCandidates(socket) {    
    console.log("Initiator id: " + socket.id);
    

    // peerConnection.onnegotiationneeded = async () => {
    //     try {
    //         await peerConnection.setLocalDescription(await peerConnection.createOffer());
    //         socket.emit('send offer', peerConnection.localDescription);
    //     } catch (err) {
    //         console.log("Error: ", err);
    //     }
    // }

    

    

    
};

function initiateSignaling(socket, peerConnection) {   
    console.log("initiate signaling: ", socket.id);
    peerConnection.onnegotiationneeded = async () => {
        console.log("In the on negotiationneeded");
        peerConnection.createOffer((offer) => {
            peerConnection.setLocalDescription(offer);
            console.log("Offer created");
            socket.emit('send offer', offer);
        }, (err) => {
            if(err) console.log("Error occurred: " + err);
        });
    };
    
}

function prepareToReceiveOffer(socket, peerConnection) {
    
    // peerConnection.ondatachannel = (e) => {
    //     dataChannel = e.channel;

    //     dataChannel.onmessage = (message) => {
    //         const data = JSON.parse(message.data);
    //         handleIncomingMessage(data.message);
    //     };
    // };
    

   
}

// function initiateDataChannel(peerConnection) {
//     dataChannel = peerConnection.createDataChannel(
//         'messageChannel',
//         { reliable: false }
//     );

//     dataChannel.onopen = () => {
//         dataChannel.onmessage = (message) => {
//             const data = JSON.parse(message.data);
//             handleIncomingMessage(data.message);
//         }
//     }
// }

async function start() {
    console.log("start() called");
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        video1.srcObject = stream;

    } catch(err) {
        console.log("Error: ", err);
    }
   

    peerConnection.ontrack = (event) => {
        console.log("on track...");
        if(video2.srcObject) return;
        video2.srcObject = event.streams[0];
    }
}

socket.onmessage = async({desc, candidate}) => {
    console.log("IN the on message")
}

socket.on('receive offer', (offer) => {
    console.log("offer received");
    peerConnection.setRemoteDescription(offer);
    peerConnection.createAnswer()
      .then((answer) => {
        peerConnection.setLocalDescription(answer);
        socket.emit('send answer', answer);        
      });   
    
}, (err) => {
    if(err) console.log("Error occurred: " + err); 
});

socket.on('receive answer', (answer) => {
    console.log("answer received");
    peerConnection.setRemoteDescription(answer);
});

socket.on('receive ice candidate', (candidate) => {
    // console.log("Receive send initiator candidates");
    // console.log("receiver socket id: ", socket.id);
    peerConnection.addIceCandidate(candidate, 
        () => {
            peerConnection.onicecandidate = (event) => {
                console.log("sending other ice candidate...");
                socket.emit('send other ice candidate', event.candidate);
            }
        }, (err) => {
            console.log("error: ", err);
        }
    );        
});  

socket.on('receive other ice candidate', (candidate) => {
    console.log("Received other ice candidates");
    peerConnection.addIceCandidate(candidate);        
}); 
