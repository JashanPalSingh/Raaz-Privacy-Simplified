document.addEventListener("DOMContentLoaded", () => {

    //------------------------------------AD BLOCKER---------------------------------------------------------//
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


    //---------------------------------HAVE I BEEN PWNED?--------------------------------------------------//
    const checkPwnedButton = document.querySelector("#checkpwned");
    const inputEmail = document.querySelector("#email");
    const pwnedDiv = document.querySelector("#pwnedDiv");

    checkPwnedButton.addEventListener("click", async () => {
        const email = inputEmail.value.trim();
        if(!email){
            pwnedDiv.innerHTML = "<p>Please enter a valid email address.</p>";
            return;
        }else{
                const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
                 method: "GET",
                 headers: {
                    "hibp-api-key": "" // <<<<<<<<<<<<<<<<<< ADD API KEY HERE
                }   
                });
                if(response.status == 404){
                    pwnedDiv.innerHTML = "Your email has not been found in any breaches.";
                }
                else if(response.ok){
                    const breaches = await response.json();
                    let breachHeading = document.createElement("p");
                    breachHeading.textContent = "Your email was found in the following breaches: ";
                    let breachList = document.createElement("ul");
                    breaches.forEach(breach => {
                        let breachEntry = document.createElement("li");
                        breachEntry.innerHTML = `<p><b>${breach.Name}</b><br><img src="${breach.LogoPath}" width ="100"><br><b>Breach Date: </b>${breach.BreachDate}</p>`;
                        breachList.appendChild(breachEntry);
                    });
                    let breachNotification = document.createElement("p");
                    breachNotification.textContent = "Please change your passwords for the above websites immediately!";
                    pwnedDiv.append(breachHeading, breachList, breachNotification);
                }else{
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
        }
    });
});