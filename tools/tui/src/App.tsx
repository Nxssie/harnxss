import { Box, Text, useApp, useInput } from 'ink'
import React, { useState } from 'react'
import { ApiKeys } from './screens/ApiKeys.js'
import { Dashboard } from './screens/Dashboard.js'
import { Install } from './screens/Install.js'
import { Models } from './screens/Models.js'

type Screen = 'dashboard' | 'keys' | 'models' | 'install'

const TABS: Array<{ id: Screen; label: string; num: string }> = [
  { id: 'dashboard', label: 'Dashboard', num: '1' },
  { id: 'keys',      label: 'API Keys',  num: '2' },
  { id: 'models',    label: 'Models',    num: '3' },
  { id: 'install',   label: 'Install',   num: '4' },
]

export function App() {
  const { exit } = useApp()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [locked, setLocked] = useState(false)

  useInput((input, key) => {
    if (input === 'q') { exit(); return }
    if (key.tab) {
      const idx = TABS.findIndex(t => t.id === screen)
      setScreen(TABS[(idx + 1) % TABS.length]!.id)
      return
    }
    if (input === '1') { setScreen('dashboard'); return }
    if (input === '2') { setScreen('keys'); return }
    if (input === '3') { setScreen('models'); return }
    if (input === '4') { setScreen('install'); return }
  }, { isActive: !locked })

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">harnxss  </Text>
        {TABS.map(t => {
          const active = t.id === screen
          return (
            <Text key={t.id} color={active ? 'cyan' : 'gray'}>
              {active ? `[${t.num}.${t.label}]` : `${t.num}.${t.label}`}
              {'  '}
            </Text>
          )
        })}
        <Text color="gray">tab:next  q:quit</Text>
      </Box>

      <Box paddingX={2} flexDirection="column">
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'keys' && (
          <ApiKeys
            onLock={() => setLocked(true)}
            onUnlock={() => setLocked(false)}
          />
        )}
        {screen === 'models' && <Models />}
        {screen === 'install' && <Install />}
      </Box>
    </Box>
  )
}
