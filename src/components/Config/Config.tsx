import { invoke } from '@tauri-apps/api/tauri'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  MidiDevice
} from '../../utils'
import { KVContext } from '../KVProvider'
import { MainContext } from '../MainProvider'
import Navbar from '../Main/Navbar'

const ConfigPage = styled.div`
  height: 100%;
  width: 100%;
`

const KeyboardContainer = styled.div`
  height: 25vh;
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
`

const Config = () => {
  const { midiDevice, setMidiDevice } = useContext(KVContext)
  const { setChordStack } = useContext(MainContext)
  const unlistenRef = useRef<UnlistenFn>()

  const { t } = useTranslation()

  const [listeningIdx, setListeningIdx] = useState(-1)

  const onLoadCallback = useCallback(async () => {
    if (midiDevice?.id !== listeningIdx) {
      setListeningIdx(-1)
    }

    if (listeningIdx > -1) return

    // TODO: Move this into a MIDIProvider / hook
    const devicesObject = await invoke('list_midi_connections')
    const deviceIds = Object.keys(devicesObject as {})
    let midiInputIdx = 0
    const foundMidiId = deviceIds.find((d) => Number(d) === midiDevice?.id)
    let foundMidi: MidiDevice | undefined
    if (foundMidiId) {
      foundMidi = {
        id: Number(foundMidiId),
        name: Object.values(devicesObject as {})[Number(foundMidiId)],
      } as MidiDevice | undefined
      midiInputIdx = Number(foundMidiId)
    }

    invoke('open_midi_connection', { inputIdx: midiInputIdx })

    listen('midi_message', (event) => {
      const payload = event.payload as { message: number[] }
      const [status, note, velocity] = payload.message

      const command = status & 0xf0

      if (command === 0x90) {
        setChordStack?.((cs) => [...cs, note])
      }

      if (command === 0x80 || velocity === 0) {
        // remove midiNumber from chordStack
        setChordStack?.((cs) => {
          const removalIdx = cs.indexOf(note)
          if (removalIdx > -1) {
            cs.splice(removalIdx, 1)
          }

          return cs
        })

      }
    })
      .then((ul) => (unlistenRef.current = ul))
      .catch(console.error)

    console.log('Connected & listening to MIDI device...')
    setListeningIdx(midiInputIdx)
    setMidiDevice?.(foundMidi || { id: 0 })
  }, [setListeningIdx, midiDevice, setMidiDevice, listeningIdx, setChordStack])


  useEffect(() => {
    onLoadCallback()
  }, [onLoadCallback])

  useEffect(() => {
    const unlisten = async () => {
      unlistenRef.current?.()
    }
    return () => {
      unlisten()
    }
  }, [])

  return (
    <ConfigPage>
      <Navbar />
    </ConfigPage>
  )
}

export default Config
