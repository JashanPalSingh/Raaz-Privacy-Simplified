let adBlockEnabled = true;

// Retrieve the last state of ad blocking when the extension starts
chrome.storage.sync.get("adBlockToggle", (result) => {
    if(result.adBlockToggle !== undefined){
        adBlockEnabled = result.adBlockToggle;
    }
});

//Listen for change of state from home.js
chrome.runtime.onMessage.addListener((message, sender,response) =>{
    if(message.action === "toggleAdBlock"){
        adBlockEnabled = message.enabled;
        chrome.storage.sync.set({adBlockToggle: adBlockEnabled});
    }
});

//Block ads based on current state.
chrome.webRequest.onBeforeRequest.addListener((details) =>{
    if(!adBlockEnabled) return {cancel:false};
    else{
        const url = details.url;
        if (blockedDomains.some((domain) => url.hostname.includes(domain))){
            console.log(`Blocked: ${details.url}`);
            return {cancel: true};
        }
    }},
    { urls: ["<all_urls>"]},
    ["blocking"]
);