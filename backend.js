/* This is the brains behind most of the functionality in our Chrome extension. We mentioned this file in our 
manifest.JSON to tell the browser that this file will govern all the services provided by our extension.*/

//First, we define some variables that we will use within this file.
let phishingReminderEnabled = false;
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
        blockRefererHeader(adBlockEnabled);
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
        blockRefererHeader(adBlockEnabled);
    }
});

/*Function to update ad-blocking rules.
 Dynamic rules in Chrome API allow us to block network requests, upgrade http schemas to https, redirect network requests, or modify requests or response headers.
 These rules are written in a JSON format and are implemented using Chrome API's declarativeNetRequest method. We use this functionality to block domains present in 
 our ad and tracker list. Source 1: https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest 
                          Source 2: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest */
function updateRules(enable) {
    if(enable){
        if (blockedDomains.length == 0) return;
    
    //We construct rule objects with the below specified attributes by mapping each entry (domain) in blockedDomains and assigning each entry a unique index starting at 1. 
    const rules = blockedDomains.map((domain, index) => ({
        id: index + 1,      // Unique ID for each rule
        priority: 1,        //Priority of our rule. Higher priority takes prevelance, we use the default value of 1 for all rules.
        action: { type: "block" },      // Our rules block requests on the following conditions.
        condition: {
            urlFilter: `||${domain}`,   // Our rule applies the action to any URL that contains onr of our black-listed domains. the "||" allows us to block domain name irresective of the preceeding sub-domain
            resourceTypes: ["script", "image", "xmlhttprequest", "sub_frame"]   // These are the types of resources we want to block coming from our domains. These are the ads and trackers you see.
        }
    }));
/* After setting up our new rules, we now put them into use. We use the updateDynamicRules within the declarativeNetRequest to update any existing rules.
First, we remove existing rules with the same rule IDs as our newly created rules. We map the rules object to only send out our rule IDs to be 
removed from the browser if they already exist.
Second, we add the rules we created by feeding the rule object to the method. 
*/
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(rule => rule.id),
        addRules: rules
    });
    }
    /*The following code executes when the user disables the switch. we reate a temporary list of rule indexes that contains the rule ids of rules we created before.
    we then remove our rules  */
    else{
        const indexes = [];
        for (let i = 1; i <= blockedDomains.length; i++) {
            indexes.push(i);
        }

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: indexes
        })
    }
    
}

// Function to update tracker-blocking rules. Funstionality of this part is the same as blocking ad domains, just with a few minor changes.
function updateTrackerRules(enable) {
    if(enable){
        if (blockedTrackers.length == 0) return; // Instead of feeding ad domains, we now feed tracker domains.

        // We do not want our tracking rules to override our ad block rules, so the index of tracker rules begin after all ad domain rules.
        // We added 1 as a buffer between indexes of ads and trackers.
        const trackerRules = blockedTrackers.map((tracker, index = blockedDomains.length + 1) => ({
            id: index + 1,
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
        const indexes = [];
        for (let i = blockedDomains.length + 1; i <= (blockedDomains.length + 1 + blockedTrackers.length); i++) {
            indexes.push(i);
        }

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: indexes
        })
    }
    
}

// -------------------------------------END OF AD BLOCKING FUNCTIONALITY-----------------------------------------------------
//--------------------------------------COOKIE BLOCKING----------------------------------------------------------------------

/* This function simply changes the third-party cookie blocking setting within the Chrome browser.
    If our switch is on, third party cookies allowed is set to false, meaning they are not allowed.
    If our switch is off, third-party cookies are allowed (true).
    Source: https://sunnyzhou-1024.github.io/chrome-extension-docs/extensions/privacy.html 
*/
function updateCookies(enable){
        chrome.privacy.websites.thirdPartyCookiesAllowed.set({ value: !enable });
}

//---------------------------------SAFE EMAIL REMINDER----------------------------------------------------------------------

chrome.storage.sync.get("phishingReminderToggle", (result) => {
    if (result.phishingReminderToggle !== undefined) {
        phishingReminderEnabled = result.phishingReminderToggle;
    } else {
        phishingReminderEnabled = false;
        chrome.storage.sync.set({ phishingReminderToggle: false });
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "togglePhishingReminder") {
        phishingReminderEnabled = message.enabled;
        chrome.storage.sync.set({ phishingReminderToggle: phishingReminderEnabled });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated
    if (changeInfo.status === 'complete' && tab.url) {
        const emailDomains = ['mail.google.com', 'outlook.live.com', 'mail.yahoo.com'];
        const isEmailService = emailDomains.some(domain => tab.url.includes(domain));
        if (isEmailService) {
            showSafeEmailReminder();
        }
    }
});

function showSafeEmailReminder() { // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Notifications
    if (phishingReminderEnabled) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'smallLogo.PNG',
            title: 'Safe Email Practices Reminder',
            message: 'Safe Email Reminder!!!!!',
            priority: 2
        });
    }
}

//------------------------------REFERER HEADER REMOVAL-------------------------------------------------------------------
/* This functions takes care of blocking referer headers. Referer headers can be used to track a user's browsing behaviour.
Referer headers can be removed the same way like ads or 
*/
function blockRefererHeader(enable){
    const headerIndex = blockedDomains.length + blockedTrackers.length + 1;
    if(enable){
        const headerRule = [{
            id: headerIndex,
            priority: 1,
            action: {
                type: "modifyHeaders",
                requestHeaders: [{
                    header: "referer",
                    operation: "remove"
                }]
            },
            condition: {
                urlFilter: "*",
                resourceTypes: ["main_frame","script", "image", "xmlhttprequest", "sub_frame"]
            }
        }];
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [headerIndex],
            addRules: headerRule
        });
    }else{
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [headerIndex]
        });
    }
}