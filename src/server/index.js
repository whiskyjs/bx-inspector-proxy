const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const server = require("http").createServer(app);

const {emit} = require("./io")(server);

app.get('*', (_, res) => res.send("( ͡° ͜ʖ ͡°)"));

app.post('/remote/event/', (req, res) => {
    try {
        const {meta, payload} = req.body;

        meta.subscribers.forEach(async (uuid) => {
            try {
                await emit(uuid, "remote:event", payload);
            } catch (err) {
                console.error(err);
            }
        });

        res.send("OK");
    } catch (err) {
        res.send("ERR");
    }
});

module.exports = server;
