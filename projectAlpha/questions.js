// js/questions.js
const QUESTIONS = [
    // --- EASY QUESTIONS (1-20) ---
    {
        id: "q1",
        title: "Two Sum",
        company: "Google",
        difficulty: "Easy",
        category: "Arrays",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\nYou can return the answer in any order.",
        inputFormat: "nums: Array of numbers, target: number",
        outputFormat: "Array of two indices",
        constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
        targetTime: "O(N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function twoSum(nums, target) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[2, 7, 11, 15], 9], expected: [0, 1], inputSize: 4 },
            { input: [[3, 2, 4], 6], expected: [1, 2], inputSize: 3 },
            { input: [[3, 3], 6], expected: [0, 1], inputSize: 2 }
        ],
        verifyFn: `
      const res = twoSum(args[0], args[1]);
      if (!Array.isArray(res) || res.length !== 2) return false;
      const sortedRes = [...res].sort((a,b) => a-b);
      const sortedExp = [...expected].sort((a,b) => a-b);
      return sortedRes[0] === sortedExp[0] && sortedRes[1] === sortedExp[1];
    `
    },
    {
        id: "q2",
        title: "Reverse Words in a String",
        company: "Microsoft",
        difficulty: "Easy",
        category: "Strings",
        description: "Given an input string `s`, reverse the order of the words.\nA word is defined as a sequence of non-space characters. The words in `s` will be separated by at least one space.\nReturn a string of the words in reverse order concatenated by a single space, without leading or trailing spaces.",
        inputFormat: "s: string",
        outputFormat: "string with reversed words",
        constraints: "1 <= s.length <= 10^4\ns contains English letters, digits, and spaces.",
        targetTime: "O(N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function reverseWords(s) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["the sky is blue"], expected: "blue is sky the", inputSize: 15 },
            { input: ["  hello world  "], expected: "world hello", inputSize: 15 },
            { input: ["a good   example"], expected: "example good a", inputSize: 16 }
        ],
        verifyFn: "return reverseWords(args[0]).trim() === expected.trim();"
    },
    {
        id: "q3",
        title: "Valid Parentheses",
        company: "Facebook",
        difficulty: "Easy",
        category: "Stacks & Queues",
        description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.",
        inputFormat: "s: string",
        outputFormat: "boolean",
        constraints: "1 <= s.length <= 10^4\ns consists of parentheses only.",
        targetTime: "O(N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function isValid(s) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["()"], expected: true, inputSize: 2 },
            { input: ["()[]{}"], expected: true, inputSize: 6 },
            { input: ["(]"], expected: false, inputSize: 2 }
        ],
        verifyFn: "return isValid(args[0]) === expected;"
    },
    {
        id: "q4",
        title: "Merge Two Sorted Lists",
        company: "Amazon",
        difficulty: "Easy",
        category: "Linked Lists",
        description: "You are given the heads of two sorted linked lists `list1` and `list2` (represented as flat arrays for simplicity in this sandbox).\nMerge the two lists in a one sorted list. The list should be made by splicing together the nodes of the first two lists.\nReturn the merged list as an array.",
        inputFormat: "list1: array, list2: array",
        outputFormat: "merged array",
        constraints: "0 <= list1.length, list2.length <= 100",
        targetTime: "O(N + M)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function mergeTwoLists(list1, list2) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4], inputSize: 6 },
            { input: [[], []], expected: [], inputSize: 0 },
            { input: [[], [0]], expected: [0], inputSize: 1 }
        ],
        verifyFn: "return JSON.stringify(mergeTwoLists(args[0], args[1])) === JSON.stringify(expected);"
    },
    {
        id: "q5",
        title: "Binary Search",
        company: "Adobe",
        difficulty: "Easy",
        category: "Searching",
        description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\nYou must write an algorithm with `O(log n)` runtime complexity.",
        inputFormat: "nums: Array of numbers, target: number",
        outputFormat: "number (index of target)",
        constraints: "1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4",
        targetTime: "O(log N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function search(nums, target) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4, inputSize: 6 },
            { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1, inputSize: 6 }
        ],
        verifyFn: "return search(args[0], args[1]) === expected;"
    },
    {
        id: "q6",
        title: "Remove Duplicates from Sorted Array",
        company: "Google",
        difficulty: "Easy",
        category: "Arrays",
        description: "Given an integer array `nums` sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same.\nReturn the number of unique elements `k`. Modify the input array `nums` such that the first `k` elements contain the unique elements in their original order.",
        inputFormat: "nums: array",
        outputFormat: "number (k unique elements count)",
        constraints: "1 <= nums.length <= 3 * 10^4\n-100 <= nums[i] <= 100",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function removeDuplicates(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 1, 2]], expected: 2, inputSize: 3 },
            { input: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], expected: 5, inputSize: 10 }
        ],
        verifyFn: "const arr = [...args[0]]; const k = removeDuplicates(arr); return k === expected;"
    },
    {
        id: "q7",
        title: "Count Set Bits",
        company: "Oracle",
        difficulty: "Easy",
        category: "Bit Manipulation",
        description: "Write a function that takes an unsigned integer `n` and returns the number of set bits (also known as Hamming weight or 1s in binary representation).",
        inputFormat: "n: number",
        outputFormat: "number",
        constraints: "0 <= n <= 2^31 - 1",
        targetTime: "O(1)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function hammingWeight(n) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [11], expected: 3, inputSize: 11 }, // 11 is 1011 (3 bits)
            { input: [128], expected: 1, inputSize: 128 },
            { input: [0], expected: 0, inputSize: 1 }
        ],
        verifyFn: "return hammingWeight(args[0]) === expected;"
    },
    {
        id: "q8",
        title: "Single Number",
        company: "Amazon",
        difficulty: "Easy",
        category: "Bit Manipulation",
        description: "Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one.\nYou must implement a solution with a linear runtime complexity and use only constant extra space.",
        inputFormat: "nums: array",
        outputFormat: "number",
        constraints: "1 <= nums.length <= 3 * 10^4\n-3 * 10^4 <= nums[i] <= 3 * 10^4",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function singleNumber(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[2, 2, 1]], expected: 1, inputSize: 3 },
            { input: [[4, 1, 2, 1, 2]], expected: 4, inputSize: 5 },
            { input: [[1]], expected: 1, inputSize: 1 }
        ],
        verifyFn: "return singleNumber(args[0]) === expected;"
    },
    {
        id: "q9",
        title: "Valid Anagram",
        company: "Facebook",
        difficulty: "Easy",
        category: "Strings",
        description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
        inputFormat: "s: string, t: string",
        outputFormat: "boolean",
        constraints: "1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function isAnagram(s, t) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["anagram", "nagaram"], expected: true, inputSize: 7 },
            { input: ["rat", "car"], expected: false, inputSize: 3 }
        ],
        verifyFn: "return isAnagram(args[0], args[1]) === expected;"
    },
    {
        id: "q10",
        title: "Reverse Linked List",
        company: "Microsoft",
        difficulty: "Easy",
        category: "Linked Lists",
        description: "Given the head of a singly linked list (represented as an array), reverse the list, and return the reversed list (as an array).",
        inputFormat: "head: array",
        outputFormat: "reversed array",
        constraints: "0 <= head.length <= 5000\n-5000 <= head[i] <= 5000",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function reverseList(head) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1], inputSize: 5 },
            { input: [[1, 2]], expected: [2, 1], inputSize: 2 },
            { input: [[]], expected: [], inputSize: 0 }
        ],
        verifyFn: "return JSON.stringify(reverseList(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q11",
        title: "Fizz Buzz",
        company: "Zoho",
        difficulty: "Easy",
        category: "Math",
        description: "Given an integer `n`, return a string array `answer` (1-indexed) where:\n- `answer[i] === 'FizzBuzz'` if `i` is divisible by 3 and 5.\n- `answer[i] === 'Fizz'` if `i` is divisible by 3.\n- `answer[i] === 'Buzz'` if `i` is divisible by 5.\n- `answer[i] === i.toString()` if none of the above conditions are true.",
        inputFormat: "n: number",
        outputFormat: "Array of strings",
        constraints: "1 <= n <= 10^4",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function fizzBuzz(n) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [3], expected: ["1", "2", "Fizz"], inputSize: 3 },
            { input: [5], expected: ["1", "2", "Fizz", "4", "Buzz"], inputSize: 5 },
            { input: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"], inputSize: 15 }
        ],
        verifyFn: "return JSON.stringify(fizzBuzz(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q12",
        title: "Palindrome Linked List",
        company: "Adobe",
        difficulty: "Easy",
        category: "Linked Lists",
        description: "Given the head of a singly linked list (represented as an array), return `true` if it is a palindrome or `false` otherwise.",
        inputFormat: "head: array",
        outputFormat: "boolean",
        constraints: "1 <= head.length <= 10^5\n0 <= head[i] <= 9",
        targetTime: "O(N)",
        targetSpace: "O(1) auxiliary",
        starterCode: {
            javascript: "function isPalindrome(head) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 2, 2, 1]], expected: true, inputSize: 4 },
            { input: [[1, 2]], expected: false, inputSize: 2 }
        ],
        verifyFn: "return isPalindrome(args[0]) === expected;"
    },
    {
        id: "q13",
        title: "Maximum Depth of Binary Tree",
        company: "Facebook",
        difficulty: "Easy",
        category: "Trees",
        description: "Given the root of a binary tree (represented as a level-order array with nulls, e.g., `[3, 9, 20, null, null, 15, 7]`), return its maximum depth.\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
        inputFormat: "root: array",
        outputFormat: "number (depth)",
        constraints: "0 <= nodes <= 10^4\n-100 <= Node.val <= 100",
        targetTime: "O(N)",
        targetSpace: "O(H) recursion stack",
        starterCode: {
            javascript: "function maxDepth(root) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[3, 9, 20, null, null, 15, 7]], expected: 3, inputSize: 7 },
            { input: [[1, null, 2]], expected: 2, inputSize: 3 }
        ],
        verifyFn: "return maxDepth(args[0]) === expected;"
    },
    {
        id: "q14",
        title: "Search a 2D Matrix",
        company: "Amazon",
        difficulty: "Easy",
        category: "Searching",
        description: "You are given an `m x n` integer matrix `matrix` with the following two properties:\n1. Each row is sorted in non-decreasing order.\n2. The first integer of each row is greater than the last integer of the previous row.\nGiven an integer `target`, return `true` if `target` is in `matrix` or `false` otherwise.",
        inputFormat: "matrix: 2D array, target: number",
        outputFormat: "boolean",
        constraints: "m == matrix.length, n == matrix[i].length\n1 <= m, n <= 100\n-10^4 <= matrix[i][j], target <= 10^4",
        targetTime: "O(log(M * N))",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function searchMatrix(matrix, target) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], expected: true, inputSize: 12 },
            { input: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], expected: false, inputSize: 12 }
        ],
        verifyFn: "return searchMatrix(args[0], args[1]) === expected;"
    },
    {
        id: "q15",
        title: "Key Pair (Two Sum Check)",
        company: "Adobe",
        difficulty: "Easy",
        category: "Arrays",
        description: "Given an array `arr` of positive integers and a value `x`, check if there exists a pair in the array whose sum is exactly `x`. Return `true` if it exists, otherwise `false`.",
        inputFormat: "arr: array, x: number",
        outputFormat: "boolean",
        constraints: "1 <= arr.length <= 10^5\n1 <= arr[i], x <= 10^5",
        targetTime: "O(N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function hasKeyPair(arr, x) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 4, 45, 6, 10, 8], 16], expected: true, inputSize: 6 },
            { input: [[1, 2, 4, 3, 6], 11], expected: false, inputSize: 5 }
        ],
        verifyFn: "return hasKeyPair(args[0], args[1]) === expected;"
    },
    {
        id: "q16",
        title: "Missing Number in Array",
        company: "Microsoft",
        difficulty: "Easy",
        category: "Arrays",
        description: "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing from the array.",
        inputFormat: "nums: array",
        outputFormat: "number",
        constraints: "n == nums.length\n1 <= n <= 10^4\n0 <= nums[i] <= n",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function missingNumber(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[3, 0, 1]], expected: 2, inputSize: 3 },
            { input: [[0, 1]], expected: 2, inputSize: 2 },
            { input: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8, inputSize: 9 }
        ],
        verifyFn: "return missingNumber(args[0]) === expected;"
    },
    {
        id: "q17",
        title: "Longest Common Prefix",
        company: "Google",
        difficulty: "Easy",
        category: "Strings",
        description: "Write a function to find the longest common prefix string amongst an array of strings.\nIf there is no common prefix, return an empty string `\"\"`.",
        inputFormat: "strs: Array of strings",
        outputFormat: "string",
        constraints: "1 <= strs.length <= 200\n0 <= strs[i].length <= 200\nstrs[i] consists of only lowercase English letters.",
        targetTime: "O(N * M) where N is array size and M is prefix length",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function longestCommonPrefix(strs) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [["flower", "flow", "flight"]], expected: "fl", inputSize: 15 },
            { input: [["dog", "racecar", "car"]], expected: "", inputSize: 10 }
        ],
        verifyFn: "return longestCommonPrefix(args[0]) === expected;"
    },
    {
        id: "q18",
        title: "Power of Two",
        company: "Amazon",
        difficulty: "Easy",
        category: "Bit Manipulation",
        description: "Given an integer `n`, return `true` if it is a power of two. Otherwise, return `false`.\nAn integer `n` is a power of two if there exists an integer `x` such that `n == 2^x`.",
        inputFormat: "n: number",
        outputFormat: "boolean",
        constraints: "-2^31 <= n <= 2^31 - 1",
        targetTime: "O(1)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function isPowerOfTwo(n) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [1], expected: true, inputSize: 1 },
            { input: [16], expected: true, inputSize: 16 },
            { input: [3], expected: false, inputSize: 3 }
        ],
        verifyFn: "return isPowerOfTwo(args[0]) === expected;"
    },
    {
        id: "q19",
        title: "Implement strStr()",
        company: "Facebook",
        difficulty: "Easy",
        category: "Strings",
        description: "Given two strings `needle` and `haystack`, return the index of the first occurrence of `needle` in `haystack`, or `-1` if `needle` is not part of `haystack`.",
        inputFormat: "haystack: string, needle: string",
        outputFormat: "number (index)",
        constraints: "1 <= haystack.length, needle.length <= 10^4\nhaystack and needle consist of lowercase English characters.",
        targetTime: "O(N * M)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function strStr(haystack, needle) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["sadbutsad", "sad"], expected: 0, inputSize: 9 },
            { input: ["leetcode", "leeto"], expected: -1, inputSize: 8 }
        ],
        verifyFn: "return strStr(args[0], args[1]) === expected;"
    },
    {
        id: "q20",
        title: "Validate BST Check",
        company: "Microsoft",
        difficulty: "Easy",
        category: "Trees",
        description: "Given the level-order representation of a binary tree as an array, return `true` if it is a valid Binary Search Tree (BST), or `false` otherwise.",
        inputFormat: "tree: array",
        outputFormat: "boolean",
        constraints: "1 <= nodes <= 10^4",
        targetTime: "O(N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function isValidBST(tree) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[2, 1, 3]], expected: true, inputSize: 3 },
            { input: [[5, 1, 4, null, null, 3, 6]], expected: false, inputSize: 7 }
        ],
        verifyFn: "return isValidBST(args[0]) === expected;"
    },

    // --- MEDIUM QUESTIONS (21-40) ---
    {
        id: "q21",
        title: "Subarray with Given Sum",
        company: "Google",
        difficulty: "Medium",
        category: "Arrays",
        description: "Given an unsorted array `arr` of non-negative integers and an integer `sum`, find a continuous subarray that adds to a given `sum`.\nReturn the 1-based start and end indices of the subarray as an array. If no such subarray exists, return `[-1]`.",
        inputFormat: "arr: array, sum: number",
        outputFormat: "Array of 1-based indices or [-1]",
        constraints: "1 <= arr.length <= 10^5\n0 <= arr[i] <= 10^5\n0 <= sum <= 10^9",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function subarraySum(arr, sum) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 2, 3, 7, 5], 12], expected: [2, 4], inputSize: 5 }, // 2+3+7 = 12
            { input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 15], expected: [1, 5], inputSize: 10 }
        ],
        verifyFn: "return JSON.stringify(subarraySum(args[0], args[1])) === JSON.stringify(expected);"
    },
    {
        id: "q22",
        title: "Kadane's Algorithm",
        company: "Amazon",
        difficulty: "Medium",
        category: "Arrays",
        description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
        inputFormat: "nums: array",
        outputFormat: "number (max subarray sum)",
        constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function maxSubArray(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6, inputSize: 9 }, // [4, -1, 2, 1] sum is 6
            { input: [[1]], expected: 1, inputSize: 1 },
            { input: [[5, 4, -1, 7, 8]], expected: 23, inputSize: 5 }
        ],
        verifyFn: "return maxSubArray(args[0]) === expected;"
    },
    {
        id: "q23",
        title: "Search in Rotated Sorted Array",
        company: "Adobe",
        difficulty: "Medium",
        category: "Searching",
        description: "There is an integer array `nums` sorted in ascending order (with distinct values).\nPrior to being passed to your function, `nums` is possibly rotated at an unknown pivot index `k`.\nGiven the array `nums` after the rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.\nYou must write an algorithm with `O(log n)` runtime complexity.",
        inputFormat: "nums: array, target: number",
        outputFormat: "number (index)",
        constraints: "1 <= nums.length <= 5000\n-10^4 <= nums[i] <= 10^4\n-10^4 <= target <= 10^4",
        targetTime: "O(log N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function searchRotated(nums, target) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4, inputSize: 7 },
            { input: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1, inputSize: 7 }
        ],
        verifyFn: "return searchRotated(args[0], args[1]) === expected;"
    },
    {
        id: "q24",
        title: "Coin Change",
        company: "Microsoft",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\nYou may assume that you have an infinite number of each kind of coin.",
        inputFormat: "coins: array, amount: number",
        outputFormat: "number (min coins)",
        constraints: "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
        targetTime: "O(N * A) where N is coins size and A is amount",
        targetSpace: "O(A)",
        starterCode: {
            javascript: "function coinChange(coins, amount) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 2, 5], 11], expected: 3, inputSize: 33 }, // 5 + 5 + 1 = 11
            { input: [[2], 3], expected: -1, inputSize: 3 },
            { input: [[1], 0], expected: 0, inputSize: 0 }
        ],
        verifyFn: "return coinChange(args[0], args[1]) === expected;"
    },
    {
        id: "q25",
        title: "0-1 Knapsack Problem",
        company: "Amazon",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: "You are given weights and values of `N` items. Put these items in a knapsack of capacity `W` to get the maximum total value in the knapsack. You cannot split items; you must either pick the entire item or leave it.\nReturn the maximum value.",
        inputFormat: "W: capacity (number), wt: weights array, val: values array",
        outputFormat: "number (max total value)",
        constraints: "1 <= N <= 1000\n1 <= W <= 1000\n1 <= wt[i], val[i] <= 1000",
        targetTime: "O(N * W)",
        targetSpace: "O(W)",
        starterCode: {
            javascript: "function knapSack(W, wt, val) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [50, [10, 20, 30], [60, 100, 120]], expected: 220, inputSize: 150 }, // wt 20 + 30 = 50, val 100 + 120 = 220
            { input: [4, [4, 5, 1], [1, 2, 3]], expected: 3, inputSize: 4 } // Pick item 3 (wt 1, val 3)
        ],
        verifyFn: "return knapSack(args[0], args[1], args[2]) === expected;"
    },
    {
        id: "q26",
        title: "Word Break Problem",
        company: "Google",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: "Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.\nNote that the same word in the dictionary may be reused multiple times in the segmentation.",
        inputFormat: "s: string, wordDict: array of strings",
        outputFormat: "boolean",
        constraints: "1 <= s.length <= 300\n1 <= wordDict.length <= 1000\n1 <= wordDict[i].length <= 20",
        targetTime: "O(N^2) or O(N * M)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function wordBreak(s, wordDict) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["leetcode", ["leet", "code"]], expected: true, inputSize: 8 },
            { input: ["applepenapple", ["apple", "pen"]], expected: true, inputSize: 13 },
            { input: ["catsandog", ["cats", "dog", "sand", "and", "cat"]], expected: false, inputSize: 9 }
        ],
        verifyFn: "return wordBreak(args[0], args[1]) === expected;"
    },
    {
        id: "q27",
        title: "Longest Increasing Subsequence",
        company: "Microsoft",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\nA subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.",
        inputFormat: "nums: array",
        outputFormat: "number (length)",
        constraints: "1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4",
        targetTime: "O(N log N) or O(N^2)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function lengthOfLIS(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4, inputSize: 8 }, // [2, 3, 7, 101] or [2, 5, 7, 101]
            { input: [[0, 1, 0, 3, 2, 3]], expected: 4, inputSize: 6 },
            { input: [[7, 7, 7, 7, 7]], expected: 1, inputSize: 5 }
        ],
        verifyFn: "return lengthOfLIS(args[0]) === expected;"
    },
    {
        id: "q28",
        title: "3Sum (Three Sum)",
        company: "Adobe",
        difficulty: "Medium",
        category: "Arrays",
        description: "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\nNotice that the solution set must not contain duplicate triplets.",
        inputFormat: "nums: array",
        outputFormat: "Array of Arrays",
        constraints: "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
        targetTime: "O(N^2)",
        targetSpace: "O(N) or O(1) auxiliary",
        starterCode: {
            javascript: "function threeSum(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]], inputSize: 6 },
            { input: [[0, 1, 1]], expected: [], inputSize: 3 },
            { input: [[0, 0, 0]], expected: [[0, 0, 0]], inputSize: 3 }
        ],
        verifyFn: `
      const res = threeSum(args[0]);
      if (!Array.isArray(res)) return false;
      const normalize = t => [...t].sort((a,b)=>a-b).join(',');
      const resNorm = res.map(normalize).sort();
      const expNorm = expected.map(normalize).sort();
      return JSON.stringify(resNorm) === JSON.stringify(expNorm);
    `
    },
    {
        id: "q29",
        title: "Sort Colors",
        company: "Oracle",
        difficulty: "Medium",
        category: "Sorting",
        description: "Given an array `nums` with `n` objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue.\nWe will use the integers `0`, `1`, and `2` to represent the color red, white, and blue, respectively.\nYou must solve this problem without using the library's sort function.",
        inputFormat: "nums: array of 0s, 1s, 2s",
        outputFormat: "sorted array in-place",
        constraints: "n == nums.length\n1 <= n <= 300\nnums[i] is either 0, 1, or 2.",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function sortColors(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[2, 0, 2, 1, 1, 0]], expected: [0, 0, 1, 1, 2, 2], inputSize: 6 },
            { input: [[2, 0, 1]], expected: [0, 1, 2], inputSize: 3 }
        ],
        verifyFn: "const arr = [...args[0]]; sortColors(arr); return JSON.stringify(arr) === JSON.stringify(expected);"
    },
    {
        id: "q30",
        title: "Longest Consecutive Subsequence",
        company: "Walmart",
        difficulty: "Medium",
        category: "Arrays",
        description: "Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence.\nYou must write an algorithm that runs in `O(n)` time.",
        inputFormat: "nums: array",
        outputFormat: "number (length)",
        constraints: "0 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
        targetTime: "O(N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function longestConsecutive(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[100, 4, 200, 1, 3, 2]], expected: 4, inputSize: 6 }, // 1, 2, 3, 4
            { input: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9, inputSize: 10 }
        ],
        verifyFn: "return longestConsecutive(args[0]) === expected;"
    },
    {
        id: "q31",
        title: "Spirally Traversing a Matrix",
        company: "Amazon",
        difficulty: "Medium",
        category: "Arrays",
        description: "Given a 2D matrix of dimensions `R x C`. Traverse the matrix in spiral order and return all elements in a flat list.",
        inputFormat: "matrix: 2D array",
        outputFormat: "array of numbers",
        constraints: "1 <= R, C <= 100\n-100 <= matrix[i][j] <= 100",
        targetTime: "O(R * C)",
        targetSpace: "O(1) auxiliary",
        starterCode: {
            javascript: "function spiralOrder(matrix) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [1, 2, 3, 6, 9, 8, 7, 4, 5], inputSize: 9 },
            { input: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], expected: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7], inputSize: 12 }
        ],
        verifyFn: "return JSON.stringify(spiralOrder(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q32",
        title: "Product of Array Except Self",
        company: "Google",
        difficulty: "Medium",
        category: "Arrays",
        description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\nThe product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer.\nYou must write an algorithm that runs in `O(n)` time and without using the division operation.",
        inputFormat: "nums: array",
        outputFormat: "array",
        constraints: "2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30",
        targetTime: "O(N)",
        targetSpace: "O(1) auxiliary",
        starterCode: {
            javascript: "function productExceptSelf(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6], inputSize: 4 },
            { input: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0], inputSize: 5 }
        ],
        verifyFn: "return JSON.stringify(productExceptSelf(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q33",
        title: "Next Greater Element",
        company: "Microsoft",
        difficulty: "Medium",
        category: "Stacks & Queues",
        description: "Given an array `arr` of size `N`, find the next greater element for each element of the array in order of their appearance in the array. The next greater element of an element in the array is the nearest element on the right which is greater than the current element. If there is no greater element, output `-1`.",
        inputFormat: "arr: array",
        outputFormat: "array",
        constraints: "1 <= N <= 10^5\n1 <= arr[i] <= 10^9",
        targetTime: "O(N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function nextLargerElement(arr) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 3, 2, 4]], expected: [3, 4, 4, -1], inputSize: 4 },
            { input: [[6, 8, 0, 1, 3]], expected: [8, -1, 1, 3, -1], inputSize: 5 }
        ],
        verifyFn: "return JSON.stringify(nextLargerElement(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q34",
        title: "Find Number of Islands",
        company: "Amazon",
        difficulty: "Medium",
        category: "Graphs",
        description: "Given an `m x n` 2D binary grid `grid` which represents a map of '1's (land) and '0's (water), return the number of islands.\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically (or diagonally in some GFG problems; let's stick to 4 directions: up, down, left, right for standard definition).",
        inputFormat: "grid: 2D array of chars or numbers",
        outputFormat: "number (islands count)",
        constraints: "m == grid.length, n == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is '0' or '1'.",
        targetTime: "O(M * N)",
        targetSpace: "O(M * N)",
        starterCode: {
            javascript: "function numIslands(grid) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            {
                input: [[
                    ["1", "1", "1", "1", "0"],
                    ["1", "1", "0", "1", "0"],
                    ["1", "1", "0", "0", "0"],
                    ["0", "0", "0", "0", "0"]
                ]], expected: 1, inputSize: 20
            },
            {
                input: [[
                    ["1", "1", "0", "0", "0"],
                    ["1", "1", "0", "0", "0"],
                    ["0", "0", "1", "0", "0"],
                    ["0", "0", "0", "1", "1"]
                ]], expected: 3, inputSize: 20
            }
        ],
        verifyFn: "return numIslands(args[0]) === expected;"
    },
    {
        id: "q35",
        title: "Stock Buy and Sell II",
        company: "Facebook",
        difficulty: "Medium",
        category: "Arrays",
        description: "You are given an integer array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\nOn each day, you may decide to buy and/or sell the stock. You can only hold at most one share of the stock at any time. However, you can buy it and then immediately sell it on the same day.\nFind and return the maximum profit you can achieve.",
        inputFormat: "prices: array",
        outputFormat: "number (max profit)",
        constraints: "1 <= prices.length <= 3 * 10^4\n0 <= prices[i] <= 10^4",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function maxProfit(prices) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[7, 1, 5, 3, 6, 4]], expected: 7, inputSize: 6 }, // Buy on day 2 (price 1) and sell on day 3 (price 5), profit 4. Buy on day 4 (price 3) and sell on day 5 (price 6), profit 3. Total 7.
            { input: [[1, 2, 3, 4, 5]], expected: 4, inputSize: 5 },
            { input: [[7, 6, 4, 3, 1]], expected: 0, inputSize: 5 }
        ],
        verifyFn: "return maxProfit(args[0]) === expected;"
    },
    {
        id: "q36",
        title: "Container With Most Water",
        company: "Google",
        difficulty: "Medium",
        category: "Arrays",
        description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\nReturn the maximum amount of water a container can store.",
        inputFormat: "height: array",
        outputFormat: "number (max area)",
        constraints: "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
        targetTime: "O(N)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function maxArea(height) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49, inputSize: 9 }, // width 7 (index 1 to 8), height min(8,7) = 7. Area = 7 * 7 = 49.
            { input: [[1, 1]], expected: 1, inputSize: 2 }
        ],
        verifyFn: "return maxArea(args[0]) === expected;"
    },
    {
        id: "q37",
        title: "Merge Intervals",
        company: "Facebook",
        difficulty: "Medium",
        category: "Arrays",
        description: "Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
        inputFormat: "intervals: Array of Arrays",
        outputFormat: "Array of merged Arrays",
        constraints: "1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= starti <= endi <= 10^4",
        targetTime: "O(N log N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function mergeIntervals(intervals) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]], inputSize: 4 },
            { input: [[[1, 4], [4, 5]]], expected: [[1, 5]], inputSize: 2 }
        ],
        verifyFn: "return JSON.stringify(mergeIntervals(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q38",
        title: "Rotate Image (90 Degrees)",
        company: "Microsoft",
        difficulty: "Medium",
        category: "Arrays",
        description: "You are given an `n x n` 2D matrix representing an image, rotate the image by 90 degrees (clockwise) in-place.\nDo NOT allocate another 2D matrix.",
        inputFormat: "matrix: 2D array",
        outputFormat: "rotated matrix in-place",
        constraints: "n == matrix.length == matrix[i].length\n1 <= n <= 20\n-1000 <= matrix[i][j] <= 1000",
        targetTime: "O(N^2)",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function rotate(matrix) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [[7, 4, 1], [8, 5, 2], [9, 6, 3]], inputSize: 9 },
            { input: [[[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]], expected: [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]], inputSize: 16 }
        ],
        verifyFn: "const arr = args[0].map(row => [...row]); rotate(arr); return JSON.stringify(arr) === JSON.stringify(expected);"
    },
    {
        id: "q39",
        title: "String Permutations",
        company: "Google",
        difficulty: "Medium",
        category: "Recursion",
        description: "Given a string `s`, return all unique permutations of the string in sorted order. Permutations can be returned as an array.",
        inputFormat: "s: string",
        outputFormat: "Array of sorted permutations",
        constraints: "1 <= s.length <= 5\ns contains English letters only.",
        targetTime: "O(N * N!)",
        targetSpace: "O(N!)",
        starterCode: {
            javascript: "function findPermutations(s) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["ABC"], expected: ["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"], inputSize: 3 },
            { input: ["AB"], expected: ["AB", "BA"], inputSize: 2 }
        ],
        verifyFn: `
      const res = findPermutations(args[0]).sort();
      const exp = expected.sort();
      return JSON.stringify(res) === JSON.stringify(exp);
    `
    },
    {
        id: "q40",
        title: "Decode String",
        company: "Facebook",
        difficulty: "Medium",
        category: "Stacks & Queues",
        description: "Given an encoded string, return its decoded string.\nThe encoding rule is: `k[encoded_string]`, where the `encoded_string` inside the square brackets is being repeated exactly `k` times. Note that `k` is guaranteed to be a positive integer.\nYou may assume that the input string is always valid; there are no extra spaces, square brackets are well-formed, etc.",
        inputFormat: "s: string",
        outputFormat: "string",
        constraints: "1 <= s.length <= 30\ns consists of lowercase English letters, digits, and square brackets.",
        targetTime: "O(L) where L is decoded string length",
        targetSpace: "O(L)",
        starterCode: {
            javascript: "function decodeString(s) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["3[a]2[bc]"], expected: "aaabcbc", inputSize: 8 },
            { input: ["3[a2[c]]"], expected: "accaccacc", inputSize: 8 },
            { input: ["2[abc]3[cd]ef"], expected: "abcabccdcdcdef", inputSize: 13 }
        ],
        verifyFn: "return decodeString(args[0]) === expected;"
    },

    // --- HARD QUESTIONS (41-60) ---
    {
        id: "q41",
        title: "Longest Valid Parentheses",
        company: "Google",
        difficulty: "Hard",
        category: "Stacks & Queues",
        description: "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
        inputFormat: "s: string",
        outputFormat: "number (length)",
        constraints: "0 <= s.length <= 3 * 10^4\ns consists of '(' and ')' only.",
        targetTime: "O(N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function longestValidParentheses(s) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["(()"], expected: 2, inputSize: 3 }, // "()" length 2
            { input: [")()())"], expected: 4, inputSize: 6 }, // "()()" length 4
            { input: ["/"], expected: 0, inputSize: 0 }
        ],
        verifyFn: "return longestValidParentheses(args[0]) === expected;"
    },
    {
        id: "q42",
        title: "LRU Cache Design",
        company: "Amazon",
        difficulty: "Hard",
        category: "Design",
        description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\nTo simulate this in the script, implement a function `runLRUCache(capacity, operations, keys, values)` where:\n- `operations` is an array of strings: either `'SET'` or `'GET'`.\n- `keys` and `values` are arrays matching the operations. For `'GET'`, values is ignored.\n- Return an array of outputs. For `'SET'`, output `null`. For `'GET'`, output the fetched value (or `-1` if not found).",
        inputFormat: "capacity: number, operations: array, keys: array, values: array",
        outputFormat: "array of outcomes",
        constraints: "1 <= capacity <= 3000\n1 <= operations.length <= 10^4",
        targetTime: "O(1) average per operation",
        targetSpace: "O(capacity)",
        starterCode: {
            javascript: "function runLRUCache(capacity, operations, keys, values) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [2, ["SET", "SET", "GET", "SET", "GET", "SET", "GET", "GET", "GET"], [1, 2, 1, 3, 2, 4, 1, 3, 4], [1, 2, null, 3, null, 4, null, null, null]], expected: [null, null, 1, null, -1, null, -1, 3, 4], inputSize: 9 }
        ],
        verifyFn: "return JSON.stringify(runLRUCache(args[0], args[1], args[2], args[3])) === JSON.stringify(expected);"
    },
    {
        id: "q43",
        title: "Edit Distance",
        company: "Microsoft",
        difficulty: "Hard",
        category: "Dynamic Programming",
        description: "Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`.\nYou have the following three operations permitted on a word:\n1. Insert a character\n2. Delete a character\n3. Replace a character",
        inputFormat: "word1: string, word2: string",
        outputFormat: "number (ops)",
        constraints: "0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.",
        targetTime: "O(N * M)",
        targetSpace: "O(N * M) or O(M)",
        starterCode: {
            javascript: "function minDistance(word1, word2) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["horse", "ros"], expected: 3, inputSize: 15 }, // horse -> rorse -> rose -> ros
            { input: ["intention", "execution"], expected: 5, inputSize: 81 }
        ],
        verifyFn: "return minDistance(args[0], args[1]) === expected;"
    },
    {
        id: "q44",
        title: "Median of Two Sorted Arrays",
        company: "Adobe",
        difficulty: "Hard",
        category: "Arrays",
        description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.\nThe overall run time complexity should be `O(log (m+n))`.",
        inputFormat: "nums1: array, nums2: array",
        outputFormat: "number (median)",
        constraints: "nums1.length == m, nums2.length == n\n0 <= m, n <= 1000\n-10^6 <= nums1[i], nums2[i] <= 10^6",
        targetTime: "O(log(M+N))",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function findMedianSortedArrays(nums1, nums2) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 3], [2]], expected: 2.0, inputSize: 3 },
            { input: [[1, 2], [3, 4]], expected: 2.5, inputSize: 4 }
        ],
        verifyFn: "return findMedianSortedArrays(args[0], args[1]) === expected;"
    },
    {
        id: "q45",
        title: "Merge k Sorted Arrays",
        company: "Google",
        difficulty: "Hard",
        category: "Sorting",
        description: "Given `k` sorted arrays of size `n` each (represented as a 2D array of size `k x n`), merge them and return a single sorted array.",
        inputFormat: "arrays: 2D array",
        outputFormat: "merged sorted array",
        constraints: "1 <= k, n <= 100",
        targetTime: "O(N * K log K)",
        targetSpace: "O(N * K)",
        starterCode: {
            javascript: "function mergeKArrays(arrays) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[[1, 2, 3], [2, 4, 6], [0, 9, 10]]], expected: [0, 1, 2, 2, 3, 4, 6, 9, 10], inputSize: 9 }
        ],
        verifyFn: "return JSON.stringify(mergeKArrays(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q46",
        title: "Trapping Rain Water",
        company: "Amazon",
        difficulty: "Hard",
        category: "Arrays",
        description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
        inputFormat: "height: array",
        outputFormat: "number (units of water)",
        constraints: "n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
        targetTime: "O(N)",
        targetSpace: "O(1) auxiliary",
        starterCode: {
            javascript: "function trap(height) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6, inputSize: 12 },
            { input: [[4, 2, 0, 3, 2, 5]], expected: 9, inputSize: 6 }
        ],
        verifyFn: "return trap(args[0]) === expected;"
    },
    {
        id: "q47",
        title: "N-Queens Problem",
        company: "Microsoft",
        difficulty: "Hard",
        category: "Backtracking",
        description: "The n-queens puzzle is the problem of placing `n` queens on an `n x n` chessboard such that no two queens attack each other.\nGiven an integer `n`, return the number of distinct solutions.",
        inputFormat: "n: number",
        outputFormat: "number (solutions count)",
        constraints: "1 <= n <= 9",
        targetTime: "O(N!)",
        targetSpace: "O(N) recursion depth",
        starterCode: {
            javascript: "function totalNQueens(n) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [4], expected: 2, inputSize: 4 },
            { input: [1], expected: 1, inputSize: 1 },
            { input: [8], expected: 92, inputSize: 8 }
        ],
        verifyFn: "return totalNQueens(args[0]) === expected;"
    },
    {
        id: "q48",
        title: "Sliding Window Maximum",
        company: "Google",
        difficulty: "Hard",
        category: "Stacks & Queues",
        description: "You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position.\nReturn the max sliding window.",
        inputFormat: "nums: array, k: number",
        outputFormat: "array of max values",
        constraints: "1 <= nums.length <= 10^5\n1 <= k <= nums.length\n-10^4 <= nums[i] <= 10^4",
        targetTime: "O(N)",
        targetSpace: "O(K)",
        starterCode: {
            javascript: "function maxSlidingWindow(nums, k) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 3, -1, -3, 5, 3, 6, 7], 3], expected: [3, 3, 5, 5, 6, 7], inputSize: 8 },
            { input: [[1], 1], expected: [1], inputSize: 1 }
        ],
        verifyFn: "return JSON.stringify(maxSlidingWindow(args[0], args[1])) === JSON.stringify(expected);"
    },
    {
        id: "q49",
        title: "Word Ladder",
        company: "Facebook",
        difficulty: "Hard",
        category: "Graphs",
        description: "A transformation sequence from word `beginWord` to word `endWord` using a dictionary `wordList` is a sequence of words `beginWord -> s1 -> s2 -> ... -> sk` such that:\n- Every adjacent pair of words differs by a single letter.\n- Every `si` is in `wordList` (except `beginWord` which doesn't need to be).\n- `sk == endWord`.\nReturn the number of words in the shortest transformation sequence, or `0` if no such sequence exists.",
        inputFormat: "beginWord: string, endWord: string, wordList: array of strings",
        outputFormat: "number (sequence length)",
        constraints: "1 <= beginWord.length <= 10\nwordList.length <= 5000",
        targetTime: "O(N * M^2) where N is word count and M is word length",
        targetSpace: "O(N * M)",
        starterCode: {
            javascript: "function ladderLength(beginWord, endWord, wordList) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], expected: 5, inputSize: 6 }, // hit -> hot -> dot -> dog -> cog (5 words)
            { input: ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], expected: 0, inputSize: 5 }
        ],
        verifyFn: "return ladderLength(args[0], args[1], args[2]) === expected;"
    },
    {
        id: "q50",
        title: "Regular Expression Matching",
        company: "Google",
        difficulty: "Hard",
        category: "Dynamic Programming",
        description: "Given an input string `s` and a pattern `p`, implement regular expression matching with support for `'.'` and `'*'` where:\n- `'.'` Matches any single character.\n- `'*'` Matches zero or more of the preceding element.",
        inputFormat: "s: string, p: string",
        outputFormat: "boolean",
        constraints: "1 <= s.length, p.length <= 20\ns contains lowercase English letters only.\np contains lowercase English letters, '.', and '*' only.",
        targetTime: "O(S * P)",
        targetSpace: "O(S * P)",
        starterCode: {
            javascript: "function isMatch(s, p) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["aa", "a"], expected: false, inputSize: 2 },
            { input: ["aa", "a*"], expected: true, inputSize: 2 },
            { input: ["ab", ".*"], expected: true, inputSize: 2 }
        ],
        verifyFn: "return isMatch(args[0], args[1]) === expected;"
    },
    {
        id: "q51",
        title: "Binary Tree Maximum Path Sum",
        company: "Facebook",
        difficulty: "Hard",
        category: "Trees",
        description: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.\nThe path sum of a path is the sum of the node's values in the path.\nGiven the level-order representation of a binary tree as an array, return the maximum path sum of any non-empty path.",
        inputFormat: "tree: array",
        outputFormat: "number (max path sum)",
        constraints: "1 <= nodes <= 3 * 10^4\n-1000 <= node.val <= 1000",
        targetTime: "O(N)",
        targetSpace: "O(H) recursion stack space",
        starterCode: {
            javascript: "function maxPathSum(tree) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[1, 2, 3]], expected: 6, inputSize: 3 }, // 2 + 1 + 3 = 6
            { input: [[-10, 9, 20, null, null, 15, 7]], expected: 42, inputSize: 7 } // 15 + 20 + 7 = 42
        ],
        verifyFn: "return maxPathSum(args[0]) === expected;"
    },
    {
        id: "q52",
        title: "Sudoku Solver",
        company: "Amazon",
        difficulty: "Hard",
        category: "Backtracking",
        description: "Write a program to solve a Sudoku puzzle by filling the empty cells.\nA sudoku solution must satisfy all of the following rules:\n1. Each of the digits 1-9 must occur exactly once in each row.\n2. Each of the digits 1-9 must occur exactly once in each column.\n3. Each of the digits 1-9 must occur exactly once in each of the 9 3x3 sub-boxes of the grid.\nThe character '.' indicates empty cells. Represent the grid as a 9x9 array of characters.",
        inputFormat: "board: 9x9 2D array",
        outputFormat: "solved board in-place",
        constraints: "board.length == 9, board[i].length == 9",
        targetTime: "O(9^(M)) where M is empty cells",
        targetSpace: "O(1)",
        starterCode: {
            javascript: "function solveSudoku(board) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            {
                input: [[
                    ["5", "3", ".", ".", "7", ".", ".", ".", "."],
                    ["6", ".", ".", "1", "9", "5", ".", ".", "."],
                    [".", "9", "8", ".", ".", ".", ".", "6", "."],
                    ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
                    ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
                    ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
                    [".", "6", ".", ".", ".", ".", "2", "8", "."],
                    [".", ".", ".", "4", "1", "9", ".", ".", "5"],
                    [".", ".", ".", ".", "8", ".", ".", "7", "9"]
                ]], expected: [
                    ["5", "3", "4", "6", "7", "8", "9", "1", "2"],
                    ["6", "7", "2", "1", "9", "5", "3", "4", "8"],
                    ["1", "9", "8", "3", "4", "2", "5", "6", "7"],
                    ["8", "5", "9", "7", "6", "1", "4", "2", "3"],
                    ["4", "2", "6", "8", "5", "3", "7", "9", "1"],
                    ["7", "1", "3", "9", "2", "4", "8", "5", "6"],
                    ["9", "6", "1", "5", "3", "7", "2", "8", "4"],
                    ["2", "8", "7", "4", "1", "9", "6", "3", "5"],
                    ["3", "4", "5", "2", "8", "6", "1", "7", "9"]
                ], inputSize: 81
            }
        ],
        verifyFn: "const b = args[0].map(row => [...row]); solveSudoku(b); return JSON.stringify(b) === JSON.stringify(expected);"
    },
    {
        id: "q53",
        title: "Matrix Chain Multiplication",
        company: "Microsoft",
        difficulty: "Hard",
        category: "Dynamic Programming",
        description: "Given a sequence of matrices, find the most efficient way to multiply these matrices together. The problem is not actually to perform the multiplications, but merely to decide in which order to perform the multiplications.\nYou are given an array `arr` which represents the dimensions of matrices such that the $i$-th matrix is of dimension `arr[i-1] x arr[i]`.\nReturn the minimum number of scalar multiplications needed to multiply the chain.",
        inputFormat: "arr: array",
        outputFormat: "number (min multiplications)",
        constraints: "2 <= arr.length <= 100\n1 <= arr[i] <= 500",
        targetTime: "O(N^3)",
        targetSpace: "O(N^2)",
        starterCode: {
            javascript: "function matrixChainOrder(arr) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[40, 20, 30, 10, 30]], expected: 26000, inputSize: 5 }, // 40*20*30 + 40*30*10 + 40*10*30 = 24000 + 12000 + 12000 = 48000 OR optimal: A(BC)D etc. = 26000
            { input: [[10, 20, 30, 40, 30]], expected: 30000, inputSize: 5 }
        ],
        verifyFn: "return matrixChainOrder(args[0]) === expected;"
    },
    {
        id: "q54",
        title: "Alien Dictionary",
        company: "Google",
        difficulty: "Hard",
        category: "Graphs",
        description: "Given a sorted dictionary of an alien language having `N` words and `K` starting alphabets of standard dictionary. Find the order of characters in the alien language.\nReturn the ordering of characters as a string (e.g. `\"wertf\"`). If there are multiple valid orders, return any of them.",
        inputFormat: "words: array of strings, N: number, K: number",
        outputFormat: "string (order of chars)",
        constraints: "1 <= N, K <= 100\n1 <= words[i].length <= 50",
        targetTime: "O(N * L + K) where L is average word length",
        targetSpace: "O(K)",
        starterCode: {
            javascript: "function findOrder(words, N, K) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [["baa", "abcd", "abca", "cab", "cad"], 5, 4], expected: "bdac", inputSize: 5 }
        ],
        verifyFn: `
      const order = findOrder(args[0], args[1], args[2]);
      if (typeof order !== 'string') return false;
      // We can verify if the words are sorted according to this order.
      const charMap = {};
      for (let i = 0; i < order.length; i++) charMap[order[i]] = i;
      const isSorted = (w1, w2) => {
        const len = Math.min(w1.length, w2.length);
        for(let i=0; i<len; i++) {
          if (w1[i] !== w2[i]) {
            if (!(w1[i] in charMap) || !(w2[i] in charMap)) return false;
            return charMap[w1[i]] < charMap[w2[i]];
          }
        }
        return w1.length <= w2.length;
      };
      const words = args[0];
      for (let i=0; i<words.length-1; i++) {
        if (!isSorted(words[i], words[i+1])) return false;
      }
      return true;
    `
    },
    {
        id: "q55",
        title: "Wildcard Matching",
        company: "Adobe",
        difficulty: "Hard",
        category: "Dynamic Programming",
        description: "Given an input string `s` and a pattern `p`, implement wildcard pattern matching with support for `'?'` and `'*'` where:\n- `'?'` Matches any single character.\n- `'*'` Matches any sequence of characters (including the empty sequence).\nThe matching should cover the entire input string (not partial).",
        inputFormat: "s: string, p: string",
        outputFormat: "boolean",
        constraints: "0 <= s.length, p.length <= 2000\ns consists of lowercase English letters.\np consists of lowercase English letters, '?', and '*'.",
        targetTime: "O(S * P)",
        targetSpace: "O(S * P) or O(P)",
        starterCode: {
            javascript: "function isWildcardMatch(s, p) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: ["aa", "a"], expected: false, inputSize: 2 },
            { input: ["aa", "*"], expected: true, inputSize: 2 },
            { input: ["cb", "?a"], expected: false, inputSize: 2 },
            { input: ["adceb", "*a*b"], expected: true, inputSize: 5 }
        ],
        verifyFn: "return isWildcardMatch(args[0], args[1]) === expected;"
    },
    {
        id: "q56",
        title: "Maximal Rectangle",
        company: "Amazon",
        difficulty: "Hard",
        category: "Dynamic Programming",
        description: "Given a `rows x cols` binary `matrix` filled with `'0'`s and `'1'`s, find the largest rectangle containing only `'1'`s and return its area.",
        inputFormat: "matrix: 2D array of chars or numbers",
        outputFormat: "number (max area)",
        constraints: "rows == matrix.length, cols == matrix[i].length\n0 <= rows, cols <= 200\nmatrix[i][j] is '0' or '1'.",
        targetTime: "O(R * C)",
        targetSpace: "O(C)",
        starterCode: {
            javascript: "function maximalRectangle(matrix) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            {
                input: [[
                    ["1", "0", "1", "0", "0"],
                    ["1", "0", "1", "1", "1"],
                    ["1", "1", "1", "1", "1"],
                    ["1", "0", "0", "1", "0"]
                ]], expected: 6, inputSize: 20
            }, // 3x2 rectangle of 1s starting at row 1, col 2
            { input: [[["0"]]], expected: 0, inputSize: 1 },
            { input: [[["1"]]], expected: 1, inputSize: 1 }
        ],
        verifyFn: "return maximalRectangle(args[0]) === expected;"
    },
    {
        id: "q57",
        title: "Binary Tree to DLL",
        company: "Microsoft",
        difficulty: "Hard",
        category: "Trees",
        description: "Given a Binary Tree (represented as a level-order array), convert it to a Doubly Linked List (DLL) in-place. The left and right pointers in nodes are to be used as previous and next pointers respectively in converted DLL. The order of nodes in DLL must be same as Inorder of the given Binary Tree.\nReturn the converted DLL as an array (representing node values in DLL order from head to tail).",
        inputFormat: "tree: array",
        outputFormat: "array (DLL node values)",
        constraints: "1 <= nodes <= 10^4",
        targetTime: "O(N)",
        targetSpace: "O(H) recursion space",
        starterCode: {
            javascript: "function bToDLL(tree) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[10, 12, 15, 25, 30, 36]], expected: [25, 12, 30, 10, 36, 15], inputSize: 6 }
        ],
        verifyFn: "return JSON.stringify(bToDLL(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q58",
        title: "Median in a Stream",
        company: "Google",
        difficulty: "Hard",
        category: "Design",
        description: "Given an input stream of `N` integers. The task is to insert these numbers into a self-balancing data structure and find the median of the numbers read so far after each insertion.\nReturn an array of medians after each insertion. Round down double medians if necessary, or return float/double. (Let's return exact float numbers).",
        inputFormat: "nums: array",
        outputFormat: "array of numbers (medians)",
        constraints: "1 <= N <= 10^5\n1 <= nums[i] <= 10^5",
        targetTime: "O(N log N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function getMedians(nums) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[5, 15, 1, 3]], expected: [5, 10, 5, 4], inputSize: 4 } // 5->5, [5,15]->10, [1,5,15]->5, [1,3,5,15]->(3+5)/2=4
        ],
        verifyFn: "return JSON.stringify(getMedians(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q59",
        title: "The Skyline Problem",
        company: "Facebook",
        difficulty: "Hard",
        category: "Arrays",
        description: "A city's skyline is the outer contour of the silhouette formed by all the buildings in that city when viewed from a distance. Given the locations and heights of all the buildings, return the skyline formed by these buildings.\nEach building is represented as a triplet `[lefti, righti, heighti]`. The list of buildings is sorted by `lefti`.\nReturn the skyline as a list of key points `[xi, yKey]` representing the coordinates of the key points.",
        inputFormat: "buildings: 2D array",
        outputFormat: "2D array of key points",
        constraints: "1 <= buildings.length <= 10^4\n0 <= lefti < righti <= 2^31 - 1\n1 <= heighti <= 2^31 - 1",
        targetTime: "O(N log N)",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function getSkyline(buildings) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[[2, 9, 10], [3, 7, 15], [5, 12, 12], [15, 20, 10], [19, 24, 8]]], expected: [[2, 10], [3, 15], [12, 12], [15, 10], [19, 8], [24, 0]], inputSize: 5 }
        ],
        verifyFn: "return JSON.stringify(getSkyline(args[0])) === JSON.stringify(expected);"
    },
    {
        id: "q60",
        title: "Redundant Connection II",
        company: "Amazon",
        difficulty: "Hard",
        category: "Graphs",
        description: "In this problem, a rooted tree is a directed graph such that, there is exactly one node (the root) for which all other nodes can be reached from it, and every node has exactly one parent, except for the root node which has no parents.\nThe input is a directed graph represented as a list of `edges` of size `n` where `edges[i] = [ui, vi]` represents a directed edge from `ui` to `vi`.\nIf there is an edge that can be removed so that the resulting graph is a rooted tree of `n` nodes, return that edge as `[ui, vi]`. If there are multiple answers, return the last one that occurs in the input.",
        inputFormat: "edges: 2D array",
        outputFormat: "Array of two numbers",
        constraints: "n == edges.length\n3 <= n <= 1000\nedges[i].length == 2",
        targetTime: "O(N α(N)) where α is inverse Ackermann",
        targetSpace: "O(N)",
        starterCode: {
            javascript: "function findRedundantDirectedConnection(edges) {\n    // Write your code here\n    \n}"
        },
        testCases: [
            { input: [[[1, 2], [1, 3], [2, 3]]], expected: [2, 3], inputSize: 3 },
            { input: [[[1, 2], [2, 3], [3, 1], [4, 1]]], expected: [3, 1], inputSize: 4 }
        ],
        verifyFn: "return JSON.stringify(findRedundantDirectedConnection(args[0])) === JSON.stringify(expected);"
    }
];

if (typeof module !== 'undefined') {
    module.exports = { QUESTIONS };
}
