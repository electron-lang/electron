DIR=$(dirname $0)
EXAMPLES=./$DIR/../docs/examples
ELECTRON=./$DIR/../lib/cli.js
find $EXAMPLES -type f -name "*.lec" | grep --invert-match -E '.d.lec$' \
    | xargs -L 1 $ELECTRON compile
