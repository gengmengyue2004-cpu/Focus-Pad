const fs=require('fs'),path=require('path');
function createStore(directory){
 fs.mkdirSync(directory,{recursive:true});const file=path.join(directory,'focus-pad-data.json'),backup=file+'.bak';let values={};
 if(fs.existsSync(file)) {try{values=JSON.parse(fs.readFileSync(file,'utf8')).values;}catch(error){if(!fs.existsSync(backup))throw error;values=JSON.parse(fs.readFileSync(backup,'utf8')).values;fs.copyFileSync(file,file+'.corrupt-'+Date.now());fs.copyFileSync(backup,file);}}
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Invalid data file');
 return {file,read:()=>({...values}),set(key,value){const next={...values,[key]:value};const tmp=file+'.tmp';const fd=fs.openSync(tmp,'w');try{fs.writeFileSync(fd,JSON.stringify({version:1,savedAt:new Date().toISOString(),values:next},null,2),'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}if(fs.existsSync(file))fs.copyFileSync(file,backup);fs.renameSync(tmp,file);values=next;}};
}
module.exports={createStore};
