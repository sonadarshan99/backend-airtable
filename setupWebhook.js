import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const NGROK_URL = process.env.NGROK_URL;

async function registerWebhook() {
  try {
    const notificationUrl = `${NGROK_URL}/webhooks/airtable`;
    console.log(`Registering webhook to: ${notificationUrl}`);

    const res = await axios.post(
      `https://api.airtable.com/v0/bases/${BASE_ID}/webhooks`,
      {
        notificationUrl: notificationUrl,
        specification: {
          options: {
            filters: {
              dataTypes: ["tableData"],
              recordChangeScope: "tblHk5wXGcyF5JkzV"
            }
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Webhook Created Successfully!");
    console.log("IMPORTANT: COPY THIS SECRET TO YOUR .ENV FILE ⚠️");
    console.log(`WEBHOOK_SECRET=${res.data.macSecretBase64}`);
  } catch (error) {
    console.error("Error registering webhook:", error.response?.data || error.message);
  }
}

registerWebhook();
