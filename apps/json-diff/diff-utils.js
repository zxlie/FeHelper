function normalizeLineEndings(text) {
    return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function splitLines(text) {
    return normalizeLineEndings(text).split('\n');
}

export function compareTextByLine(leftText, rightText) {
    const leftLines = splitLines(leftText);
    const rightLines = splitLines(rightText);
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
    };
}

if (typeof window !== 'undefined') {
    window.JsonDiffUtils = {
        splitLines,
        compareTextByLine,
    };
}
