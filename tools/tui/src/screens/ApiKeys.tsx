import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import React, { useState } from 'react'
import { GEN_SCRIPT, getNanApiKey, maskKey, updateNanApiKey } from '../utils/fs.js'
import { runScript } from '../utils/shell.js'

type Step = 'view' | 'input' | 'confirm' | 'running' | 'done' | 'error'

interface Props {
  onLock: () => void
  onUnlock: () => void
}

export function ApiKeys({ onLock, onUnlock }: Props) {
  const [step, setStep] = useState<Step>('view')
  const [newKey, setNewKey] = useState('')
  const [message, setMessage] = useState('')

  function startInput() {
    setNewKey('')
    onLock()
    setStep('input')
  }

  function cancelInput() {
    onUnlock()
    setStep('view')
    setNewKey('')
  }

  function submitKey() {
    if (!newKey.trim()) return
    onUnlock()
    setStep('confirm')
  }

  async function confirmRotate() {
    setStep('running')
    try {
      await updateNanApiKey(newKey.trim())
      const result = await runScript(GEN_SCRIPT)
      if (result.ok) {
        setMessage("Key updated and configs regenerated. Run 'exec fish' to apply in this shell.")
      } else {
        setMessage(result.stderr || result.stdout || 'gen.ts failed with no output')
      }
      setStep(result.ok ? 'done' : 'error')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
      setStep('error')
    }
  }

  // Escape during text input
  useInput((_, key) => {
    if (key.escape) cancelInput()
  }, { isActive: step === 'input' })

  // All other steps
  useInput((input, key) => {
    if (step === 'view' && input === 'r') startInput()
    if (step === 'confirm') {
      if (input === 'y') void confirmRotate()
      if (input === 'n' || key.escape) setStep('view')
    }
    if ((step === 'done' || step === 'error') && (key.return || input === ' ')) {
      setStep('view')
    }
  }, { isActive: step !== 'input' && step !== 'running' })

  const currentKey = getNanApiKey()

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>NaN API Key</Text>

      {step === 'view' && (
        <Box flexDirection="column" gap={1}>
          <Box gap={2}>
            <Text color="gray">Current:</Text>
            <Text color={currentKey ? 'white' : 'red'}>
              {currentKey ? maskKey(currentKey) : '(not set)'}
            </Text>
          </Box>
          <Text color="gray">r — rotate key</Text>
        </Box>
      )}

      {step === 'input' && (
        <Box flexDirection="column" gap={1}>
          <Text color="gray">New key (Enter to confirm, Esc to cancel):</Text>
          <Box gap={1}>
            <Text color="cyan">›</Text>
            <TextInput
              value={newKey}
              onChange={setNewKey}
              onSubmit={submitKey}
              mask="*"
            />
          </Box>
        </Box>
      )}

      {step === 'confirm' && (
        <Box flexDirection="column" gap={1}>
          <Box gap={2}>
            <Text>Rotate to</Text>
            <Text color="cyan">{maskKey(newKey.trim())}</Text>
            <Text>?</Text>
          </Box>
          <Text color="gray">Updates secrets.fish and regenerates all tool configs.</Text>
          <Box gap={3}>
            <Text><Text bold color="green">y</Text> confirm</Text>
            <Text><Text bold color="red">n</Text> cancel</Text>
          </Box>
        </Box>
      )}

      {step === 'running' && (
        <Text color="yellow">updating key and running gen.ts…</Text>
      )}

      {step === 'done' && (
        <Box flexDirection="column" gap={1}>
          <Text color="green">✓ Done</Text>
          <Text color="gray">{message}</Text>
          <Text color="gray" dimColor>Enter to go back</Text>
        </Box>
      )}

      {step === 'error' && (
        <Box flexDirection="column" gap={1}>
          <Text color="red">✗ Error</Text>
          <Text color="gray">{message}</Text>
          <Text color="gray" dimColor>Enter to go back</Text>
        </Box>
      )}
    </Box>
  )
}
