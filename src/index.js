'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { sendToTypetalk } = require('./app');

// Server settings

var app = express();
app.use(morgan('combined'));
app.use(express.json({ type: '*/*' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message });
});

// Router settings

app.options("*", (_req, res) => {
  res.status(200).send('OK');
});

app.post("/api/v1/topics/:topicId", (req, res, next) => {
    (async () => {
        try {
            const topicId = req.params.topicId || '';
            const token = req.query.typetalkToken || '';
            if (!topicId || !token || !req.body || Object.keys(req.body).length === 0) {
                res.status(400).json({ message: 'Invalid request' });
                return;
            }

            const viewsDir = path.join(__dirname, 'views');
            const data = req.body || {};
            const response = await sendToTypetalk(viewsDir, topicId, token, data);
            res.status(200).json({ message: response.data })
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ message: err.message })
        }    
    })().catch(next);
});

// Start server.

const server = app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + server.address().port)
});