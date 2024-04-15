// Importing in another file
import {
    isa_hash,
    isa_array,
    containString,
    decode_entities,
    num_keys,
    first_key,
    trim,
  } from './xmlFunctions.js'; 
  

// let xml_header = '<?xml version="1.0"?>';
// // let sort_args = null;
// // let re_valid_tag_name = /^\w[\w\-\:\.]*$/;
// // var indexNodeXML = 0;

// export const XMLparser = {

//     preserveDocumentNode: false,
//     preserveAttributes: false,
//     preserveWhitespace: false,
//     lowerCase: false,
//     forceArrays: false,

//     patTag: /([^<]*?)<([^>]+)>/g,
//     patSpecialTag: /^\s*([\!\?])/,
//     patPITag: /^\s*\?/,
//     patCommentTag: /^\s*\!--/,
//     patDTDTag: /^\s*\!DOCTYPE/,
//     patCDATATag: /^\s*\!\s*\[\s*CDATA/,
//     patStandardTag: /^\s*(\/?)([\w\-\:\.]+)\s*([\s\S]*)$/,
//     patSelfClosing: /\/\s*$/,
//     patAttrib: new RegExp("([\\w\\-\\:\\.]+)\\s*=\\s*([\\\"\\'])([^\\2]*?)\\2", "g"),
//     patPINode: /^\s*\?\s*([\w\-\:]+)\s*(.*)$/,
//     patEndComment: /--$/,
//     patNextClose: /([^>]*?)>/g,
//     patExternalDTDNode: new RegExp("^\\s*\\!DOCTYPE\\s+([\\w\\-\\:]+)\\s+(SYSTEM|PUBLIC)\\s+\\\"([^\\\"]+)\\\""),
//     patInlineDTDNode: /^\s*\!DOCTYPE\s+([\w\-\:]+)\s+\[/,
//     patEndDTD: /\]$/,
//     patDTDNode: /^\s*\!DOCTYPE\s+([\w\-\:]+)\s+\[(.*)\]/,
//     patEndCDATA: /\]\]$/,
//     patCDATANode: /^\s*\!\s*\[\s*CDATA\s*\[([^]*)\]\]/,

//     attribsKey: '_Attribs',
//     dataKey: '_Data',

//     XMLparse: function (args, opts) {
//         // class constructor for XML parser class
//         // pass in args hash or text to parse
//         if (!args) args = '';
//         if (isa_hash(args)) {
//             for (var key in args) this[key] = args[key];
//         }
//         else this.text = args || '';

//         // options may be 2nd argument as well
//         if (opts) {
//             for (var key in opts) this[key] = opts[key];
//         }

//         this.tree = {};
//         this.errors = [];
//         this.piNodeList = [];
//         this.dtdNodeList = [];
//         this.documentNodeName = '';

//         this.patTag.lastIndex = 0;
//         if (this.text) this.parse();

//         return this;
//     },

//     parse: function (branch, name) {
//         // TODO : resolve bug here for exporting several layers one time, the layers are not correctly detected
//         let indexNodeXML = 0
//         // parse text into XML tree, recurse for nested nodes
//         if (!branch) branch = this.tree;
//         if (!name) name = null;
//         var foundClosing = false;
//         var matches = null;

//         // match each tag, plus preceding text
//         while (matches = this.patTag.exec(this.text)) {
//             // console.log('matches ;;', matches)
//             var before = matches[1];
//             var tag = matches[2];
//             // console.log('before >>', before, 'tag >>', tag)

//             // text leading up to tag = content of parent node
//             if (before.match(/\S/)) {
//                 if (typeof (branch[this.dataKey]) != 'undefined') branch[this.dataKey] += ' '; else branch[this.dataKey] = '';
//                 branch[this.dataKey] += !this.preserveWhitespace ? trim(decode_entities(before)) : decode_entities(before);
//             }

