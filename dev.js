import React from 'react'
import ReactDOM from 'react-dom'
import { componentDidMount, componentWillMount, componentWillUnmount, componentWillReceiveProps,
    getInitialState, propTypes, displayName, combine, addSpecs, onPropChange } from './src/index.js'

/**
 * Dev components
 */
const didMount = componentDidMount(
    () => ({ didMount: true })
)

const willMount = componentWillMount(
    () => ({ willMount: true })
)

const willUmount = componentWillUnmount(
    () => console.log('unmounted')
)

const willReceiveProps = componentWillReceiveProps(
    (nextProps, props, state) => ({ xxx: 'yyy' })
)

const propChange = onPropChange({
    received: (nextProps, props, state) => ({ received: nextProps.received * 2, time: +new Date() })
})

const didAndWillMount = componentDidMount(
    () => ({ didMount: true }),
    componentWillMount(
        () => ({ willMount: true }),
        componentWillUnmount(
            () => console.log('unmounted'),
            getInitialState(
                () => ({ test: 'testing initial state' }),
                propTypes(
                    { bar: React.PropTypes.string },
                    displayName(
                        'TestComponent1'
                    )
                )
            )
        )
    )
)

const StatelessComponent = (props) => <p>{JSON.stringify(props)}</p>

const Component1 = didAndWillMount(StatelessComponent)
const Component2 = didMount(willMount(willReceiveProps))(StatelessComponent)
const Component3 = combine(didMount, willMount, willReceiveProps, willUmount, propChange)(StatelessComponent)

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
        setTimeout(() => this.setState({ received: this.state.received + 1 }), 1000)
        setTimeout(() => this.setState({ received: this.state.received }), 2000)
        setTimeout(() => this.setState({ received: this.state.received }), 3000)
    },

    render() {
        return (
            <div>
                { true && <Component1 bar="bar" received={this.state.received} /> }
                { true && <Component2 foobar="fbavgd" received={this.state.received} /> }
                { true && <Component3 bazaar="bazaar" received={this.state.received} /> }
            </div>
        )
    }
})

ReactDOM.render(React.createElement(Wrapper), div)
