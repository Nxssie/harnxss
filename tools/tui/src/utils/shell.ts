export interface RunResult {
  stdout: string
  stderr: string
  ok: boolean
}

export async function runScript(scriptPath: string): Promise<RunResult> {
  const proc = Bun.spawn(['bun', 'run', scriptPath], {
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env as Record<string, string>,
  })
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const exitCode = await proc.exited
  return { stdout: stdout.trim(), stderr: stderr.trim(), ok: exitCode === 0 }
}

export async function runInstall(
  scriptPath: string,
  cwd: string,
  onLine: (line: string) => void,
): Promise<boolean> {
  const proc = Bun.spawn(['sh', scriptPath], {
    stdout: 'pipe',
    stderr: 'pipe',
    cwd,
    env: process.env as Record<string, string>,
  })

  const decoder = new TextDecoder()

  async function pump(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader()
    let buf = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) onLine(line)
    }
    if (buf) onLine(buf)
  }

  await Promise.all([pump(proc.stdout), pump(proc.stderr)])
  return (await proc.exited) === 0
}
