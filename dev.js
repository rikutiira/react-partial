import React from 'react'
import ReactDOM from 'react-dom'
import { componentDidMount, componentWillMount, componentWillUnmount, componentDidUpdate,
    componentWillReceiveProps, shouldComponentUpdate, getInitialState,
    propTypes, displayName, combine, addSpecs, createClass, onPropChange } from './src/index.js'

const updateOnPropChange = (customProps = '') => {
    const propsToCheck = customProps.split(' ')
    return shouldComponentUpdate((nextProps, nextState, props) => {
        const changedProps = (propsToCheck || Object.keys(nextProps)).filter((prop) =>
            nextProps[prop] !== props[prop]).length

        return changedProps
    })
}

const StatelessComponent = (props) => <div>{JSON.stringify(props)}</div>
const Hello = (props) => <h1>Hello {props.world} {props.smiley} {props.test} {props.received}</h1>

const Component1 = combine(updateOnPropChange('foo'))(StatelessComponent)

const Component2 = combine(
    componentDidMount((self, props, state) => {
        setTimeout(() => self.setState({ smiley: ':(' }), 1000)
        setTimeout(() => self.setState({ smiley: ':)' }), 2000)
    }),
    shouldComponentUpdate((self, nextProps, nextState) => nextState.smiley === ':)'),
    componentDidMount((self, props, state) => self.setState({ test: 'test' })),
    onPropChange({
        received: (self, props) => self.setState({ received: props.received * 2 })
    }),
    displayName('Component2'),
    displayName('Test')
)(Hello)

const withSpecs = addSpecs({
    displayName: 'test',
    getInitialState: () => ({ bar: 'bar' }),
    getDefaultProps: () => ({ baz: 'baz' }),
    propTypes: { received: React.PropTypes.number.isRequired },
    mixins: [{ mixinVar: true }],
    statics: { staticMethod: () => true },
    componentWillMount: (self) => self.setState({ foo: 'foobar' })
})

const withSpecs2 = createClass({
    mixins: [{ mixinVar2: true }],
    statics: { staticMethod2: () => false },
    componentWillMount: (self) => console.log(self),
})

const Component3 = combine(withSpecs, withSpecs2)(StatelessComponent)

const Component4 = componentDidMount(
    (self) => self.setState({ foo: 'foo' }),
    componentDidMount(
        (self) => self.setState({ bar: 'bar' })
    )
)(StatelessComponent)

//const Component5 = componentDidMount((self) => self.setState({ bar: 'bar' }), Component4)

/**
 * Append div to document and render the dev app
 */
const div = document.createElement('div')
document.body.appendChild(div)

const Wrapper = React.createClass({
    getInitialState() {
        return {
            received: 0
        }
    },

    componentDidMount() {
        setTimeout(() => this.setState({ received: this.state.received + 1, foo: 'foo' }), 1000)
        setTimeout(() => this.setState({ received: this.state.received + 1 }), 2000)
        setTimeout(() => this.setState({ received: this.state.received + 1, foo: 'bar' }), 3000)
    },

    render() {
        return (
            <div>
                <Component2 world="world" received={this.state.received} />
                <Component3 received={this.state.received} />
                <br /><br /><br />
                <Component4 />
            </div>
        )
    }
})

ReactDOM.render(React.createElement(Wrapper), div)
