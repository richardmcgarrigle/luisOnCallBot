/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/
"use strict";

var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
var hostResponse = require('./hosts');
var host = '';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/

//session.send('Hello '+session.userData.name\'%s\'', JSON.stringify(session));
.matches('greet', function(session){
        session.send('Hello '+session.message.user.name);
        offerHelp(session)
})
.matches('checkStatus', function(session, args){
   
    host = args.entities[0].entity
    session.send('Ok, looking up ' + host + ' now');
    var matchedHosts = hostResponse.filter(function(singleHost){
        return singleHost.host.indexOf(host) > -1;
    });
    
    var badHosts =[];
    
    if(matchedHosts.length > 0){
        session.send(matchedHosts.length + ' matches found for ' + host);
        badHosts = matchedHosts.filter(function(matchedHost){
            session.send(matchedHost.host + ', status: ' + matchedHost.status);
            return matchedHost.status != 'green';
        })
        
        if(badHosts.length > 0){
            troubleShoot(session ,badHosts);
        }
    }
})
.onDefault((session) => {
    offerHelp(session)
});

var offerHelp = function(session){
    session.send("I can help you find the status of a service or server, let me know if there is anything you'd like me to check", session.message.text);
}

var troubleShoot = function(session , hosts){
    session.send("Steps to troubleshoot ..." , hosts[0].name);
}



bot.dialog('/', intents);    

