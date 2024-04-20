// Importing in another file
import {
    // isa_hash,
    // isa_array,
    containString,
    decode_entities,
    num_keys,
    first_key,
    // trim,
  } from './xmlFunctions.js'; 
  


export class XMLParser {
    constructor(svg = null, options = {}) {
        if (!svg) return

        this.svg = svg
        this.options = {
            preserveDocumentNode: true,
            preserveAttributes: false,
            preserveWhitespace: false,
            lowerCase: false,
            forceArrays: false,
            ...options,

            attribsKey: '_Attribs',
            dataKey: '_Data',
        }

        this.regex = {
            patTag: /([^<]*?)<([^>]+)>/g,
            patSpecialTag: /^\s*([\!\?])/,
            patPITag: /^\s*\?/,
            patCommentTag: /^\s*\!--/,
            patDTDTag: /^\s*\!DOCTYPE/,
            patCDATATag: /^\s*\!\s*\[\s*CDATA/,
            patStandardTag: /^\s*(\/?)([\w\-\:\.]+)\s*([\s\S]*)$/,
            patSelfClosing: /\/\s*$/,
            patAttrib: new RegExp("([\\w\\-\\:\\.]+)\\s*=\\s*([\\\"\\'])([^\\2]*?)\\2", "g"),
            patPINode: /^\s*\?\s*([\w\-\:]+)\s*(.*)$/,
            patEndComment: /--$/,
            patNextClose: /([^>]*?)>/g,
            patExternalDTDNode: new RegExp("^\\s*\\!DOCTYPE\\s+([\\w\\-\\:]+)\\s+(SYSTEM|PUBLIC)\\s+\\\"([^\\\"]+)\\\""),
            patInlineDTDNode: /^\s*\!DOCTYPE\s+([\w\-\:]+)\s+\[/,
            patEndDTD: /\]$/,
            patDTDNode: /^\s*\!DOCTYPE\s+([\w\-\:]+)\s+\[(.*)\]/,
            patEndCDATA: /\]\]$/,
            patCDATANode: /^\s*\!\s*\[\s*CDATA\s*\[([^]*)\]\]/,
        }
        this.tree = {};
        this.errors = [];
        this.piNodeList = [];
        this.dtdNodeList = [];
        this.documentNodeName = '';

