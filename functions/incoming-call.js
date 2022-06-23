exports.handler = async function(context, event, callback) {
    console.log(event);

    const client = context.getTwilioClient()

    const caller = event.Caller
    const called = event.Called
    const twiml = new Twilio.twiml.VoiceResponse()

    const conferenceName = `${caller}_at_${Date.now()}`
    let domain = context.DOMAIN_NAME

    if (context.DOMAIN_NAME.includes('localhost')) {
        domain = context.DEV_DOMAIN_NAME
    }
    
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
    
    const participantAddresses = await client.conversations.conversations(conversationSid)
        .participants
        .list({limit: 20})
        .then(participants => {
            console.log(participants);
            const participantsToDial = participants.reduce((result, p) => {
                if (p.messagingBinding.type === "sms" && p.messagingBinding.address != caller) {
                    result.push({
                        address: p.messagingBinding.address,
                        proxyAddress: p.messagingBinding.proxy_address
                    })
                    
                    console.log(result, p);
                    return result;
                } else {
                    console.log(`ineligible participant: ${caller}`)
                    return result;
                }
            }, [])
            console.log(`ZZ ${participantsToDial}`)
            return participantsToDial;
        });
    
    console.log(`PaS: ${participantAddresses}`);
    const callPromises = participantAddresses.map(pa => {
        console.log(pa);
        console.log(`Dialing ${pa.address} from ${pa.proxyAddress}`);

        return client.calls.create({
            url: `https://${domain}/join-conference?conferenceName=${encodeURIComponent(conferenceName)}`,
            to: pa.address,
            from: pa.proxyAddress
        });
    });

    const dial = twiml.dial();
    dial.conference(conferenceName);

    Promise.all(callPromises)
        .then((results) => {
            console.log(results);
            callback(null, twiml);
        });
}