// test_complexity.js
const { QUESTIONS } = require('./js/questions.js');

// Standard static code analysis functions from js/evaluator.js (adapted for node testing)
function analyzeTimeComplexity(code, question) {
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/\s+/g, ' ');
    let complexity = "O(N)";
    let explanation = "Detected sequential operations.";

    const forMatches = cleanCode.match(/for\s*\(/g) || [];
    const whileMatches = cleanCode.match(/while\s*\(/g) || [];
    const mapMatches = cleanCode.match(/\.map\s*\(/g) || [];
    const forEachMatches = cleanCode.match(/\.forEach\s*\(/g) || [];
    const totalLoopConstructs = forMatches.length + whileMatches.length + mapMatches.length + forEachMatches.length;

    const hasNestedLoop =
        /for\s*\(.*for\s*\(/.test(cleanCode) ||
        /for\s*\(.*while\s*\(/.test(cleanCode) ||
        /while\s*\(.*for\s*\(/.test(cleanCode) ||
        /while\s*\(.*while\s*\(/.test(cleanCode) ||
        /\.forEach\s*\(.*\.forEach\s*\(/.test(cleanCode) ||
        /\.map\s*\(.*\.map\s*\(/.test(cleanCode) ||
        /for\s*\(.*\.forEach\s*\(/.test(cleanCode) ||
        /\.forEach\s*\(.*for\s*\(/.test(cleanCode);

    const hasDivideAndConquer =
        /Math\.floor\s*\(.*\/.*2\)/.test(cleanCode) &&
        (/(low|left|l)\s*=\s*(mid|m)\s*\+\s*1/.test(cleanCode) || /(high|right|r)\s*=\s*(mid|m)\s*-\s*1/.test(cleanCode));

    const functionNames = cleanCode.match(/function\s+(\w+)/) || cleanCode.match(/const\s+(\w+)\s*=\s*(\(.*\)|\w+)\s*=>/);
    let isRecursive = false;
    if (functionNames) {
        const fnName = functionNames[1];
        const selfCalls = cleanCode.split(fnName).length - 1;
        if (selfCalls > 1) {
            isRecursive = true;
        }
    }

    const hasSorting = /\.sort\s*\(/.test(cleanCode);

    if (hasDivideAndConquer) {
        complexity = "O(log N)";
        explanation = "Detected binary search logic (halving search space).";
    } else if (isRecursive && !cleanCode.includes("memo") && !cleanCode.includes("dp") && !cleanCode.includes("cache")) {
        if (question.category === "Recursion" || question.category === "Backtracking") {
            complexity = question.targetTime;
            explanation = `Recursion/backtracking logic detected. Expected time matches target ${question.targetTime}.`;
        } else {
            complexity = "O(2^N)";
            explanation = "Detected recursion without memoization.";
        }
    } else if (hasNestedLoop) {
        complexity = "O(N^2)";
        explanation = "Detected nested loops iterating over the inputs.";
    } else if (hasSorting) {
        complexity = "O(N log N)";
        explanation = "Detected array sorting operation (.sort()).";
    } else if (totalLoopConstructs === 1) {
        complexity = "O(N)";
        explanation = "Detected a single iteration loop over the inputs.";
    } else if (totalLoopConstructs === 0 && !isRecursive) {
        complexity = "O(1)";
        explanation = "No loops or recursion detected. Operations run in constant time.";
    }

    return { complexity, explanation };
}

// Test codes
const optimalTwoSum = `
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
`;

const bruteForceTwoSum = `
function twoSum(nums, target) {
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return [];
}
`;

const binarySearchCode = `
function search(nums, target) {
    let low = 0, high = nums.length - 1;
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        if (nums[mid] === target) return mid;
        else if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
`;

console.log("=== Running Complexity Analysis Tests ===");

const twoSumQ = QUESTIONS.find(q => q.id === "q1");
const searchQ = QUESTIONS.find(q => q.id === "q5");

console.log("\nTesting TwoSum Optimal Code:");
const res1 = analyzeTimeComplexity(optimalTwoSum, twoSumQ);
console.log("Detected Complexity:", res1.complexity);
console.log("Explanation:", res1.explanation);

console.log("\nTesting TwoSum Brute Force Code:");
const res2 = analyzeTimeComplexity(bruteForceTwoSum, twoSumQ);
console.log("Detected Complexity:", res2.complexity);
console.log("Explanation:", res2.explanation);

console.log("\nTesting Binary Search Code:");
const res3 = analyzeTimeComplexity(binarySearchCode, searchQ);
console.log("Detected Complexity:", res3.complexity);
console.log("Explanation:", res3.explanation);

console.log("\nTesting correctness verification on TwoSum optimal code:");
// Test cases from questions.js
const testCases = twoSumQ.testCases;
let allPassed = true;
try {
    // Bind function globally to mirror the Web Worker environment
    global.twoSum = (function () {
        eval(optimalTwoSum);
        return twoSum;
    })();
    testCases.forEach((tc, idx) => {
        const res = global.twoSum(tc.input[0], tc.input[1]);

        // Run verifyFn logic
        const args = tc.input;
        const expected = tc.expected;
        const result = res;

        const checker = new Function('args', 'expected', 'result', twoSumQ.verifyFn);
        const passed = checker(args, expected, result);
        console.log(`Test case ${idx + 1}: Expected ${JSON.stringify(tc.expected)}, Got ${JSON.stringify(res)} -> PASSED: ${passed}`);
        if (!passed) allPassed = false;
    });
} catch (err) {
    console.error("Test execution failed:", err);
    allPassed = false;
}

console.log("\nOverall Correctness test status:", allPassed ? "SUCCESS" : "FAILURE");
