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
		assert(result.response.directives.length === 1);
		assert(result.response.directives[0].audioItem.stream.token === "b");
	}
);
