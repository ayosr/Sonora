import { describe, it, expect } from 'vitest'
import { filterTracks, sortTracks, tagCloud, matchesQuery, nextIndex, prevIndex } from '../src/utils/library.js'

const track = (over = {}) => ({
  id: 't1', title: 'Feather', artist: 'Nujabes', album: 'Modal Soul',
  tags: [], favorite: false, duration: 200, addedAt: 1, ...over,
})

const tracks = [
  track({ id: 'a', title: 'Aruarian Dance', artist: 'Nujabes', tags: ['chill'], addedAt: 3, duration: 250 }),
  track({ id: 'b', title: 'Feather', artist: 'Nujabes', tags: ['chill', 'focus'], addedAt: 1, duration: 300, favorite: true }),
  track({ id: 'c', title: 'Zero', artist: 'Bonobo', tags: ['focus'], addedAt: 2, duration: 180 }),
]

describe('matchesQuery', () => {
  it('is case insensitive and searches tags', () => {
    expect(matchesQuery(tracks[1], 'FOCUS')).toBe(true)
    expect(matchesQuery(tracks[1], 'bonobo')).toBe(false)
  })

  it('matches everything on an empty query', () => {
    expect(matchesQuery(tracks[0], '   ')).toBe(true)
  })
})

describe('filterTracks', () => {
  it('returns all tracks by default', () => {
    expect(filterTracks(tracks)).toHaveLength(3)
  })

  it('filters favorites', () => {
    expect(filterTracks(tracks, { collection: 'favorites' }).map((t) => t.id)).toEqual(['b'])
  })

  it('filters by playlist membership', () => {
    const result = filterTracks(tracks, { collection: 'p1', playlists: { p1: ['a', 'c'] } })
    expect(result.map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('combines tag and query filters', () => {
    const result = filterTracks(tracks, { tag: 'focus', query: 'nujabes' })
    expect(result.map((t) => t.id)).toEqual(['b'])
  })

  it('does not mutate the input array', () => {
    const input = tracks.slice()
    filterTracks(input, { collection: 'recent' })
    expect(input.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('sortTracks', () => {
  it('sorts newest first by default', () => {
    expect(sortTracks(tracks).map((t) => t.id)).toEqual(['a', 'c', 'b'])
  })

  it('sorts titles alphabetically', () => {
    expect(sortTracks(tracks, 'title').map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts longest first by duration', () => {
    expect(sortTracks(tracks, 'duration').map((t) => t.id)).toEqual(['b', 'a', 'c'])
  })
})

describe('tagCloud', () => {
  it('counts tags and orders by usage', () => {
    expect(tagCloud(tracks)).toEqual([
      { name: 'chill', count: 2 },
      { name: 'focus', count: 2 },
    ])
  })
})

describe('queue navigation', () => {
  it('advances through the queue', () => {
    expect(nextIndex(3, 0)).toBe(1)
  })

  it('stops at the end when repeat is off', () => {
    expect(nextIndex(3, 2)).toBeNull()
  })

  it('wraps when repeat is all', () => {
    expect(nextIndex(3, 2, { repeat: 'all' })).toBe(0)
  })

  it('stays put when repeat is one', () => {
    expect(nextIndex(3, 1, { repeat: 'one' })).toBe(1)
  })

  it('re-rolls until shuffle lands on a different track', () => {
    const values = [0.4, 0.9] // 0.4 -> index 1 (the current one), 0.9 -> index 2
    let call = 0
    const random = () => values[call++]
    expect(nextIndex(3, 1, { shuffle: true, random })).toBe(2)
  })

  it('returns the only track when the queue has one item', () => {
    expect(nextIndex(1, 0, { shuffle: true })).toBe(0)
  })

  it('wraps backwards to the end', () => {
    expect(prevIndex(3, 0)).toBe(2)
    expect(prevIndex(0, 0)).toBeNull()
  })
})
