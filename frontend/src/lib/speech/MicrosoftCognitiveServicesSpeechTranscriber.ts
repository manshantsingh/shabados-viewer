import * as sdk from 'microsoft-cognitiveservices-speech-sdk'

import { ResultCallback, Transcriber } from './Transcriber'

export class MicrosoftCognitiveServicesSpeechTranscriber extends Transcriber {
  private speechRecognizer: sdk.SpeechRecognizer

  constructor( callback: ResultCallback, speechKey: string, speechRegion: string ) {
    super( callback )

    const speechConfig = sdk.SpeechConfig.fromSubscription( speechKey, speechRegion )
    speechConfig.speechRecognitionLanguage = 'hi-IN'
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
    this.speechRecognizer = new sdk.SpeechRecognizer( speechConfig, audioConfig )

    this.speechRecognizer.recognizing = ( s, e ) => {
      if ( e.result.reason === sdk.ResultReason.RecognizingSpeech ) {
        console.log( `Interim Transcription: ${e.result.text}` )
        callback( e.result.text )
      }
    }
  }

  StartRecording(): void {
    this.speechRecognizer.startContinuousRecognitionAsync( () => {
      console.log( 'Transcribing speech. Press Ctrl+C to stop.' )
    } )
  }

  StopRecording(): void {
    this.speechRecognizer.stopContinuousRecognitionAsync( () => {
      console.log( 'Transcription stopped.' )
      this.speechRecognizer.close()
    } )
  }
}
