const { execSync } = require('child_process');
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
    const changelog = process.env.RELEASE_BODY;
    const plainTextChangelog = execSync(`echo "${changelog}" | pandoc -f markdown -t plain`).toString().trim();
    return marked(plainTextChangelog);
}

function generateHexColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

async function sendSlackNotification(slackWebhookURL, changelog, colorHex) {
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
                        value: `*Version:* \`${process.env.RELEASE_TAG}\` :label:\n*Repository:* \`${process.env.REPOSITORY_FULL_NAME}\`\n*Author:* ${process.env.RELEASE_AUTHOR}`,
                        short: false
                    },
                    {
                        title: 'Changes',
                        value: changelog,
                        short: false
                    },
                    {
                        title: 'Release Details',
                        value: `:eyes: *View on GitHub:* <${process.env.RELEASE_HTML_URL}>`,
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
