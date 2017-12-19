import { ITweenOptions, ITweenRex, ITweenRexAddOptions, ITRexObservable, IAction } from './types'
import { _ } from './internal/constants'
import { isString } from './internal/inspect'
import { newify } from './internal/newify'
import { TRexObservable } from './TRexObservable'
import { defaultTimer } from './internal/defaultTimer'
import { addAll, removeAll, toArray } from './internal/arrays'
import { minMax } from './internal/math'
import { coalesce } from './internal/colesce'

/**
 * Creates a TweenRex instance.  This allows tweening over a period of time with playback controls.
 */
export function TweenRex(opts?: ITweenOptions): ITweenRex {
    const options = (opts || {}) as ITweenOptions

    // create and extend instance
    const self = newify<ITweenRexInternal>(this, TweenRex)
    self._opts = options
    self._timer = options.timer || defaultTimer
    self._pos = options.duration || 0
    self._time = 0
    self.labels = options.labels || {}
    self.easing = options.easing
    self.playbackRate = 1

    self._tick = timestamp => {
        const delta = options.frameSize || (timestamp - (self._last || timestamp)) * self.playbackRate
        const n = self._time + delta
        self._last = timestamp
        self.seek(n)
    }

    // copy next/subscribe to this object
    const obs = TRexObservable<number>(options)
    self.dispose = () => {
        // pause timeline to clear active state
        self.pause()

        // reset internal state
        self._pos = 0
        self._time = 0
        self.playbackRate = 1
        self._tweens = _
        self.labels = {}

        // dispose the observable
        obs.dispose()
    }
    self.next = obs.next
    self.value = obs.value
    self.subscribe = obs.subscribe

    return self
}

TweenRex.prototype = {
    get duration(this: ITweenRexInternal) {
        const self = this
        const tweens = self._tweens

        let maxSize = self._pos
        if (tweens) {
            for (let i = 0, ilen = tweens.length; i < ilen; i++) {
                const t = tweens[i]
                const size = t.pos + t.tween.duration
                if (maxSize < size) {
                    maxSize = size
                }
            }
        }
        return maxSize
    },
    set duration(this: ITweenRexInternal, value: number) {
        this._pos = value
    },
    get currentTime(this: ITweenRexInternal): number {
        return this._time
    },
    set currentTime(this: ITweenRexInternal, time: number) {
        this.seek(time)
    },
    get isPlaying(this: ITweenRexInternal) {
        return !!this._sub
    },
    add(this: ITweenRexInternal, tweens: ITweenRex[], opts?: ITweenRexAddOptions) {
        const self = this
        if (!self._tweens) {
            self._tweens = []
        }

        tweens = toArray(tweens)
        const _tweens = self._tweens

        // set option defaults
        opts = opts || {}

        let pos = coalesce(
            isString(opts.position) ? self.labels[opts.position] : (opts.position as number),
            self.duration
        )

        const seq = opts.sequence
        const stagger = opts.stagger

        // create position + tween objects
        const ilen = tweens.length
        const tweenObjs: typeof _tweens = Array(ilen)
        for (let i = 0; i < ilen; i++) {
            // wrap in TweenRex to ensure it is a TweenRex instance
            const tween = ensureTween(tweens[i])

            // tell tween to stop current playing
            if (tween.isPlaying) {
                tween.pause()
            }
            // unhook tween from timer
            tween._timer = _

            // add to list of tweens
            tweenObjs[i] = { pos, tween }

            if (seq) {
                // move the position if this is a sequence
                pos += tween.duration
            }
            if (stagger) {
                pos += stagger
            }
        }

        // add to list of tweens
        addAll(_tweens, tweenObjs)

        return () => {
            // unsubscribe all
            removeAll(_tweens, tweenObjs)
        }
    },
    play(this: ITweenRexInternal) {
        const self = this
        const timer = self._timer
        if (timer && !self.isPlaying) {
            const isForwards = self.playbackRate >= 0
            const duration = self.duration

            let n = self._time
            if (isForwards && n >= duration) {
                n = 0
            } else if (!isForwards && n <= 0) {
                n = duration
            }

            self.seek(n)
            self._sub = timer.subscribe(self._tick)
            if (self._opts.onPlay) {
                self._opts.onPlay()
            }
        }
        return self
    },
    restart(this: ITweenRexInternal) {
        const self = this
        return self
            .pause()
            .seek(self.playbackRate >= 0 ? 0 : self.duration)
            .play()
    },
    pause(this: ITweenRexInternal) {
        const self = this
        const sub = self._sub
        if (sub) {
            sub()
            self._sub = self._last = _
            if (self._opts.onPause) {
                self._opts.onPause()
            }
        }
        return self
    },
    reverse(this: ITweenRexInternal) {
        this.playbackRate *= -1
        return this
    },
    seek(this: ITweenRexInternal, n: number | string) {
        const self = this
        const isForwards = self.playbackRate >= 0
        const wasPlaying = self.isPlaying
        const duration = self.duration
        // resolve label
        let c = isString(n) ? self.labels[n as string] : (n as number)

        let isAtEnd: boolean
        if (isForwards && c >= duration) {
            c = duration
            self.pause()
            isAtEnd = true
        } else if (!isForwards && c <= 0) {
            c = 0
            self.pause()
            isAtEnd = true
        }

        self._time = c

        let offset = c / (duration || 1)
        if (self.easing) {
            offset = self.easing(offset)
        }

        if (isAtEnd && wasPlaying && self._opts.onFinish) {
            self._opts.onFinish()
        }

        const isSeekingBackward = c < self.value()
        self.next(offset)

        // update sub-timelines
        const tweens = self._tweens
        if (tweens) {
            // loop tween order so that the subscribers that need the property change are handled last
            // this is a fix for using interpolate() on the same target and property on multiple subtweens
            const d = duration - c
            tweens.sort((a, b) => (d + a.pos) % duration - (d + b.pos) % duration)

            if (isSeekingBackward) {
                tweens.reverse()
            }

            // determine if in range and perform an update
            for (let i = 0, ilen = tweens.length; i < ilen; i++) {
                const t = tweens[i]
                const tween = t.tween
                const startPos = t.pos
                const endPos = startPos + (tween.duration || 1)
                const ro = minMax((c - startPos) / (endPos - startPos), 0, 1)
                tween.next(ro)
            }
        }

        return self
    },
    getLabel(this: ITweenRexInternal, name: string) {
        return this.labels[name]
    },
    setLabel(this: ITweenRexInternal, name: string, time?: number) {
        this.labels[name] = time
        return this
    }
}

/**
 * A TweenRex instance.  This allows tweening over a period of time with playback controls.
 */
export interface ITweenRexInternal extends ITweenRex {
    /** DO_NOT_USE: options used to instantiate this */
    _opts: ITweenOptions
    /** DO_NOT_USE: next position for add() */
    _pos: number
    /** DO_NOT_USE: currentTime backing property */
    _time: number
    /** DO_NOT_USE: last updated time */
    _last: number
    /** DO_NOT_USE: observable that provides new dates each frame */
    _timer: ITRexObservable<number>
    /** DO_NOT_USE: active subscription to the timer */
    _sub: IAction
    /** DO_NOT_USE: sub-tween list and their positions */
    _tweens: { pos: number; tween: ITweenRex }[]
    /** DO_NOT_USE: callback for the timer */
    _tick: (delta: number) => void
}

function ensureTween(opts: ITweenOptions | ITweenRex): ITweenRexInternal {
    return opts instanceof TweenRex
        ? (opts as ITweenRexInternal)
        : (TweenRex(opts as ITweenOptions) as ITweenRexInternal)
}
