let adBlockEnabled = true;
let blockedDomains = [];
let blockedTrackers = [];

// Fetch all domains from the blocked_domains.json.
fetch (chrome.runtime.getURL("blocked_domains.json")).then(response => response.json())
.then(data => { blockedDomains = data.domains; })
.catch(error => console.error("Could not load domains", error));

// Fetch all trackers from the blocked_trackers.json.
fetch (chrome.runtime.getURL("blocked_trackers.json")).then(response => response.json())
.then(data => { blockedTrackers = data.trackers; })
.catch(error => console.error("Could not load trackers", error));

// Retrieve the last state of ad blocking when the extension starts
chrome.storage.sync.get("adBlockToggle", (result) => {
    if(result.adBlockToggle !== undefined){
        adBlockEnabled = result.adBlockToggle;
        updateRules(adBlockEnabled);
        updateTrackerRules(adBlockEnabled);
        updateCookies(adBlockEnabled);
    }
});

//Listen for change of state from home.js
chrome.runtime.onMessage.addListener((message) =>{
    if(message.action === "toggleAdBlock"){
        adBlockEnabled = message.enabled;
        chrome.storage.sync.set({adBlockToggle: adBlockEnabled});
        updateRules(adBlockEnabled);
        updateTrackerRules(adBlockEnabled);
        updateCookies(adBlockEnabled);
    }
});

// Function to update ad-blocking rules
function updateRules(enable) {
    if(enable){
        if (blockedDomains.length == 0) return;

    const rules = blockedDomains.map((domain, index) => ({
        id: index + 1,  // Unique ID for each rule
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: `||${domain}`,
            resourceTypes: ["script", "image", "xmlhttprequest", "sub_frame"]
        }
    }));

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(rule => rule.id),
        addRules: rules
    });
    }else{
        return;
    }
    
}

// Function to update tracker-blocking rules
function updateTrackerRules(enable) {
    if(enable){
        if (blockedTrackers.length == 0) return;

        const trackerRules = blockedTrackers.map((tracker, index) => ({
            id: index + 1,  // Unique ID for each rule
            priority: 1,
            action: { type: "block" },
            condition: {
                urlFilter: `||${tracker}`,
                resourceTypes: ["script", "image", "xmlhttprequest", "sub_frame"]
            }
        }));
    
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: trackerRules.map(rule => rule.id),
            addRules: trackerRules
        });
    }else{
        return;
    }
    
}

// -------------------------------------END OF AD BLOCKING FUNCTIONALITY-----------------------------------------------------

function updateCookies(enable){
        chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: !enable });
}