//             // parse based on tag type
//             if (tag.match(this.patSpecialTag)) {
//                 // special tag
//                 if (tag.match(this.patPITag)) tag = this.parsePINode(tag);
//                 else if (tag.match(this.patCommentTag)) tag = this.parseCommentNode(tag);
//                 else if (tag.match(this.patDTDTag)) tag = this.parseDTDNode(tag);
//                 else if (tag.match(this.patCDATATag)) {
//                     tag = this.parseCDATANode(tag);
//                     if (typeof (branch[this.dataKey]) != 'undefined') branch[this.dataKey] += ' '; else branch[this.dataKey] = '';
//                     branch[this.dataKey] += !this.preserveWhitespace ? trim(decode_entities(tag)) : decode_entities(tag);
//                 } // cdata
//                 else {
//                     this.throwParseError("Malformed special tag", tag);
//                     break;
//                 } // error

//                 if (tag == null) break;
//                 continue;
//             } // special tag
//             else {
//                 // Tag is standard, so parse name and attributes (if any)
//                 var matches = tag.match(this.patStandardTag);
//                 // console.log('Matches  ..', matches)
//                 if (!matches) {
//                     this.throwParseError("Malformed tag", tag);
//                     break;
//                 }

//                 var closing = matches[1];
//                 var nodeName = this.lowerCase ? matches[2].toLowerCase() : matches[2];
//                 var attribsRaw = matches[3];

//                 // console.log('atribs >>', attribsRaw)
//                 // If this is a closing tag, make sure it matches its opening tag
//                 if (closing) {
//                     if (nodeName == (name || '')) {
//                         console.log('nodeName > ', nodeName, 'name >  ', name)
//                         foundClosing = 1;
//                         break;
//                     }
//                     else {
//                         this.throwParseError("Mismatched closing tag (expected </" + name + ">)", tag);
//                         break;
//                     }
//                 } // closing tag
//                 else {
//                     // Not a closing tag, so parse attributes into hash.  If tag
//                     // is self-closing, no recursive parsing is needed.
//                     var selfClosing = !!attribsRaw.match(this.patSelfClosing);
//                     var leaf = {};
//                     var attribs = leaf;

//                     // preserve attributes means they go into a sub-hash named "_Attribs"
//                     // the XML composer honors this for restoring the tree back into XML
//                     if (this.preserveAttributes) {
//                         leaf[this.attribsKey] = {};
//                         attribs = leaf[this.attribsKey];
//                         console.log('attribs >>>>....', attribs)
//                     }

//                     var nameObjectXML = ["rect", "polygon", "ellipse", "circle", "path", "line", "polyline"];
//                     if (containString(nameObjectXML, nodeName)) {
//                         attribs["indexNodeXML"] = indexNodeXML;
//                         indexNodeXML++;
//                     }


//                     // parse attributes
//                     this.patAttrib.lastIndex = 0;
//                     while (matches = this.patAttrib.exec(attribsRaw)) {
//                         var key = this.lowerCase ? matches[1].toLowerCase() : matches[1];
//                         attribs[key] = decode_entities(matches[3]);
//                         // console.log('matches <>>>>><<', matches, 'attre', attribs)
//                     } // foreach attrib



//                     // if no attribs found, but we created the _Attribs subhash, clean it up now
//                     if (this.preserveAttributes && !num_keys(attribs)) {
//                         delete leaf[this.attribsKey];
//                     }

//                     // Recurse for nested nodes
//                     if (!selfClosing) {
//                         this.parse(leaf, nodeName);
//                         if (this.error()) break;
//                     }

//                     // Compress into simple node if text only
//                     var num_leaf_keys = num_keys(leaf);
                    
//                     if ((typeof (leaf[this.dataKey]) != 'undefined') && (num_leaf_keys == 1)) {
//                         leaf = leaf[this.dataKey];
//                         // console.log('num ;;;', num_leaf_keys, 'leaf', leaf)
//                     }
//                     else if (!num_leaf_keys) {
//                         leaf = '';
//                         // console.log('num ;;;', num_leaf_keys, 'leaf', leaf)
//                     }

