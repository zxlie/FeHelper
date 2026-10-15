function normalizeLineEndings(text) {
    return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

const MAX_TEXT_DIFF_MATRIX_CELLS = 250000;

export function splitLines(text) {
    return normalizeLineEndings(text).split('\n');
}

export function compareTextByPosition(leftLines, rightLines) {
    const maxLength = Math.max(leftLines.length, rightLines.length);
    const changedLeftLines = [];
    const changedRightLines = [];

    for (let index = 0; index < maxLength; index++) {
        if (leftLines[index] === rightLines[index]) {
            continue;
        }
        if (index < leftLines.length) {
            changedLeftLines.push(index);
        }
        if (index < rightLines.length) {
            changedRightLines.push(index);
        }
    }

    return {
        leftLines,
        rightLines,
        changedLeftLines,
        changedRightLines,
        changeCount: Math.max(changedLeftLines.length, changedRightLines.length),
        isDifferent: changedLeftLines.length > 0 || changedRightLines.length > 0,
        algorithm: 'position',
    };
}

export function compareTextByLine(leftText, rightText) {
    const leftLines = splitLines(leftText);
    const rightLines = splitLines(rightText);
    const matrixCells = (leftLines.length + 1) * (rightLines.length + 1);

    if (matrixCells > MAX_TEXT_DIFF_MATRIX_CELLS) {
        return compareTextByPosition(leftLines, rightLines);
    }

    const dp = Array.from({ length: leftLines.length + 1 }, () => new Array(rightLines.length + 1).fill(0));

    for (let i = leftLines.length - 1; i >= 0; i--) {
        for (let j = rightLines.length - 1; j >= 0; j--) {
            if (leftLines[i] === rightLines[j]) {
                dp[i][j] = dp[i + 1][j + 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    const changedLeftLines = [];
    const changedRightLines = [];
    let i = 0;
    let j = 0;

    while (i < leftLines.length && j < rightLines.length) {
        if (leftLines[i] === rightLines[j]) {
            i++;
            j++;
            continue;
        }

        if (dp[i + 1][j] >= dp[i][j + 1]) {
            changedLeftLines.push(i);
            i++;
        } else {
            changedRightLines.push(j);
            j++;
        }
    }

    while (i < leftLines.length) {
        changedLeftLines.push(i);
        i++;
    }

    while (j < rightLines.length) {
        changedRightLines.push(j);
        j++;
    }

    return {
        leftLines,
        rightLines,
        changedLeftLines,
        changedRightLines,
        changeCount: Math.max(changedLeftLines.length, changedRightLines.length),
        isDifferent: changedLeftLines.length > 0 || changedRightLines.length > 0,
        algorithm: 'lcs',
    };
}

// Compare parsed JSON values directly: JSON-based cloning loses BigInt support.
// Patch values are read-only references used only by the summary and highlighting.
export function compareJsonValues(left, right, path = '') {
    if (left === right) return [];
    const leftObject = left !== null && typeof left === 'object';
    const rightObject = right !== null && typeof right === 'object';
    if (!leftObject || !rightObject || Array.isArray(left) !== Array.isArray(right)) {
        return [{ op: 'replace', path, value: right }];
    }
    const diffs = [];
    const childPath = key => path + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1');
    Object.keys(left).reverse().forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(right, key)) {
            diffs.push({ op: 'remove', path: childPath(key) });
        } else {
            compareJsonValues(left[key], right[key], childPath(key)).forEach(diff => diffs.push(diff));
        }
    });
    Object.keys(right).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(left, key)) {
            diffs.push({ op: 'add', path: childPath(key), value: right[key] });
        }
    });
    return diffs;
}

if (typeof window !== 'undefined') {
    window.JsonDiffUtils = {
        compareJsonValues,
        splitLines,
        compareTextByLine,
        compareTextByPosition,
    };
}
