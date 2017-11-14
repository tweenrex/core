
# TyrannoScrollus

## Usage
Creates a scroll Observable that updates based on scroll position of an element.

```js
// create an observable
const t1 = TyrannoScrollus({
    targets: '#myTarget',

    // subscribe to changes to the scroll position
    subscribe: offset => {
        // offset is 0 and 1 representing 0% to 100% of scroll position
        // todo: write some code
    }
})


// start listening
t1.play()
```

## Options
Name | Description |
--- | --- |
distinct | When true, subsequent values will be ignored if they are the same as the previous value.  The default is true. |
direction| The axis to observe.  'x' detects scrolling horizontally and 'y' detects scrolling vertically.  'y' is the default.|
easing | Eases subscribe by a function. |
onDispose| Triggered by calling dispose() |
onNext| Triggered by calling next() |
onSubscribe| Triggered by calling subscribe() |
onUnsubscribe| Triggered by unsubscribing |
subscribe | Subscribes to changes in the value.  The value provided is a number between 0 and 1 representing 0% to 100% of scroll position.  This can be either a function or an array of functions. |
targets|An element or selector to observe scroll position|
timer | The observable that provides new time deltas.  If ```undefined```, it will use a default timer.  The default value is ```undefined```.  |

## Properties
Name | Description |
--- | --- |
easing | Eases subscribe by a function. |
isPlaying | If true, the target is being watched |
target | The active target being watched |

## Player Controls

### play()
Starts watching for changes in the scroll position.  If not already playing, TyrannoScrollus will publish the first value in the same frame.
### pause()
Stops watching for changes in the scroll position


## Scroll Configuration

### ```subscribe(observer | observer[])```
Subscribes the observer to changes in the value.  The value provided is a number between 0 and 1 representing 0% to 100% of time elapsed.  This value can be passed to renderer functions such as the ones [Polymorph](https://github.com/notoriousb1t/polymorph) provides.

```js
var target = document.querySelector('#target')
var svgRenderer = polymorph.interpolate(['#first path', '#second path'])

var tween = TyrannoScrollus({ targets: '#container' })
tween.subscribe(o => {
    target.setAttribute('d', svgRenderer(o))
});

tween.play();
```

This returns a function that can be used to unsubscribe:

```js
var tween = new TyrannoScrollus(...)
var unsubscribe = tween.subscribe([
    o => /* 1st observer */,
    o => /* 2nd observer */
]);

// call unsubscribe
unsubscribe();
```

You can pass in an array of functions  or a single function.  If there isn't a need to remove subscriptions, you can provide the subscriptions upon initialization instead for more concise code:

```js
var target = document.querySelector('#target')
var svgRenderer = polymorph.interpolate(['#first path', '#second path'])

var tween = TyrannoScrollus({
    targets: '#container',
    subscribe: o => {
        target.setAttribute('d', svgRenderer(o))
    }
})

tween.play();
```

### ```dispose()```
Removes all subscriptions and resets the internal state.

