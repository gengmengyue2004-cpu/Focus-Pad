document.querySelector('[data-open-custom]').addEventListener('click',()=>{location.href='../companion.html#your-rhythm';});

document.getElementById('curveButton').addEventListener('click',event=>{if(window.focusPetDesktop?.isWidget){event.stopImmediatePropagation();window.focusPetDesktop.openCustomization();}},true);
