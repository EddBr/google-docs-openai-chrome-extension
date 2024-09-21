import OpenAI from "openai";
const api_key = ""
const openai = new OpenAI({apiKey: api_key, dangerouslyAllowBrowser: true});
export const getGPT = async(messages) => {
	console.log("asking gpt")
	const completion = await openai.chat.completions.create({
		model: "gpt-3.5-turbo-0125",
		messages: messages
	});
	console.log(completion.choices[0].message);
	const text = completion.choices[0].message.content
	return text.toString()
}
