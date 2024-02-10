const core = require('@actions/core');
const { readFileSync } = require('fs');
const axios = require('axios');

async function run() {
    try {
        const slackWebhookURL = core.getInput('slack-webhook-url');
        const releaseNotes = getReleaseNotesFromEvent();
        console.log('Release Notes:', releaseNotes);

        if (!releaseNotes) {
            throw new Error('Release notes not found');
        }

        const { slackMessage, colorHex } = processReleaseNotes(releaseNotes);
        console.log('Slack Message:', slackMessage);
        console.log('ColorHex:', colorHex);

        core.setOutput('color_hex', colorHex);

        await sendSlackNotification(slackWebhookURL, slackMessage, colorHex);
    } catch (error) {
        core.setFailed(error.message);
    }
}

function getReleaseNotesFromEvent() {
    const eventPayloadPath = process.env.GITHUB_EVENT_PATH;
    const payload = JSON.parse(readFileSync(eventPayloadPath, 'utf8'));
    return payload.release.body;
}

function processReleaseNotes(releaseNotes) {
    const colorHex = generateHexColor();
    const slackMessage = formatReleaseNotesForSlack(releaseNotes);
    return { slackMessage, colorHex };
}

function generateHexColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

async function sendSlackNotification(slackWebhookURL, slackMessage, colorHex) {
    const payload = {
        text: 'A release is published.',
        attachments: [
            {
                fallback: '*New Release Alert!*',
                color: `#${colorHex}`,
                pretext: '*New Release Alert!*',
                fields: [
                    {
                        title: 'Release Notes',
                        value: slackMessage,
                        short: false
                    }
                ]
            }
        ]
    };
    console.log('Slack Payload:', payload);
    await axios.post(slackWebhookURL, payload);
}

function formatReleaseNotesForSlack(releaseNotes) {
    // Assuming releaseNotes is a Markdown string
    // Convert Markdown syntax to Slack message formatting
    // You can customize this conversion based on your needs
    let slackMessage = releaseNotes.replace(/^##\s*(.*)$/gm, '*_$1_*'); // Convert headings
    slackMessage = slackMessage.replace(/^- \[(.*)\] - (.*)$/gm, '*$1*: $2'); // Convert bullet points
    slackMessage = slackMessage.replace(/`([^`]*)`/g, '`$1`'); // Preserve inline code
    return slackMessage;
}

run();
