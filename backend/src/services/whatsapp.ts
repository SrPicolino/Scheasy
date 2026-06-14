import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

let client: any = null;

const getClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken || accountSid === 'your_account_sid') {
    return null;
  }

  if (!client) {
    client = twilio(accountSid, authToken);
  }
  return client;
};

export const sendWhatsAppMessage = async (to: string, message: string) => {
  console.log(`[WhatsApp] Intentando enviar para ${to}...`);
  try {
    const twilioClient = getClient();
    if (!twilioClient) {
      console.log('[WhatsApp][DEBUG] Twilio não configurado no .env.');
      return;
    }

    // Ensure phone number starts with + and has country code
    let formattedTo = to.startsWith('+') ? to : `+55${to}`;

    console.log(`[WhatsApp] Usando o número: ${formattedTo}`);

    const response = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedTo}`,
    });
    console.log(`[WhatsApp] Sucesso! SID da Mensagem: ${response.sid}`);
    return response;
  } catch (error: any) {
    console.error('[WhatsApp][ERRO] Falha ao enviar:', error.message);
    throw error;
  }
};
