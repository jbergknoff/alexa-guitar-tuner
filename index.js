"use strict";

// options: object with
//    text: optional string to be spoken
//    note: optional object with
//      name: required string (key into `note_references`)
//      enqueue: optional boolean, whether to enqueue or play immediately
//    end_session: optional boolean
//    pause: optional boolean, whether to pause playing audio
const generate_alexa_response = (options) => {
  options = options || {};

  const alexa_response = {
    version: "1.0",
    response: {
      directives: []
    }
  };

  if (options.text) {
    alexa_response.response.outputSpeech = {
      type: "PlainText",
      text: options.text
    };
  }

  if (options.end_session) {
    alexa_response.response.shouldEndSession = true;
  }

  if (options.note) {
    const note_details = note_references[options.note.name];
    alexa_response.response.directives.push(
      {
        type: "AudioPlayer.Play",
        playBehavior: options.note.enqueue ? "ENQUEUE" : "REPLACE_ALL",
        audioItem: {
          stream: {
            token: options.note.name,
            expectedPreviousToken: options.note.enqueue ? options.note.name : null,
            url: note_details.url,
            offsetInMilliseconds: note_details.offset_in_milliseconds
          }
        }
      }
    );
  }

  if (options.pause) {
    alexa_response.sessionAttributes = { paused: true };
    alexa_response.response.directives.push(
      {
        type: "AudioPlayer.ClearQueue",
        clearBehavior: "CLEAR_ALL"
      }
    );
  }

  return alexa_response;
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
note_references["e."] = note_references["low e"];
note_references["a."] = note_references["a"];
note_references["d."] = note_references["d"];
note_references["g."] = note_references["g"];
note_references["b."] = note_references["b"];

const play_note = (note_name, callback) => {
  const note_details = note_references[note_name];
  if (!note_details) {
    return callback(null, generate_alexa_response({ text: `I don't know how to play ${note_name}`, stop_audio: true, end_session: true }));
  }

  const response = generate_alexa_response(
    {
      text: `Playing ${note_details.article || "a"} ${note_details.name} string`,
      note: {
        name: note_name
      },
      end_session: true
    }
  );

  return callback(null, response);
};

exports.handler = (event, context, callback) => {
  console.log(`[handler] Incoming event type ${event.request.type}: ${JSON.stringify(event)}`);

  const cb = (e, r) => { if (r) { console.log(`[handler] responding with ${JSON.stringify(r)}`); } callback(e, r); };

  if (event.request.type === "AudioPlayer.PlaybackNearlyFinished") {
    if (((event.session || {}).attributes || {}).paused) {
      return cb(null, generate_alexa_response());
    }

    const response = generate_alexa_response(
      {
        note: {
          name: event.request.token,
          enqueue: true
        }
      }
    );

    return cb(null, response);
  }

  const intent = (event.request.intent || {}).name;
  if (event.request.type === "LaunchRequest" || intent === "PlayNoteIntent") {
    const note_name = ((((event.request.intent || {}).slots || {})["Note"] || {}).value || "").toLowerCase() || "low e";
    return play_note(note_name, cb);
  } else if (intent === "AMAZON.PauseIntent") {
    return cb(null, generate_alexa_response({ text: "Okay", pause: true, end_session: true }));
  } else if (intent === "AMAZON.ResumeIntent") {
    const note_name = (event.context.AudioPlayer || {}).token || "low e";
    return play_note(note_name, cb);
  } else {
    return cb(null, generate_alexa_response({ end_session: true }));
  }
};
