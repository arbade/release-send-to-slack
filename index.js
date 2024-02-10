const { getInput, setFailed, setOutput } = require('@actions/core');
const axios = require('axios');

async function run() {
    try {
        const payload = require(process.env.GITHUB_EVENT_PATH);
        const slackWebhookURL = getInput('slack-webhook-url');

        // Generate Hex Color
        const colorHex = Math.floor(Math.random() * 16777215).toString(16);
        setOutput('color_hex', colorHex);

        // Prepare Slack Message
        const changes = payload.release.body.replace(/<\/?[^>]+(>|$)/g, "");
        setOutput('changes', changes);

        // Slack Notification
        await axios.post(slackWebhookURL, {
            text: 'A release is published.',
            attachments: [
                {
                    fallback: ':alert: *New Release Alert!* :alert:',
                    color: `#${colorHex}`,
                    pretext: ':alert: *New Release Alert!* :alert:',
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
        });
    } catch (error) {
        setFailed(error.message);
    }
}

run();
