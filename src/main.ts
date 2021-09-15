import * as core from '@actions/core'
import {getEnv, setupGitAction, cleanupGitAction} from './setup-git-action'

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
      await setupGitAction(email, username, deployKey)
    } else {
      await cleanupGitAction()
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
