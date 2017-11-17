/**
 * An observer (or consumer) of a value
 */
export interface IObserver<T> {
    (value: T): void
}

/**
 * A simple function
 */
export interface IAction {
    (): void
}

export interface IEasing {
    (o: number): number
}

/**
 * Objects that are or resemble an HTML element
 */
export interface IElement {
    tagName: string
}

/**
 * Objects that have the necessary properties for scrolling
 */
export interface IScrollable extends IElement {
    scrollHeight: number
    scrollLeft: number
    scrollTop: number
    scrollWidth: number
    clientWidth: number
    clientHeight: number
}

/**
 * Single item or array of items
 */
export type OneOrMany<T> = T | T[]

/**
 * Options for creating a TRexObservable
 */
export interface IObservableOptions<TValue> {
    /**
    * When true, subsequent values will not be published if they are the same as the last.  The default is true.
    */
    distinct?: boolean
    /**
     * Callback for when .dispose() is called
     */
    onDispose?: IAction
    /**
     * Callback for when .next() is called
     */
    onNext?: (value: TValue, subs: IObserver<TValue>[]) => void
    /**
     * Callback for when .subscribe() is called
     */
    onSubscribe?: IObserver<IObserver<TValue>[]>
    /**
     * Callback for when an unsubscribe function is called
     */
    onUnsubscribe?: IObserver<IObserver<TValue>[]>
    /**
     * Function or array of functions to be notified when the .next() value is received.
     */
    subscribe?: OneOrMany<IObserver<TValue>>
}

/**
 * Options for creating a TweenRex
 */
export interface ITweenOptions extends IObservableOptions<number> {
    /**
     * Initial duration of the tween
     */
    duration?: number
    /**
     * Easing function to apply to the whole Tween instance
     */
    easing?: IEasing
    /**
     * Number of frames to lock the timer at.  Leave undefined to synchronize to real time.
     */
    frameSize?: number
    /**
     * Dictionary of named times to use for seeking. Ex: .seek('middle')
     */
    labels?: Record<string, number>
    /**
     * Callback when playback finished due to hitting duration (if forward) or 0 (if backward)
     */
    onFinish?: IAction
      /**
     * Callback when play() is called
     */
    onPlay?: IAction
    /**
     * Callback when pause() is called
     */
    onPause?: IAction
    /**
     * This should typically not be set.  Timer to use for frame-rate and deltas.
     */
    timer?: ITRexObservable<number>
}

/**
 * Options for adding sub-tweens to a TweenRex
 */
export interface ITweenRexAddOptions extends IObservableOptions<number> {
    /**
     * Position at which to set these sub-tweens. Leave unset or undefined to use the last known position (duration)
     * of the array
     */
    position?: number | string
    /**
     * True if the array of tweens should be treated as a sequence.  Default value is false.
     */
    sequence?: boolean
    /**
     * Number of additional milliseconds to add to each subsequent item.  With sequence = false, this creates an offset
     * between each item that is visually appealing.  With sequence = true, you can use a negative number here to overlap
     * items in the sequence.
     */
    stagger?: number
}

/**
 * Options for creating a new TyrannoScrollus
 */
export interface IScrollOptions extends IObservableOptions<number> {
    /**
     * The direction to observe. 'x' = horizontal; 'y' = vertical
     */
    direction?: 'x' | 'y'
    /**
     * Easing function to apply to the whole Tween instance
     */
    easing?: IEasing
    /**
     * Callback when play() is called
     */
    onPlay?: IAction
    /**
     * Callback when pause() is called
     */
    onPause?: IAction
    /**
     * Element to observe. Specify a CSS selector or an Element
     */
    targets: string | IScrollable
    /**
     * This should typically not be set.  Timer to use for checking for changes.
     */
    timer?: ITRexObservable<number>
}

/**
 * A TRexObservable instance.  This is the base type of all other TRexes
 */
export interface ITRexObservable<TValue> {
    /**
     * Unhooks all subscribers and performs cleanup logic
     */
    dispose(): void
    /**
     * Provides the next value to the observable
     */
    next(n: TValue): void
    /**
     * Subscribes to each new value.  Can be set a a function or an array of functions
     */
    subscribe(observer: OneOrMany<IObserver<TValue>>): IAction
}

/**
 * A TweenRex instance.  This allows tweening over a period of time with playback controls.
 */
export interface ITweenRex extends ITRexObservable<number> {
    /**
     * The total duration of the tween.  Setting this property increases the length of the tween.
     * If the tween contains sub-tweens, this will return either the value set or the length of the longest tween.
     */
    duration: number
    /**
     * Easing function to apply to the whole Tween instance
     */
    easing?: IEasing
    /**
     * The playback rate of the timeline.  By default this is set to 1 (100%).
     * Setting this to a negative value will play the timeline in reverse.
     */
    playbackRate: number
    /**
     * A dictionary of named times in the tween.  These times can be seeked to with .seek('name')
     */
    labels: Record<string, number>
    /**
     * The current time of the tween.  Setting this will .seek() to that position.
     */
    currentTime: number
    /**
     * Returns true if the timer is currently subscribed.
     */
    isPlaying: boolean
    /**
     * Plays the tween.  Has no effect if the tween is already playing.
     */
    play(): ITweenRex
    /**
     * Performs the following:
     *  - pauses the timeline
     *  - seeks to 0 if playing forwards or duration if playing in reverse
     *  - plays the timeline
     */
    restart(): ITweenRex
    /**
     * Pauses playback.
     */
    pause(): ITweenRex
    /**
     * Flips the playback rate.
     */
    reverse(): ITweenRex
    /**
     * Seeks to the time or label provided.  To seek to a percentage-based position, call .next() instead.
     */
    seek(n: number | string): ITweenRex
    /**
     * Gets the time at a particul label
     */
    getLabel(name: string): number
    /**
     * Sets a label at a particular time.  Set to undefined to clear.
     */
    setLabel(name: string, time?: number): ITweenRex
    /**
     * Adds a TweenRex instance as a sub-tween to this instance.  If options are passed, it will be
     * used to generate a new tween automatically.
     */
    add(tweens: OneOrMany<ITweenRex | ITweenOptions>, opts?: ITweenRexAddOptions): IAction

    /**
     * Moves to the (0-1) position in the timeline.
     * @param n a number between 0 and 1 representing 0% to 100% of the duration
     */
    next(n: number): void
}

/**
 * A TyrannoScrollus instance.  This allows tweening based on changes to the x or y scroll position of an element
 */
export interface ITyrannoScrollus extends ITRexObservable<number> {
    /**
     * The direction to observe. 'x' = horizontal; 'y' = vertical
     */
    direction?: 'x' | 'y'
    /**
     * Easing function to apply to the whole Tween instance
     */
    easing?: IEasing
    /**
     * Returns true if the scroll position is being observed.
     */
    isPlaying: boolean
    /**
     * Listens to change in the scroll position. Has no effect if the target is being observed already.
     */
    play(): void
    /**
     * Stops listening to changes in the scroll position.
     */
    pause(): void
    /**
     * The target being observed
     */
    target: IScrollable
}
