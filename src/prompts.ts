require("dotenv").config();

const prompts = [
  `Before we get started, we need some information from you. Please say your company ID. It should be 6 digits and located in your organization settings`,
  `Thank you. So what would you like to create today? You can say "segment" or "flow". Or you can press 1 for segment, press 2 for flow!`,
  `Your flow has been successfully created. You can find it by going to klayveeoh.com slash flow slash {{widgets.CreateFlow.parsed.id}} slash edit. Again the ID is {{widgets.CreateFlow.parsed.id}}. Enjoy setting up the rest of your flow and enjoy the rest of the hackathon! Bye bye!`,
  `Your segment is described as follows:
{{widgets.GenerateSegment.parsed.segment_description}}`,
`OK got it. Generating your flow now. This'll take a sec.`,
`Ah, there was an error trying to generate your flow. Do you wanna give it another go?`,
`Your segment has been created.`
];

function parsePrompts() {
  prompts.forEach((prompt) => {
    const separateIntoChunks = (text) => {
      return text
        .split(/({{.*?}})/)
        .map((chunk) => {
          if (chunk.startsWith("{{") && chunk.endsWith("}}")) {
            return chunk.trim();
          } else {
            return encodeURIComponent(chunk.trim());
          }
        })
        .join(""); // Join all chunks back together
    };

    console.log(
      `https://${
        process.env.SERVER_DOMAIN
      }/call/say-message?text=${separateIntoChunks(prompt)} \n`
    );
  });
}

parsePrompts();
