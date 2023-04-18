/* eslint-disable jsx-a11y/click-events-have-key-events */

import Fuse from 'fuse.js'
import { stripEndings, stripVishraams, toHindi, toUnicode } from 'gurmukhi-utils'
import { useAtomValue } from 'jotai'
import { mapValues } from 'lodash'
import { SkipBack, SkipForward } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { GlobalHotKeys } from 'react-hotkeys'
import { createUseStyles } from 'react-jss'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { useDebounce } from 'use-debounce'

import AsciiGurmukhi, { Form } from '../components/AsciiGurmukhi'
import Button from '../components/Button'
import Content from '../components/Content'
import Error from '../components/Error'
import Layout from '../components/Layout'
import Loader from '../components/Loader'
import Section from '../components/Section'
import theme from '../helpers/theme'
import { PAGE_API } from '../lib/consts'
import { savePosition } from '../lib/utils'
import { SourcePageResponse, SourcesResponse } from '../types/api'
import { zoom } from './Interface'

const useStyles = createUseStyles( {
  sourceContent: {
    // placeholder so it can be used in nested sourceControls definition
  },
  sourceControls: {
    position: 'fixed',
    bottom: 0,
    zIndex: 0,
    borderTop: '1px solid rgba(0,0,0,0.1)',
    background: theme.Shader,
    width: '100%',
    '& + $sourceContent': {
      paddingBottom: `calc(${theme.Gutter})`,
    },
  },

  line: {
    padding: [ theme.Gap, theme.BlankSpace ],
    borderRadius: theme.Gap,
    outline: [ '2px', 'solid', 'transparent' ],
    transition: theme.Normally,
    '&:first-child': {
      marginLeft: 0,
    },
    '&:hover': {
      backgroundColor: theme.Shader,
    },
  },

  active: {
    color: theme.Blue,
    '& > span > span': {
      filter: 'brightness(1.25) saturate(1.25)',
    },
  },

  focused: {
    outlineColor: theme.Blue,
  },

  controlsContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },

  '@media (prefers-color-scheme: dark)': {
    line: {
      '&:hover': {
        backgroundColor: theme.Highlighter,
      },
    },
    active: {
      color: theme.BlueDarkScheme,
      '& > span > span': {
        filter: 'brightness(1.25) saturate(1.5)',
      },
    },
    focused: {
      outlineColor: theme.BlueDarkScheme,
    },
    sourceControls: {
      background: theme.Highlighter,
    },
  },

  '@media (pointer: coarse)': {
    sourceControls: {
      paddingBottom: `calc(${theme.Gutter} / 2)`,
      '& + $sourceContent': {
        paddingBottom: `calc(${theme.Gutter} * 1.5)`,
      },
    },
  },
} )

type SourceViewParams = 'page' | 'source' | 'line'

const KEY_MAP = {
  activatePreviousLine: [ 'left' ],
  activateNextLine: [ 'right' ],
  focusPreviousLine: [ 'shift+tab' ],
  focusNextLine: [ 'tab' ],
  firstLine: [ 'home' ],
  lastLine: [ 'end' ],
  openLine: [ 'enter' ],
  previousPage: [ 'shift+left', 'pageup' ],
  nextPage: [ 'shift+right', 'pagedown' ],
  toggleRecord: [ 'space' ],
}

const BLOCKED_KEYS = [ 'Tab', 'PageUp', 'PageDown' ]
const blockKeys = ( event: KeyboardEvent ) => {
  if ( BLOCKED_KEYS.some( ( key ) => event.key === key ) ) event.preventDefault()
}

type SourceViewProps = {
  sources: SourcesResponse,
}

const fuseOptions = {
  // isCaseSensitive: false,
  // includeScore: false,
  shouldSort: true,
  // includeMatches: false,
  // findAllMatches: false,
  // minMatchCharLength: 1,
  // location: 0,
  // threshold: 0.6,
  // distance: 100,
  // useExtendedSearch: false,
  // ignoreLocation: false,
  // ignoreFieldNorm: false,
  // fieldNormWeight: 1,
  keys: [ 'hindi' ],
}

