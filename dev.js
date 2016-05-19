import React from 'react'
import ReactDOM from 'react-dom'
import { componentDidMount, componentWillMount, componentWillUnmount, componentDidUpdate,
    componentWillReceiveProps, shouldComponentUpdate, getInitialState,
    propTypes, displayName, combine, addSpecs, onPropChange } from './src/index.js'

const updateOnPropChange = (customProps = '') => {
    const propsToCheck = customProps.split(' ')
    return shouldComponentUpdate((nextProps, nextState, props) => {
        const changedProps = (propsToCheck || Object.keys(nextProps)).filter((prop) =>
            nextProps[prop] !== props[prop]).length

        return changedProps
    })
}

const StatelessComponent = (props) => <div>{JSON.stringify(props)}</div>
const Hello = (props) => <h1>Hello {props.world} {props.smiley} {props.test}</h1>

const Component1 = combine(updateOnPropChange('foo'))(StatelessComponent)
const Component2 = combine(
    componentDidMount((props, state, self) => {
        setTimeout(() => self.setState({ smiley: ':(' }), 1000)
        setTimeout(() => self.setState({ smiley: ':)' }), 2000)
    }),
    shouldComponentUpdate((props, state) => console.log(state) || state.smiley === ':)'),
    componentDidMount((props, state, self) => ({ test: 'test' }))
)(Hello)

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
                <Component2 world="world" />
            </div>
        )
    }
})

ReactDOM.render(React.createElement(Wrapper), div)
