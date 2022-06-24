/*
    This function adds callers into a conference.
    It is referenced in incoming-call.js.
*/

exports.handler = async function(context, event, callback) {

    const twiml = new Twilio.twiml.VoiceResponse()
    const dial = twiml.dial();
    dial.conference(`${decodeURIComponent(event.conferenceName)}`);

    return callback(null, twiml);
}