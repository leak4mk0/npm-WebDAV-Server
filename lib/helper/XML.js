"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xmljs = require("xml-js");
function seekForNS(node, parentNS) {
    if (!node.attributes)
        return parentNS;
    var ns = {};
    for (var name_1 in parentNS)
        ns[name_1] = parentNS[name_1];
    for (var name_2 in node.attributes) {
        if (name_2.indexOf('xmlns:') === 0 || name_2 === 'xmlns') {
            var value = node.attributes[name_2];
            if (name_2 === 'xmlns')
                ns._default = value;
            else
                ns[name_2.substring('xmlns:'.length)] = value;
        }
    }
    return ns;
}
function muteNodeNS(node, parentNS) {
    if (parentNS === void 0) { parentNS = { _default: 'DAV' }; }
    var nss = seekForNS(node, parentNS);
    if (node.name) {
        for (var ns in nss) {
            if (ns === '_default')
                continue;
            if (node.name.indexOf(ns + ':') === 0)
                node.name = nss[ns] + node.name.substring((ns + ':').length);
        }
    }
    node.find = function (name) {
        for (var index in node.elements)
            if (node.elements[index].name && node.elements[index].name === name)
                return node.elements[index];
        throw new Error('Can\'t find the element.');
    };
    node.findMany = function (name) {
        var elements = [];
        for (var index in node.elements)
            if (node.elements[index].name && node.elements[index].name === name)
                elements.push(node.elements[index]);
        return elements;
    };
    if (node.elements)
        node.elements.forEach(function (n) { return muteNodeNS(n, nss); });
    else
        node.elements = [];
}
var XML = (function () {
    function XML() {
    }
    XML.parse = function (xml) {
        var x = xmljs.xml2js(xml, {
            compact: false
        });
        muteNodeNS(x);
        return x;
    };
    XML.toXML = function (xml, includeDeclaration) {
        if (includeDeclaration === void 0) { includeDeclaration = true; }
        var finalXml = xml;
        if (includeDeclaration && !xml.declaration)
            finalXml = {
                declaration: {
                    attributes: {
                        version: '1.0',
                        encoding: 'utf-8'
                    }
                },
                elements: [
                    xml
                ]
            };
        return xmljs.js2xml(finalXml, {
            compact: false
        });
    };
    XML.createElement = function (name, attributes, text) {
        if (!attributes)
            attributes = {};
        var lindex = name.lastIndexOf('/');
        if (lindex !== -1) {
            ++lindex;
            attributes['xmlns:x'] = name.substring(0, lindex);
            name = 'x:' + name.substring(lindex);
        }
        var result = {
            type: 'element',
            name: name,
            attributes: attributes,
            elements: [],
            ele: function (name, attributes) {
                var el = result.eleFn(name, attributes);
                result.elements.push(el);
                return el;
            },
            add: function (element) {
                if (element.constructor === String || element.constructor === Number)
                    element = {
                        type: 'text',
                        text: element.toString()
                    };
                if (element.type === 'element') {
                    if (!element.attributes)
                        element.attributes = {};
                    var lindex_1 = element.name.lastIndexOf('/');
                    if (lindex_1 !== -1) {
                        ++lindex_1;
                        element.attributes['xmlns:x'] = element.name.substring(0, lindex_1);
                        element.name = 'x:' + element.name.substring(lindex_1);
                    }
                }
                if (element.constructor === Array)
                    element.forEach(result.add);
                else
                    result.elements.push(element);
                return element;
            },
            eleFn: XML.createElement
        };
        return result;
    };
    return XML;
}());
exports.XML = XML;