const core = require('@actions/core');
const { readFileSync } = require('fs');
const { execSync } = require('child_process');
const axios = require('axios');

async function run() {
    try {
        const slackWebhookURL = core.getInput('slack-webhook-url');
        const changelog = getChangelogFromEvent();

        const { changes, colorHex } = processChangelog(changelog);
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
    const plainTextChanges = parseMarkdownChangelog(changelog.body);
    const colorHex = generateHexColor();
    return { changes: plainTextChanges, colorHex };
}

function parseMarkdownChangelog(changelog) {
    let changes = execSync(`echo -n "${changelog}" | docker run --rm -i pandoc/core:latest -f markdown -t plain`).toString().trim();
    return changes.split('\n').join('\\n');
}

function generateHexColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

async function sendSlackNotification(slackWebhookURL, changes, colorHex) {
    const payload = createSlackMessagePayload(changes, colorHex);
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
