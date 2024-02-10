const core = require('@actions/core');
const { execSync } = require('child_process');
const fs = require('fs');
const axios = require('axios');

async function run() {
    try {
        // Get the Slack webhook URL from the action input
        const slackWebhookURL = core.getInput('slack-webhook-url');

        // Read the release body from the event payload file
        const eventPayloadPath = process.env.GITHUB_EVENT_PATH;
        const payload = JSON.parse(fs.readFileSync(eventPayloadPath, 'utf8'));
        const changelog = payload.release.body;

        // Parse the markdown changelog
        const changes = parseMarkdownChangelog(changelog);
        core.setOutput('changes', changes);

        // Generate a hex color
        const colorHex = generateHexColor();
        core.setOutput('color_hex', colorHex);

        // Send Slack notification
        await sendSlackNotification(slackWebhookURL, payload, changes, colorHex);
    } catch (error) {
        core.setFailed(error.message);
    }
}

function parseMarkdownChangelog(changelog) {
    const sections = changelog.match(/##\s+(.+?)(?=\n##|\n*$)/gs);
    if (!sections) return '';

    let parsedChanges = '';

    sections.forEach(section => {
        const category = section.match(/##\s+(.+?)\n/)[1].trim();
        const items = section.match(/- .+?(?=\n- |\n*$)/gs);
        if (!items) return;

        parsedChanges += `*${category}*\n`;

        items.forEach(item => {
            parsedChanges += `- ${item.substring(2).trim()}\n`;
        });

        parsedChanges += '\n';
    });

    return parsedChanges.trim();
}




function generateHexColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

async function sendSlackNotification(slackWebhookURL, payload, changes, colorHex) {
    // Prepare the Slack message payload
    const slackMessage = {
        text: 'A release is published.',
        attachments: [
            {
                fallback: '*New Release Alert!*',
                color: `#${colorHex}`,
                pretext: '*New Release Alert!*',
                fields: [
                    {
                        title: 'Release Information',
                        value: `*Version:* \`${payload.release.tag_name}\` :label:\n*Repository:* \`${payload.repository.full_name}\`\n*Author:* ${payload.sender.login}`,
                        short: false
                    },
                    {
                        title: 'Changes',
                        value: changes,
                        short: false
                    },
                    {
                        title: 'Release Details',
                        value: `:eyes: *View on GitHub:* <${payload.release.html_url}>`,
                        short: false
                    }
                ]
            }
        ]
    };

    // Send the Slack message
    await axios.post(slackWebhookURL, slackMessage);
}

run();
