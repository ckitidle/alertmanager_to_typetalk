const axios = require('axios')
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

// Variables
const TYPETALK_TOPIC_URL = 'https://typetalk.com/api/v1/topics/';
const DEBUG = process.env.DEBUG || false;

/**
 * Send to Typetalk with alertmanager notification data.
 * @param {string} viewsDir Views directory path
 * @param {string} topicId Topic ID
 * @param {string} token Typetalk access token
 * @param {Object} data Alertmanager notification data
 * @returns {Object} Response
 * @throws Error
 */
exports.sendToTypetalk = async (viewsDir, topicId, token, data) => {
    const url = TYPETALK_TOPIC_URL + topicId + '?typetalkToken=' + token;
    const body = {
        message: createTypetalkMessage(viewsDir, topicId, data)
    };
    if (DEBUG) {
        console.log({
            url: url,
            body: body
        });
    }
    return await axios.post(url, body);
};

/**
 * Lambda handler.
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 * @param {Object} _context
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */
exports.lambdaHandler = async (event, _context) => {
    try {
        const topicId = event.pathParameters.topicId || '';
        const token = event.queryStringParameters.typetalkToken || '';
        if (!topicId || !token || !event.body || Object.keys(event.body).length === 0) {
            return {
                isBase64Encoded: false,
                statusCode: 400,
                headers: {},
                body: 'Invalid request'
            };
        }

        const viewsDir = path.join(__dirname, 'views');
        const data = JSON.parse(event.body || '{}');
        const response = await this.sendToTypetalk(viewsDir, topicId, token, data);
        return {
            isBase64Encoded: false,
            statusCode: 200,
            headers: {},
            body: JSON.stringify(response.data),
        }
    } catch (err) {
        console.error(err.message);
        return {
            isBase64Encoded: false,
            statusCode: 500,
            headers: {},
            body: err.message
        };
    }
};

/**
 * Create Typetalk message.
 * @param {string} viewsDir
 * @param {string} topicId
 * @param {Object} data
 * @returns Typetalk message
 */
const createTypetalkMessage = (viewsDir, topicId, data) => {
    const template = fs.readFileSync(templatePath(viewsDir, topicId), 'utf8');
    return ejs.render(template, data);
}

/**
 * Get template file path.
 * @param {string} viewsDir
 * @param {string} topicId
 * @return Template file path
 */
const templatePath = (viewsDir, topicId) => {
    const fileName = topicId + '.ejs';
    const template = path.join(viewsDir, fileName);
    if (fs.existsSync(template)) {
        return template;
    } else {
        return path.join(viewsDir, 'template.ejs');
    }
}
