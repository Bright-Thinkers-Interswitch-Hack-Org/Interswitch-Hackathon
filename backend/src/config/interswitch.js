export const interswitchConfig = {
  clientId: process.env.INTERSWITCH_CLIENT_ID,
  clientSecret: process.env.INTERSWITCH_CLIENT_SECRET,
  passportUrl: process.env.INTERSWITCH_PASSPORT_URL || "https://qa.interswitchng.com",
  apiUrl: process.env.INTERSWITCH_API_URL || "https://api-marketplace-routing.k8.isw.la/marketplace-routing/api",
};
