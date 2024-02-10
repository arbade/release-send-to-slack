const { execSync } = require('child_process');
const { GitHub, context } = require('@actions/github');

async function run() {
    try {
        const github = new GitHub(process.env.GITHUB_TOKEN);

        const changelog = context.payload.release.body;
        let changes = parseMarkdownChangelog(changelog);

        console.log(`::set-output name=changes::${changes}`);

        const colorHex = generateHexColor();
        console.log(`::set-output name=color_hex::${colorHex}`);

        await sendSlackNotification(github, changes, colorHex);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
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

async function sendSlackNotification(github, changes, colorHex) {
    if (process.env.SUCCESS === 'true') {
        await github.repos.createCommitComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            commit_sha: context.sha,
            body: JSON.stringify({
                text: 'A release is published.',
                attachments: [
                    {
                        fallback: ':alert: *New Release Alert!* :alert:',
                        color: `#${colorHex}`,
                        pretext: ':alert: *New Release Alert!* :alert:',
                        fields: [
                            {
                                title: 'Release Information',
                                value: `*Version:* \`${context.payload.release.tag_name}\` :label:\n*Repository:* \`${context.repo.repo}\`\n*Author:* ${context.actor}`,
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
            })
        });
    }
}

run();
