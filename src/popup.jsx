import React, {useState} from "react"
import { createRoot } from 'react-dom/client';
import {getGPT} from "./openai.js"

const Page = () => {
	const [token, setToken] = useState("")
	const [title, setTitle] = useState("")
	const [loading, setLoading] = useState(false)
	const [loaded, setLoaded] = useState(false)
	const [stateDocId, setStateDocId] = useState("")
	const [feedback, setFeedback] = useState("")
	const [messages,setMessages] = useState([
		{
			role: "system", content: "You are a helpful assistant." 
		},
	])
	chrome.identity.getAuthToken({ 'interactive': true }, function (user_token) {
		setToken(user_token)
	});

	const handleSubmit = async(event) => {
		event.preventDefault()
		let current_msg = {role: "user", content: "Write about " + title}
		const docId = await createFile()
		setStateDocId(docId)
		console.log(title)
		const gpt_resp = await getGPT([...messages, current_msg])
		setMessages(old => [...old,current_msg,{role:"assistant", content:gpt_resp}])
		const finished_update = await writeFile(docId, gpt_resp)
		chrome.tabs.update(undefined, { url: "https://docs.google.com/document/d/"+docId})
		console.log(messages)
	}

	const handleFeedback = async(event) => {
		console.log(messages)
		event.preventDefault()
		const gpt_resp = await getGPT([...messages,{role:"user", content: feedback}])
		const finished_update = await rewriteFile(stateDocId, gpt_resp)
		setMessages(old => [...old,{role:"user", content: feedback},{role:"assistant", content: gpt_resp}])
		setFeedback("")
	}

	const rewriteFile = async(docId,text) => {
		const resp = await fetch("https://docs.googleapis.com/v1/documents/"+docId+":batchUpdate",{
			method: "POST",
			headers: new Headers({"Authorization": "Bearer " + token}),
			body: JSON.stringify({
				requests: [
					{
						replaceAllText: {
							replaceText: text,
							containsText: {
								text:messages[messages.length-1].content,
								matchCase: false
							}
						},
					},
				],
			})
		})
		const resp_json = await resp.json()
		console.log(resp_json)
		return
	}

	const writeFile = async(docId,text) => {
		const resp = await fetch("https://docs.googleapis.com/v1/documents/"+docId+":batchUpdate",{
			method: "POST",
			headers: new Headers({"Authorization": "Bearer " + token}),
			body: JSON.stringify({
				requests: [
					{
						insertText: {
							text: text,
							location: {
								index: 1,
							},
						},
					},
				],
			})
		})
		const resp_json = await resp.json()
		console.log(resp_json)
		return
	}
	const createFile = async(event) => {
		const resp = await fetch("https://docs.googleapis.com/v1/documents?title="+title,{
			method: "POST",
			headers: new Headers({"Authorization": "Bearer " + token}),
		})
		const json_resp = await resp.json()
		console.log(json_resp)
		console.log(json_resp.documentId)
		return json_resp.documentId
	}

	return (
		<div style={{/*"backgroundColor":"blue"*/}}>
		<h1>Google Docs + OpenAI</h1>
		<form id="form">
		<input type="text" required id="title" onChange={e => setTitle(e.target.value)}/>
		<button onClick={handleSubmit} disabled={loading && !loaded}>Create New File</button>
		</form>
		<p>If you are not happy with the text created, you can request changes below</p>
		<form id="change-text">
		<input type="text" required id="feedback" onChange={e => setFeedback(e.target.value)}/>
		<button onClick={handleFeedback}>Provide Feeback</button>
		</form>
		<p>Do not close the extension before you have finished making changes</p>
		</div>
	)
}

const container = document.getElementById('react-target');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
export default Page
root.render(<Page />);
