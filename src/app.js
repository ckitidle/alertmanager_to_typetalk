const axios = require('axios')
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

const TYPETALK_TOPIC_URL = 'https://typetalk.com/api/v1/topics/';
const VIEWS_DIR = path.join(__dirname, 'views');
const TOPIC_ID = process.env.TOPIC_ID || '';
const TOKEN = process.env.TOKEN || '';
const DEBUG = process.env.DEBUG || false;
const TYPETALK_URL = TYPETALK_TOPIC_URL + TOPIC_ID + '?typetalkToken=' + TOKEN;

/**
 * Send to Typetalk with alertmanager notification data.
 * @param {string} data Alertmanager notification data
 * @returns {Object} Response
 * @throws Error
 */
exports.sendToTypetalk = async (data) => {
    const body = {
        message: createTypeTalkMessage(VIEWS_DIR, TOPIC_ID, data)
    };
    if (DEBUG) {
        console.log({
            url: TYPETALK_URL,
            body: body
        });
    }
    return await axios.post(TYPETALK_URL, body);
};

/**
 * Lambda handler.
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 * @param {Object} _context
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */
exports.lambdaHandler = async (event, _context) => {
    try {
        const res = await this.sendToTypetalk(event.body || '{}');
        return {
            isBase64Encoded: false,
            statusCode: 200,
            headers: {},
            body: JSON.stringify(res.data),
        }
    } catch (err) {
        console.error(err);
        return {
            isBase64Encoded: false,
            statusCode: 400,
            headers: {},
            body: err.message
        };
    }
};

/**
 * Create Typetalk message.
 * @param {string} viewsDir
 * @param {string} topicId
 * @param {string} data
 * @returns Typetalk message
 */
const createTypeTalkMessage = (viewsDir, topicId, data) => {
    const template = fs.readFileSync(templatePath(viewsDir, topicId), 'utf8');
    const json = JSON.parse(data);
    return ejs.render(template, json);
}

/**
 * Get template file path.
 * @param {string} viewsDir
 * @param {string} topicId
 * @return Template file path
 */
const templatePath = (viewsDir, topicId) => {
    let fileName = topicId + '.ejs';
    const template = path.join(viewsDir, fileName);
    if (fs.existsSync(template)) {
        return template;
    } else {
        return path.join(viewsDir, 'template.ejs');
    }
}
