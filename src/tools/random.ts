function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomItem<T>(array: T[]): T {
    return array[random(0, array.length - 1)];
}

export {
    random,
    randomItem
}
