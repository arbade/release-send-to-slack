const core = require('@actions/core');
const { readFileSync } = require('fs');
const { execSync } = require('child_process');
const axios = require('axios');

async function run() {
    try {
        const slackWebhookURL = core.getInput('slack-webhook-url');
        const changelog = getChangelogFromEvent();
        console.log('Changelog:', changelog);

        const { changes, colorHex } = processChangelog(changelog.body);
        console.log('Changes:', changes);
        console.log('ColorHex:', colorHex);

        core.setOutput('changes', changes);
        core.setOutput('color_hex', colorHex);

        await sendSlackNotification(slackWebhookURL, changes, colorHex);
    } catch (error) {
        core.setFailed(error.message);
    }
}

function getChangelogFromEvent() {
    const eventPayloadPath = process.env.GITHUB_EVENT_PATH;
    const payload = JSON.parse(readFileSync(eventPayloadPath, 'utf8'));
    return payload;
}

function processChangelog(changelog) {
    const { plainTextChanges, colorHex } = parseMarkdownChangelog(changelog);
    return { changes: plainTextChanges, colorHex };
}

function parseMarkdownChangelog(changelog) {
    // Convert Markdown syntax to Slack message formatting specifically for "Changes" section
    let changes = changelog.replace(/^([-*])\s*/gm, '• '); // Replace list items with bullet points
    changes = changes.replace(/\*\*(.*?)\*\*/g, '*$1*'); // Convert bold
    changes = changes.replace(/`(.*?)`/g, '`$1`'); // Convert inline code
    changes = changes.replace(/~~(.*?)~~/g, '~$1~'); // Convert strikethrough
    changes = changes.replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>'); // Convert links
    const colorHex = generateHexColor();
    return { plainTextChanges: changes, colorHex };
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
