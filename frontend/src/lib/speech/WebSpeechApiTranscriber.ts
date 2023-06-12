import { result } from 'lodash'

import { ResultCallback, Transcriber } from './Transcriber'

export class WebSpeechApiTranscriber extends Transcriber {
  private recognition

  private transcriptionSoFar = ''

  constructor( callback: ResultCallback ) {
    super( callback )

    const recognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new recognitionClass()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'hi-IN'

    this.recognition.onstart = function () {
      // recognizing = true
      console.log( 'starting recording' )
    }

    this.recognition.onerror = function ( event ) {
      // handle errors
      console.log( 'onerror in recording: ', event )
    }

    this.recognition.onend = function () {
      console.log( 'ending recording' )
    }

    this.recognition.onresult = function ( event ) {
    //   console.log( 'onresult:', result )

      //   let interim_transcript = ''
      //   for ( let i = event.resultIndex; i < event.results.length; ++i ) {
      //     if ( !( event.results[ i ].isFinal ) ) {
      //       interim_transcript += event.results[ i ][ 0 ].transcript
      //     }
      //   }

      let interim_transcript = ''
      for ( let i = event.resultIndex; i < event.results.length; ++i ) {
        // console.log( 'interim: ', event.results[ i ][ 0 ].transcript )
        interim_transcript += event.results[ i ][ 0 ].transcript

        if ( event.results[ i ].isFinal ) {
        //   prevTranscription = interim_transcript
          console.log( 'final result: ', event.results[ i ][ 0 ].transcript )
        //   toggleRecord()
        //   return
        }
      }
      console.log( 'result received: ', interim_transcript )
      callback( interim_transcript )
    }
  }

  StartRecording(): void {
    this.recognition.start()
  }

  StopRecording(): void {
    this.recognition.stop()
  }
}
