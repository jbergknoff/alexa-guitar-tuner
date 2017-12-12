const assert = require("assert");
const guitar_tuner = require("./index.js");

guitar_tuner.handler(
	{
		request: {
			intent: {
				name: "PlayNoteIntent",
				slots: {
					"Note": {
						value: "B"
					}
				}
			}
		}
	},
	null,
	(error, result) => {
		assert(!error);
		assert(result);
		assert.equal(result.response.directives.length, 1);
		assert.equal(result.response.outputSpeech.text, "Playing a b string")
		assert.equal(result.response.directives[0].audioItem.stream.token, "b");
	}
);
