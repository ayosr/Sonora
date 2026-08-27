import { describe, it, expect } from 'vitest'
import { formatDuration, formatBytes, parseFilename, parseTags, initial, hueFor } from '../src/utils/format.js'

describe('formatDuration', () => {
  it('pads seconds under a minute', () => {
    expect(formatDuration(7)).toBe('0:07')
    expect(formatDuration(65)).toBe('1:05')
  })

  it('switches to hours past 3600 seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('falls back to zero for junk input', () => {
    expect(formatDuration(undefined)).toBe('0:00')
    expect(formatDuration(-12)).toBe('0:00')
    expect(formatDuration(NaN)).toBe('0:00')
  })
})

describe('formatBytes', () => {
  it('keeps small values in bytes', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('steps up units', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('parseFilename', () => {
  it('splits artist and title on a hyphen', () => {
    expect(parseFilename('Nujabes - Feather.mp3')).toEqual({ artist: 'Nujabes', title: 'Feather' })
  })

  it('drops a leading track number', () => {
    expect(parseFilename('03 - Nujabes - Feather.flac')).toEqual({ artist: 'Nujabes', title: 'Feather' })
  })

  it('normalizes underscores and marks the artist unknown', () => {
    expect(parseFilename('late_night_take.wav')).toEqual({
      artist: 'Unknown artist',
      title: 'late night take',
    })
  })
})

describe('parseTags', () => {
  it('trims, lower-cases and de-duplicates', () => {
    expect(parseTags(' Focus, jazz ,FOCUS , ')).toEqual(['focus', 'jazz'])
  })

  it('accepts an array as well as a string', () => {
    expect(parseTags(['Chill', 'chill'])).toEqual(['chill'])
  })
})

describe('cover helpers', () => {
  it('returns a stable hue for the same input', () => {
    expect(hueFor('Feather')).toBe(hueFor('Feather'))
  })

  it('always produces a printable initial', () => {
    expect(initial('  feather')).toBe('F')
    expect(initial('')).toBe('?')
  })
})
