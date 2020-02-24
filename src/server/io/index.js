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

            console.log("Connection.", socket.timestamp);

            replyWith({
                uuid: socket.uuid,
            });
        });

        socket.on('disconnect', () => {
            // Не делаем ничего
        });
    });

    const findClient = (prop, value) => {
        Object.keys(subscribers.connected).forEach((socketId) => {
            if (subscribers.connected[socketId][prop] === value) {
                return subscribers.connected[socketId];
            }
        });
    };

    const emit = (uuid, data) => {
        return new Promise((resolve, reject) => {
            const client = findClient("uuid", uuid);

            if (!client) {
                reject("¯\\_(ツ)_/¯");
            }

            client.emit("message:external", data, (response) => {
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
