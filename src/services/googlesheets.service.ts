import config from "../config/config.js";
import { AppError } from "../errors/AppError.js";
import { UserModel } from "../modules/user/user.model.js";
import {
  addCredential,
  deleteCredential,
} from "../modules/user/user.service.js";
import {
  ProviderEnum,
  type CredentialType,
  type ProviderService,
} from "../validators/credential.schema.js";
import { google } from "googleapis";
import { type User } from "@prisma/client";
export const GoogleSheetsProvider: ProviderService = {
  async verify(credential: CredentialType) {
    const state = Buffer.from(
      JSON.stringify({
        returnUrl: credential.credential.returnUrl,
        email: credential.credential.email,
      }),
    ).toString("base64");

    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      client_id: config.GOOGLE_CLIENT_ID,
      redirect_uri: "http://localhost:8000/api/credential/google/callback",
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state: state,
    };

    const q = new URLSearchParams(options).toString();
    const authUrl = `${rootUrl}?${q}`;

    return {
      ok: true,
      authUrl: authUrl,
    };
  },

  async create(credential: CredentialType, email: string) {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: credential.credential.key,
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:8000/api/credential/google/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed");
    }

    const credentialPayload: CredentialType = {
      name: ProviderEnum.GoogleSheets,
      credential: {
        key: tokenData.refresh_token,
        refresh_token: tokenData.refresh_token,
        access_token: tokenData.access_token,
        expiry_date: Date.now() + tokenData.expires_in * 1000,
      },
    };

    return await addCredential(credentialPayload, email);
  },
  async provide(name, uid: User["id"]) {
    const credentials = await UserModel.getCredentialByid(name, uid);
    if (!credentials) {
      throw new AppError("Internal Error", 500);
    }
    return credentials;
  },
  async delete(credentialName, email) {
    deleteCredential(credentialName, email);
  },
  async handleWebhook() {},
};

async function getAuthenticatedClient(userEmail: string) {
  const creds = await UserModel.getCredentialByname(
    ProviderEnum.GoogleSheets,
    userEmail,
  );
  if (!creds) throw new Error("No credentials found");

  const auth = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    access_token: creds.credential.access_token as string,
    refresh_token: creds.credential.refresh_token as string,
  });

  if (Date.now() >= (creds.credential.expiry_date as any) - 30000) {
    const { credentials } = await auth.refreshAccessToken();

    await UserModel.updateCredential(
      {
        name: ProviderEnum.GoogleSheets,
        credential: {
          ...creds.credential,
          access_token: credentials.access_token,
          expiry_date: credentials.expiry_date,
        },
      },
      userEmail,
    );

    auth.setCredentials(credentials);
  }

  return auth;
}
export const SheetData = {
  async listSpreadsheets(userEmail: string) {
    const auth = await getAuthenticatedClient(userEmail);
    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed = false",
      fields: "files(id, name)",
    });
    return response.data.files || [];
  },

  async listSheetNames(userEmail: string, spreadsheetId: string) {
    const auth = await getAuthenticatedClient(userEmail);
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.get({ spreadsheetId });

    return response.data.sheets?.map((s) => s.properties?.title) || [];
  },

  async getHeaders(
    userEmail: string,
    spreadsheetId: string,
    sheetName: string,
  ) {
    const auth = await getAuthenticatedClient(userEmail);
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });

    const rows = response.data.values;
    if (!rows) {
      return {
        status: "EMPTY",
        headers: [],
      };
    }

    return {
      status: "OK",
      headers: rows[0],
    };
  },
};
