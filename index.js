const core = require('@actions/core');
const { readFileSync } = require('fs');
const { execSync } = require('child_process'); // Import execSync
const axios = require('axios');

async function run() {
    try {
        const slackWebhookURL = core.getInput('slack-webhook-url');
        const changelog = getChangelogFromEvent();

        const { changes, colorHex } = processChangelog(changelog);
        core.setOutput('changes', changes);
        core.setOutput('color_hex', colorHex);

        await sendSlackNotification(slackWebhookURL, changelog, changes, colorHex);
    } catch (error) {
        core.setFailed(error.message);
    }
}

function getChangelogFromEvent() {
    const eventPayloadPath = process.env.GITHUB_EVENT_PATH;
    const payload = JSON.parse(readFileSync(eventPayloadPath, 'utf8'));
    return payload.release.body;
}

function processChangelog(changelog) {
    const plainTextChanges = parseMarkdownChangelog(changelog);
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

async function sendSlackNotification(slackWebhookURL, changelog, changes, colorHex) {
    const payload = createSlackMessagePayload(changelog, changes, colorHex);
    await axios.post(slackWebhookURL, payload);
}

function createSlackMessagePayload(changelog, changes, colorHex) {
    return {
        text: 'A release is published.',
        attachments: [
            {
                fallback: '*New Release Alert!*',
                color: `#${colorHex}`,
                pretext: '*New Release Alert!*',
                fields: [
                    {
                        title: 'Release Information',
                        value: `*Version:* \`${changelog.release.tag_name}\` :label:\n*Repository:* \`${changelog.repository.full_name}\`\n*Author:* ${changelog.sender.login}`,
                        short: false
                    },
                    {
                        title: 'Changes',
                        value: changes,
                        short: false
                    },
                    {
                        title: 'Release Details',
                        value: `:eyes: *View on GitHub:* <${changelog.release.html_url}>`,
                        short: false
                    }
                ]
            }
        ]
    };
}

run();
