#!/bin/bash
# OpenClaw Automation Hub - Quick Test
# Run with: bash test-local.sh

set -e

echo "⚡ Automation Hub - Quick Test"
echo "=============================="

PASS=0
FAIL=0

test_case() {
    if [ "$2" = "0" ]; then
        echo "✅ $1"
        PASS=$((PASS + 1))
    else
        echo "❌ $1"
        FAIL=$((FAIL + 1))
    fi
}

# Navigate to project
cd "$(dirname "$0")"

# Test 1: Check files
echo ""
echo "1. Checking files..."

[ -f "package.json" ] && test_case "package.json exists" 0 || test_case "package.json exists" 1
[ -f "src/engine.js" ] && test_case "engine.js exists" 0 || test_case "engine.js exists" 1
[ -f "cli/main.js" ] && test_case "CLI exists" 0 || test_case "CLI exists" 1
[ -f "dashboard/server.js" ] && test_case "Dashboard exists" 0 || test_case "Dashboard exists" 1
[ -f "install.sh" ] && test_case "install.sh exists" 0 || test_case "install.sh exists" 1

# Test 2: Install deps & run tests
echo ""
echo "2. Running tests..."
if npm test 2>&1 | tail -5 | grep -q "All tests passed"; then
    test_case "All tests pass" 0
else
    test_case "All tests pass" 1
fi

# Summary
echo ""
echo "=============================="
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo "🎉 All checks passed!"
    echo ""
    echo "🚀 To start dashboard:"
    echo "   node dashboard/server.js"
    echo ""
    echo "🌐 Then open:"
    echo "   http://localhost:18795"
else
    echo "⚠️  Some checks failed."
fi
