import * as core from '@actions/core'
import {cleanupGitAction, getEnv, setupGitAction} from './setup-git-action'
import {randomUUID} from 'crypto'

function isPost(): boolean {
  // Will be false if the environment variable doesn't exist; true if it does.
  return !!process.env['STATE_isPost']
}

async function run(): Promise<void> {
  try {
    const post = isPost()
    core.saveState('isPost', post)
    const email: string = core.getInput('email')
    const username: string = core.getInput('username')
    const deployKey: string = getEnv('GIT_DEPLOY_KEY')

    if (!post) {
      const directory = `_github_home_${randomUUID()}`
      core.saveState('directory', directory)
      await setupGitAction(email, username, deployKey, directory)
    } else {
      const directory = core.getState('directory')
      await cleanupGitAction(directory)
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