const SourceView = ( { sources }: SourceViewProps ) => {
  const {
    line: rawLine = 0,
    page: rawPage = 1,
    source,
  } = mapValues( useParams<SourceViewParams>(), Number )

  const [ page ] = useDebounce( rawPage, 100 )
  const [ line ] = useDebounce( rawLine, 100 )

  const lineRefs = useRef<{ [key: number]: HTMLElement }>( {} )

  const {
    data: lines,
    error: err,
  } = useSWR<SourcePageResponse, Error>( `${PAGE_API}/${source}/page/${rawPage}` )

  const loading = !lines

  useEffect( () => {
    if ( !loading ) return

    lineRefs.current = {}
  }, [ loading ] )

  useEffect( () => {
    console.log( 'MSK_useEffect::blockKeys' )
    document.addEventListener( 'keydown', blockKeys )

    return () => document.removeEventListener( 'keydown', blockKeys )
  }, [] )

  useEffect( () => {
    console.log( 'MSK_useEffect::source=', source, ', page=', page, ', line=', line )
    savePosition( source, page, line )
  }, [ source, page, line ] )

  useEffect( () => {
    console.log( 'MSK_useEffect::line=', line, ', lines=', lines )
    if ( !lines ) return
    lineRefs.current[ line ]?.scrollIntoView( { block: 'center' } )

    // MSK code start
    const dict = []
    for ( let i = 0; i < lines?.length; i++ ) {
      dict.push( {
        id: i,
        hindi: toHindi( stripEndings( stripVishraams( toUnicode( lines[ i ].gurmukhi ) ) ) ),
      } )
    }

    console.log( 'new dict: ', dict )
    fuse = new Fuse( dict, fuseOptions )
  }, [ line, lines ] )

  const navigate = useNavigate()
  const location = useLocation()

  const { length, pageNameGurmukhi } = sources.find( ( { id } ) => id === source ) ?? {}

  const activatePageLine = ( page: number, line: number ) => {
    navigate( `/sources/${source}/page/${page}/line/${line}`, { replace: true } )

    console.log( 'lineRefs: ', lineRefs, ', line: ', line )
    lineRefs.current[ line ].scrollIntoView( { block: 'center' } )
  }

  const activateLine = ( line: number ) => {
    activatePageLine( rawPage, line )
  }

  const focusLine = ( line: number ) => {
    lineRefs.current[ line ].focus()
    lineRefs.current[ line ].scrollIntoView( { block: 'center' } )
  }

  const goToPage = ( nextPage: number ) => {
    if ( nextPage && nextPage !== rawPage ) navigate( `/sources/${source}/page/${nextPage}/line/0`, { replace: true } )
  }

  const nextPage = () => {
    if ( rawPage < length! ) goToPage( rawPage + 1 )
  }

  const previousPage = () => {
    if ( rawPage > 1 ) goToPage( rawPage - 1 )
  }

  const activateNextLine = () => {
    if ( rawLine < lines!.length - 1 ) activateLine( rawLine + 1 )
    else nextPage()
  }

  const activatePreviousLine = () => {
    if ( rawLine > 0 ) activateLine( rawLine - 1 )
    else previousPage()
  }

  const focusNextLine = () => {
    if ( rawLine < lines!.length - 1 ) focusLine( rawLine + 1 )
    else nextPage()
  }

  const focusPreviousLine = () => {
    if ( rawLine > 0 ) focusLine( rawLine - 1 )
    else previousPage()
  }

  const toggleRecord = () => {
    if ( recognizing ) {
      recognition.stop()
      return
    }
    recognition.start()
  }

  const firstLine = () => focusLine( 0 )
  const lastLine = () => focusLine( lines!.length - 1 )

  const onLineEnter = () => navigate( `${location.pathname}/view` )

  const handlers = {
    activatePreviousLine,
    activateNextLine,
    focusPreviousLine,
    focusNextLine,
    firstLine,
    lastLine,
    previousPage,
    nextPage,
    toggleRecord,
    openLine: onLineEnter,
  }

  const classes = useStyles()

  const zoomValue = useAtomValue( zoom )

  // MSK code start
  const dict = []
  for ( let i = 0; i < lines?.length; i++ ) {
    dict.push( {
      id: i,
      hindi: toHindi( stripEndings( stripVishraams( toUnicode( lines[ i ].gurmukhi ) ) ) ),
    } )
  }

  console.log( 'dict: ', dict )

  let fuse = new Fuse( dict, fuseOptions )

  // Setup SpeechRecognition
  let recognizing = false

  const recognition = new window.webkitSpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'hi-IN'

  recognition.onstart = function () {
    recognizing = true
    console.log( 'starting recording' )
  }

  recognition.onerror = function ( event ) {
    // handle errors
  }

  recognition.onend = function () {
    recognizing = false
    console.log( 'stopping recording' )
    // recognition.start()
  }

  recognition.onresult = function ( event ) {
    let interim_transcript = ''
    for ( let i = event.resultIndex; i < event.results.length; ++i ) {
      if ( event.results[ i ].isFinal ) {
        console.log( 'final: ', event.results[ i ][ 0 ].transcript )
      } else {
        console.log( 'interim: ', event.results[ i ][ 0 ].transcript )
        interim_transcript += event.results[ i ][ 0 ].transcript
      }
    }

    const fuseSearchResult = fuse.search( interim_transcript )
    console.log( 'MSK: ', "interim_transcript='", interim_transcript, "', and result=", fuseSearchResult )

    if ( fuseSearchResult.length > 0 ) {
      activatePageLine( page, fuseSearchResult[ 0 ].item.id )
    }
  }
  // MSK code start

  return (
    <Layout>
      {length! > 1 && (
        <div className={classes.sourceControls}>
          <Content>
            <div className={classes.controlsContent}>
              <Link to={page > 1 ? `/sources/${source}/page/${page - 1}/line/0` : '#'}>
                <Button disabled={page <= 1}>
                  <SkipBack />
                </Button>
              </Link>

              <span>
                {pageNameGurmukhi ? <AsciiGurmukhi text={`${pageNameGurmukhi} `} /> : ''}
                <AsciiGurmukhi text={rawPage.toString()} />
                {' '}
                /
                {' '}
                <AsciiGurmukhi text={length.toString()} />
              </span>

              <Link to={page < length! ? `/sources/${source}/page/${page + 1}/line/0` : ''}>
                <Button disabled={page >= length!}>
                  <SkipForward />
                </Button>
              </Link>
            </div>
          </Content>
        </div>
      )}
      <div className={classes.sourceContent}>
        <Content>
          <Section>
            {err && <Error err={err} />}
            {!( lines || err ) && <Loader />}

            <GlobalHotKeys keyMap={KEY_MAP} handlers={handlers} allowChanges>
              {lines?.map( ( { id, gurmukhi }, index: number ) => (
                <Link
                  key={id}
                  to={`/sources/${source}/page/${page}/line/${index}/view`}
                  ref={( ref ) => { lineRefs.current[ index ] = ref! }}
                  className={`${classes.line} ${rawLine === index ? classes.active : ''}`}
                  style={{ fontSize: `${zoomValue}rem` }}
                  data-cy="go-to-home-value"
                >
                  <AsciiGurmukhi form={Form.syntactical} text={gurmukhi} />
                </Link>
              ) )}
            </GlobalHotKeys>
          </Section>
        </Content>
      </div>
    </Layout>
  )
}

export default SourceView
