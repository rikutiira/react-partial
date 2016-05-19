'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.onPropChange = exports.addSpecs = exports.combine = exports.componentWillUnmount = exports.componentDidUpdate = exports.componentWillUpdate = exports.shouldComponentUpdate = exports.componentWillReceiveProps = exports.componentDidMount = exports.componentWillMount = exports.displayName = exports.statics = exports.mixins = exports.propTypes = exports.getDefaultProps = exports.getInitialState = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var specs = {
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
    compose = function compose() {
    for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
        funcs[_key] = arguments[_key];
    }

    return function () {
        for (var _len2 = arguments.length, defaultArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            defaultArgs[_key2] = arguments[_key2];
        }

        return funcs.concat().reverse().reduce(function () {
            var args = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
            var func = arguments[1];
            return [func.apply(undefined, _toConsumableArray(args))];
        }, defaultArgs)[0];
    };
},
    pick = function pick(hash) {
    var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    return Object.assign.apply(Object, [{}].concat(_toConsumableArray(Object.keys(data).filter(function (key) {
        return hash[key];
    }).map(function (key) {
        return _defineProperty({}, key, data[key]);
    }))));
},
    merge = function merge() {
    for (var _len3 = arguments.length, objs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        objs[_key3] = arguments[_key3];
    }

    return Object.assign.apply(Object, [{}].concat(_toConsumableArray(Object.keys(objs).filter(function (key) {
        return objs[key].constructor === Object;
    }).map(function (key) {
        return objs[key];
    }))));
},
    formatComponentData = function formatComponentData(data) {
    return [pick(specs, data), pick(lifecycles, data), pick(helpers, data)];
},
    asInternal = function asInternal(f) {
    f.__functionalReact = true;

    return f;
},
    isInternal = function isInternal(f) {
    return f && f.__functionalReact;
},
    mergeComponentSpecs = function mergeComponentSpecs(methods) {
    var newMethods = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    return merge.apply(undefined, [methods].concat(_toConsumableArray(Object.keys(newMethods).map(function (key) {
        return _defineProperty({}, key, methods[key] ? methods[key].concat(newMethods[key]) : newMethods[key]);
    }))));
},
    accumulateComponent = function accumulateComponent() {
    var componentMethods = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var componentF = arguments[1];

    if (!componentF) {
        return asInternal(function (componentF, newComponentMethods) {
            return accumulateComponent(mergeComponentSpecs(componentMethods, newComponentMethods), componentF);
        });
    }

    return isInternal(componentF) ? asInternal(function (newComponentF, newComponentMethods) {
        return componentF(newComponentF, mergeComponentSpecs(componentMethods, newComponentMethods));
    }) : makeComponent.apply(undefined, _toConsumableArray(formatComponentData(componentMethods)).concat([componentF]));
},
    makeComponent = function makeComponent(specs, lifecycles, helpers, component) {
    return _react2.default.createClass({
        displayName: specs.displayName || 'ReactFunctionalComponent',

        getInitialState: specs.getInitialState,

        getDefaultProps: specs.getDefaultProps,

        propTypes: specs.propTypes,

        mixins: specs.mixins,

        statics: specs.statics,

        call: function call() {
            var _this = this;

            for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                args[_key4 - 1] = arguments[_key4];
            }

            var funcs = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            return funcs.map(function (func) {
                return func.apply(undefined, args.concat([_this.props, _this.state, _this]));
            });
        },
        maybeSetState: function maybeSetState() {
            var stateArr = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            var state = merge.apply(undefined, _toConsumableArray(stateArr));
            if (Object.keys(state).length) {
                this.setState(state);
            }
        },
        componentWillMount: function componentWillMount() {
            this.callAndSetState = compose(this.maybeSetState, this.call);
            this.callAndSetState(lifecycles.componentWillMount);
        },
        componentDidMount: function componentDidMount() {
            this.callAndSetState(lifecycles.componentDidMount);
        },
        componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
            var _this2 = this;

            var handleReceivedProps = function handleReceivedProps() {
                var _helpers$receivedProp = helpers.receivedProps;
                var receivedProps = _helpers$receivedProp === undefined ? {} : _helpers$receivedProp;


                return merge.apply(undefined, _toConsumableArray(Object.keys(receivedProps).map(function (prop) {
                    return _this2.props[prop] !== nextProps[prop] && _this2.callLifecycle(receivedProps[prop], nextProps);
                })).concat([_this2.call(lifecycles.componentWillReceiveProps, nextProps)]));
            };

            this.maybeSetState(handleReceivedProps());
        },
        shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
            var shouldComponentUpdate = lifecycles.shouldComponentUpdate;


            return shouldComponentUpdate ? this.call(shouldComponentUpdate, nextProps, nextState).filter(Boolean).length : true;
        },
        componentWillUpdate: function componentWillUpdate(nextProps, nextState) {
            this.call(lifecycles.componentWillUpdate, nextProps, nextState);
        },
        componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
            this.callAndSetState(lifecycles.componentDidUpdate, prevProps, prevState);
        },
        componentWillUnmount: function componentWillUnmount() {
            this.call(lifecycles.componentWillUnmount);
        },
        render: function render() {
            return _react2.default.createElement(component, _extends({}, this.props, this.state));
        }
    });
},
    specsToArrays = function specsToArrays(specs) {
    return [].concat(specs).map(function (spec, key) {
        return _defineProperty({}, key, [spec]);
    });
},
    makeLiftedFunction = function makeLiftedFunction(name) {
    return function (componentMethod, f) {
        return accumulateComponent(_defineProperty({}, name, [componentMethod]), f);
    };
};

/**
 * Specs
 */
var getInitialState = exports.getInitialState = makeLiftedFunction('getInitialState');
var getDefaultProps = exports.getDefaultProps = makeLiftedFunction('getDefaultProps');
var propTypes = exports.propTypes = makeLiftedFunction('propTypes');
var mixins = exports.mixins = makeLiftedFunction('mixins');
var statics = exports.statics = makeLiftedFunction('statics');
var displayName = exports.displayName = makeLiftedFunction('displayName');

/**
 * Lifecycle methods
 */
var componentWillMount = exports.componentWillMount = makeLiftedFunction('componentWillMount');
var componentDidMount = exports.componentDidMount = makeLiftedFunction('componentDidMount');
var componentWillReceiveProps = exports.componentWillReceiveProps = makeLiftedFunction('componentWillReceiveProps');
var shouldComponentUpdate = exports.shouldComponentUpdate = makeLiftedFunction('shouldComponentUpdate');
var componentWillUpdate = exports.componentWillUpdate = makeLiftedFunction('componentWillUpdate');
var componentDidUpdate = exports.componentDidUpdate = makeLiftedFunction('componentDidUpdate');
var componentWillUnmount = exports.componentWillUnmount = makeLiftedFunction('componentWillUnmount');

/**
 * Helpers
 */
var combine = exports.combine = function combine() {
    return compose.apply(undefined, arguments)();
};
var addSpecs = exports.addSpecs = function addSpecs(specs, f) {
    return accumulateComponent(specsToArrays(specs), f);
};
var onPropChange = exports.onPropChange = function onPropChange(receivedProps, f) {
    return accumulateComponent(specsToArrays({ receivedProps: receivedProps }), f);
};
