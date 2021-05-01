class Api {
    constructor() {
        this.handlers = new Map();
        this.retry = false;
        this.retryCount = 3;
        this.curCount = 0;
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    trigger(type, data) {
        if (!this.handlers.has(type))
            return;
        this.handlers.get(type).forEach(func => {
            func(data)
        });
    }

    on(type, func) {
        if (this.handlers.has(type))
            this.handlers.get(type).push(func);
        else
            this.handlers.set(type, [ func ]);
    }

    connect() {
        if (this.curCount >= this.retryCount) {
            this.trigger('error', 'Превышено количество попыток подключения');
            return;
        }
        this.curCount++;

        this.ws = new WebSocket("ws://localhost:8081");

        this.ws.onerror = (e) => {
            if (this.ws.readyState !== WebSocket.OPEN) {
                this.trigger('error', 'Невозможно установить соединение с сервером');
                console.log('WebSocket is not open yet');
            }
            else {
                this.trigger('error', 'Неизвестаня ошибка АПИ');
                console.log("Unknown error");
            }
        };

        this.ws.onopen = () => {
            console.log("Successfully connected to the server");
            this.trigger('connection');
        };

        this.ws.onclose = async (e) => {
            this.trigger('error', 'Потеряно соединение с сервером, переподключение...');
            console.log("Lost connection with server. Reconnecting...");
            await this.sleep(5000);
            this.connect();
        };

        this.ws.onmessage = (e) => {
            this.trigger('message', e.data);
        }
    }

    async send(data) {
        if (this.ws.readyState !== WebSocket.OPEN) {
            this.trigger('error', 'Нет подключения к серверу, переподключение...');
            console.log("Server ready state is not open");
            this.curCount = 0;
            await this.sleep(2000);
            this.connect();
        }
        else
            this.ws.send(data);
    }
};

export const server = new Api();
