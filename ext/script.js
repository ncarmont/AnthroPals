
document.addEventListener('click', async e => {
    console.clear()
    const elem =  document.elementFromPoint(e.clientX, e.clientY) 
    // if(!elem.innerText.includes("GPT Chat") && window.location.href.includes("jira")){
    //     elem.style.border = "2px dotted red";
    //     storeValueChromeStorage(GET_JIRA_TXT_CHROME_STORAGE_STRING,elem.innerText)
    // }

    if(elem.id === "GPT"){
        alert("test")
    
    }
  }, {passive: true})