import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

export const getAuthUrl = (role: string = 'admin') => {
  const oauth2Client = createOAuthClient();
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Ensure we always get a refresh token
    state: role
  });
};

export const setTokens = async (code: string): Promise<any> => {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const createCalendarEvent = async (tokens: any, eventDetails: any) => {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startTime,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: eventDetails.endTime,
      timeZone: 'America/Sao_Paulo',
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    return response.data;
  } catch (error: any) {
    console.error('[Google Calendar] API Error:', error.message);
    throw error;
  }
};

export const deleteCalendarEvent = async (tokens: any, eventId: string) => {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    console.log(`[Google Calendar] Event ${eventId} deleted successfully.`);
  } catch (error: any) {
    console.error(`[Google Calendar] Failed to delete event ${eventId}:`, error.message);
    throw error;
  }
};
