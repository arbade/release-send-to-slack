const core = require('@actions/core');
const { execSync } = require('child_process');
const { context, getOctokit } = require('@actions/github');

async function run() {
    try {
        const slackWebhookURL = core.getInput('slack-webhook-url');
        const octokit = getOctokit(process.env.GITHUB_TOKEN);

        const changelog = context.payload.release.body;
        const changes = parseMarkdownChangelog(changelog);

        core.setOutput('changes', changes);

        const colorHex = generateHexColor();
        core.setOutput('color_hex', colorHex);

        await sendSlackNotification(slackWebhookURL, changes, colorHex);
    } catch (error) {
        core.setFailed(error.message);
    }
}

function parseMarkdownChangelog(changelog) {
    let changes = execSync(`echo -n "${changelog}" | docker run --rm -i pandoc/core:latest -f markdown -t plain`).toString().trim();
    changes = changes.split('\n').join('\\n');
    return changes;
}

function generateHexColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

async function sendSlackNotification(slackWebhookURL, changes, colorHex) {
    const payload = {
        text: 'A release is published.',
        attachments: [
            {
                fallback: '*New Release Alert!*',
                color: `#${colorHex}`,
                pretext: '*New Release Alert!*',
                fields: [
                    {
                        title: 'Release Information',
                        value: `*Version:* \`${context.payload.release.tag_name}\` :label:\n*Repository:* \`${context.payload.repository.full_name}\`\n*Author:* ${context.payload.sender.login}`,
                        short: false
                    },
                    {
                        title: 'Changes',
                        value: changes,
                        short: false
                    },
                    {
                        title: 'Release Details',
                        value: `:eyes: *View on GitHub:* <${context.payload.release.html_url}>`,
                        short: false
                    }
                ]
            }
        ]
    };

    // Send payload to Slack webhook URL
    await axios.post(slackWebhookURL, payload);
}

run();
