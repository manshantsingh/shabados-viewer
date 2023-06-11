function fuzzyMatchAllResults( needle: string, haystack: string ) : [number[], number[]] {
  const arrayLength = haystack.length + 1
  let prev: number[] = Array<number>( arrayLength ).fill( 0 )
  let prevBacktrace: number[] = Array<number>( arrayLength ).fill( 0 ).map( ( _, i ) => i )

  let current: number[] = Array<number>( arrayLength ).fill( 0 )
  let currentBacktrace: number[] = Array<number>( arrayLength ).fill( 0 )

  for ( let i = 0; i < needle.length; i += 1 ) {
    const cost = 1 // TODO: update this to use different cost based on what the character is.

    current[ 0 ] = prev[ 0 ] + 1
    currentBacktrace[ 0 ] = 0

    for ( let j = 0; j < arrayLength - 1; j += 1 ) {
      // cost of deleting. If you make this the default option, it will
      // encapsulate the longest match found with backtrace (including garbage chars on edge)
      current[ j + 1 ] = current[ j ] + cost
      currentBacktrace[ j + 1 ] = currentBacktrace[ j ]

      // cost of substitute if needed. If you make this the default option, it will
      // decrease the collection of garbage characters on the edges in
      // the match found with backtrace
      const substitutionCost = prev[ j ] + ( needle[ i ] !== haystack[ j ] ? cost : 0 )
      if ( current[ j + 1 ] > substitutionCost ) {
        current[ j + 1 ] = substitutionCost
        currentBacktrace[ j + 1 ] = prevBacktrace[ j ]
      }

      // cost of inserting
      const insertionCost = prev[ j + 1 ] + cost
      if ( current[ j + 1 ] > insertionCost ) {
        current[ j + 1 ] = insertionCost
        currentBacktrace[ j + 1 ] = prevBacktrace[ j + 1 ]
      }
    }
    const temp = prev
    prev = current
    current = temp

    const tempBacktrace = prevBacktrace
    prevBacktrace = currentBacktrace
    currentBacktrace = tempBacktrace
  }
  return [ prev, prevBacktrace ]
}

export const fuzzyMatch = ( needle: string, haystack: string ) : [number, number, number] => {
  const tuple = fuzzyMatchAllResults( needle, haystack )
  const prev = tuple[ 0 ]
  const prevBacktrace = tuple[ 1 ]

  // get the farthest match with same value
  // Note: don't use prev[0] as that value is just to assist the Dynamic Programming
  let pos = prev.length - 1
  for ( let i = prev.length - 2; i > 0; i -= 1 ) {
    if ( prev[ pos ] > prev[ i ] ) {
      pos = i
    }
  }

  // (cost, startPosition, endPosition) where the match is substring [startPosition, endPosition)
  return [ prev[ pos ], prevBacktrace[ pos ], pos ]
}
