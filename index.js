'use strict';
var dbhelper = require('./lib/DynamoDBHelper');
/**
 * This code is a specific function that handles Mariswaran's BookMark Alexa Skills
 *
 * Author : Mariswaran Balasubramanian
 * Created Date : March 2017
 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `${title}`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}




function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    const sessionAttributes = {};
    const cardTitle = 'Bookmarker';
    const speechOutput = 'Welcome to the Bookmarker,  just say the book name and page number. Bookmarker will remember it for you.   ';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Do you like Alexa to create and remind your bookmark, just say the book name and page number. ';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Bookmarker';
    const speechOutput = 'Thank you for trying the Bookmarker. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Sets the Bookmark in the session and saves it to DB
 */
function saveBookMarkInDB(intent, session, callback) {
   try{

   var bookname = null;
   var bookmarkpage = null;
   var speechOutput = null;
   var userId = session.user.userId;
   if(typeof intent.slots.BookName != 'undefined' && typeof intent.slots.BookName.value != 'undefined')
    bookname = intent.slots.BookName.value;
   
   if(typeof intent.slots.BookmarkPage != 'undefined' && typeof intent.slots.BookmarkPage.value != 'undefined')
    bookmarkpage = intent.slots.BookmarkPage.value;
  
  
   if(bookmarkpage!=null){


    dbhelper.set(userId,bookname,bookmarkpage,callback);

    const sessionAttributes = {};
    const cardTitle = 'Bookmarker';
    
     if(bookname!=null)
     speechOutput = 'BookMark Set To ' + bookmarkpage + " For the Book " + bookname;
     else
     speechOutput = 'BookMark Set To Page ' + bookmarkpage;
      
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Do you like Alexa to be your book mark reminder, just say the book name and page number. ';
    const shouldEndSession = true;

    console.log("Speech Output is:" + speechOutput);
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
   }
   else
   {
    const sessionAttributes = {};
    const cardTitle = 'Bookmarker';
    
    speechOutput = 'Could not find a matching bookmark at this time';
      
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'To use bookmarker first save bookmark for your book and then just say get bookmark ';
    const shouldEndSession = true;

    console.log("Speech Output is:" + speechOutput);
    callback(sessionAttributes,
    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));


   }
}
catch(err)
{
    callback(err);
}
       
}


/**
 * Sets the bookmark in the session and saves it to DB
 */
function getBookMarkFromDB(intent, session, callback) {
   
   try{
    var userId = session.user.userId;
    var bookname = null;
    var bookmarkpage = null;
    var speechOutput = 'Book mark for the book ';

    dbhelper.get(userId, (err,data) => {
        if(err) {
                    return context.fail('Error fetching user state: ' + err);
                }
    
    const sessionAttributes = {};
    const cardTitle = 'Bookmarker';
     
     if(typeof data.Item.bookName!= 'undefined' && typeof data.Item.bookmarkPage != 'undefined')
     {
          speechOutput = speechOutput + data.Item.bookName + " is " + data.Item.bookmarkPage ;
     }
     if(typeof data.Item.bookName == 'undefined' && typeof data.Item.bookmarkPage != 'undefined')
     {
         speechOutput = speechOutput + " is " + data.Item.bookmarkPage ;
     }

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Happy Reading.  ';
    const shouldEndSession = true;

    console.log("Speech Output is:" + speechOutput);
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
       
});

   }
   catch(err)
   {
       callback(err);
   }
       
}




/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if(intentName === 'SetBookMarkIntent') {
        saveBookMarkInDB(intent, session, callback);
    } else if(intentName === 'GetBookMarkIntent') {
        getBookMarkFromDB(intent, session, callback);
    }  else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
