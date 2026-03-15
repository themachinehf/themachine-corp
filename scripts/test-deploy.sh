#!/bin/bash
# Test script for THEMACHINE Corp. deployment

echo "=== THEMACHINE Deployment Test ==="
echo ""

# Test pages
PAGES=(
  "https://themachine-corp.pages.dev"
  "https://themachine-corp.pages.dev/forge"
  "https://themachine-corp.pages.dev/social"
  "https://themachine-corp.pages.dev/shortform"
  "https://themachine-corp.pages.dev/account"
)

FAILED=0

for url in "${PAGES[@]}"; do
  echo -n "Testing $url ... "
  if curl -sf --max-time 10 "$url" > /dev/null 2>&1; then
    echo "OK"
  else
    echo "FAILED"
    FAILED=1
  fi
done

# Test API
echo -n "Testing API ... "
if curl -sf --max-time 10 -X POST "https://themachine-api.jxs66.workers.dev" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","type":"content"}' > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAILED"
  FAILED=1
fi

# Test subscription API
echo -n "Testing Subscription API ... "
if curl -sf --max-time 10 "https://themachine-subscription.jxs66.workers.dev?email=test@test.com" > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAILED"
  FAILED=1
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo "=== ALL TESTS PASSED ==="
  exit 0
else
  echo "=== SOME TESTS FAILED ==="
  exit 1
fi
