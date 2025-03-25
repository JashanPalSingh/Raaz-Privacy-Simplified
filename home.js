/* This file communicates instructions between the index.html front-end and the backend.js back-end.
First, we add an event listner to wait for all DOM content to load before enabling any scripts to prevent from
generating unnecesary errors as variables will not be able to find associated objects in html file.*/
document.addEventListener("DOMContentLoaded", () => {

    //------------------------------------AD BLOCKER---------------------------------------------------------//

    const adBlockCheckbox = document.querySelector("#toggleAdBlock"); // Select the checkbox we created for our extension's main events.


    /*Find the value of the ad blocker toggle switch present in chome storage using the get method. Create an anonymous function that
    checks the last state of it. If it was toggled on, we set the current state to on, same for off. For undefined (usually during the first setup),
    we let it be on by default. Source: https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync */
    chrome.storage.sync.get("adBlockToggle", (result) => {
        if(result.adBlockToggle !== undefined){
            adBlockCheckbox.checked = result.adBlockToggle;
        }
        else{
            adBlockCheckbox.checked = true;
            chrome.storage.sync.set({adBlockToggle: true});
        }
    });
    /* Adding an event listner to the ad blocking checkbox that detects user-made change to checkbox state and updates the state to chrome storage. 
    It also sends out a message during the runtime to any event listners in our application. The message contains a simple JSON containing 
    an "action" field and an "enabled" field (these are just the names we used, field names can be anything). We will place a similar runtime.onMessage 
    listener in our back-end to wait for this message and take necessary action.
    Source: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage */
    adBlockCheckbox.addEventListener("change", () => {
        // console.log("It is working");
        const isEnabled = adBlockCheckbox.checked;
        chrome.storage.sync.set({adBlockToggle: isEnabled});
        chrome.runtime.sendMessage({action: "toggleAdBlock", enabled: isEnabled});
    });

    //---------------------------------END OF AD BLOCKER---------------------------------------------------//
    //---------------------------------HAVE I BEEN PWNED?--------------------------------------------------//

    /* For our project, we also decided to give our users the convenience of searching for their mail involved in any recorded data breaches.
    "Have I Been Pwned?" provides a convenient API that allows us to query theit database by sending it any email address. If present in the database,
    we will receive a JSON containing all the information present about our provided email address. This functionality requires purchasing an API key.
    Source: https://haveibeenpwned.com/api/v3 */
    const checkPwnedButton = document.querySelector("#checkpwned"); // Select elements in the HTML and assign them variablees.
    const showPwnedButton = document.querySelector("#showPwned");
    const inputEmail = document.querySelector("#email");
    const pwnedDiv = document.querySelector("#pwnedDiv");
    const emailDiv = document.querySelector("#pwned");

    // Add an event listener to our "is my email safe?" button to un-hide the div containing our API functionality. It remains hidden when not in use to maintain cleanliness.
    showPwnedButton.addEventListener("click", () => {
        emailDiv.className = "";
    });

    /*Within the API div, we add an event listener to trigger an asynchronus function that sends a web request to HIBP servers. Upon receiving the response,
    we update the content displayed in th API div with either the breaches, formatted in a list, or a simple message telling users the good news. */ 
    checkPwnedButton.addEventListener("click", async () => {
        const email = inputEmail.value.trim(); // assign user input to a variable
        if(!email){
            pwnedDiv.innerHTML = "<p>Please enter a valid email address.</p>";  //if user leaves the field empty, display message.
            return;
        }else{
                pwnedDiv.textContent = "";  //Empty the div of any previous search content before making the request.

                // Fetch a response from the API servers, the format of querying is provided by HIBP documentation. Source: https://haveibeenpwned.com/api/v3 
                const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
                 method: "GET",
                 headers: {
                    "hibp-api-key": "48937c9e6a6f4a20a8624bf8c48b74c8", // <<<<<<<<<<<<<<<<<< ADD API KEY HERE
                    "User-Agent": "Raaz-Extension/1.0"
                }   
                });
                //If we do not receive anything, the email is not present in any breaches.
                if(response.status == 404){
                    pwnedDiv.innerHTML = "Your email has not been found in any breaches.";
                }
                //Otherwise, we create a list of breaches from the received JSON and append the data to our API div.
                else if(response.ok){
                    const breaches = await response.json();
                    let breachHeading = document.createElement("p");
                    breachHeading.textContent = "Your email was found in the following breaches: ";
                    let breachList = document.createElement("ul");
                    breaches.forEach(breach => {
                        let breachEntry = document.createElement("li");
                        breachEntry.innerHTML = `<p><h3>${breach.Name}</h3><img src="${breach.LogoPath}" class ="breachImage"><br><b>Breach Date: </b>${breach.BreachDate}<br><b>What was breached: </b>${breach.DataClasses}</p>`;
                        breachList.appendChild(breachEntry);
                    });
                    let breachNotification = document.createElement("p");
                    breachNotification.textContent = "Please change your passwords for the above websites immediately!";
                    pwnedDiv.append(breachHeading, breachList, breachNotification);
                } // Finally, we catch any errors.
                else{
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
        }
    });
    //---------------------------------END OF HAVE I BEEN PWNED?--------------------------------------------------//
    //---------------------------------SAFE EMAIL REMINDER--------------------------------------------------//

    const phishingReminderCheckbox = document.querySelector("#togglePhishingReminder");

    chrome.storage.sync.get("phishingReminderToggle", (result) => {
        if (result.phishingReminderToggle !== undefined) {
            phishingReminderCheckbox.checked = result.phishingReminderToggle;
        } else {
            phishingReminderCheckbox.checked = false;
            chrome.storage.sync.set({phishingReminderToggle: false});
        }
    });

    phishingReminderCheckbox.addEventListener("change", () => {
        const isEnabled = phishingReminderCheckbox.checked;
        chrome.storage.sync.set({phishingReminderToggle: isEnabled});
        chrome.runtime.sendMessage({action: "togglePhishingReminder", enabled: isEnabled});
    });
    //---------------------------------END OF SAFE EMAIL REMINDER--------------------------------------------------//

    //---------------------------------SECURITY DASHBOARD--------------------------------------------------//
    const showDash = document.querySelector("#showDash");
    const dashboard = document.querySelector("#dashboard");    
    const dashDiv = document.querySelector("#dashDiv");

    showDash.addEventListener("click", () => {
        dashboard.className = "";
        chrome.runtime.sendMessage({action: "getList"}, (response) => {
            if(response){
                dashDiv.innerHTML = `<p> Domains blocked: ${response.domainLength}</p>
                                    <p> Trackers blocked: ${response.trackerLength}</p>`
            }else{
                dashDiv.innerHTML = "<p>Failed to load data.</p>";
            }
        });
    }); 
});