export function collapseConsoleLogs(logs) {
    return logs.reduce((collapsed, entry) => {
        const lastIndex = collapsed.length - 1;
        const previous = collapsed[lastIndex];
        if (previous && previous.type === entry.type && previous.message === entry.message) {
            collapsed[lastIndex] = { ...previous, count: previous.count + entry.count };
        } else {
            collapsed.push({ ...entry });
        }
        return collapsed;
    }, []);
}

export function isConsoleNearBottom(scrollHeight, scrollTop, clientHeight, threshold = 32) {
    return scrollHeight - scrollTop - clientHeight <= threshold;
}
