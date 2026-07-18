// js/evaluator.js

/**
 * Heuristically analyzes user code to determine time complexity.
 */
function analyzeTimeComplexity(code, question) {
    // Normalize code by removing comments and extra spaces
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/\s+/g, ' ');

    let complexity = "O(N)"; // Default fallback
    let explanation = "Detected sequential operations on input.";

    // Check for nested loops
    const forMatches = cleanCode.match(/for\s*\(/g) || [];
    const whileMatches = cleanCode.match(/while\s*\(/g) || [];
    const mapMatches = cleanCode.match(/\.map\s*\(/g) || [];
    const forEachMatches = cleanCode.match(/\.forEach\s*\(/g) || [];

    const totalLoopConstructs = forMatches.length + whileMatches.length + mapMatches.length + forEachMatches.length;

    // Simple nested loop check using syntax markers
    const hasNestedLoop =
        /for\s*\(.*for\s*\(/.test(cleanCode) ||
        /for\s*\(.*while\s*\(/.test(cleanCode) ||
        /while\s*\(.*for\s*\(/.test(cleanCode) ||
        /while\s*\(.*while\s*\(/.test(cleanCode) ||
        /\.forEach\s*\(.*\.forEach\s*\(/.test(cleanCode) ||
        /\.map\s*\(.*\.map\s*\(/.test(cleanCode) ||
        /for\s*\(.*\.forEach\s*\(/.test(cleanCode) ||
        /\.forEach\s*\(.*for\s*\(/.test(cleanCode);

    // Check for binary search dividing pattern
    const hasDivideAndConquer =
        /Math\.floor\s*\(.*\/.*2\)/.test(cleanCode) &&
        (/(low|left|l)\s*=\s*(mid|m)\s*\+\s*1/.test(cleanCode) || /(high|right|r)\s*=\s*(mid|m)\s*-\s*1/.test(cleanCode));

    // Check for recursion
    const functionNames = cleanCode.match(/function\s+(\w+)/) || cleanCode.match(/const\s+(\w+)\s*=\s*(\(.*\)|\w+)\s*=>/);
    let isRecursive = false;
    if (functionNames) {
        const fnName = functionNames[1];
        // Check if function calls itself (excluding declaration)
        const selfCalls = cleanCode.split(fnName).length - 1;
        if (selfCalls > 1) {
            isRecursive = true;
        }
    }

    // Check for sorting
    const hasSorting = /\.sort\s*\(/.test(cleanCode);

    if (hasDivideAndConquer) {
        complexity = "O(log N)";
        explanation = "Detected binary search logic (halving search space).";
    } else if (isRecursive && !cleanCode.includes("memo") && !cleanCode.includes("dp") && !cleanCode.includes("cache")) {
        // Naive recursion (like Fibonacci O(2^N) or Permutations O(N!))
        if (question.category === "Recursion" || question.category === "Backtracking") {
            complexity = question.targetTime; // Intended complexity
            explanation = `Recursion/backtracking logic detected. Expected time matches target ${question.targetTime}.`;
        } else {
            complexity = "O(2^N)";
            explanation = "Detected recursion without memoization/caching, which often scales exponentially.";
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

/**
 * Heuristically analyzes user code to estimate space complexity.
 */
function analyzeSpaceComplexity(code, question) {
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/\s+/g, ' ');

    let complexity = "O(1)";
    let explanation = "Using only scalar auxiliary variables (constant space).";

    // Check for recursion (which uses stack space)
    const functionNames = cleanCode.match(/function\s+(\w+)/) || cleanCode.match(/const\s+(\w+)\s*=\s*(\(.*\)|\w+)\s*=>/);
    let isRecursive = false;
    if (functionNames) {
        const fnName = functionNames[1];
        const selfCalls = cleanCode.split(fnName).length - 1;
        if (selfCalls > 1) {
            isRecursive = true;
        }
    }

    // Check for array allocations or structures
    const hasArrayAllocation =
        /new\s+Array\s*\(/.test(cleanCode) ||
        /=\s*\[\s*\]/.test(cleanCode) && (cleanCode.includes(".push(") || cleanCode.includes("fill("));
    const hasHashStructures =
        /new\s+(Map|Set)\s*\(/.test(cleanCode) ||
        /\{\}/.test(cleanCode) && (cleanCode.includes("[") && cleanCode.includes("]="));

    if (isRecursive) {
        complexity = "O(N)";
        explanation = "Uses recursive call stack. Space scales with depth of recursion.";
    } else if (hasArrayAllocation || hasHashStructures) {
        complexity = "O(N)";
        explanation = "Allocates auxiliary storage (arrays, Sets, or Maps) proportional to the input size.";
    }

    // Check if target is higher (e.g. O(N^2))
    if (question.targetSpace === "O(N^2)" && complexity === "O(N)") {
        // If it's a 2D grid DP and they allocated a grid
        if (cleanCode.includes("Array") && cleanCode.match(/new\s+Array/g)?.length > 1) {
            complexity = "O(N^2)";
            explanation = "Allocates a 2D matrix/grid of size proportional to N^2.";
        }
    }

    return { complexity, explanation };
}

/**
 * Runs code inside a sandboxed Web Worker.
 */
function runCodeInWorker(userCode, fnName, testCases, verifyFn) {
    return new Promise((resolve) => {
        // Construct the worker source script
        const workerScript = `
      self.onmessage = function(e) {
        const { userCode, fnName, testCases, verifyFn } = e.data;
        const results = [];
        
        try {
          // Eval the user function
          eval(userCode);
          const userFn = self[fnName] || eval(fnName);
          
          if (typeof userFn !== 'function') {
            throw new Error("Function '" + fnName + "' is not defined or is not a function.");
          }

          // Run test cases
          for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const args = JSON.parse(JSON.stringify(tc.input)); // Deep copy args
            const expected = tc.expected;
            
            const start = performance.now();
            const result = userFn(...args);
            const duration = performance.now() - start;
            
            // Run verification function or standard equivalence
            let passed = false;
            try {
              if (verifyFn) {
                // verifyFn can reference: args, expected, userCode, result
                const checker = new Function('args', 'expected', 'result', verifyFn);
                passed = checker(args, expected, result);
              } else {
                passed = JSON.stringify(result) === JSON.stringify(expected);
              }
            } catch (verifErr) {
              passed = false;
            }

            results.push({
              index: i,
              passed: passed,
              duration: parseFloat(duration.toFixed(3)),
              output: result,
              error: null
            });
          }

          self.postMessage({ success: true, results });
        } catch (err) {
          self.postMessage({ success: false, error: err.message });
        }
      };
    `;

        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        let timeoutId = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve({
                success: false,
                timeout: true,
                error: "Time Limit Exceeded (Execution timed out after 2000ms. Check for infinite loops!)"
            });
        }, 2000);

        worker.onmessage = function (e) {
            clearTimeout(timeoutId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve(e.data);
        };

        worker.onerror = function (err) {
            clearTimeout(timeoutId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve({ success: false, error: err.message });
        };

        // Start execution
        worker.postMessage({
            userCode,
            fnName,
            testCases,
            verifyFn
        });
    });
}

/**
 * Main evaluation function.
 */
async function evaluateQuestion(userCode, question) {
    // Extract function name from starter code
    const fnMatch = question.starterCode.javascript.match(/function\s+(\w+)/);
    const fnName = fnMatch ? fnMatch[1] : null;

    if (!fnName) {
        return {
            score: 0,
            correctnessScore: 0,
            timeScore: 0,
            spaceScore: 0,
            detectedTime: "N/A",
            detectedSpace: "N/A",
            feedback: "Failed to parse starter function name.",
            testResults: []
        };
    }

    // 1. Run Correctness Tests
    const runResult = await runCodeInWorker(userCode, fnName, question.testCases, question.verifyFn);

    let correctnessScore = 0;
    let testResults = [];
    let compileError = null;

    if (runResult.timeout) {
        compileError = runResult.error;
        testResults = question.testCases.map((tc, idx) => ({
            index: idx,
            passed: false,
            duration: 2000,
            output: null,
            error: "Time Limit Exceeded"
        }));
    } else if (!runResult.success) {
        compileError = runResult.error;
        testResults = question.testCases.map((tc, idx) => ({
            index: idx,
            passed: false,
            duration: 0,
            output: null,
            error: runResult.error
        }));
    } else {
        testResults = runResult.results;
        const passedCount = testResults.filter(r => r.passed).length;
        correctnessScore = Math.round((passedCount / testResults.length) * 100);
    }

    // 2. Analyze Time & Space Complexity
    const timeAnalysis = analyzeTimeComplexity(userCode, question);
    const spaceAnalysis = analyzeSpaceComplexity(userCode, question);

    // 3. Score Complexity relative to Target
    // Helper to map complexity to a numeric order of growth
    const complexityRank = {
        "O(1)": 1,
        "O(log N)": 2,
        "O(N)": 3,
        "O(N log N)": 4,
        "O(N^2)": 5,
        "O(N^3)": 6,
        "O(2^N)": 7,
        "O(N!)": 8
    };

    const userTimeRank = complexityRank[timeAnalysis.complexity] || 3;
    const targetTimeRank = complexityRank[question.targetTime] || 3;
    const userSpaceRank = complexityRank[spaceAnalysis.complexity] || 1;
    const targetSpaceRank = complexityRank[question.targetSpace] || 1;

    let timeScore = 100;
    if (userTimeRank > targetTimeRank) {
        // Penalize based on how much worse it is
        const diff = userTimeRank - targetTimeRank;
        timeScore = Math.max(0, 100 - diff * 30);
    }

    let spaceScore = 100;
    if (userSpaceRank > targetSpaceRank) {
        const diff = userSpaceRank - targetSpaceRank;
        spaceScore = Math.max(0, 100 - diff * 40);
    }

    // If code has compilation errors or TLE, complexity scores are nullified
    if (compileError) {
        timeScore = 0;
        spaceScore = 0;
    }

    // Calculate overall score (40% correctness, 30% time complexity, 30% space complexity)
    const score = Math.round((correctnessScore * 0.40) + (timeScore * 0.30) + (spaceScore * 0.30));

    // Build feedback report
    let feedback = "";
    if (compileError) {
        feedback = `**Compilation/Runtime Error:**\n\`${compileError}\`\n\nPlease fix the errors in your code and try again.`;
    } else {
        feedback += `### **Performance & Complexity Analysis**\n\n`;
        feedback += `- **Time Complexity:** Detected **${timeAnalysis.complexity}** (Target: ${question.targetTime}).\n`;
        feedback += `  *Analysis:* ${timeAnalysis.explanation}\n`;
        feedback += `- **Space Complexity:** Detected **${spaceAnalysis.complexity}** (Target: ${question.targetSpace}).\n`;
        feedback += `  *Analysis:* ${spaceAnalysis.explanation}\n\n`;

        if (score === 100) {
            feedback += `🎉 **Perfect!** Your solution is fully correct and optimally designed!`;
        } else if (correctnessScore < 100) {
            feedback += `⚠️ **Correctness Issues:** Some test cases failed. Check edge cases or logical errors in your code.`;
        } else if (timeScore < 100 || spaceScore < 100) {
            feedback += `💡 **Optimization Tip:** Your code passes all tests, but it can be made more optimal. `;
            if (timeScore < 100) {
                feedback += `Try to reduce nested loops to achieve the target **${question.targetTime}** complexity. `;
            }
            if (spaceScore < 100) {
                feedback += `Try to solve it in-place to avoid using extra **${spaceAnalysis.complexity}** memory. `;
            }
        }
    }

    return {
        score,
        correctnessScore,
        timeScore,
        spaceScore,
        detectedTime: timeAnalysis.complexity,
        detectedSpace: spaceAnalysis.complexity,
        feedback,
        testResults
    };
}

if (typeof module !== 'undefined') {
    module.exports = { evaluateQuestion };
}
