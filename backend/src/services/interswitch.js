import axios from "axios";
import crypto from "crypto";
import { interswitchConfig } from "../config/interswitch.js";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Get Interswitch access token using client credentials
 */
async function getAccessToken() {
  const credentials = Buffer.from(
    `${interswitchConfig.clientId}:${interswitchConfig.clientSecret}`
  ).toString("base64");

  try {
    const { data } = await axios.post(
      `${interswitchConfig.passportUrl}/passport/oauth/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("   [OK] Interswitch access token obtained");
    return data.access_token;
  } catch (error) {
    console.error("   [WARN] Interswitch token error:", error.response?.status, error.response?.data || error.message);
    return null;
  }
}

/**
 * Send OTP to user's WhatsApp number via Interswitch WhatsApp OTP API
 * Endpoint: POST /v1/whatsapp/auth/send
 */
export async function sendWhatsAppOTP(phoneNumber) {
  const otp = crypto.randomInt(100000, 999999).toString();

  if (isDev) {
    console.log(`   [DEV] OTP Code: ${otp} | Phone: ${phoneNumber}`);
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.log("   [WARN] No access token — skipping WhatsApp send");
    return otp;
  }

  try {
    const url = `${interswitchConfig.apiUrl}/v1/whatsapp/auth/send`;
    console.log(`   [SEND] Sending OTP to ${phoneNumber} via ${url}`);

    const { data } = await axios.post(
      url,
      {
        phoneNumber: phoneNumber,
        code: otp,
        action: "verifying",
        service: "Spendlex",
        channel: "phone",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`   [OK] WhatsApp OTP sent successfully:`, data);
  } catch (error) {
    const status = error.response?.status;
    const errData = error.response?.data;
    console.log(`   [WARN] Interswitch WhatsApp send failed (${status}):`, JSON.stringify(errData || error.message));
    if (isDev) {
      console.log(`   [INFO] DEV MODE: Use code ${otp} from console to verify`);
    }
  }

  return otp;
}
