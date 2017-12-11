"use strict";

const blank_response = {
  version: "1.0",
  response: {}
};

const quit_response = {
  version: "1.0",
  response: {
    shouldEndSession: true,
    directives: [
      {
        type: "AudioPlayer.ClearQueue",
        clearBehavior: "CLEAR_ALL"
      }
    ]
  }
};

const spoken_response = (text) => {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: text
      }
    }
  };
};

const note_references = {
  "low e": {
    name: "low e",
    url: "https://archive.org/download/GuitarChord-A/6th_String_E.mp3",
    offset_in_milliseconds: 1500
  },
  "high e": {
    name: "high e",
    url: "https://archive.org/download/GuitarChord-A/1st_String_E.mp3",
    offset_in_milliseconds: 1900
  },
  "a": {
    name: "a",
    url: "https://archive.org/download/GuitarChord-A/5th_String_A.mp3",
    offset_in_milliseconds: 1500,
    article: "an"
  },
  "d": {
    name: "d",
    url: "https://archive.org/download/GuitarChord-A/4th_String_D.mp3",
    offset_in_milliseconds: 1300
  },
  "g": {
    name: "g",
    url: "https://archive.org/download/GuitarChord-A/3rd_String_G.mp3",
    offset_in_milliseconds: 1600
  },
  "b": {
    name: "b",
    url: "https://archive.org/download/GuitarChord-A/2nd_String_B_.mp3",
    offset_in_milliseconds: 1400
  }
};

note_references["e"] = note_references["low e"];

// options: object with
//    note: required string (key into `note_references`)
//    enqueue: optional boolean, whether to enqueue or play immediately
const note_response = (options) => {
  const note_details = note_references[options.note];

  if (!note_details) {
    return spoken_response(`I don't know how to play ${options.note}`);
  }

  const alexa_response = {
    version: "1.0",
    sessionAttributes: {
      playing: true
    },
    response: {
      directives: [
        {
          type: "AudioPlayer.Play",
          playBehavior: options.enqueue ? "ENQUEUE" : "REPLACE_ALL",
          audioItem: {
            stream: {
              token: options.note,
              expectedPreviousToken: options.enqueue ? options.note : null,
              url: note_details.url,
              offsetInMilliseconds: note_details.offset_in_milliseconds
            }
          }
        }
      ]
    }
  };

  if (!options.enqueue) {
    alexa_response.response.outputSpeech = {
      type: "PlainText",
      text: `Playing ${note_details.article || "a"} ${note_details.name} string`
    };
  }

  return alexa_response;
};

exports.handler = function(event, context, callback) {
  console.log(`[handler] Incoming event type ${event.request.type}: ${JSON.stringify(event)}`);
  if (event.request.type === "AudioPlayer.PlaybackNearlyFinished") {
    return callback(null, note_response({ note: event.request.token, enqueue: true }));
  }

  const intent = (event.request.intent || {}).name;
  if (event.request.type === "LaunchRequest" || intent === "PlayNoteIntent") {
    const note = ((((event.request.intent || {}).slots || {})["Note"] || {}).value || "").toLowerCase() || "low e";
    return callback(null, note_response({ note: note }));
  } else if (intent === "AMAZON.PauseIntent") {
    return callback(null, spoken_response("Okay"));
  } else if (intent === "AMAZON.ResumeIntent") {
    return callback(null, note_response({ note: (event.context.AudioPlayer || {}).token || "low e" }));
  } else {
    return callback(null, blank_response);
  }
};
