export const onNextFrame =
    typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame.bind(window)
        : (fn: FrameRequestCallback): any => setTimeout(() => fn(Date.now()), 1000 / 60)
