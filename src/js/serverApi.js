class Api {
    constructor() {
        this.retry = false;
    }

    connect() {
        if (this.retry) {
            this.retry = false;
            return;
        }

        this.retry = true;
        this.ws = new WebSocket("ws://localhost:8081");
        this.ws.onerror = (e) => {
            if (this.ws.readyState !== WebSocket.OPEN) {
                console.log("Unable to connect to the server. Retrying...");
                this.retry = true;
                setTimeout(() => this.connect(), 300);
            }
            else
                console.log("Unknown error");
        };

        this.ws.onopen = () => {
            console.log("Successfully connected to the server");
        };

        this.ws.onclose = (e) => {
            console.log("Lost connection with server. Reconnecting...");
            this.connect();
        };

        this.ws.onmessage = (e) => {
            console.log('got message: ', e.data);
        };
        this.retry = false;
    }
 
    send(data) {
        if (this.ws.readyState !== WebSocket.OPEN) {
            console.log("Server ready state is not open");
            this.connect();
        }
        else
            this.ws.send(data);
    }
};

export const server = new Api();
