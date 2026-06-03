import { Box, Text, useInput } from 'ink'
import React, { useEffect, useState } from 'react'
import {
  GEN_SCRIPT,
  readModels,
  writeModels,
  type NaNConfig,
  type NaNModel,
} from '../utils/fs.js'
import { runScript } from '../utils/shell.js'

export function Models() {
  const [config, setConfig] = useState<NaNConfig | null>(null)
  const [selected, setSelected] = useState(0)
  const [regenRunning, setRegenRunning] = useState(false)
  const [regenMsg, setRegenMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    readModels().then(setConfig).catch(() => null)
  }, [])

  useInput((input, key) => {
    if (!config) return

    if (key.upArrow) {
      setSelected(s => Math.max(0, s - 1))
      return
    }
    if (key.downArrow) {
      setSelected(s => Math.min(config.models.length - 1, s + 1))
      return
    }

    if (input === 'd' && config.models.length > 1) {
      const updated = { ...config, models: config.models.filter((_, i) => i !== selected) }
      setConfig(updated)
      setSelected(s => Math.min(s, updated.models.length - 1))
      void writeModels(updated)
      setRegenMsg(null)
      return
    }

    if (input === 'r') {
      setRegenMsg(null)
      setRegenRunning(true)
      void runScript(GEN_SCRIPT).then(result => {
        setRegenMsg(
          result.ok
            ? { ok: true, text: 'Configs regenerated.' }
            : { ok: false, text: result.stderr || result.stdout || 'gen.ts failed' },
        )
        setRegenRunning(false)
      })
    }
  }, { isActive: !regenRunning })

  if (!config) return <Text color="gray">loading…</Text>

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={2}>
        <Text bold>Models</Text>
        <Text color="gray" dimColor>{config.baseUrl}</Text>
      </Box>

      <Box flexDirection="column">
        {config.models.map((model, i) => (
          <ModelRow key={model.id} model={model} isSelected={i === selected} />
        ))}
      </Box>

      {regenRunning && <Text color="yellow">running gen.ts…</Text>}
      {regenMsg && (
        <Text color={regenMsg.ok ? 'green' : 'red'}>
          {regenMsg.ok ? '✓' : '✗'} {regenMsg.text}
        </Text>
      )}

      {!regenRunning && (
        <Text color="gray">↑↓ select  d delete  r regenerate configs</Text>
      )}
    </Box>
  )
}

function ModelRow({ model, isSelected }: { model: NaNModel; isSelected: boolean }) {
  const ctx =
    model.contextWindow >= 1_000_000
      ? `${model.contextWindow / 1_000_000}M ctx`
      : `${Math.round(model.contextWindow / 1_000)}k ctx`
  const out =
    model.maxTokens >= 1_000
      ? `${Math.round(model.maxTokens / 1_000)}k out`
      : `${model.maxTokens} out`

  return (
    <Box gap={2}>
      <Text color={isSelected ? 'cyan' : 'gray'}>{isSelected ? '▶' : ' '}</Text>
      <Text bold={isSelected} color={isSelected ? 'white' : 'gray'}>
        {model.id}
      </Text>
      <Text color="gray">{model.name}</Text>
      <Text color="gray" dimColor>
        {ctx}  {out}
      </Text>
    </Box>
  )
}
