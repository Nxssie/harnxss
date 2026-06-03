import { Box, Text, useInput } from 'ink'
import React, { useState } from 'react'
import { INSTALL_SCRIPT, REPO_ROOT } from '../utils/fs.js'
import { runInstall } from '../utils/shell.js'

const MAX_LINES = 24

export function Install() {
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const [result, setResult] = useState<boolean | null>(null)

  async function run() {
    setLines([])
    setResult(null)
    setRunning(true)
    const ok = await runInstall(INSTALL_SCRIPT, REPO_ROOT, line => {
      setLines(prev => [...prev.slice(-(MAX_LINES - 1)), line])
    })
    setRunning(false)
    setResult(ok)
  }

  useInput((input) => {
    if (input === 'r') void run()
  }, { isActive: !running })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Install</Text>
      <Text color="gray" dimColor>
        Runs install.sh — symlinks configs, regenerates NaN models, bootstraps secrets
      </Text>

      {!running && result === null && (
        <Text color="gray">r — run install.sh</Text>
      )}

      {lines.length > 0 && (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
          {lines.map((line, i) => (
            <Text key={i} color="gray">{line || ' '}</Text>
          ))}
          {running && <Text color="yellow">  running…</Text>}
        </Box>
      )}

      {!running && result === true && (
        <Text color="green">✓ Done. Restart your AI tools and run 'exec fish' to pick up changes.</Text>
      )}
      {!running && result === false && (
        <Text color="red">✗ install.sh exited with an error (see output above).</Text>
      )}

      {!running && result !== null && (
        <Text color="gray">r — run again</Text>
      )}
    </Box>
  )
}
