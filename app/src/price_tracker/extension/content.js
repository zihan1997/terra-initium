window.addEventListener("message", async (event) => {
    console.log("Received message:" + JSON.stringify(event.data))
    if (event.data.type === "START_LEETCODE_AGENT") {
        // Step 1: Click daily challenge icon
        // document.querySelector('#headlessui-popover-button-3 > a')?.click();

        // // Wait for page to load (can be improved)
        // await new Promise(resolve => setTimeout(resolve, 10000));

        // Step 2: Scrape problem statement
        const problemText = document.querySelector('[data-layout-path="/ts0/t0"]').innerText
            .replaceAll(' ', '')
            .replaceAll('\n', '');
        // document.querySelectorAll('[id][class*="active"]');;
        // console.log(JSON.stringify(problemText))

        // Step 3: Send to GPT
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Authorization": "",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                input: [
                    { role: "system", content: "You are a Java coding assistant for LeetCode." },
                    { role: "user", content: `Solve this LeetCode problem in Java:\n\n${problemText}\n\nOnly output Java code.` }
                ],
                temperature: 0.5
            })
        });

        const data = await response.json();
        console.log(data)
        
        // extract output
        const output = data.output[0]?.content[0]?.text;
    
        console.log(output)
        // Step 4: Send to LeetCode
    } else {
        console.log(event.data)
        // document.querySelector('#headlessui-popover-button-3 > a')?.click();
        var problemText = document.querySelectorAll('[id][class*="active"]')
        var res = '';
        for (var i = 0; i < problemText.length; i++) {
            res += problemText[i].innerHTML;
        }

        console.log(JSON.stringify(res));

        while(!document.innerText){
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(document.innerText.split('\n'))

        
    }
});