'use strict';

import postcss from 'postcss';

function dedupe(ary) {
    return ary.filter((el, i) => ary.indexOf(el) === i)
}

export default postcss.plugin('postcss-merge-rules-non-adjacent', () => {
    return css => {
        const declObjs = {
            //decl.toString() => {sources: [], sels: [selectors]}
        }
        // collect declarations as key to selectors matching list
        css.walkRules((rule)=>{
            rule.walk(decl=>{
                const declStr = decl.toString();
                const declObj = (declObjs[declStr] || {decls: [], sels:[]});
                declObj.sels = declObj.sels.concat(rule.selectors)
                declObj.decls = declObj.decls.concat([decl])
                declObjs[declStr] = declObj
            })
            rule.remove()
        })
        // invert so it's selectors => declarations
        const selToDecls = {
            //sel.toString() => [{decls: [], decl: decl.toString()}]
        }
        Object.keys(declObjs).forEach(declStr=>{
            // dedupe and sort selector lists
            const {sels, decls} = declObjs[declStr];
            const selStr = dedupe(sels).sort().join(',')
            selToDecls[selStr] = (selToDecls[selStr] || []).concat([{
                declStr,
                decls,
            }])
        })
        // now 
        Object.keys(selToDecls).forEach(selStr=>{
            const decls = selToDecls[selStr];
            const newRule = postcss.rule({ selector: selStr })
            decls.forEach(({declStr, decls})=>{
                const ruleWithDecl = postcss.parse(`a{${declStr}}`)
                const newDecl = ruleWithDecl.first.first;
                //newDecl.source = postcss.mergeSources(decls)
                newRule.append(newDecl)
            })
            css.append(newRule)
        })
    }
});