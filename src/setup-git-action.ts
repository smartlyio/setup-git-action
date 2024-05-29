import * as core from '@actions/core'
import * as exec from '@actions/exec'

import * as path from 'path'
import * as process from 'process'
import {promises as fs} from 'fs'

export function getEnv(name: string): string {
  const value: string | undefined = process.env[name]
  if (value === undefined) {
    throw new Error(`No ${name} environment variable set`)
  }
  return value
}

export function getSshPath(subdir: string, name: string): string {
  const temp = getEnv('RUNNER_TEMP')
  return path.join(temp, subdir, name)
}

export async function sshKeyscan(): Promise<string> {
  let stderr = ''
  let stdout = ''
  const options: exec.ExecOptions = {}
  options.listeners = {
    stdout: (data: Buffer) => {
      stdout += data.toString()
    },
    stderr: (data: Buffer) => {
      stderr += data.toString()
    }
  }
  await exec.exec('ssh-keyscan', ['-t', 'rsa', 'github.com'], options)
  core.info(`Stderr from ssh-keyscan: ${stderr}`)
  return stdout
}

export async function setupGitAction(
  email: string,
  username: string,
  deployKey: string,
  directory: string
): Promise<void> {
  const keyPath = getSshPath(directory, 'id_rsa')
  const knownHostsPath = getSshPath(directory, 'known_hosts')
  const sshDir = path.dirname(keyPath)
  await fs.mkdir(sshDir, {recursive: true})

  core.info(`Writing deploy key to ${keyPath}`)
  await fs.writeFile(keyPath, `${deployKey}\n`, {mode: 0o400})

  core.info('Running ssh-keyscan for github.com')
  const githubKey = await sshKeyscan()
  await fs.writeFile(knownHostsPath, githubKey)

  core.info('Setting up git config for commit user')
  await exec.exec('git', ['config', 'user.email', email])
  await exec.exec('git', ['config', 'user.name', username])

  core.info('Setting up git config for ssh command')
  const sshCommand = `ssh -i ${sshDir}/id_rsa -o UserKnownHostsFile=${sshDir}/known_hosts`
  await exec.exec('git', ['config', 'core.sshCommand', sshCommand])

  core.info('Setting git remote url')
  const repoFullName = process.env['GITHUB_REPOSITORY']
  const origin = `git@github.com:${repoFullName}.git`
  await exec.exec('git', ['remote', 'set-url', 'origin', origin])
}

export async function cleanupGitAction(directory: string): Promise<void> {
  const keyPath = getSshPath(directory, 'id_rsa')
  const knownHosts = getSshPath(directory, 'known_hosts')

  core.info('Shredding files containing secrets')
  await exec.exec('shred', ['-zuf', keyPath])
  await exec.exec('shred', ['-zuf', knownHosts])

  core.info('Unsettings git config')
  await exec.exec('git', ['config', '--unset', 'user.email'])
  await exec.exec('git', ['config', '--unset', 'user.name'])
  await exec.exec('git', ['config', '--unset', 'core.sshCommand'])

  core.info('Resetting git remote url')
  const repoFullName = process.env['GITHUB_REPOSITORY']
  const origin = `https://github.com/${repoFullName}`
  await exec.exec('git', ['remote', 'set-url', 'origin', origin])
}
