const core = require('@actions/core');
const axios = require('axios');

async function run() {
    try {
        const slackWebhookURL = core.getInput('slack-webhook-url');
        const releaseBody = process.env.GITHUB_EVENT_PATH;

        // Extract mentioned users from changelog
        let changes = await parseMarkdownChangelog(releaseBody);

        // Set output for changes
        core.setOutput('changes', changes);

        // Generate Hex Color
        const colorHex = generateHexColor();
        core.setOutput('color_hex', colorHex);

        // Slack Notification
        await sendSlackNotification(slackWebhookURL, changes, colorHex);
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function parseMarkdownChangelog(releaseBody) {
    // Use axios to make an HTTP request to pandoc
    const response = await axios.post('http://pandoc:8080', { markdown: releaseBody }, { responseType: 'text' });
    return response.data;
}

function generateHexColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

async function sendSlackNotification(slackWebhookURL, changes, colorHex) {
    // Implement Slack notification logic here
    const slackMessage = {
        text: 'A release is published.',
        attachments: [
            {
                fallback: ':alert: *New Release Alert!* :alert:',
                color: `#${colorHex}`,
                pretext: ':alert: *New Release Alert!* :alert:',
                fields: [
                    {
                        title: 'Release Information',
                        value: '*Version:* `' + process.env.GITHUB_REF.split('/').pop() + '` :label:\n*Repository:* `' + process.env.GITHUB_REPOSITORY + '`\n*Author:* ' + process.env.GITHUB_ACTOR,
                        short: false
                    },
                    {
                        title: 'Changes',
                        value: changes,
                        short: false
                    },
                    {
                        title: 'Release Details',
                        value: ':eyes: *View on GitHub:* <' + process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY + '/releases/tag/' + process.env.GITHUB_REF.split('/').pop() + '>',
                        short: false
                    }
                ]
            }
        ]
    };

    await axios.post(slackWebhookURL, slackMessage);
}

run();
