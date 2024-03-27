#!/bin/sh

docker compose run --build --entrypoint /usr/bin/env --remove-orphans --rm "$@"
ex="$?"
docker compose down --remove-orphans
exit "${ex}"
