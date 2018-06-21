DIR=$(dirname $0)
EXAMPLES=./$DIR/../docs/examples
ELECTRON=./$DIR/../lib/cli.js
find $EXAMPLES -type f -name "*.lec" | xargs -L 1 $ELECTRON compile
