(() => {
 const bridge=window.focusPetDesktop;
 if (!bridge) return;
 const original=Storage.prototype.setItem;
 const stored=bridge.loadStore();
 for (const [key,value] of Object.entries(stored)) original.call(localStorage,key,value);
 for(let i=0;i<localStorage.length;i++) { const key=localStorage.key(i); if(key.startsWith('focus-') && !(key in stored)) bridge.saveEntry(key,localStorage.getItem(key)); }
 Storage.prototype.setItem=function(key,value){ if(this===localStorage && String(key).startsWith('focus-')) bridge.saveEntry(String(key),String(value)); return original.call(this,key,value); };
 bridge.onStoreChange(({key,value})=>{ original.call(localStorage,key,value); window.dispatchEvent(new StorageEvent('storage',{key,newValue:value,storageArea:localStorage})); });
})();
