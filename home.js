document.addEventListener("DOMContentLoaded", () => {

    const adBlockCheckbox = document.querySelector("#toggleAdBlock");


    //Find the value of the ad blocker toggle switch present in chome storage. Create an anonymous function that
    //checks the last state of it. If it was toggled on, we set the current state to on, same for off. For undefined (during the first setup), we let it be on by default.
    chrome.storage.sync.get("adBlockToggle", (result) => {
        if(result.adBlockToggle !== undefined){
            adBlockCheckbox.checked = result.adBlockToggle;
        }
        else{
            adBlockCheckbox.checked = true;
            chrome.storage.sync.set({adBlockToggle: true});
        }
    });
    // Adding an event listner to the ad blocking checkbox that detects user-made change to checkbox state and updates the state to chrome storage.
    adBlockCheckbox.addEventListener("change", () => {
        // console.log("It is working");
        const isEnabled = adBlockCheckbox.checked;
        chrome.storage.sync.set({adBlockToggle: isEnabled});
        chrome.runtime.sendMessage({action: "toggleAdBlock", enabled: isEnabled});
    });

});