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
  // 1. Sanitize: remove all non-numeric characters
  let cleanNumber = to.replace(/\D/g, '');
  
  // 2. Remove leading zero if user typed e.g. 07199999999
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1);
  }

  // 3. Format: ensure it starts with '+'
  let formattedTo = cleanNumber;
  if (cleanNumber.length <= 11) {
    // If it's a Brazilian number (10 or 11 digits without country code)
    formattedTo = `+55${cleanNumber}`;
  } else {
    // Likely already has a country code
    formattedTo = `+${cleanNumber}`;
  }

  console.log(`[WhatsApp] Preparando envio para: ${formattedTo}`);
  
  try {
    const twilioClient = getClient();
    if (!twilioClient) {
      console.warn('[WhatsApp] Twilio não configurado no arquivo .env.');
      return;
    }

    const response = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedTo}`,
    });

    console.log(`[WhatsApp] Mensagem enviada com sucesso! SID: ${response.sid}`);
    return response;
  } catch (error: any) {
    console.error(`[WhatsApp][ERRO] Falha ao enviar para ${formattedTo}:`, error.message);
    
    // Help identify Sandbox issues
    if (error.code === 21608) {
      console.error('--- AVISO DE SANDBOX ---');
      console.error(`O número ${formattedTo} ainda não deu "join" no seu Sandbox.`);
      console.error(`Verifique no console do Twilio qual é a palavra-chave (ex: join choice-victory)`);
      console.error(`e envie ela do seu WhatsApp para o número ${process.env.TWILIO_WHATSAPP_NUMBER}`);
      console.error('------------------------');
    }
    
    throw error;
  }
};
