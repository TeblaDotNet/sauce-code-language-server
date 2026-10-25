/** Reviewed completion-only semantic projection; no editorial values are copied. */
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,structuredClone(value[k])]));
const dictionary=(value,project)=>Object.fromEntries(Object.entries(value).map(([id,item])=>[id,project(item)]));
const names=value=>pick(value,['names','plural_names','lexical_names']);
function structure(value){
 const out=names(value);
 if(value.aliases)out.aliases=value.aliases.map(a=>typeof a==='string'?a:pick(a,['name','type','warning']));
 if(value.variants)out.variants=dictionary(value.variants,v=>pick(v,['names','aliases','canonical_id']));
 if(value.states)out.states=dictionary(value.states,v=>pick(v,['names','aliases']));
 if(value.parts)out.parts=dictionary(value.parts,structure);
 if(value.part_groups)out.part_groups=dictionary(value.part_groups,v=>pick(v,['process','parts']));
 return out;
}
export function completionEntry(entry){
 const out={...pick(entry,['id','kind','canonical_name','reference','type_of','canonical_target']),...structure(entry)};
 if(entry.exact_names)out.exact_names=entry.exact_names.map(n=>pick(n,['name','locale']));
 return out;
}
