#!/bin/bash

set -euo pipefail

# Directory outside docker container corresponding to $HOME here
EXT_HOME=/home/runner/work/_temp/_github_home

# Validate input

if [ -z "$GIT_DEPLOY_KEY" ]
then
    echo "No GIT_DEPLOY_KEY environment variable set"
    exit 255
fi

# Setup SSH keys so we can push commits and tags to master branch
mkdir -p "$HOME/.ssh"
ssh-keyscan -t rsa github.com > "$HOME/.ssh/known_hosts"
echo "$GIT_DEPLOY_KEY" > "$HOME/.ssh/id_rsa"
chmod 400 "$HOME/.ssh/id_rsa"

# Setup git
git config user.email "$INPUT_EMAIL"
git config user.name "$INPUT_USERNAME"
git config core.sshCommand "ssh -i ${EXT_HOME}/.ssh/id_rsa -o UserKnownHostsFile=${EXT_HOME}/.ssh/known_hosts"

git remote set-url origin "git@github.com:$GITHUB_REPOSITORY.git"
