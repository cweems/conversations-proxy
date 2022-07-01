# Twilio Conversations Proxy

Twilio Proxy is no longer available to new customers. Twilio Conversations can be used as an alternative, but misses a few of Proxy's core features:

* No number selection management for conversation sessions.
* No support for voice.

This repository provides a proof of concept for supporting those two features. Using `functions/add-participant.js` you can add a participant to a conversation and auto-select their proxy address based on available phone numbers.

<img width="723" alt="Screen Shot 2022-06-24 at 10 51 32 AM" src="https://user-images.githubusercontent.com/1418949/175615606-a23f5061-cc76-4c41-a8e3-64d7a0ff6253.png">

If a user calls their proxy address (phone number) for the conversation, `functions/incoming-call.js` can place an outbound call to all participants in the conversation and join them into a conference.

## Setup
Pre-requisites:
* A [Twilio Account](https://www.twilio.com/try-twilio)
* Install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart)
* Install the [Twilio CLI Serverless Toolkit](https://www.twilio.com/docs/labs/serverless-toolkit)

Then, in your terminal do the following:

```bash
# Clone the repository:
git clone https://github.com/cweems/conversations-proxy.git

# Set the repository as your working directory:
cd conversations-proxy

# Make a copy of the example .env file
# and add your Twilio Account SID and Auth Token:
cp .env.example .env
```

You'll need to expose a webhook to allow Twilio to call the functions in this project. You can do this in two ways:

1. Run `twilio serverless:deploy` to publish this project to Twilio Serverless.
1. Use ngrok.io to get a custom domain name that tunnels to your app. If you go this route, set `DEV_DOMAIN_NAME` in `.env` to be your ngrok URL. Then tun `twilio serverless:start`.

Lastly, you'll need to set `https://[YOUR_DOMAIN]/incoming-call` to be the incoming call handler on your phone number. You can do that in the Twilio Console by going to:

> Phone Numbers / Active Numbers / [YOUR_NUMBER] / Voice & Fax

Then under `Configure With` select `Webhook`. Paste your callback URL into the `A Call Comes In` input field.

## Usage

You can test the functionality by opening up `https://[YOUR_RUNTIME_URL]/index.html` and using the UI. You can also call `/add-participant` directly by using `curl` like this:

```bash
curl -X POST https://[YOUR_RUNTIME_URL]/add-participant \                                                                                                      ─╯
--data-urlencode address=[E164_PHONE_NUMBER] \
--data-urlencode conversationSid=CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