//                     // foundClosing     // Add leaf to parent branch
//                     if (typeof (branch[nodeName]) != 'undefined') {
//                         // console.log('branch[nodeName]', branch[nodeName], 'nodeName ', nodeName)
//                         if (isa_array(branch[nodeName])) {
//                             // console.log('Old Branch', branch[nodeName])
//                             branch[nodeName].push(leaf);
//                             // console.log('New Branch', leaf)
//                         }
//                         else {
//                             var temp = branch[nodeName];
//                             // console.log('Old Branch', temp, 'nodeName ', nodeName)
//                             branch[nodeName] = [temp, leaf];
//                             // console.log('New Branch', [temp, leaf])
//                         }
//                     }
//                     else if (this.forceArrays && (branch != this.tree)) {
//                         // console.log('New Branch', leaf)
//                         branch[nodeName] = [leaf];
//                     }
//                     else {
//                         branch[nodeName] = leaf;
//                         console.log('Leaf', leaf)
//                     }

//                     if (this.error() || (branch == this.tree)) {console.log('branch', branch); break;}
//                 } // not closing
//             } // standard tag
//         } // main reg exp

//         // Make sure we found the closing tag
//         if (name && !foundClosing) {
//             this.throwParseError("Missing closing tag (expected </" + name + ">)", name);
//         }

//         // If we are the master node, finish parsing and setup our doc node
//         if (branch == this.tree) {
//             // console.log('brnach', branch, 'dataKey', branch[this.dataKey])
//             if (typeof (this.tree[this.dataKey]) != 'undefined') delete this.tree[this.dataKey];

//             if (num_keys(this.tree) > 1) {
//                 this.throwParseError('Only one top-level node is allowed in document', first_key(this.tree));
//                 return;
//             }

//             this.documentNodeName = first_key(this.tree);
//             if (this.documentNodeName && !this.preserveDocumentNode) {
//                 this.tree = this.tree[this.documentNodeName];
//             }
//         }
//     },

//     throwParseError: function (key, tag) {
//         // log error and locate current line number in source XML document
//         var parsedSource = this.text.substring(0, this.patTag.lastIndex);
//         var eolMatch = parsedSource.match(/\n/g);
//         var lineNum = (eolMatch ? eolMatch.length : 0) + 1;
//         lineNum -= tag.match(/\n/) ? tag.match(/\n/g).length : 0;

//         this.errors.push({
//             type: 'Parse',
//             key: key,
//             text: '<' + tag + '>',
//             line: lineNum
//         });

//         // Throw actual error (must wrap parse in try/catch)
//         throw new Error(this.getLastError());
//     },

//     error: function () {
//         // return number of errors
//         return this.errors.length;
//     },

//     getError: function (error) {
//         // get formatted error
//         var text = '';
//         if (!error) return '';

//         text = (error.type || 'General') + ' Error';
//         if (error.code) text += ' ' + error.code;
//         text += ': ' + error.key;

//         if (error.line) text += ' on line ' + error.line;
//         if (error.text) text += ': ' + error.text;

//         return text;
//     },

//     getLastError: function () {
//         // Get most recently thrown error in plain text format
//         if (!this.error()) return '';
//         return this.getError(this.errors[this.errors.length - 1]);
//     },

//     parsePINode: function (tag) {
//         // Parse Processor Instruction Node, e.g. <?xml version="1.0"?>
//         if (!tag.match(this.patPINode)) {
//             this.throwParseError("Malformed processor instruction", tag);
//             return null;
//         }

//         this.piNodeList.push(tag);
//         return tag;
//     },

//     parseCommentNode: function (tag) {
//         // Parse Comment Node, e.g. <!-- hello -->
//         var matches = null;
//         this.patNextClose.lastIndex = this.patTag.lastIndex;

