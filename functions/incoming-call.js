/*
    This function should be set as the voice webhook for the proxy phone number.
    It receives an inbound call, gathers all phone numbers for participants
    in the conversation, and then dials them and joins them into a conference.
*/

exports.handler = async function(context, event, callback) {
    
    const client = context.getTwilioClient()
    const caller = event.Caller
    const called = event.Called
    const twiml = new Twilio.twiml.VoiceResponse() 
    const conferenceName = `${caller}_at_${Date.now()}`

    // If developing locally, you can use a tool
    // like ngrok.io and set DEV_DOMAIN_NAME to your
    // personal url.
    let domain = context.DOMAIN_NAME
    if (context.DOMAIN_NAME.includes('localhost')) {
        domain = context.DEV_DOMAIN_NAME
    }
    
    console.log(`Received an incoming call from ${caller} to ${called}\n`)

    // Find the user's conversation based on address.
    const conversationSid = await client.conversations.participantConversations
      .list({address: caller})
      .then(participantConversations => {
          
          let activeConversation = participantConversations.map(pc => {
            if (pc.participantMessagingBinding.proxy_address === called) {
                return pc.conversationSid;
            }
          })

          return activeConversation;
        });
    
    console.log(`Caller is currently present in ${conversationSid}\n`)
    
    // Gather all participant phone numbers,
    // ingoring anyone who isn't joined by phone number (e.g. chat identifier)
    // and also ignoring the caller.
    const participantAddresses = await client.conversations.conversations(conversationSid)
        .participants
        .list({limit: 20})
        .then(participants => {
            const participantsToDial = participants.reduce((result, p) => {
                if (p.messagingBinding.type === "sms" && p.messagingBinding.address != caller) {
                    console.log(`Adding ${p.messagingBinding.address} to list of numbers to dial.\n`)

                    result.push({
                        address: p.messagingBinding.address,
                        proxyAddress: p.messagingBinding.proxy_address
                    })                    
                }

                return result;
            }, [])

            return participantsToDial;
        });
    
    console.log(`Found ${participantAddresses.length} SMS participants in the conversation that are not the caller.\n`)
    console.log('Placing outbound calls to other conversation participants...\n')

    // Make outbound calls to all conversation participants.
    const callPromises = participantAddresses.map(pa => {
        console.log(`Dialing ${pa.address} from ${pa.proxyAddress}...`);

        return client.calls.create({
            url: `https://${domain}/join-conference?conferenceName=${encodeURIComponent(conferenceName)}`,
            to: pa.address,
            from: pa.proxyAddress
        });
    });

    // Return TwiML to redirect the caller into the conference
    // once all outbound calls have been made.
    Promise.all(callPromises)
        .then((results) => {
            const dial = twiml.dial();
            dial.conference({
                endConferenceOnExit: true
            }, conferenceName);

            console.log('\nNow transferring the caller to the conference.')
            callback(null, twiml);
        });
}