        this.regex.patTag.lastIndex = 0;
        this.parse();
    }

    parse(branch, name) {
        let indexNodeXML = 0;
        if (!branch) branch = this.tree;
        if (!name) name = null;
        let foundClosing = false;
        let matches = null;

        while (matches = this.regex.patTag.exec(this.svg)) {
            let before = matches[1];
            let tag = matches[2];
            // console.log('matches >>', matches)

            // text leading up to tag = content of parent node
            if (before.match(/\S/)) {
                // console.log('before >>', before)
                if (typeof (branch[this.options.dataKey]) != 'undefined') branch[this.options.dataKey] += ' '; else branch[this.options.dataKey] = '';
                // branch[this.dataKey] += !this.preserveWhitespace ? trim(decode_entities(before)) : decode_entities(before);
                branch[this.options.dataKey] += !this.options.preserveWhitespace ? decode_entities(before).trim() : decode_entities(before);
            }

            if (tag.match(this.regex.patSpecialTag))  {
                if (tag.match(/^\s*\?/)) 
                    tag = this.parsePINode(tag);
                else if (tag.match(/^\s*\!--/))
                    tag = this.parseCommentNode(tag);
                else if (tag.match(/^\s*\!DOCTYPE/)) {
                    tag = this.parseCDATANode(tag);
                    if (typeof (branch[this.options.dataKey]) != 'undefined') branch[this.options.dataKey] += ' '; else branch[this.options.dataKey] = '';
                    branch[this.options.dataKey] += !this.preserveWhitespace ? decode_entities(tag).trim() : decode_entities(tag);
                } else {
                    this.throwParseError("Malformed special tag", tag);
                    break;
                }

                if (tag == null) break;
                continue
            } else {
                let matches = tag.match(this.regex.patStandardTag);
                if (!matches) {
                    this.throwParseError("Malformed tag", tag);
                    break;
                }

                let closing = matches[1];
                let nodeName = this.options.lowerCase ? matches[2].toLowerCase() : matches[2];
                let attribsRaw = matches[3]

                if (closing) {
                    if (nodeName == (name || '')) {
                        foundClosing = true; 
                        break;
                    } else {
                        this.throwParseError("Mismatched closing tag (expected </" + name + ">)", tag);
                        break;
                    }
                } else {
                    const isSelfClosing = !!attribsRaw.match(this.regex.patSelfClosing);
                    let leaf = {}
                    let attribs = leaf;

                    if (this.options.preserveAttributes) {
                        leaf[this.options.attribsKey] = {};
                        attribs = leaf[this.options.attribsKey];
                        // console.log('attribs >>>>....', attribs)
                    }

                    var nameObjectXML = ["rect", "polygon", "ellipse", "circle", "path", "line", "polyline"];
                    if (containString(nameObjectXML, nodeName)) {
                        attribs["indexNodeXML"] = indexNodeXML;
                        indexNodeXML++;
                    }

                    this.regex.patAttrib.lastIndex = 0;
                    while (matches = this.regex.patAttrib.exec(attribsRaw)) {
                        let key = this.options.lowerCase ? matches[1].toLowerCase() : matches[1];
                        attribs[key] = decode_entities(matches[3]);
                    }

                    if (this.options.preserveAttributes && !num_keys(attribs)) {
                        delete leaf[this.options.attribsKey];
                    }

                    if (!isSelfClosing) {
                        // console.log('Not Self Closing >====', leaf, 'nodeName >====', nodeName)
                        this.parse(leaf, nodeName);
                        if (this.error()) break;
                    }

                    let num_leaf_keys = num_keys(leaf);
                    if ((typeof (leaf[this.options.dataKey]) != 'undefined') && (num_leaf_keys == 1)) {
                        leaf = leaf[this.options.dataKey];
                    } else if (!num_leaf_keys) {
                        leaf = '';
                    }

                    if (typeof (branch[nodeName]) !== 'undefined') {
                        if (Array.isArray(branch[nodeName])) {
                            branch[nodeName].push(leaf);
                        } else {
                            let temp = branch[nodeName];
                            branch[nodeName] = [temp, leaf]
                        }
                    } else if (this.options.forceArrays && (branch !== this.tree)) {
                        branch[nodeName] = [leaf]
                    } else {
                        branch[nodeName] = leaf
                    }

                    if (this.error() || (branch === this.tree)) break;
                }

            }

        }

        if (name && !foundClosing) {
            this.throwParseError("Missing closing tag (expected </" + name + ">)", name);
        }

        if (branch == this.tree) {
            // console.log('brnach', branch, 'dataKey', branch[this.dataKey])
            if (typeof (this.tree[this.dataKey]) != 'undefined') delete this.tree[this.dataKey];

            if (num_keys(this.tree) > 1) {
                this.throwParseError('Only one top-level node is allowed in document', first_key(this.tree));
                return;
            }

            this.documentNodeName = first_key(this.tree);
            if (this.documentNodeName && !this.preserveDocumentNode) {
                this.tree = this.tree[this.documentNodeName];
            }
        }
    }

    throwParseError (key, tag) {
        // log error and locate current line number in source XML document
        var parsedSource = this.text.substring(0, this.patTag.lastIndex);
        var eolMatch = parsedSource.match(/\n/g);
        var lineNum = (eolMatch ? eolMatch.length : 0) + 1;
        lineNum -= tag.match(/\n/) ? tag.match(/\n/g).length : 0;

        this.errors.push({
            type: 'Parse',
            key: key,
            text: '<' + tag + '>',
            line: lineNum
        });

        // Throw actual error (must wrap parse in try/catch)
        throw new Error(this.getLastError());
    }

    error () {
        return this.errors.length;
    }

    getLastError () {
        // Get most recently thrown error in plain text format
        if (!this.error()) return '';
        return this.getError(this.errors[this.errors.length - 1]);
    }

    parsePINode (tag) {
        // Parse Processor Instruction Node, e.g. <?xml version="1.0"?>
        if (!tag.match(this.regex.patPINode)) {
            this.throwParseError("Malformed processor instruction", tag);
            return null;
        } 

        this.piNodeList.push(tag);
        return tag;
    }

    parseCommentNode (tag) {
        // Parse Comment Node, e.g. <!-- hello -->
        var matches = null;
        this.regex.patNextClose.lastIndex = this.regex.patTag.lastIndex;

        while (!tag.match(this.regex.patEndComment)) {
            if (matches = this.regex.patNextClose.exec(this.text)) {
                tag += '>' + matches[1];
            }
            else {
                this.throwParseError("Unclosed comment tag", tag);
                return null;
            }
        }

        this.regex.patTag.lastIndex = this.regex.patNextClose.lastIndex;
        return tag;
    }

    getTree () {
        return this.tree;
    }
}