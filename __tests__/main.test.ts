import {exec} from '@actions/exec'
import {promises as fs} from 'fs'
import * as fssync from 'fs'
import * as path from 'path'
import {mocked} from 'ts-jest/utils'

import {
  getEnv,
  getSshPath,
  sshKeyscan,
  setupGitAction,
  cleanupGitAction,
  TEMPDIR_NAME
} from '../src/setup-git-action'

jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn()
}))

jest.mock('@actions/exec', () => ({
  exec: jest.fn()
}))

let runnerTempDir: string | null = null
const originalDirectory = process.cwd()
const githubRepository = 'smartlyio/setup-git-action'
const OLD_ENV = process.env
beforeEach(() => {
  jest.resetAllMocks()
  runnerTempDir = fssync.mkdtempSync(
    path.join(originalDirectory, 'runner-temp')
  )
  process.chdir(runnerTempDir)
  process.env = {...OLD_ENV}
  process.env['RUNNER_TEMP'] = runnerTempDir
  process.env['GITHUB_REPOSITORY'] = githubRepository
})

afterEach(() => {
  process.chdir(originalDirectory)
  process.env = OLD_ENV
  fssync.rmdirSync(runnerTempDir as string, {recursive: true})
  runnerTempDir = null
})

describe('test npm-setup-publish', () => {
  describe('get env', () => {
    test('failure', () => {
      delete process.env['RUNNER_TEMP']
      expect(() => {
        getEnv('RUNNER_TEMP')
      }).toThrow()
    })

    test('gets env var', () => {
      expect(getEnv('RUNNER_TEMP')).toEqual(runnerTempDir)
    })
  })

  test('get ssh path', () => {
    const filePath = getSshPath('id_rsa')
    expect(filePath).toEqual(`${runnerTempDir}/${TEMPDIR_NAME}/id_rsa`)
  })

  test('ssh-keyscan', async () => {
    const mockExec = mocked(exec)
    const callArgs = [
      'ssh-keyscan',
      ['-t', 'rsa', 'github.com'],
      expect.objectContaining({
        listeners: expect.objectContaining({
          stdout: expect.anything(),
          stderr: expect.anything()
        })
      })
    ]
    await sshKeyscan()

    expect(mockExec.mock.calls.length).toEqual(1)
    expect(mockExec.mock.calls[0]).toEqual(callArgs)
  })

  test('setupGitAction', async () => {
    const repository = path.join(runnerTempDir as string, 'repo')
    await fs.mkdir(repository, {recursive: true})
    process.chdir(repository)

    const email = 'user@example.com'
    const username = 'Example User'
    const deployKey = 'definitely an ssh key'

    await setupGitAction(email, username, deployKey)

    const sshKeyData = await fs.readFile(
      path.join(runnerTempDir as string, TEMPDIR_NAME, 'id_rsa')
    )
    expect(sshKeyData.toString()).toEqual(`${deployKey}\n`)

    const mockExec = mocked(exec)
    expect(mockExec.mock.calls.length).toEqual(5)

    expect(mockExec.mock.calls[0][0]).toEqual('ssh-keyscan')
    expect(mockExec.mock.calls[1]).toEqual([
      'git',
      ['config', 'user.email', email]
    ])
    expect(mockExec.mock.calls[2]).toEqual([
      'git',
      ['config', 'user.name', username]
    ])
    expect(mockExec.mock.calls[3]).toEqual([
      'git',
      [
        'config',
        'core.sshCommand',
        expect.stringContaining('UserKnownHostsFile')
      ]
    ])
    expect(mockExec.mock.calls[4]).toEqual([
      'git',
      ['remote', 'set-url', 'origin', `git@github.com:${githubRepository}.git`]
    ])
  })

  test('cleanupGitAction', async () => {
    const keyPath = path.join(runnerTempDir as string, TEMPDIR_NAME, 'id_rsa')
    const hostsPath = path.join(
      runnerTempDir as string,
      TEMPDIR_NAME,
      'known_hosts'
    )
    await cleanupGitAction()

    const mockExec = mocked(exec)
    expect(mockExec.mock.calls.length).toEqual(6)

    expect(mockExec.mock.calls[0]).toEqual(['shred', ['-zuf', keyPath]])
    expect(mockExec.mock.calls[1]).toEqual(['shred', ['-zuf', hostsPath]])
    expect(mockExec.mock.calls[2]).toEqual([
      'git',
      ['config', '--unset', 'user.email']
    ])
    expect(mockExec.mock.calls[3]).toEqual([
      'git',
      ['config', '--unset', 'user.name']
    ])
    expect(mockExec.mock.calls[4]).toEqual([
      'git',
      ['config', '--unset', 'core.sshCommand']
    ])
    expect(mockExec.mock.calls[5]).toEqual([
      'git',
      ['remote', 'set-url', 'origin', `https://github.com/${githubRepository}`]
    ])
  })
})
