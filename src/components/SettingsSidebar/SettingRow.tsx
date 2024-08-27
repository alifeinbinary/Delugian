import { invoke } from '@tauri-apps/api/tauri'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import UncheckedIcon from 'remixicon-react/CheckboxBlankCircleLineIcon'
import CheckedIcon from 'remixicon-react/CheckboxCircleFillIcon'
import styled from 'styled-components'
import { MidiDevice, PTSettingType } from '../../utils'
import {
  AVAILABLE_LANGUAGES,
  SupportedLanguagesType,
} from '../../utils/languages'
import { KVContext } from '../KVProvider'

const SettingRowContainer = styled.div`
  margin: 24px 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1em;
  cursor: pointer;
  z-index: 15;

  .settings-row-label {
    color: rgba(255, 255, 255, 0.7);
  }
`

interface SettingRowProps {
  setting: PTSettingType
  value: string | boolean | number | undefined
}

const SettingRow = ({ setting, value }: SettingRowProps) => {
  const {
    setShowKeyboard,
    setMidiDevice: setConnectedMidiDevice,
    setLanguage,
    setIsSentryOn,
    // setPianoSound,
  } = useContext(KVContext)
  const { t } = useTranslation()

  const [midiDevices, setMidiDevices] = useState<MidiDevice[]>([])

  // TODO: This will probably fit in a future hook
  useEffect(() => {
    if (setting.key === 'midi-input-id') {
      invoke('list_midi_connections').then((devices) => {
        const devicesObject = devices as { [key: string]: string }
        const midiConnectionKeys = Object.keys(devicesObject as {})
        setMidiDevices([])
        midiConnectionKeys.forEach((ck) => {
          setMidiDevices((md) => [
            ...md,
            {
              id: Number(ck),
              name: devicesObject[ck],
            } as MidiDevice,
          ])
        })
      })
    }
  }, [setting.key])

  // Render Dropdown inputs
  if (setting.key === 'midi-input-id') {
    if (!Array.isArray(midiDevices)) return null
    const connectedMidiDevice = midiDevices[Number(value)]

    return (
      <SettingRowContainer>
        <span className='settings-row-label'>
          {t(`settings.options.${setting.key}`)}
        </span>
        <Select
          options={midiDevices.map((d) => ({
            value: d.id,
            label: d.name || `Name: N/A :: ID: ${d.id}`,
          }))}
          value={{
            value: connectedMidiDevice?.id || 0,
            label: connectedMidiDevice?.name || 'N/A',
          }}
          onChange={(e) => {
            try {
              const newMidiDevice = midiDevices.find((md) => md.id === e?.value)
              if (newMidiDevice) {
                setConnectedMidiDevice?.(newMidiDevice)
              }
            } catch (e) {
              console.error('There was an error connecting to MIDI', e)
            }
          }}
          className='text-black'
        />
        <button onClick={() => { invoke('sysex_receive', { sysexReceiveMessage: 'tauri' }) }}>Send</button>
        <button onClick={() => { invoke('sysex_send').then((message) => console.log(message)) }}>Receive</button>
      </SettingRowContainer>
    )
  } else if (setting.key === 'language') {
    return (
      <SettingRowContainer>
        <span className='settings-row-label'>
          {t(`settings.options.${setting.key}`)}
        </span>
        <Select
          options={Object.keys(AVAILABLE_LANGUAGES).map((code) => ({
            label: AVAILABLE_LANGUAGES[code as SupportedLanguagesType].name,
            value: code,
          }))}
          value={{
            label: AVAILABLE_LANGUAGES[value as SupportedLanguagesType].name,
            value,
          }}
          onChange={(e) => {
            setLanguage?.(e?.value as SupportedLanguagesType)
          }}
        />
      </SettingRowContainer>
    )
  }

  // Render boolean options
  return (
    <SettingRowContainer
      onClick={() => {
        switch (setting.key) {
          case 'show-keyboard':
            setShowKeyboard?.((v) => !v)
            break
          case 'is-sentry-on':
            setIsSentryOn?.((v) => !v)
            break
        }
      }}
    >
      <span className='settings-row-label'>
        {t(`settings.options.${setting.key}`)}
      </span>

      {value ? (
        <CheckedIcon color='white' size={32} />
      ) : (
        <UncheckedIcon color='white' size={32} />
      )}
    </SettingRowContainer>
  )
}

export default SettingRow
