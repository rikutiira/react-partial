# React Wrappy

Do you prefer writing stateless function components ([introduced with React 0.14](https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#stateless-functional-components)) over class syntax but still occasionally need lifecycle methods or state?

Wrappy lets you keep writing stateless components by giving you lifted component methods which can be used to create partial components with a plethora of different uses. These partial components can be used to wrap your existing components, giving them with new functionality in a declarative, functional manner.

It enables you to reduce boilerplate, add functionality to existing components and write simpler code. Wrappy even makes it possible to write highly reusable container components by using a powerful composition pattern. More on that [here](https://github.com/rikutiira/react-wrappy#3-creating-reusable-containers).

```js
import { componentDidMount } from 'react-wrappy'

const didMount = (props, state, self) => self.setState({ message: 'React Wrappy'})

//state gets merged to stateless component's props
const Component = (props) => <h1>{props.message}</h1>

export default componentDidMount(didMount, Component)
```

```js
import { componentDidMount, shouldComponentUpdate, combine } from 'react-wrappy'

const Hello = (props) => <h1>Hello {props.world} {props.smiley}</h1>

//combine functionality with ease
export default combine(
    componentDidMount((props, state, self) => {
        setTimeout(() => self.setState({ smiley: ':(' }), 1000)
        setTimeout(() => self.setState({ smiley: ':)' }), 2000)
    }),
    shouldComponentUpdate((props, state) => state.smiley === ':)')
)(Hello)
```

## Installing

npm:

`npm install react-wrappy`

## Why use React Wrappy?

- Lightweight, just around ~10KB
- Allows you to stick to stateless function syntax
- Simplifies code and reduces boilerplate
- Ships with a few useful utility functions
- Enables nice compositional patterns for creating higher order components

## Supported methods

Wrappy supports all the specifications of React.createClass():

Specs: `getInitialState, getDefaultProps, propTypes, mixins, statics, displayName`

Lifecycle methods: `componentWillMount, componentDidMount, componentWillReceiveProps, shouldComponentUpdate, componentWillUpdate, componentDidUpdate, componentWillUnmount`

### How component methods work

Every component method in React Wrappy follows the same pattern:

```js
import { propTypes, componentDidMount } from 'react-wrappy'

propTypes(propTypesObj, [Component/componentMethod])
componentDidMount(didMountF, [Component/componentMethod])
//etc...
```

- The first argument is always the value which React expects, eg. propTypes takes an object, componentDidMount takes a function.
    - All functions get appended with 3 arguments: `props, state, this`:<br>
    `componentDidMount((props, state, self) => ...)`<br>
    `shouldComponentUpdate((nextProps, nextState, props, state, self) => ...)`
    - If `setState` is callable within the method, you can return an object instead of having to call `setState` yourself. This has many benefits as it allows Wrappy to optimize the amount of setState calls and your functions can often remain pure.
- Second argument is optional, and when omitted a new curried function is returned which takes a single argument `Component/componentMethod`<br>
    - If Component is given, a new React component is returned. The returned component wraps the given component and applies all the specified component methods.<br>
    - If componentMethod is given, its functionality is added to the existing method(s) and a new curried function is returned which takes a single argument `Component/componentMethod`

### Utility functions

#### `combine(...funcs)`

Combines multiple component methods without having to write nested function calls.

Returns a curried function.

```js
combine(
    componentDidMount(f),
    componentWillMount(f),
    componentWillUnmount(f)
)(Component)
```

#### `onPropChange(propsObject, [function])`

onPropChange uses `componentWillReceiveProps` lifecycle method and listens to changes in props specified by the propsObject and calls the given function when prop has changed (using `!==` equality check). This helps you to reduce boilerplate by not having to check whether prop has changed or not.

Returns a function following the same composition pattern as component methods.

```js
onPropChange({
    foo: (props, state, wrapper) => {
        return { fooDoubled: props.foo * 2 }
    },
    bar: (props, state, wrapper) => {
        return { bar: state.bar.concat(props.bar) }
    }
}, Component)
```

Notice that if you return the new state instead of explicitly using `wrapper.setState`, `setState` is only called once even when multiple props have changed.

`componentWillReceiveProps` and `onPropChange` can be used together.

### `addSpecs(specificationsObject, [function])`

addSpecs can be used to define component methods as an object instead of using function composition.

Returns a function following the same composition pattern as component methods.

```js
addSpecs({
    displayName: 'MyAlertingComponent',
    componentDidMount: () => alert('woosh!')
})(Component)
```

## Examples

### 1. Simple composition
```js
import { componentDidMount, componentWillUnmount } from 'react-wrappy'

const HelloWorld = (props) => <div>Hello {props.world}</div>

//second argument is omitted and partial function is returned
const hello = componentDidMount(() => ({ world: 'world' }))
const goodbye = componentWillUnmount(() => alert('goodbye world'))

//this allows you to add more functionality to an already existing wrapper
const helloAndGoodbye = hello(goodbye)

//HelloWorld is augmented with both hello's and goodbye's functionality
export default goodbye(HelloWorld)
```

You can also write the above with more inline aesthetic:

```js
hello(
    () => ({ world: 'world' }),
    goodbye(
        () => alert('goodbye world'),
        HelloWorld
    )
)
```

### 2. Combining multiple lifecycle methods
```js
import { getInitialState, componentDidMount, componentWillUnmount, combine } from 'react-wrappy'

//combine lets you get rid of deeply nested function calls when dealing with multiple methods
const wrapper = combine(
    getInitialState((props) => ({ timer: props.timer || 0 })),
    componentDidMount((props, state, wrapper) => { //props, state and this are always passed as last 3 arguments
        wrapper.interval = setInterval(() => {
            wrapper.setState({ timer: state.timer + 1 })
        }, 1000)
    }),
    componentWillUnmount((props, state, wrapper) => clearInterval(wrapper.interval)),
);

//parent state is assigned to wrapped component's props
const Timer = (props) => <div>{props.timer}</div>

//every method of Wrappy is curried, allowing you to add more lifecycle methods later on if needed...
export default wrapper(Timer) //... but here we are simply returning our new component
```

### 3. Creating reusable containers

Perhaps the best feature of Wrappy is how easily it allows you to make composable higher order components which hold different logic and can be applied to any component. This is a very powerful pattern, allowing you to write declarative code and potentially greatly minimizing the amount of stateful components in your codebase.

```js
//containers.js

import { componentDidMount, shouldComponentUpdate } from 'react-wrappy'
import { store } from './stores'
import * as actions from './actions'

/**
 * - Only re-renders component when some of the given props change
 * - If no props are given, whole newProps is used
 */
export const updateOnPropChange = (customProps = '') => {
    const propsToCheck = customProps.split(' ')
    return shouldComponentUpdate((nextProps, nextState, props) =>
        (propsToCheck || Object.keys(nextProps)).filter((prop) =>
            nextProps[prop] !== props[prop]).length
    )
}

/**
 * - Fetches given data from store (Redux syntax assumed in example)
 * - calls actions to populate store if data is not yet there
 */
export const dependencies = (dependencies) => {
    const deps = dependencies.split(' ')
    return componentDidMount(() =>
        Object.assign(...deps.map((dependency) => {
            const state = store.getState()

            if (!state[dependency]) {
                const action = actions[`GET_${dependency.toUpperCase()}`]
                action()
            }

            return {
                [dependency]: state[dependency]
            }
        })
}
```

```js
//MyComponent.js

import { combine } from 'react-wrappy'
import { updateOnPropChange, dependencies } from './containers'

const Component = (props) => <div>{JSON.stringify(props)}</div>

/**
 * Creates a component that:
 * - re-renders only when foo or bar change
 * - fetches foo, bar and baz from redux store as props to itself,
 *   if the data is not in store, corresponding actions are called to populate it
 */
export default combine(
    updateOnPropChange('foo bar'),
    dependencies('foo bar baz')
)(Component)
```

As you can see, this neatly lets you abstract away the nitty-gritty of creating stateful components.

### 4. Multiple same lifecycle methods

Because components can be composed, it's important for them to work like mixins as multiple components can define same lifecycle methods. Instead of having to worry about how to compose functions so that all lifecycle methods get called, Wrappy calls all the lifecycle methods in the same way mixins do:

```js
import { combine, componentDidMount } from 'react-wrappy'

const Component = (props) => <div>{props.foo + props.bar}</div>

combine(
    componentDidMount((props, state, wrapper) => ({ foo: 'foo '})),
    componentDidMount((props, state, wrapper) => ({ bar: 'bar '})),
)(Component)
```

If you return the state instead of explicitly calling `wrapper.setState` inside the functions, the state objects are merged together and `setState` is only called once.

## License

MIT