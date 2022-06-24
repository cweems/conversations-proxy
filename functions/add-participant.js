/*
This function takes a phone number and conversations SID
as inputs and checks if there is an existing session
defined between the recipient's number and the proxy address.

If there is an existing session, it queries phone numbers and
picks a new proxy address.

@param string address - the user's phone number (urlencoded)
@param string conversationSid - the SID of the conversation
*/

exports.handler = async function(context, event, callback) {
  try {
    const client = context.getTwilioClient();
    let address = decodeURI(event.address);

    console.log(`Received a new request to add ${address} to ${event.conversationSid}`);

    // Get an array of Twilio numbers that are currently
    // being used by the customer as proxy_addresses
    const inUseAddresses = await client.conversations.participantConversations
      .list({address: address})
      .then(participantConversations => {
          
          let proxyAddresses = participantConversations.map(p => {
            console.log(p.participantMessagingBinding.proxy_address);
            return p.participantMessagingBinding.proxy_address;
          })

          console.log(proxyAddresses);
          return proxyAddresses;
        });
    
    console.log(`${address} is currently bound to these proxy addresses: \n\n ${inUseAddresses.join("\n")}`)
    
    // Query Twilio numbers and find one that is
    // not being used as a proxy_address
    const newProxyAddress = await client.incomingPhoneNumbers
      .list()
      .then(incomingPhoneNumbers => {
        let phoneNumber = null;
        
        for (let el of incomingPhoneNumbers) {
          if (!inUseAddresses.includes(el.phoneNumber)) {
            phoneNumber = el.phoneNumber;
            break;
          }
        }

        if (!phoneNumber) {
          console.log('No available phone numbers found, you can add one in the Twilio Console.')
          /*
            Your code to handle fetching new numbers here.
          */
        }

        return phoneNumber;
      });
    
    console.log(`Found an available number to use as a the proxy address: ${newProxyAddress}`)

    // Add the conversation participant with the new Proxy Address
    const participant = await client.conversations.conversations(event.conversationSid)
      .participants
      .create({
        'messagingBinding.address': address,
        'messagingBinding.proxyAddress': newProxyAddress
      })
      .then(participant => { participant });

    console.log(`Added ${address} to ${event.conversationSid} with ${newProxyAddress} as the proxy address.`)
    
    callback(null, participant)

  } catch (err) {
    callback(err);
  }  
};
