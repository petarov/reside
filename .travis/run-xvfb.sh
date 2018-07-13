#!/usr/bin/env bash
set -ev

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  export DISPLAY=:99.0
  sh -e /etc/init.d/xvfb start
  sleep 3
else
  echo xvfb not available on osx!
fi