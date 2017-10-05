'use strict';
var apiai = require("apiai");
var uuid = require('uuid');
var req = require('request');
var http = require('http');
var Alexa = require('alexa-sdk');
var APP_ID = 'amzn1.ask.skill.dfef576b-c6c2-4f79-b898-56bf24241df1'; 
var rp = require("request-promise");
var Client = require('node-rest-client').Client;

var access_token = "e9a64730ddf44bdc8cc0fe3f0cbceb4d";

var options = {
    proxy: 'http://one.proxy.att.com:8080'
}

var app = apiai(access_token, options);
var sessionID = uuid.v4();
var reqOptions = {
    sessionId: sessionID
}


   var getStatus = function(user_text, alexaCallback) {
        console.log('inside getStatus');
        //console.log("This is this "+self);
        //var user_text = "what is the weather in mumbai";
        var apiAiRequest = app.textRequest(user_text, reqOptions);   
        apiAiRequest.on('response', function(apiAiResponse) {
            console.log("inside api ai response is the best" +JSON.stringify(apiAiResponse));

            var city = apiAiResponse.result.parameters['geo-city'];
            console.log("The city is: "+city);
            if(city === "" || city === undefined || city === null){
                console.log("User response entire:" +JSON.stringify(apiAiResponse.result));
                console.log(apiAiResponse.result.fulfillment.messages[1].speech);
                alexaCallback(apiAiResponse.result.fulfillment.messages[1].speech);
            }
            else {
                console.log("city is: " +city);
                var client = new Client();


                client.get("http://api.openweathermap.org/data/2.5/weather?q="+city+"&APPID=d0b6201d84ce0b78503638466648ead8", function(data, response){ 
                    var temperatureKelvin = data.main.temp;
                    var tempCelcius = 273.15;
                    var tempFarenheit = 32;
                    var finalTemp = (temperatureKelvin - tempCelcius) * (9/5) + tempFarenheit;

                    var highTemp = (data.main.temp_max - tempCelcius) * (9/5) + tempFarenheit;
                    var lowTemp = (data.main.temp_min - tempCelcius) * (9/5) + tempFarenheit;

                    /* Date conversion code
                   aPI call for tomorrows weather=> http://api.openweathermap.org/data/2.5/forecast/daily?q=london&units=metric&APPID=d0b6201d84ce0b78503638466648ead8&cnt=2
                    var theDate = new Date(1505559600 * 1000);
                    dateString = theDate.toUTCString();
                    console.log(dateString.split(",")[1].split(" ")[1] + dateString.split(",")[1].split(" ")[2]);

                    Eg: 16Sep
                    */
                    
                    console.log("User text matching" +user_text.match(/rain/g));

                     if(user_text.match(/rain/g) !== null && user_text.match(/rain/g) !== undefined) {
                        if(data.weather[0].main == "Clear"){
                            alexaCallback("There is no rain expected in "+data.name);
                        }
                        else{
                            alexaCallback("There is some rain expected in "+data.name);
                        }
                    }

                    else if(user_text.match(/umbrella/g) !== null && user_text.match(/umbrella/g) !== undefined){
                        console.log("user text matchin umbrella "+user_text.match(/umbrella/g));
                        if(data.weather[0].main == "Clear"){
                            alexaCallback("You will not need an umbrella in "+data.name);
                        }
                        else {
                            alexaCallback("You might want to carry an umbrella with you in "+data.name);
                        }
                    }
                    else {
                        console.log("weather response entire: "+JSON.stringify(apiAiResponse));
                        console.log("New speech response "+apiAiResponse.result.fulfillment.messages[1].speech);
                        var weatherResponse = apiAiResponse.result.fulfillment.messages[1].speech +" "+ Math.trunc(finalTemp) +" degrees fahrenheit with a high of "+Math.trunc(highTemp) +" degrees and a low of "+Math.trunc(lowTemp) +" degrees";
                        alexaCallback(weatherResponse);
                    }
                });
            }
        });

        apiAiRequest.on('error', function(error) {
            console.error(error);
        });

        apiAiRequest.end();
    }


var newSessionHandlers = {
   "LaunchRequest": function () {
        //this.handler.state = SKILL_STATES.START;
 /*       var self = this;
        app.eventRequest({name: 'WELCOME'}, reqOptions)
            .on('response', function(response) {
                var speech = response.result.fulfillment.speech;
                console.log("This is speech" +speech);
                self.emit(':ask', speech, speech);
            })
            .on('error', function(error){
                console.log(error.message);
                self.emit(':tell', error);
            })
            .end();
        },*/
        this.emit(':tell', "Welcome to this awesome weather skill, try by asking weather at your place");
    },
   "DefaultWelcomeIntent": function () {
         var self = this;
         //console.log("This is the user welcome from Alexa " +JSON.stringify(this.event.request.intent.slots.WELCOME.value));
         console.log("This is the user welcome from Alexa " +JSON.stringify(this.event.request));
        app.eventRequest({name: 'WELCOME'}, reqOptions)
            .on('response', function(response) {
                var speech = response.result.fulfillment.speech;
                console.log("This is speech" +speech);
                self.emit(':tell', speech, speech);
            })
            .on('error', function(error){
                console.log(error.message);
                self.emit(':tell', error);
            })
            .end();
    },
     "StopIntent": function (){
        var self = this;
        var stopSpeech = null;
        app.eventRequest({name: 'STOP'}, reqOptions)
            .on('response', function(response) {
                console.log("This is the response for stop: "+JSON.stringify(response.result.fulfillment.messages[0].speech));
                stopSpeech = JSON.stringify(response.result.fulfillment.messages[0].speech);
                 self.emit(':tell', stopSpeech);
            })
            .on('error', function(err){
                console.log(err);
            })
            .end();
           
    },

    "DefaultByeEvent": function () {
        var self = this;
        var byeSpeech;
        app.eventRequest({name: 'BYE'}, reqOptions)
            .on('response', function(response) {
                var byeSpeech = JSON.stringify(response.result.fulfillment.messages[0].speech);
                console.log("Inside default bye event");
                self.emit(':tell', byeSpeech, "Bye now");
            }) 
    },

    "Unhandled": function () {
       var speechOutput = "I can tell you the weather at a location, for example; you can ask me, What is the weather in San Francisco."
        this.emit(":ask", speechOutput, speechOutput);
    },
    "Weather" : function (){
        var self = this;
         var user_phrase_alexa;
         console.log("Entered the weather intent");
        if(JSON.stringify(this.event.request.intent.slots.userphrase) !== null || JSON.stringify(this.event.request.intent.slots.userphrase) !== undefined) {
            console.log("This is before exxtracting user phrase" +JSON.stringify(this.event.request));
            user_phrase_alexa = JSON.stringify(this.event.request.intent.slots.userphrase.value);
        }
        console.log("Entire response" +JSON.stringify(this.event.request));
        //console.log("new try: "+user_phrase_alexa);
        /*city = this.event.request.intent.slots.location.value*/
        app.eventRequest({name: 'Weather'}, reqOptions)
            .on('response', function(response) {
                console.log("This is response for weather: " +JSON.stringify(response));
                //console.log("This is speech: " +speech);
                   getStatus(user_phrase_alexa, function(data){
                    this.emit(':ask', data);
                }.bind(self));
            })
            .on('error', function(error){
                console.log(error.message);
                self.emit(':tell', error);
            })
            .end();
    },

   
};

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;
    var locale = event.request.locale;
    alexa.registerHandlers(newSessionHandlers);
    alexa.execute();
};

