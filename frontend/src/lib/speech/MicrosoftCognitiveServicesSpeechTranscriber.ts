import axios from 'axios'
import { EventEmitter } from 'events'
import { AudioConfig, ResultReason, SpeechConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk'

import { MSFT_AUTH_API } from '../consts'
import { ResultCallback, Transcriber } from './Transcriber'

export class MicrosoftCognitiveServicesSpeechTranscriber extends Transcriber {
  private speechRecognizer: SpeechRecognizer | undefined

  constructor( callback: ResultCallback, speechKey: string, speechRegion: string ) {
    super( callback )

    axios.get( `${MSFT_AUTH_API}/${speechKey}/${speechRegion}` )
      .then( ( response ) => {
        this.InitRecognizer( response.data.token, speechRegion, callback )
      } )
      .catch( ( err ) => console.error( 'Failed to retrieve auth token for MSFT speech to text', err ) )
  }

  InitRecognizer( token: string, speechRegion: string, callback: ResultCallback ): void {
    const speechConfig = SpeechConfig.fromAuthorizationToken(
      token,
      speechRegion
    )
    speechConfig.speechRecognitionLanguage = 'hi-IN'
    const audioConfig = AudioConfig.fromDefaultMicrophoneInput()
    this.speechRecognizer = new SpeechRecognizer( speechConfig, audioConfig )

    this.speechRecognizer.recognizing = ( s, e ) => {
      if ( e.result.reason === ResultReason.RecognizingSpeech ) {
        console.log( `Interim Transcription: ${e.result.text}` )
        callback( e.result.text )
      }
    }
  }

  StartRecording(): void {
    this.speechRecognizer?.startContinuousRecognitionAsync( () => {
      console.log( 'Transcribing speech. Press Ctrl+C to stop.' )
    } )
  }

  StopRecording(): void {
    this.speechRecognizer?.stopContinuousRecognitionAsync( () => {
      console.log( 'Transcription stopped.' )
      this.speechRecognizer?.close()
    } )
  }
}
