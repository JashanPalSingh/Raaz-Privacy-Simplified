let adBlockEnabled = true;
let blockedDomains = [];

// Fetch all domains from the blocked_domains.json.
fetch (chrome.runtime.getURL("blocked_domains.json")).then(response => response.json())
.then(data => { blockedDomains = data.domains; })
.catch(error => console.error("Could not load domains", error));

// Retrieve the last state of ad blocking when the extension starts
chrome.storage.sync.get("adBlockToggle", (result) => {
    if(result.adBlockToggle !== undefined){
        adBlockEnabled = result.adBlockToggle;
        updateRules(adBlockEnabled);
    }
});

//Listen for change of state from home.js
chrome.runtime.onMessage.addListener((message, sender,response) =>{
    if(message.action === "toggleAdBlock"){
        adBlockEnabled = message.enabled;
        chrome.storage.sync.set({adBlockToggle: adBlockEnabled});
        updateRules(adBlockEnabled);
    }
});

// Function to update ad-blocking rules
function updateRules(enable) {
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
        addRules: enable ? rules : []
    }, () => {
        console.log(enable ? `Enabled ${rules.length} ad-blocking rules` : "Ad blocking disabled");
    });
}

// -------------------------------------END OF AD BLOCKING FUNCTIONALITY-----------------------------------------------------