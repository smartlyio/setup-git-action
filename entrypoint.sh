#!/bin/bash

set -euo pipefail

# Validate input

if [ -z "$GIT_DEPLOY_KEY" ]
then
    echo "No GIT_DEPLOY_KEY environment variable set"
    exit -1
fi

# Setup SSH keys so we can push commits and tags to master branch
mkdir -p $GITHUB_WORKSPACE/.ssh
ssh-keyscan -t rsa github.com > $GITHUB_WORKSPACE/.ssh/known_hosts
echo "$GIT_DEPLOY_KEY" > $GITHUB_WORKSPACE/.ssh/id_rsa
chmod 400 $GITHUB_WORKSPACE/.ssh/id_rsa

# Setup git
git config user.email "$INPUT_EMAIL"
git config user.name "$INPUT_USERNAME"
git config core.sshCommand 'ssh -i $GITHUB_WORKSPACE/.ssh/id_rsa -o UserKnownHostsFile=$GITHUB_WORKSPACE/.ssh/known_hosts'

git remote set-url origin git@github.com:$GITHUB_REPOSITORY.git