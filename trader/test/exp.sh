#!/bin/bash
# usage: exp.sh <outfile> <seedFrom> <seedTo> <days> "label|setup" ...
cp dist/engine_bundle.js /tmp/bundle_$$.js; export BUNDLE=/tmp/bundle_$$.js
out=$1; a=$2; b=$3; d=$4; shift 4
for e in "$@"; do
  label="${e%%|*}"; setup="${e#*|}"
  BYKIND=1 node test/sweep.mjs $a $b $d "$setup" "$label" >> $out 2>&1
done
echo DONE >> $out
