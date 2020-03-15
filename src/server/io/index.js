const bind = (server) => {
    const uuid = require("uuid");
    const io = require("socket.io")(server);

    const subscribers = io.of("/subscriber/");

    subscribers.on('connection', (socket) => {
        socket.on("attach", (data, replyWith) => {
            if (typeof data.uuid === "undefined") {
                socket.uuid = uuid.v4();
            } else {
                socket.uuid = data.uuid;
            }

            socket.timestamp = +(new Date());

            replyWith({
                uuid: socket.uuid,
            });
        });

        socket.on('disconnect', () => {
        });
    });

    const findClient = (prop, value) => {
        for (let socketId of Object.keys(subscribers.connected)) {
            if (subscribers.connected[socketId][prop] === value) {
                return subscribers.connected[socketId];
            }
        }
    };

    const emit = (uuid, type, data) => {
        return new Promise((resolve, reject) => {
            const client = findClient("uuid", uuid);

            if (!client) {
                reject(`Subscriber ${uuid} not found in connection registry.`);
            }

            client.emit(type, {...data, action: type}, (response) => {
                resolve(response);
            });
        });
    };

    setInterval(() => {
        const timestamp = +(new Date());

        Object.keys(subscribers.connected).forEach((socketId) => {
            const socket = subscribers.connected[socketId];

            // noinspection JSUnresolvedVariable
            if (timestamp - socket.timestamp > 2 * 3600 * 1000) {
                // noinspection JSUnresolvedFunction
                socket.disconnect(true);
            }
        });
    }, 1000);

    return {
        emit,
    };
};

module.exports = bind;
