import React from 'react'

const
    specs = {
        getInitialState: true,
        getDefaultProps: true,
        propTypes: true,
        mixins: true,
        statics: true,
        displayName: true
    },

    lifecycles = {
        componentWillMount: true,
        componentDidMount: true,
        componentWillReceiveProps: true,
        shouldComponentUpdate: true,
        componentWillUpdate: true,
        componentDidUpdate: true,
        componentWillUnmount: true
    },

    helpers = {
        receivedProps: true
    },

    compose = (...funcs) => (...defaultArgs) =>
        funcs.reverse().reduce((args = [], func) => [func(...args)], defaultArgs)[0],

    pick = (hash, data = {}) => Object.assign({},
        ...Object.keys(data)
            .filter((key) => hash[key])
            .map((key) => ({ [key]: data[key] }))
    ),

    merge = (...objs) => Object.assign({}, ...objs),

    formatComponentData = (data) => [
        pick(specs, data),
        pick(lifecycles, data),
        pick(helpers, data)
    ],

    asInternal = (f) => {
        f.__functionalReact = true

        return f
    },

    isInternal = (f) => f && f.__functionalReact,

    accumulateComponent = (componentMethods = {}, componentF) => {
        if (!componentF) {
            return asInternal((componentF, newComponentMethods) =>
                accumulateComponent(merge(componentMethods, newComponentMethods), componentF))
        }

        return isInternal(componentF)
            ? asInternal((newComponentF, newComponentMethods) =>
                componentF(newComponentF, merge(componentMethods, newComponentMethods)))
            : makeComponent(...formatComponentData(componentMethods), componentF)
    },

    makeComponent = (specs, lifecycles, helpers, component) =>
        React.createClass({
            displayName: specs.displayName || 'ReactFunctionalComponent',

            getInitialState: specs.getInitialState,

            getDefaultProps: specs.getDefaultProps,

            propTypes: specs.propTypes,

            mixins: specs.mixins,

            statics: specs.statics,

            call(f, ...args) {
                if (f) {
                    return f(...args, this.props, this.state, this)
                }
            },

            maybeSetState(state) {
                if (state) {
                    this.setState(state)
                }
            },

            componentWillMount() {
                this.callAndSetState = compose(this.maybeSetState, this.call)
                this.callAndSetState(lifecycles.componentWillMount)
            },

            componentDidMount() {
                this.callAndSetState(lifecycles.componentDidMount)
            },

            componentWillReceiveProps(nextProps) {
                const handleReceivedProps = () => {
                    const { receivedProps = {} } = helpers

                    return merge(
                        ...Object.keys(receivedProps).map((prop) => {
                            return (this.props[prop] !== nextProps[prop]) &&
                                this.callLifecycle(receivedProps[prop], nextProps)
                        }),
                        this.call(lifecycles.componentWillReceiveProps, nextProps)
                    )
                }

                this.maybeSetState(handleReceivedProps())
            },

            shouldComponentUpdate(nextProps, nextState) {
                return this.call(lifecycles.shouldComponentUpdate, nextProps, nextState) || true
            },

            componentWillUpdate(nextProps, nextState) {
                this.call(lifecycles.componentWillUpdate, nextProps, nextState)
            },

            componentDidUpdate(prevProps, prevState) {
                this.callAndSetState(lifecycles.componentDidUpdate, prevProps, prevState)
            },

            componentWillUnmount() {
                this.call(lifecycles.componentWillUnmount)
            },

            render() {
                return React.createElement(component, { ...this.props, ...this.state })
            }
        })

/**
 * Specs
 */
export const getInitialState = (getInitialState, f) => accumulateComponent({ getInitialState }, f)
export const getDefaultProps = (getDefaultProps, f) => accumulateComponent({ getDefaultProps }, f)
export const propTypes = (propTypes, f) => accumulateComponent({ propTypes }, f)
export const mixins = (mixins, f) => accumulateComponent({ mixins }, f)
export const statics = (statics, f) => accumulateComponent({ statics }, f)
export const displayName = (displayName, f) => accumulateComponent({ displayName }, f)

/**
 * Lifecycle methods
 */
export const componentWillMount = (componentWillMount, f) => accumulateComponent({ componentWillMount }, f)
export const componentDidMount = (componentDidMount, f) => accumulateComponent({ componentDidMount }, f)
export const componentWillReceiveProps = (componentWillReceiveProps, f) => accumulateComponent({ componentWillReceiveProps }, f)
export const shouldComponentUpdate = (shouldComponentUpdate, f) => accumulateComponent({ shouldComponentUpdate }, f)
export const componentWillUpdate = (componentWillUpdate, f) => accumulateComponent({ componentWillUpdate }, f)
export const componentDidUpdate = (componentDidUpdate, f) => accumulateComponent({ componentDidUpdate }, f)
export const componentWillUnmount = (componentWillUnmount, f) => accumulateComponent({ componentWillUnmount }, f)

/**
 * Helpers
 */
export const combine = (...funcs) => compose(...funcs)()
export const addSpecs = (specs, f) => accumulateComponent(specs, f)
export const onPropChange = (receivedProps, f) => accumulateComponent({ receivedProps }, f)
