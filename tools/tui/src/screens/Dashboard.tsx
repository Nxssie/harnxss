import { Box, Text } from 'ink'
import React, { useEffect, useState } from 'react'
import {
  getNanApiKey,
  getToolStatuses,
  maskKey,
  readModels,
  type NaNConfig,
  type ToolStatus,
} from '../utils/fs.js'

export function Dashboard() {
  const [tools, setTools] = useState<ToolStatus[]>([])
  const [models, setModels] = useState<NaNConfig | null>(null)
  const key = getNanApiKey()

  useEffect(() => {
    setTools(getToolStatuses())
    readModels().then(setModels).catch(() => null)
  }, [])

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold>NaN API Key</Text>
        <Box gap={2}>
          <Text color={key ? 'green' : 'red'}>{key ? '●' : '○'}</Text>
          <Text color={key ? 'white' : 'red'}>
            {key ? maskKey(key) : 'not set — go to API Keys (2)'}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold>Models</Text>
        {models ? (
          <Box gap={2}>
            <Text color="cyan">{models.models.length} loaded</Text>
            <Text color="gray">{models.models.map(m => m.id).join('  ')}</Text>
          </Box>
        ) : (
          <Text color="gray">loading…</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text bold>Tools</Text>
        <Box flexDirection="row" gap={3} flexWrap="wrap">
          {tools.map(t => (
            <Box key={t.id} gap={1}>
              <Text color={t.installed ? 'green' : 'gray'}>{t.installed ? '●' : '○'}</Text>
              <Text color={t.installed ? 'white' : 'gray'}>{t.name}</Text>
            </Box>
          ))}
        </Box>
      </Box>

      <Text color="gray" dimColor>Tab / 1-4 to navigate  q to quit</Text>
    </Box>
  )
}
