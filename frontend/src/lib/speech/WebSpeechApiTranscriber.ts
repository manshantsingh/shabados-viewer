class WebSpeechApiTranscriber extends Transcriber {
  private recognition

  constructor( callback: ResultCallback ) {
    super( callback )

    this.recognition = window.SpeechRecognition || window.webkitSpeechRecognition

    this.recognition.onresult = function ( event ) {
      let interim_transcript = ''
      for ( let i = event.resultIndex; i < event.results.length; ++i ) {
        if ( !( event.results[ i ].isFinal ) ) {
          interim_transcript += event.results[ i ][ 0 ].transcript
        }
      }
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
