_MAKE=.docker/run.sh workspace make

.PHONY: \
    all \
	deps _deps \
	build _build \
	test _test \
	clean _clean

all:

deps:
	${_MAKE} _deps
_deps:
	npm install --from-lock-file

build:
	${_MAKE} _build
_build: _deps
	npm run build

test:
	${_MAKE} _test
_test: _deps
	npm test

clean:
	${_MAKE} _clean
_clean:
	npm run clean
	rm -fr node_modules
