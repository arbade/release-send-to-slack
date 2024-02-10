const {execSync} = require('child_process');
const axios = require('axios');
const marked = require('marked');

async function run() {
    try {
        const slackWebhookURL = process.env.SLACK_RELEASE_WEBHOOK_URL;
        const changelog = await parseMarkdownChangelog();
        const colorHex = generateHexColor();

        await sendSlackNotification(slackWebhookURL, changelog, colorHex);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function parseMarkdownChangelog() {
    const changelog = execSync('pandoc -f markdown -t plain changelog.md').toString().trim();
    return marked(changelog);
}

function generateHexColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

async function sendSlackNotification(slackWebhookURL, payload, changelog, colorHex) {
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
                        value: changelog,
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
