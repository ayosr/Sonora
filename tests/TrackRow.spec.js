import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TrackRow from '../src/components/TrackRow.vue'

const track = {
  id: 't1', title: 'Feather', artist: 'Nujabes', album: 'Modal Soul',
  tags: ['chill'], favorite: false, duration: 245, addedAt: 1,
}

const mountRow = (props = {}) => mount(TrackRow, { props: { track, ...props } })

describe('TrackRow', () => {
  it('renders the title, artist, tags and a formatted length', () => {
    const row = mountRow()
    expect(row.find('.t-title').text()).toBe('Feather')
    expect(row.find('.t-sub').text()).toContain('Nujabes')
    expect(row.find('.t-sub').text()).toContain('chill')
    expect(row.find('.t-dur').text()).toBe('4:05')
  })

  it('emits play when the row is clicked', async () => {
    const row = mountRow()
    await row.trigger('click')
    expect(row.emitted('play')).toHaveLength(1)
  })

  it('emits play on Enter so the list is keyboard operable', async () => {
    const row = mountRow()
    await row.trigger('keyup.enter')
    expect(row.emitted('play')).toHaveLength(1)
  })

  it('shows the equalizer only while this track is the one playing', () => {
    expect(mountRow().find('.bars').exists()).toBe(false)
    expect(mountRow({ active: true, playing: true }).find('.bars').exists()).toBe(true)
  })

  it('marks the active row so the styling can respond', () => {
    expect(mountRow({ active: true }).classes()).toContain('playing')
  })

  it('emits favorite, edit and remove without also emitting play', async () => {
    const row = mountRow()
    const buttons = row.findAll('.row-acts button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    await buttons[2].trigger('click')
    expect(row.emitted('favorite')).toHaveLength(1)
    expect(row.emitted('edit')).toHaveLength(1)
    expect(row.emitted('remove')).toHaveLength(1)
    expect(row.emitted('play')).toBeUndefined()
  })

  it('labels the row for screen readers', () => {
    expect(mountRow().attributes('aria-label')).toBe('Play Feather by Nujabes')
  })
})
