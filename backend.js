/* This is the brains behind most of the functionality in our Chrome extension. We mentioned this file in our 
manifest.JSON to tell the browser that this file will govern all the services provided by our extension.*/

//First, we define some variables that we will use within this file.
let adBlockEnabled = true;  // Variable that decides, the current status of out ad-block switch, we initialize it as true be default and update it as user changes preferences.
let blockedDomains = [];    // This is an empty list that will soon contain about six thousand entries of blocked domains as we fetch them from our blocked_domains.JSON.
let blockedTrackers = [];   // This list will contain over fifteen thousand nefarious trackers present in our blocked-trackers.JSON.

/* Fetch all domains from the blocked_domains.json.
   the getURL method returns a String of content present in the mentioned URL and thus, needs to be converted to JSON again.
   Source: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getURL 
   We then simply set the value of our variable defined earlier to the attribute present in our JSOn, which is also a list. */
fetch (chrome.runtime.getURL("blocked_domains.json")).then(response => response.json())
.then(data => { blockedDomains = data.domains; })
.catch(error => console.error("Could not load domains", error));

// Fetch all trackers from the blocked_trackers.json. Same woring as the other list variable.
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

/*Listen for change of state from home.js 
As mentioned in the home.js, chrome.runtime.onMessage listens for any messages broadcasted by other functions.
If the message contains our desired content, we once again set the updated parameter in browser storage and call in functions to
implement the ad blocking, tracker blocking, and third-party cookie blocking functionality */
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
//--------------------------------------COOKIE BLOCKING----------------------------------------------------------------------

function updateCookies(enable){
        chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: !enable });
}