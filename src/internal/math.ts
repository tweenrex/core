const math = Math
export const min = math.min
export const max = math.max

export function minMax(val: number, minVal: number, maxVal: number): number {
    return min(max(minVal, val), maxVal)
}
