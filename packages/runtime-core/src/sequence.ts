// 求最长递增子序列的个数

// 3 2 8 9 5 6 7 11 15

// 递增子序列1：2 8 9 11 15
// 递增子序列2：2 5 6 7 11 15
// 所以最长的是序列2

// 查找过程：
// 3
// 2
// 2 8
// 2 8 9
// 2 5 9
// 2 5 6
// 2 5 6 7
// 2 5 6 7 11
// 2 5 6 7 11 15

// 总结思路：依次遍历原来的乱序队列
// 1.如果当前正在遍历的元素比已有递增子序列中的最后一个元素大，则直接追加到已有递增序列末尾；
// 2.如果当前正在遍历的元素比已有递增子序列中的最后一个元素小，则通过二分查找找到递增子序列中比当前元素大的那个元素，用当前元素替换掉它。
// 3.最优的情况就是默认全部递增.

export function getSequence(arr: Array<number>) {
    const len = arr.length;
    // 注意：result 中存储的是arr的索引而不是具体的值。递增子序列默认从arr的第0项开始。
    const result = [0];
    // 递增子序列中最后一个元素在原序列中的索引值，默认也是0.
    let resultLastIndex = 0;
    // p用于在遍历原数组时，记录原数组中元素的索引，所以要和原数组长度保持一致.
    let p = new Array(arr.length).fill(undefined);
    let start;
    let end;
    let middle;
    for (let i = 0; i < len; i++) {
        let current = arr[i];
        // 忽略0，因为diff算法中0表示没有对比过，是新加入的元素，要创建。
        if (current !== 0) {
            resultLastIndex = result[result.length - 1]; // result中的值对应的是arr中的索引
            if (arr[resultLastIndex] < current) {
                // 如果递增子序列的最后一个元素(其实对应的是arr中某个元素的索引)，它对应在arr中的值，
                // 比当前正在遍历的元素小，则直接追加当前正在遍历元素的索引进递增子序列.
                result.push(i);
                p[i] = resultLastIndex;  // 元素i放进去后要记得记录递增子序列中它之前的元素的索引
            } else {
                // 如果递增子序列的最后一个元素(其实对应的是arr中某个元素的索引)，它对应在arr中的值，
                // 比当前正在遍历的元素大，则二分查找递增子序列，找到比它大的最小的索引。
                start = 0;
                end = result.length - 1;
                while (start < end) {
                    middle = ((start + end) / 2) | 0;
                    if (arr[result[middle]] < current) {
                        start = middle + 1;
                    } else {
                        end = middle;
                    }
                }
                // 用当前正在遍历的arr元素的索引，替换掉找到的result中的元素。
                if (arr[result[end]] > current) {
                    result[end] = i;
                    // p中存的是arr的索引，对应与result数组里元素的值，end-1表示被替换位置的上一个位置.
                    p[i] = result[end - 1];
                }
            }
        }
    }

    // 倒叙追溯
    // console.log("result: ", result);
    // console.log("p: ", p);
    let i = result.length - 1;
    let last = result[i];  // last在result中是值，但在arr、p中代表的是索引
    while (i >= 0) {
        result[i] = last;
        last = p[last];  // p[last] 表示的是arr中第last号位元素记录的前一个元素的索引
        i--;
    }

    return result;
}


// =======================测试用例==============================
// let arr = [3, 2, 8, 9, 5, 6, 7, 11, 15];
// let arr = [2, 3, 1, 5, 6, 8, 7, 9, 4];
// let result = getSequence(arr);
// console.log("==========result结果================")
// console.log(result);
//
// console.log("==========最长递增子序列结果================")
// let str = "[";
// for (let i = 0; i < result.length; i++) {
//     str += arr[result[i]] + " "
// }
// console.log(str + "]");

