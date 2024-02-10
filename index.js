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

        const { changes, colorHex } = processReleaseNotes(releaseNotes);
        console.log('Changes:', changes);
        console.log('ColorHex:', colorHex);

        core.setOutput('changes', changes);
        core.setOutput('color_hex', colorHex);

        await sendSlackNotification(slackWebhookURL, changes, colorHex);
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
    // Here you can add specific Markdown parsing logic if needed
    // For simplicity, we'll just return the release notes as plain text
    const colorHex = generateHexColor();
    return { changes: releaseNotes, colorHex };
}

function generateHexColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

async function sendSlackNotification(slackWebhookURL, changes, colorHex) {
    const payload = createSlackMessagePayload(changes, colorHex);
    console.log('Slack Payload:', payload);
    await axios.post(slackWebhookURL, payload);
}

function createSlackMessagePayload(changes, colorHex) {
    return {
        text: 'A release is published.',
        attachments: [
            {
                fallback: '*New Release Alert!*',
                color: `#${colorHex}`,
                pretext: '*New Release Alert!*',
                fields: [
                    {
                        title: 'Changes',
                        value: changes,
                        short: false
                    }
                ]
            }
        ]
    };
}

run();
