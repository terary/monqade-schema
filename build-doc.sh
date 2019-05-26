#/bin/bash

#documentation build  src/** src/monqade-base-src/classes/** -f html -o docs
jsdoc -c .jsdoc.json  --verbose 

# builds tutorial - but layout not ideal
#jsdoc -t jsdoc-minami/ -u tutorial-raw  src/* --verbose -d docs

# not builds tutorial - but layout  ideal
#jsdoc -t jsdoc-minami/ -u tutorial-raw  src/* --verbose -d docs