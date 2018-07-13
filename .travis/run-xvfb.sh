#!/bin/bash
set -ev

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  export DISPLAY=:99.0
  sh -e /etc/init.d/xvfb start
  # give xvfb some time to start
  sleep 3
else
  echo xvfb not available on osx!
fi