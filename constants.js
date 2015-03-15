exports.ERROR = {
	MISSING: {
		TOKEN: "Please provide a valid access token",
		QUESTION_ID: "Please provide 'questionId' property.",
		QUESTION_TITLE: "Please provide 'questionTitle' property.",
		QUESTION_DESCRIPTION: "Please provide 'questionDescription' property.",
		QUESTION_CATEGORY: "Please provide 'categoryIndex' property.",
		ANSWER_BODY: "Please provide 'answerBody' property.",
		EMAIL: "Please provide an email",
		PASSWORD: "Please provide a password",
		FIRST_NAME: "Please provide a firstName."
	},
	INVALID: {
		TOKEN: "Unauthorized. Invalid token.",
		EMAIL_OR_PASSWORD: "Invalid email or password",
		HTTP_METHOD: "Invalid HTTP method or path, please refer to the API Documentation."
	},
	SAVE: {
		ANSWER: "Could not save answer.",
		QUESTION: "Could not save question.",
		USER: "Could not save user."
	},
	QUESTION_BY_ID: "Could not find question. Please form your requests like the following: api/question/QUESTION_ID",
	EMAIL_IN_USE: "The provided email is already in use",
	FEATURE_NOT_IMPLEMENTED: "This feature is not yet implemented."
};

exports.SUCCESS = {
	SAVE: {
		ANSWER: "Successfully saved answer.",
		QUESTION: "Successfully saved question.",
		USER: "Successfully saved user."
	}
};

exports.URLS = {
	API_DOC: "http://docs.waterlooanswers.apiary.io/"
}