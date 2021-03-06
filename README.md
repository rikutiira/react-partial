# React Partial

Do you prefer writing stateless function components ([introduced with React 0.14](https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#stateless-functional-components)) over class syntax but still occasionally need lifecycle methods or state?

React Partial lets you keep writing stateless components by giving you lifted component methods which can be used to create partial, higher order components. These partial components are used to wrap your existing components, giving them new functionality in a declarative, functional manner.

The purpose of the library is to allow you to start with stateless functions as your go-to component and wrap them with stateful components when needed. This is not only helpful if you prefer writing stateless UI components but can also help you to find reusable patterns with your stateful containers. By abstracting stateful logic in containers, it becomes easy to add functionality to existing UI components and write simpler code. More on examples of reusable containers [here](https://github.com/rikutiira/react-partial#3-creating-reusable-containers).

React Partial is lightweight, just around ~10KB.

```js
import { componentDidMount } from 'react-partial'

const didMount = (self, props, state) => self.setState({ message: 'React Partial'})

//state gets merged to stateless component's props
const Component = (props) => <h1>{props.message}</h1>

export default componentDidMount(didMount, Component)
```

```js
import { componentDidMount, shouldComponentUpdate, combine } from 'react-partial'

const Hello = (props) => <h1>Hello {props.world} {props.smiley}</h1>

//combine functionality with ease
export default combine(
    componentDidMount((self, props, state) => {
        setTimeout(() => self.setState({ smiley: ':(' }), 1000)
        setTimeout(() => self.setState({ smiley: ':)' }), 2000)
    }),
    shouldComponentUpdate((self, props, state) => state.smiley === ':)')
)(Hello)
```

## Installing

npm:

`npm install react-partial`

## Supported methods

React Partial supports all the specifications of React.createClass():

Specs: `getInitialState, getDefaultProps, propTypes, mixins, statics, displayName`

Lifecycle methods: `componentWillMount, componentDidMount, componentWillReceiveProps, shouldComponentUpdate, componentWillUpdate, componentDidUpdate, componentWillUnmount`

### How component methods work

Every component method in React Partial follows the same pattern:

```js
import { propTypes, componentDidMount } from 'react-partial'

propTypes(propTypesObj, [Component/componentMethod])
componentDidMount(didMountF, [Component/componentMethod])
//etc...
```

- **The first argument is always the value which the method expects**, eg. propTypes takes an object, componentDidMount takes a function.
    - Each function's arguments get prepended with `this` and appended with `this.props, this.state`:<br>
    `componentDidMount((self, props, state) => ...)`<br>
    `shouldComponentUpdate((self, nextProps, nextState, props, state) => ...)`
        - The reasoning for the order is that `this` is often necessary while `props` and `state` are just there for convenience, eg. if you want to destructure arguments.
- Second argument is optional, and when omitted a new curried function is returned which takes a single argument `componentMethod/Component`
    - If componentMethod is given, its functionality is added to the existing method(s) and a new curried function is returned which takes a single argument `Component/componentMethod`
    - If Component is given, a new React component is returned. The returned component wraps Component with a higher order component with all the given partial methods.

## Utility functions

### `combine(...funcs)`

Combines multiple component methods without having to write nested function calls.

Returns a composable `f(componentMethod/Component)` function.

```js
combine(
    componentDidMount(f),
    componentWillMount(f),
    componentWillUnmount(f)
)(Component)
```

### `onPropChange(propsObject, [function])`

#### NOTE: `onPropChange` has been deprecated and will be removed in the next major version. React Partial should be as simple as possible and it's easy to write these kind of composable utility functions without React Partial shipping with them.

onPropChange uses `componentWillReceiveProps` lifecycle method and listens to changes in props specified by the propsObject and calls the given function when prop has changed (using `!==` equality check). This helps you to reduce boilerplate by not having to check whether prop has changed or not.

Returns a composable `f(componentMethod/Component)` function.

```js
onPropChange({
    foo: (self, nextProps) => self.setState({ fooDoubled: nextProps.foo * 2 }),
    bar: (self, nextProps) => self.setState({ bar: self.state.bar.concat(props.bar) })
}, Component)
```

`componentWillReceiveProps` and `onPropChange` can be used together.

### `createClass(specificationsObject, [function])`

createClass can be used to define component methods as an object instead of using function composition.

Returns a composable `f(componentMethod/Component)` function.

```js
createClass({
    displayName: 'MyAlertingComponent',
    componentDidMount: () => alert('woosh!')
})(Component)
```

### `addSpecs -> createClass`

#### NOTE: addSpecs has been renamed to createClass and will be removed in the next major version.

## Examples

### 1. Simple composition
```js
import { componentDidMount, componentWillUnmount } from 'react-partial'

const HelloWorld = (props) => <div>Hello {props.world}</div>

//second argument is omitted and partial function is returned
const hello = componentDidMount((self) => self.setState({ world: 'world' }))
const goodbye = componentWillUnmount(() => alert('goodbye world'))

//this allows you to add more functionality to an already existing wrapper
const helloAndGoodbye = hello(goodbye)

//HelloWorld is augmented with both hello's and goodbye's functionality
export default helloAndGoodbye(HelloWorld)
```

You can also write the above with more inline aesthetic:

```js
hello(
    (self) => self.setState({ world: 'world' }),
    goodbye(() => alert('goodbye world'))
)(HelloWorld)
```

### 2. Combining multiple lifecycle methods
```js
import { getInitialState, componentDidMount, componentWillUnmount, combine } from 'react-partial'

//combine lets you get rid of deeply nested function calls when dealing with multiple methods
const wrapper = combine(
    getInitialState((props) => ({ timer: props.timer || 0 })),
    componentDidMount((self, props, state) => {
        self.interval = setInterval(() => {
            self.setState({ timer: state.timer + 1 })
        }, 1000)
    }),
    componentWillUnmount((self, props, state) => clearInterval(self.interval)),
);

const Timer = (props) => <div>{props.timer}</div>

export default wrapper(Timer)
```

### 3. Creating reusable containers

React Partial doesn't add any new functionality to React but it guides you separate pure UI components from logical components. It guides you to write composable higher order components with well defined functionality and can be then applied to any component. This is a very powerful pattern, allowing you to write declarative code and potentially greatly minimizing the amount of stateful components in your codebase.

```js
//MyComponent.js

import { combine } from 'react-partial'
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

```js
//containers.js

import { componentDidMount, shouldComponentUpdate } from 'react-partial'
import { store } from './stores'
import * as actions from './actions'

/**
 * - Only re-renders component when some of the given props change
 * - If no props are given, whole newProps is used
 */
export const updateOnPropChange = (customProps = '') => {
    const propsToCheck = customProps.split(' ')
    return shouldComponentUpdate((self, nextProps, nextState, props, state) =>
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
    return componentDidMount((self) =>
        self.setState(
            Object.assign(...deps.map((dependency) => {
                const state = store.getState()

                if (!state[dependency]) {
                    const action = actions[`GET_${dependency.toUpperCase()}`]
                    action()
                }

                return {
                    [dependency]: state[dependency]
                }
            }))))
}
```

As you can see, this neatly lets you abstract away the nitty-gritty of creating stateful components.

### 4. Multiple same lifecycle methods

Because components can be composed, it's important for them to work like mixins as multiple components can define same lifecycle methods. Instead of having to worry about how to compose functions so that all lifecycle methods get called, React Partial calls all the lifecycle methods in the same way mixins do:

```js
import { combine, componentDidMount } from 'react-partial'

const Component = (props) => <div>{props.foo + props.bar}</div>

combine(
    componentDidMount((self, props, state) => self.setState({ foo: 'foo '})),
    componentDidMount((self, props, state) => self.setState({ bar: 'bar '})),
)(Component)
```

## License

MIT