const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;

export const grammar = '#JSGF V1.0;' // Best guess from default grammar

export let recognition;

export const active = false

export const minConfidence = 0

export function start(){
    if (!this.active){
        this.active = true
        this.recognition.start()
    }
}

export function stop(){
    this.recognition.stop();
    this.active = false
}

export function esDisconnected() {
    this.stop()
}

export function esConnected() {

    this.recognition = new SpeechRecognition();
    const speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(this.grammar, 1);
    this.recognition.grammars = speechRecognitionList;
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const { transcript, confidence } = event.results[last][0]
        const words = transcript.trim();
        if (confidence > this.minConfidence) this.default(words)
        return words
    }

    this.recognition.onspeechend = this.stop

    this.recognition.onnomatch = (event) => {
        console.log('I didnt recognise that.', event);
    }

    this.recognition.onerror = (event) => {
        console.log(`Error occurred in recognition: ${event.error}`);
    }
}


export default (output) => output