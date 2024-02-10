const { execSync } = require('child_process');
const axios = require('axios');
const marked = require('marked');

async function run() {
    try {
        const slackWebhookURL = process.env.SLACK_RELEASE_WEBHOOK_URL;
        const changelog = await parseMarkdownChangelog(process.env.CHANGELOG);
        const colorHex = generateHexColor();

        await sendSlackNotification(slackWebhookURL, changelog, colorHex);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function parseMarkdownChangelog(changelog) {
    // Convert Markdown to HTML using the 'marked' library
    return marked(changelog);
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
                        title: 'Changes',
                        value: changelog,
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
