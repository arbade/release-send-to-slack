# release-send-to-slack
A lightweight GitHub Action for Send Release Notice to Slack


### Usage

```
name: demo

on:
  release:
    types: [published]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Release Notice
        uses: arbade/release-send-to-slack@v4.0
        with:
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
            
```
