(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Mivm = {}));
}(this, (function (exports) { 'use strict';

    function vnode(sel, data, children, text, elm) {
        var key = data === undefined ? undefined : data.key;
        return { sel: sel, data: data, children: children,
            text: text, elm: elm, key: key };
    }

    var array = Array.isArray;
    function primitive(s) {
        return typeof s === 'string' || typeof s === 'number';
    }

    function createElement(tagName) {
        return document.createElement(tagName);
    }
    function createElementNS(namespaceURI, qualifiedName) {
        return document.createElementNS(namespaceURI, qualifiedName);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    var htmlDomApi = {
        createElement: createElement,
        createElementNS: createElementNS,
        createTextNode: createTextNode,
        createComment: createComment,
        insertBefore: insertBefore,
        removeChild: removeChild,
        appendChild: appendChild,
        parentNode: parentNode,
        nextSibling: nextSibling,
        tagName: tagName,
        setTextContent: setTextContent,
        getTextContent: getTextContent,
        isElement: isElement,
        isText: isText,
        isComment: isComment,
    };

    function isUndef(s) { return s === undefined; }
    function isDef(s) { return s !== undefined; }
    var emptyNode = vnode('', {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
    }
    function isVnode(vnode) {
        return vnode.sel !== undefined;
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var i, map = {}, key, ch;
        for (i = beginIdx; i <= endIdx; ++i) {
            ch = children[i];
            if (ch != null) {
                key = ch.key;
                if (key !== undefined)
                    map[key] = i;
            }
        }
        return map;
    }
    var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
    function init(modules, domApi) {
        var i, j, cbs = {};
        var api = domApi !== undefined ? domApi : htmlDomApi;
        for (i = 0; i < hooks.length; ++i) {
            cbs[hooks[i]] = [];
            for (j = 0; j < modules.length; ++j) {
                var hook = modules[j][hooks[i]];
                if (hook !== undefined) {
                    cbs[hooks[i]].push(hook);
                }
            }
        }
        function emptyNodeAt(elm) {
            var id = elm.id ? '#' + elm.id : '';
            var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    var parent_1 = api.parentNode(childElm);
                    api.removeChild(parent_1, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var i, data = vnode.data;
            if (data !== undefined) {
                if (isDef(i = data.hook) && isDef(i = i.init)) {
                    i(vnode);
                    data = vnode.data;
                }
            }
            var children = vnode.children, sel = vnode.sel;
            if (sel === '!') {
                if (isUndef(vnode.text)) {
                    vnode.text = '';
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                var hashIdx = sel.indexOf('#');
                var dotIdx = sel.indexOf('.', hashIdx);
                var hash = hashIdx > 0 ? hashIdx : sel.length;
                var dot = dotIdx > 0 ? dotIdx : sel.length;
                var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
                var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                    : api.createElement(tag);
                if (hash < dot)
                    elm.setAttribute('id', sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        var ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                i = vnode.data.hook; // Reuse variable
                if (isDef(i)) {
                    if (i.create)
                        i.create(emptyNode, vnode);
                    if (i.insert)
                        insertedVnodeQueue.push(vnode);
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                var ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var i, j, data = vnode.data;
            if (data !== undefined) {
                if (isDef(i = data.hook) && isDef(i = i.destroy))
                    i(vnode);
                for (i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (j = 0; j < vnode.children.length; ++j) {
                        i = vnode.children[j];
                        if (i != null && typeof i !== "string") {
                            invokeDestroyHook(i);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            for (; startIdx <= endIdx; ++startIdx) {
                var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                            cbs.remove[i_1](ch, rm);
                        if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                            i_1(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else {
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            var oldStartIdx = 0, newStartIdx = 0;
            var oldEndIdx = oldCh.length - 1;
            var oldStartVnode = oldCh[0];
            var oldEndVnode = oldCh[oldEndIdx];
            var newEndIdx = newCh.length - 1;
            var newStartVnode = newCh[0];
            var newEndVnode = newCh[newEndIdx];
            var oldKeyToIdx;
            var idxInOld;
            var elmToMove;
            var before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        newStartVnode = newCh[++newStartIdx];
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                        newStartVnode = newCh[++newStartIdx];
                    }
                }
            }
            if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
                if (oldStartIdx > oldEndIdx) {
                    before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                    addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
                }
                else {
                    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
                }
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var i, hook;
            if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
                i(oldVnode, vnode);
            }
            var elm = vnode.elm = oldVnode.elm;
            var oldCh = oldVnode.children;
            var ch = vnode.children;
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined) {
                for (i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                i = vnode.data.hook;
                if (isDef(i) && isDef(i = i.update))
                    i(oldVnode, vnode);
            }
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, '');
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, '');
                }
            }
            else if (oldVnode.text !== vnode.text) {
                if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                api.setTextContent(elm, vnode.text);
            }
            if (isDef(hook) && isDef(i = hook.postpatch)) {
                i(oldVnode, vnode);
            }
        }
        return function patch(oldVnode, vnode) {
            var i, elm, parent;
            var insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (!isVnode(oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var _class = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function updateClass(oldVnode, vnode) {
        var cur, name, elm = vnode.elm, oldClass = oldVnode.data.class, klass = vnode.data.class;
        if (!oldClass && !klass)
            return;
        if (oldClass === klass)
            return;
        oldClass = oldClass || {};
        klass = klass || {};
        for (name in oldClass) {
            if (!klass[name]) {
                elm.classList.remove(name);
            }
        }
        for (name in klass) {
            cur = klass[name];
            if (cur !== oldClass[name]) {
                elm.classList[cur ? 'add' : 'remove'](name);
            }
        }
    }
    exports.classModule = { create: updateClass, update: updateClass };
    exports.default = exports.classModule;

    });

    var props = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function updateProps(oldVnode, vnode) {
        var key, cur, old, elm = vnode.elm, oldProps = oldVnode.data.props, props = vnode.data.props;
        if (!oldProps && !props)
            return;
        if (oldProps === props)
            return;
        oldProps = oldProps || {};
        props = props || {};
        for (key in oldProps) {
            if (!props[key]) {
                delete elm[key];
            }
        }
        for (key in props) {
            cur = props[key];
            old = oldProps[key];
            if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
                elm[key] = cur;
            }
        }
    }
    exports.propsModule = { create: updateProps, update: updateProps };
    exports.default = exports.propsModule;

    });

    var attributes = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var xlinkNS = 'http://www.w3.org/1999/xlink';
    var xmlNS = 'http://www.w3.org/XML/1998/namespace';
    var colonChar = 58;
    var xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        var key, elm = vnode.elm, oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            var cur = attrs[key];
            var old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    exports.attributesModule = { create: updateAttrs, update: updateAttrs };
    exports.default = exports.attributesModule;

    });

    var style = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    // Bindig `requestAnimationFrame` like this fixes a bug in IE/Edge. See #360 and #409.
    var raf = (typeof window !== 'undefined' && (window.requestAnimationFrame).bind(window)) || setTimeout;
    var nextFrame = function (fn) { raf(function () { raf(fn); }); };
    var reflowForced = false;
    function setNextFrame(obj, prop, val) {
        nextFrame(function () { obj[prop] = val; });
    }
    function updateStyle(oldVnode, vnode) {
        var cur, name, elm = vnode.elm, oldStyle = oldVnode.data.style, style = vnode.data.style;
        if (!oldStyle && !style)
            return;
        if (oldStyle === style)
            return;
        oldStyle = oldStyle || {};
        style = style || {};
        var oldHasDel = 'delayed' in oldStyle;
        for (name in oldStyle) {
            if (!style[name]) {
                if (name[0] === '-' && name[1] === '-') {
                    elm.style.removeProperty(name);
                }
                else {
                    elm.style[name] = '';
                }
            }
        }
        for (name in style) {
            cur = style[name];
            if (name === 'delayed' && style.delayed) {
                for (var name2 in style.delayed) {
                    cur = style.delayed[name2];
                    if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
                        setNextFrame(elm.style, name2, cur);
                    }
                }
            }
            else if (name !== 'remove' && cur !== oldStyle[name]) {
                if (name[0] === '-' && name[1] === '-') {
                    elm.style.setProperty(name, cur);
                }
                else {
                    elm.style[name] = cur;
                }
            }
        }
    }
    function applyDestroyStyle(vnode) {
        var style, name, elm = vnode.elm, s = vnode.data.style;
        if (!s || !(style = s.destroy))
            return;
        for (name in style) {
            elm.style[name] = style[name];
        }
    }
    function applyRemoveStyle(vnode, rm) {
        var s = vnode.data.style;
        if (!s || !s.remove) {
            rm();
            return;
        }
        if (!reflowForced) {
            getComputedStyle(document.body).transform;
            reflowForced = true;
        }
        var name, elm = vnode.elm, i = 0, compStyle, style = s.remove, amount = 0, applied = [];
        for (name in style) {
            applied.push(name);
            elm.style[name] = style[name];
        }
        compStyle = getComputedStyle(elm);
        var props = compStyle['transition-property'].split(', ');
        for (; i < props.length; ++i) {
            if (applied.indexOf(props[i]) !== -1)
                amount++;
        }
        elm.addEventListener('transitionend', function (ev) {
            if (ev.target === elm)
                --amount;
            if (amount === 0)
                rm();
        });
    }
    function forceReflow() {
        reflowForced = false;
    }
    exports.styleModule = {
        pre: forceReflow,
        create: updateStyle,
        update: updateStyle,
        destroy: applyDestroyStyle,
        remove: applyRemoveStyle
    };
    exports.default = exports.styleModule;

    });

    var eventlisteners = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function invokeHandler(handler, vnode, event) {
        if (typeof handler === "function") {
            // call function handler
            handler.call(vnode, event, vnode);
        }
        else if (typeof handler === "object") {
            // call handler with arguments
            if (typeof handler[0] === "function") {
                // special case for single argument for performance
                if (handler.length === 2) {
                    handler[0].call(vnode, handler[1], event, vnode);
                }
                else {
                    var args = handler.slice(1);
                    args.push(event);
                    args.push(vnode);
                    handler[0].apply(vnode, args);
                }
            }
            else {
                // call multiple handlers
                for (var i = 0; i < handler.length; i++) {
                    invokeHandler(handler[i], vnode, event);
                }
            }
        }
    }
    function handleEvent(event, vnode) {
        var name = event.type, on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], vnode, event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        var oldOn = oldVnode.data.on, oldListener = oldVnode.listener, oldElm = oldVnode.elm, on = vnode && vnode.data.on, elm = (vnode && vnode.elm), name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            var listener = vnode.listener = oldVnode.listener || createListener();
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    exports.eventListenersModule = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners
    };
    exports.default = exports.eventListenersModule;

    });

    var vnode_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function vnode(sel, data, children, text, elm) {
        var key = data === undefined ? undefined : data.key;
        return { sel: sel, data: data, children: children,
            text: text, elm: elm, key: key };
    }
    exports.vnode = vnode;
    exports.default = vnode;

    });

    var is = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.array = Array.isArray;
    function primitive(s) {
        return typeof s === 'string' || typeof s === 'number';
    }
    exports.primitive = primitive;

    });

    var h_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });


    function addNS(data, children, sel) {
        data.ns = 'http://www.w3.org/2000/svg';
        if (sel !== 'foreignObject' && children !== undefined) {
            for (var i = 0; i < children.length; ++i) {
                var childData = children[i].data;
                if (childData !== undefined) {
                    addNS(childData, children[i].children, children[i].sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        var data = {}, children, text, i;
        if (c !== undefined) {
            data = b;
            if (is.array(c)) {
                children = c;
            }
            else if (is.primitive(c)) {
                text = c;
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined) {
            if (is.array(b)) {
                children = b;
            }
            else if (is.primitive(b)) {
                text = b;
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (is.primitive(children[i]))
                    children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
            (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
            addNS(data, children, sel);
        }
        return vnode_1.vnode(sel, data, children, text, undefined);
    }
    exports.h = h;
    exports.default = h;

    });

    // export const renderCx = { h };

    const patch = init([ // Init patch function with chosen modules
      _class.classModule, // makes it easy to toggle classes
      props.propsModule, // for setting properties on DOM elements
      attributes.attributesModule, // attributes module
      style.styleModule, // handles styling on elements with support for animations
      eventlisteners.eventListenersModule, // attaches event listeners
    ]);

    const proxyCache = new WeakMap();
    const rawCache = new WeakMap();
    const trackMap = new WeakMap();
    const effectCache = [];

    const normalHandler = {
      get: (target, key, receiver) => {
        const res = Reflect.get(target, key, receiver);
        if (res._isRef) return res.value;
        track(target, key);
        return reactive(res);
      },
      set: (target, key, value, receiver) => {
        const res = Reflect.set(target,key,value,receiver);
        trigger(target, key);
        return res;
      },
    };

    function isObject(v) {
      return v !== null && typeof v === 'object';
    }

    function createReactive(target, namespace) {
      if (!isObject(target)) return target;
      let observed = proxyCache.get(target);
      if (observed) return observed;
      if (rawCache.get(target)) return target;
      observed = new Proxy(target, normalHandler);
      proxyCache.set(target, observed);
      rawCache.set(observed, target);
      return observed;
    }

    function createEffect(fn) {
      const effect = function() {
        return runEffect(effect, fn);
      };
      return effect;
    }

    function runEffect(effect, fn) {
      try {
        effectCache.push(effect);
        return fn();
      } finally {
        effectCache.pop(effect);
      }
    }

    function track(target, key) {
      const effect = effectCache[effectCache.length-1];
      if (effect) {
        let depsMap = trackMap.get(target);
        if (!depsMap) {
          trackMap.set(target, depsMap = new Map());
        }
        let dep = depsMap.get(key);
        if (!dep) {
          depsMap.set(key, dep = new Set());
        }
        if (!dep.has(effect)) {
          dep.add(effect);
        }
      }
    }

    function trigger(target, key) {
      const depsMap = trackMap.get(target);
      if (!depsMap) return;
      const effects = depsMap.get(key);
      if (effects) {
        effects.forEach((effect) => effect());
      }
    }

    function reactive(target) {
      return createReactive(target);
    }

    function ref(raw) {
      raw = isObject(raw) ? reactive(raw) : raw;
      const v = {
        _isRef: true,
        get value() {
          track(v, '');
          return raw;
        },
        set value(newVal) {
          raw = newVal;
          trigger(v, '');
        }
      };
      return v;
    }

    function watchEffect(fn) {
      const effect = createEffect(fn);
      effect();
      return effect;
    }

    const scopedCx = { reactive, ref, watchEffect };

    const _nbsp_ = ' ';
    const _empty_ = '';
    const _space_ = '|||';

    function createTokenizer(list) {
      return function tokenize(raw, matched) {
        const [tagName] = matched.split(_nbsp_);
        list.push(tagName.replace('/', _empty_));
        return `${_space_}<${matched}>${_space_}`;
      };
    }

    function createAttrParser(token) {
      token.attrs = Object.create(null);
      return function attrParser(raw, attrName, binding) {
        // console.log(attrName, '|', binding);
        token.attrs[attrName] = binding;
        return raw;
      };
    }

    function createToken(value, tagNameList) {
      const startTagReg = /^\<\w+/;
      const endTagReg = /^\<\/\w+\>$/;
      const attrReg = /\s+['"]?([^=]+)['"]?=['"]+([^'"]+)['"]+/gi;
      const token = {
        type: 'Value',
        tagName: undefined,
        nodeType: undefined,
        attrs: undefined,
        value,
      };

      if (value.includes('<')) {
        token.nodeType = 1;
        token.tagName = tagNameList.shift();
        if (startTagReg.test(value)) {
          token.type = 'TagOpen';
          const tokenAttrParser = createAttrParser(token);
          token.value.replace(attrReg, tokenAttrParser);
        }
        else if (endTagReg.test(value)) token.type = 'TagClose';
      } else {
        token.nodeType = 3;
      }

      return token;
    }

    function htmlTokenize(string) {
      const tagRex = /\<([^>]*)\>/gi;
      const tagNextLine = /\n\s*([<>]?)/gi;
      const tagNameList = [];
      const tokenizer = createTokenizer(tagNameList);
      return string.replace(
          tagNextLine,
          (s0, s1) => (s1 === '<' || s1 === '>') ? s1 : _nbsp_
        )
        .replace(tagRex, tokenizer)
        .split(_space_)
        .filter((str) => (str !== _empty_ && str !== _nbsp_))
        .map((str) => createToken(str, tagNameList));
    }

    function pad (hash, len) {
      while (hash.length < len) {
        hash = '0' + hash;
      }
      return hash;
    }

    function fold (hash, text) {
      var i;
      var chr;
      var len;
      if (text.length === 0) {
        return hash;
      }
      for (i = 0, len = text.length; i < len; i++) {
        chr = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
      }
      return hash < 0 ? hash * -2 : hash;
    }

    function foldObject (hash, o, seen) {
      return Object.keys(o).sort().reduce(foldKey, hash);
      function foldKey (hash, key) {
        return foldValue(hash, o[key], key, seen);
      }
    }

    function foldValue (input, value, key, seen) {
      var hash = fold(fold(fold(input, key), toString(value)), typeof value);
      if (value === null) {
        return fold(hash, 'null');
      }
      if (value === undefined) {
        return fold(hash, 'undefined');
      }
      if (typeof value === 'object' || typeof value === 'function') {
        if (seen.indexOf(value) !== -1) {
          return fold(hash, '[Circular]' + key);
        }
        seen.push(value);

        var objHash = foldObject(hash, value, seen);

        if (!('valueOf' in value) || typeof value.valueOf !== 'function') {
          return objHash;
        }

        try {
          return fold(objHash, String(value.valueOf()))
        } catch (err) {
          return fold(objHash, '[valueOf exception]' + (err.stack || err.message))
        }
      }
      return fold(hash, value.toString());
    }

    function toString (o) {
      return Object.prototype.toString.call(o);
    }

    function sum (o) {
      return pad(foldValue(0, o, '', []).toString(16), 8);
    }

    var hashSum = sum;

    function html(strings, ...deps) {
      const template = strings.reduce((result, str, i) => {
        return result + str + (deps[i] !== void 0 ? `$dep${i}` : '');
      }, '');
      return {
        template,
        strings,
        deps,
      };
    }

    // store node index
    let parentIdxStack = [];

    function isComponent(vnode) {
      return vnode && typeof vnode.sel === 'function';
    }

    function isPlainValue(vnode) {
      return typeof vnode !== 'object';
    }

    function parseProps(attrs) {
      const props = Object.create(null);
      for (let key in attrs) {
        if (key.startsWith('p_')) {
          props[key.slice(2)] = attrs[key];
          delete attrs[key];
        } else if (key === 'key') {
          delete attrs[key];
        }
      }
      return props;
    }

    const renderCx = { h: h_1.h, html };

    function compiler(tag, attrs, deps) {
      let props = attrs || {};
      let children = [];
      let options = {
        attrs: {},
        on: {}
      };
      // mount root
      let isGreatRoot = typeof tag === 'string' && !parentIdxStack.length;
      // default rootKey
      let rootKey = isGreatRoot
        ? hashSum(JSON.stringify(props))
        : undefined;

      // handle root
      for (const key in props) {
        // event
        if (key.startsWith('@')) {
          const depIndex = props[key].replace(/\$dep(\d+)/, '$1');
          options.on[key.slice(1).toLowerCase()] = deps[depIndex];
        } else if (key === 'key') {
          rootKey = props[key];
        } else {
          // normal
          options.attrs[key] = props[key].replace(
            /\$dep(\d+)/gi,
            (s0, s1) => deps[s1]
          );
        }
      }

      const args = [...arguments]; // flat
      parentIdxStack.push(rootKey);
      // has children
      for (let i = 4; i < args.length; i++) {
        let vnode = args[i];
        let key = vnode.key || String(i);
        // set key
        if (vnode.data && vnode.data.attrs.key) {
          key = vnode.key = vnode.data.attrs.key;
        }
        parentIdxStack.push(key);
        // console.log(tag, parentIdxStack.filter(i => i).join('_'), vnode);

        // component
        if (isComponent(vnode)) {
          let cx = {...renderCx};
          let $attrs = {};
          let $on = {};
          const uniqueKey = parentIdxStack.filter(i => i).join('_');
          const componentCr = vnode.sel(uniqueKey);

          if (vnode.data) {
            $attrs = vnode.data.attrs;
            $on = vnode.data.on;
            // inject props
            cx.props = parseProps($attrs);
          }
          vnode = componentCr(cx);
          vnode.key = key;
          // handle attrs
          vnode.data.attrs = {...vnode.data.attrs, ...$attrs};
          vnode.data.on = {...vnode.data.on, ...$on};
        }

        // text
        if (isPlainValue(vnode)) {
          vnode = vnode.replace(/\$dep(\d+)/gi, function(s0, s1) {
            return deps[s1];
          });
        }

        children.push(vnode);
        parentIdxStack.pop();
      }
      parentIdxStack.pop();

      const root = h_1.h(tag, options, children);
      root.key = rootKey;
      return root;
    }

    function createNode(token) {
      const node = {
        tagName: token.tagName,
        nodeType: token.nodeType,
        children: [],
        data: token.attrs,
        parent: undefined,
        text: token.type === 'Value'
          ? token.value
          : undefined,
      };
      return node;
    }

    const selfClosedTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    function isSelfClosedTags(tag) {
      return selfClosedTags.indexOf(tag) > -1;
    }

    function createParser(tokens) {
      const tokenStack = [];
      const nodeStack = [];
      let root, nodeHEAD;

      const parseTag = function(token, i, node) {
        if (i === 0) {
          root = node;
          nodeHEAD = root;
        } else {
          const topNode = nodeStack[nodeStack.length-1];
          if (topNode !== nodeHEAD) {
            nodeStack.push(nodeHEAD);
          }
          if (token.type !== 'TagClose') {
            nodeHEAD.children.push(node);
          }
        }
      };

      const parseHtml = function() {
        for (let i=0;i<tokens.length;i++) {
          const token = tokens[i];
          const node = createNode(token);
          const isElement = token.nodeType === 1;
          const isOpenTag = token.type === 'TagOpen';
          parseTag(token, i, node);
          // elements
          if (isElement) {
            // handle self closed tags
            if (isSelfClosedTags(token.tagName)) {
              continue;
            }
            // handle open or close/text
            if (isOpenTag) {
              nodeHEAD = node;
              tokenStack.push(token);
            } else {
              const topToken = tokenStack[tokenStack.length-1];
              if (topToken.tagName !== token.tagName) throw 'SyntaxError';
              nodeStack.pop();
              nodeHEAD = nodeStack[nodeStack.length-1];
              tokenStack.pop();
            }
          }
        }
        if (tokenStack.length > 0) throw 'SyntaxError';
        // console.log('Parse complete');
        return root;
      };

      return {
        parseTag,
        parseHtml,
      };
    }

    function parseHtmlTokens(inputTokens) {
      const { parseHtml } = createParser(inputTokens);
      return parseHtml();
    }

    function compileNode(node, deps, components) {
      if (typeof node !== 'object') return;
      if (node.children.length) {
        for (let i=0;i<node.children.length;i++) {
          const child = node.children[i];
          node.children[i] = child.text ||
            compileNode(child, deps, components);
        }
      }
      const tag = (components && node.tagName in components)
        ? components[node.tagName]
        : node.tagName;
      return compiler(
        tag,
        node.data,
        deps,
        components,
        ...node.children
      );
    }

    function compileTemplate(result) {
      const { template, deps, components } = result;
      const tokens = htmlTokenize(template);
      const nodes = parseHtmlTokens(tokens);
      return compileNode(nodes, deps, components);
    }

    function renderToVnode(render, state, components) {
      const result = render(renderCx, state);
      result.components = components;
      return result.sel ? result : compileTemplate(result);
    }

    function createComponent(options) {
      const { render, data = () => {} } = options;
      const keyMap = new Map();
      // console.log(keyMap);
      return (key) => {
        if (typeof options === 'function')
        return (cx) => renderToVnode(options, Object.create(null));
        return (cx) => {
          let state;
          if (keyMap.has(key)) {
            state = keyMap.get(key);
          } else {
            keyMap.set(key, state = data(scopedCx) || {});
          }
          const vnode = renderToVnode(render, state);
          return vnode;
        };
      };
    }

    function createRenderer(renderFn) {
      let vnode, oldVnode, state;
      let components = Object.create(null);

      const updateMount = (el) => () => {
        vnode = renderToVnode(renderFn, state, components);
        patch(
          oldVnode ? oldVnode : el,
          vnode,
        );
        oldVnode = vnode;
      };

      function mount(sel) {
        if (typeof sel === 'string') {
          sel = document.querySelector(sel);
        }
        watchEffect(updateMount(sel));
        return this;
      }

      function setState(data) {
        state = data(scopedCx);
      }

      function setComponent(name, setupComponent) {
        components[name] = setupComponent;
      }

      const o = Object.create(null);
      Object.defineProperty(o, 'vnode', { get: () => vnode });
      Object.defineProperty(o, 'mount', { get: () => mount });
      Object.defineProperty(o, 'setState', { get: () => setState });
      Object.defineProperty(o, 'component', { get: () => setComponent });
      return o;
    }

    function createApp(options) {
      if (typeof options === 'function') {
        return createRenderer(options);
      }
      const {
        components,
        render,
        data = () => {}
      } = options;
      const renderer = createRenderer(render);
      // setState
      renderer.setState(data);
      // setComponents
      for (let name in components) {
        renderer.component(name, components[name]);
      }
      return renderer;
    }

    const setup = createComponent;
    const render = createRenderer;
    const renderApp = createApp;

    exports.compileTemplate = compileTemplate;
    exports.compiler = compiler;
    exports.h = h_1.h;
    exports.patch = patch;
    exports.reactive = reactive;
    exports.ref = ref;
    exports.render = render;
    exports.renderApp = renderApp;
    exports.renderCx = renderCx;
    exports.scopedCx = scopedCx;
    exports.setup = setup;
    exports.watchEffect = watchEffect;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