//         while (!tag.match(this.patEndComment)) {
//             if (matches = this.patNextClose.exec(this.text)) {
//                 tag += '>' + matches[1];
//             }
//             else {
//                 this.throwParseError("Unclosed comment tag", tag);
//                 return null;
//             }
//         }

//         this.patTag.lastIndex = this.patNextClose.lastIndex;
//         return tag;
//     },

//     parseDTDNode: function (tag) {
//         // Parse Document Type Descriptor Node, e.g. <!DOCTYPE ... >
//         var matches = null;

//         if (tag.match(this.patExternalDTDNode)) {
//             // tag is external, and thus self-closing
//             this.dtdNodeList.push(tag);
//         }
//         else if (tag.match(this.patInlineDTDNode)) {
//             // Tag is inline, so check for nested nodes.
//             this.patNextClose.lastIndex = this.patTag.lastIndex;

//             while (!tag.match(this.patEndDTD)) {
//                 if (matches = this.patNextClose.exec(this.text)) {
//                     tag += '>' + matches[1];
//                 }
//                 else {
//                     this.throwParseError("Unclosed DTD tag", tag);
//                     return null;newTree
//                 }
//             }

//             this.patTag.lastIndex = this.patNextClose.lastIndex;

//             // Make sure complete tag is well-formed, and push onto DTD stack.
//             if (tag.match(this.patDTDNode)) {
//                 this.dtdNodeList.push(tag);
//             }
//             else {
//                 this.throwParseError("Malformed DTD tag", tag);
//                 return null;
//             }
//         }
//         else {
//             this.throwParseError("Malformed DTD tag", tag);
//             return null;
//         }

//         return tag;
//     },

//     getTree: function () {
//         // get reference to parsed XML tree
//         return this.tree;
//     },

//     compose: function (indent_string, eol) {
//         // compose tree back into XML
//         if (typeof (eol) == 'undefined') eol = "\n";
//         var tree = this.tree;
//         if (this.preserveDocumentNode) tree = tree[this.documentNodeName];

//         var raw = compose_xml(tree, this.documentNodeName, 0, indent_string, eol);
//         var body = raw.replace(/^\s*\<\?.+?\?\>\s*/, '');
//         var xml = '';

//         if (this.piNodeList.length) {
//             for (var idx = 0, len = this.piNodeList.length; idx < len; idx++) {
//                 xml += '<' + this.piNodeList[idx] + '>' + eol;
//             }
//         }
//         else {
//             xml += xml_header + eol;
//         }

//         if (this.dtdNodeList.length) {
//             for (var idx = 0, len = this.dtdNodeList.length; idx < len; idx++) {
//                 xml += '<' + this.dtdNodeList[idx] + '>' + eol;
//             }
//         }

//         xml += body;
//         return xml;
//     },
// }


export class newXMLParser {
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
            console.log('matches ;;', matches)

            // text leading up to tag = content of parent node
            if (before.match(/\S/)) {
                if (typeof (branch[this.dataKey]) != 'undefined') branch[this.dataKey] += ' '; else branch[this.dataKey] = '';
                branch[this.dataKey] += !this.preserveWhitespace ? trim(decode_entities(before)) : decode_entities(before);
            }

            if (tag.match(this.regex.patSpecialTag))  {
                if (tag.match(/^\s*\?/)) 
                    tag = this.parsePINode(tag);
                else if (tag.match(/^\s*\!--/))
                    tag = this.parseCommentNode(tag);
                else if (tag.match(/^\s*\!DOCTYPE/)) {
                    tag = this.parseCDATANode(tag);
                    if (typeof (branch[this.dataKey]) != 'undefined') branch[this.dataKey] += ' '; else branch[this.dataKey] = '';
                    branch[this.dataKey] += !this.preserveWhitespace ? trim(decode_entities(tag)) : decode_entities(tag);
                } else {
                    this.throwParseError("Malformed special tag", tag);
                    break;
                }

                // if (tag == null) break;
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
                        console.log('attribs >>>>....', attribs)
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