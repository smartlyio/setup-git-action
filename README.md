
# setup-git-action

Action to setup git. It configures git access so it can commit and push to branches. Git with SSH authentication is used so that it is possible to push to protected branches.

## Inputs

| Input            | Required  | Description                                                       |
|------------------|-----------|-------------------------------------------------------------------|
| email            | no        | Email to use with git                                             |
| username         | no        | Username to use with git                                          |
| workingDirectory | no        | Relative path to a git working directory in which to authenticate |

## Environment variables

| Variable          | Required  | Description
|-------------------|-----------|-------------------------------------------------------------|
| GIT_DEPLOY_KEY    | yes       | RSA key to authenticate to git repository                   |

## Usage example

The action is used as follows:

```yaml
- uses: smartlyio/setup-git-action@v1
  env:
    GIT_DEPLOY_KEY: ${{ secrets.GIT_DEPLOY_KEY }}
```
