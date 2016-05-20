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
        funcs.concat().reverse().reduce((args = [], func) => [func(...args)], defaultArgs)[0],

    pick = (hash, data = {}) => Object.assign({},
        ...Object.keys(data)
            .filter((key) => hash[key])
            .map((key) => ({ [key]: data[key] }))
    ),

    merge = (...objs) => Object.assign({}, ...Object.keys(objs)
        .filter((key) => objs[key] && objs[key].constructor === Object)
        .map((key) => objs[key])),

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

    mergeComponentSpecs = (methods, newMethods = {}) =>
        merge(methods, ...Object.keys(newMethods).map((key) => ({
            [key]: methods[key]
                ? methods[key].concat(newMethods[key])
                : newMethods[key],
            }))),

    accumulateComponent = (componentMethods = {}, componentF) => {
        if (!componentF) {
            return asInternal((componentF, newComponentMethods) =>
                accumulateComponent(mergeComponentSpecs(componentMethods, newComponentMethods), componentF))
        }

        return isInternal(componentF)
            ? asInternal((newComponentF, newComponentMethods) =>
                componentF(newComponentF, mergeComponentSpecs(componentMethods, newComponentMethods)))
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

            __accumulateState: false,

            __state: {},

            __customSetState(state) {
                if (this.__accumulateState) {
                    this.__state = merge(this.__state, state)
                } else  {
                    const newState = merge(this.__state, state)

                    if (newState && Object.keys(newState).length) {
                        this.__setState(newState)
                        this.__state = {}
                    }
                }
            },

            __call(funcs = [], ...args) {
                this.__accumulateState = true

                const funcsData = funcs.map((func) =>
                    func(...args, this, this.props, this.state))

                this.__accumulateState = false

                return funcsData
            },

            componentWillMount() {
                this.__setState = this.setState
                this.setState = this.__customSetState

                this.__callAndSetState = compose(this.__customSetState, this.__call)
                this.__callAndSetState(lifecycles.componentWillMount)
            },

            componentDidMount() {
                this.__callAndSetState(lifecycles.componentDidMount)
            },

            componentWillReceiveProps(nextProps) {
                const handleReceivedProps = () => {
                    const { receivedProps = {} } = helpers

                    return merge(
                        ...Object.keys(receivedProps).map((prop) => {
                            return (this.props[prop] !== nextProps[prop]) &&
                                this.__call(receivedProps[prop], nextProps)
                        }),
                        this.__call(lifecycles.componentWillReceiveProps, nextProps)
                    )
                }

                this.__customSetState(handleReceivedProps())
            },

            shouldComponentUpdate(nextProps, nextState) {
                const { shouldComponentUpdate } = lifecycles

                return  shouldComponentUpdate
                    ? this.__call(shouldComponentUpdate, this, nextProps, nextState)
                        .filter(Boolean).length
                    : true
            },

            componentWillUpdate(nextProps, nextState) {
                this.__call(lifecycles.componentWillUpdate, nextProps, nextState)
            },

            componentDidUpdate(prevProps, prevState) {
                this.__callAndSetState(lifecycles.componentDidUpdate, prevProps, prevState)
            },

            componentWillUnmount() {
                this.__call(lifecycles.componentWillUnmount)
            },

            render() {
                return React.createElement(component, { ...this.props, ...this.state })
            }
        }),

    specsToArrays = (specs) =>
        merge(...Object.keys(specs).map((key) => ({ [key]: [specs[key]] }))),

    makeLiftedFunction = (name) => (componentMethod, f) =>
        accumulateComponent({ [name]: [componentMethod] }, f)

/**
 * Specs
 */
export const getInitialState = makeLiftedFunction('getInitialState')
export const getDefaultProps = makeLiftedFunction('getDefaultProps')
export const propTypes = makeLiftedFunction('propTypes')
export const mixins = makeLiftedFunction('mixins')
export const statics = makeLiftedFunction('statics')
export const displayName = makeLiftedFunction('displayName')

/**
 * Lifecycle methods
 */
export const componentWillMount = makeLiftedFunction('componentWillMount')
export const componentDidMount = makeLiftedFunction('componentDidMount')
export const componentWillReceiveProps = makeLiftedFunction('componentWillReceiveProps')
export const shouldComponentUpdate = makeLiftedFunction('shouldComponentUpdate')
export const componentWillUpdate = makeLiftedFunction('componentWillUpdate')
export const componentDidUpdate = makeLiftedFunction('componentDidUpdate')
export const componentWillUnmount = makeLiftedFunction('componentWillUnmount')

/**
 * Helpers
 */
export const combine = (...funcs) => compose(...funcs)()
export const addSpecs = (specs, f) => accumulateComponent(specsToArrays(specs), f)
export const onPropChange = (receivedProps, f) => accumulateComponent(specsToArrays({ receivedProps }), f)
