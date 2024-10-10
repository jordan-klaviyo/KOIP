import "dotenv/config";
import express, { Response } from "express";
import ExpressWs from "express-ws";
import { ElevenLabsClient } from "elevenlabs";
import bodyParser from "body-parser";
import axios from "axios";

const PORT: number = parseInt(process.env.PORT || "5000");
const KLAVIYO_COMPANY_ID = process.env.KLAVIYO_COMPANY_ID;
const KLAVIYO_HOSTNAME = "http://0.0.0.0:8081";
const cache = new Map<string, any>();

const app = ExpressWs(express()).app;
app.use(bodyParser.json());

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});
const voiceId = "LgWmGWmMc4zkYEKRZyoN"; // A.B. Voice

async function sayMessage(text: string, res: Response) {
  console.log("Received text: ", text);
  res.setHeader("Content-Type", "audio/mp3");
  const message = await elevenlabs.textToSpeech.convertAsStream(voiceId, {
    model_id: "eleven_turbo_v2",
    output_format: "mp3_44100_32",
    text: (text as string) || "This is a test message",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.1,
      style: 0.2,
    },
  });

  message.pipe(res);
}

function startApp() {
  app.get("/call/say-message", async (req, res: Response) => {
    const { text } = req.query;
    return sayMessage(text as string, res);
  });

  app.get("/call/say-description", async (req, res: Response) => {
    const text = cache.get("FlowDescription");
    if (!text) {
      throw new Error("Flow description not found in cache");
    }
    return sayMessage(
      `Your flow is described as follows... ${text} You wanna create it now?`,
      res
    );
  });

  app.get('/call/error-generating', (req, res) => {
    const messages = [
      `Ah drat, there was an error trying to generate your flow. Do you wanna give it another go?`,
      `Oh shoot, there was an error trying to generate the flow. Do you wanna try again?`,
      `Woopsie! Yeah...there was an error trying to generate your flow... Do you wanna give it another go?`
    ]
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    return sayMessage(randomMessage as string, res);
  });

  app.get("/call/say-flow-url", async (req, res) => {
    const flowId = cache.get("FlowId") || 'tzXC8j';
    if (!flowId) {
      console.warn("Flow ID not found in cache");
    }
    const text = `Your flow has been successfully created. You can find it by going to klayveeoh.com slash flow slash ${flowId} slash edit. Again the ID is ${flowId}. If you enjoyed your service today, please stay on for a brief survey. Enjoy setting up the rest of your flow! Alright, lets get to it!`;
    return sayMessage(text, res);
  });

  app.post("/generate-segment", async (req, res) => {
    try {
      console.log("Generating segment with description: ", req.body.description);
      const description = isNaN(parseInt(req.body.description))
        ? req.body.description
        : "Engaged customers";
      const { definition } = await axios
        .post(`${KLAVIYO_HOSTNAME}/ux-api/chat/describe-segment`, {
          company_id: KLAVIYO_COMPANY_ID,
          description,
        })
        .then(({ data }) => data);
      cache.set("SegmentDefinition", JSON.stringify(definition));
      res.sendStatus(200);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  })

  app.post("/generate-flow", async (req, res) => {
    try {
      console.log("Generating flow with description: ", req.body.description);
      const description = isNaN(parseInt(req.body.description))
        ? req.body.description
        : "Welcome series with one email";
      const { flow_definition, flow_description } = await axios
        .post(`${KLAVIYO_HOSTNAME}/ux-api/chat/generate-flow`, {
          company_id: KLAVIYO_COMPANY_ID,
          description,
        })
        .then(({ data }) => data);
      cache.set("FlowDefinition", JSON.stringify(flow_definition));
      cache.set("FlowDescription", flow_description);
      console.log('Generated flow with description: ', flow_description);
      res.sendStatus(200);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

  app.post("/create-flow", async (req, res) => {
    try {
      const flowDefinition = JSON.parse(cache.get("FlowDefinition"));
      if (!flowDefinition) {
        console.log("Flow definition not found in cache");
        throw new Error("Flow definition not found in cache");
      }
      console.log("Creating flow...");
      const response = await axios.post(
        `${KLAVIYO_HOSTNAME}/ajax/flow/encoded`,
        {
          company_id: KLAVIYO_COMPANY_ID,
          encoded_flow: {
            name: "KOIP flow",
            tags: [],
            origin: 1,
            definition: flowDefinition,
          },
        }
      );
      console.log("Created flow with id", response.data.id);
      cache.set("FlowId", response.data.id);
      res.sendStatus(200);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

  app.listen(PORT, () => {
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Remote: https://${process.env.SERVER_DOMAIN}`);
  });
  app.get("/health", (req, res) => res.sendStatus(200));
}

startApp();
